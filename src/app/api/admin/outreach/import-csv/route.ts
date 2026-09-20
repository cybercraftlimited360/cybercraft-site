import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Enrollment } from "@/lib/email-sequences";

export const maxDuration = 120;

const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
  "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
  "TX","UT","VT","VA","WA","WV","WI","WY","DC",
]);

// Hunter.io CSV column names
const COL = {
  firstName:    "First name",
  lastName:     "Last name",
  fullName:     "Full name",
  jobTitle:     "Job title",
  company:      "Company",
  industry:     "Industry",
  email:        "Email address",
  compCountry:  "Company Country",
  website:      "Website",
  phone:        "Phone number",
  city:         "City",
  state:        "State",
  country:      "Country",
  verification: "Verification status",
};

function auth(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;
  const adminToken = req.headers.get("x-admin-token");
  return adminToken === Buffer.from(`cc360:${adminSecret}:v2`).toString("base64");
}

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  const atIdx = trimmed.lastIndexOf("@");
  if (atIdx < 1) return false;
  const domain = trimmed.slice(atIdx + 1);
  if (!domain.includes(".")) return false;
  const tld = domain.split(".").pop() ?? "";
  return tld.length >= 2 && tld.length <= 8 && /^[a-zA-Z0-9._%+\-]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(trimmed);
}

function classifyCountry(row: Record<string, string>): "US" | "INTERNATIONAL" | "REVIEW" {
  const country = (row[COL.country] ?? "").trim().toUpperCase();
  const compCountry = (row[COL.compCountry] ?? "").trim().toUpperCase();
  const state = (row[COL.state] ?? "").trim().toUpperCase();

  if (country === "US" || compCountry === "US") return "US";
  if (state && US_STATES.has(state)) return "US";
  if (!country && !compCountry) return state && !US_STATES.has(state) ? "INTERNATIONAL" : "REVIEW";
  if ((country && country !== "US") || (compCountry && compCountry !== "US")) return "INTERNATIONAL";
  return "REVIEW";
}

// Minimal CSV parser — handles quoted fields with embedded commas and newlines
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = "";
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        if (ch === '\r') i++;
        row.push(field);
        field = "";
        if (row.some(f => f.trim() !== "")) rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  // flush last field/row
  if (field || row.length) {
    row.push(field);
    if (row.some(f => f.trim() !== "")) rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(cells => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim(); });
    return obj;
  });
}

function buildEnrollment(row: Record<string, string>, sequenceId: string): Enrollment {
  const fromEmail = process.env.OUTREACH_EMAIL ?? "info@cybercraft360.com";
  const fromName = process.env.OUTREACH_NAME ?? "Saad";

  const firstName = row[COL.firstName] || "";
  const lastName = row[COL.lastName] || "";
  const fullName = row[COL.fullName] || `${firstName} ${lastName}`.trim();
  const company = row[COL.company] || fullName || "there";
  const email = (row[COL.email] ?? "").trim().toLowerCase();
  const city = row[COL.city] || "";
  const industry = row[COL.industry] || "Real Estate";
  const phone = row[COL.phone] || undefined;
  const website = row[COL.website] || undefined;

  const id = `enroll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const leadId = `lead_csv_${email.replace(/[^a-z0-9]/g, "_")}`;
  const now = new Date().toISOString();

  return {
    id,
    leadId,
    leadName: company,
    leadEmail: email,
    leadIndustry: industry,
    leadCity: city,
    ownerName: firstName || undefined,
    leadPhone: phone,
    leadWebsite: website,
    sequenceId,
    currentStep: 0,
    nextSendAt: now,
    status: "active",
    enrolledAt: now,
    sentSteps: [],
    openedSteps: [],
    fromEmail,
    fromName,
  };
}

export async function POST(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const sequenceId = (formData.get("sequenceId") as string | null) ?? "realestate-seq";
  const usOnly = (formData.get("usOnly") as string | null) !== "false"; // default true

  if (!file) {
    return NextResponse.json({ error: "No file uploaded. Send a 'file' field in multipart form data." }, { status: 400 });
  }

  let csvText: string;
  try {
    csvText = await file.text();
  } catch {
    return NextResponse.json({ error: "Could not read file" }, { status: 400 });
  }

  // Strip UTF-8 BOM if present
  if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.slice(1);

  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV is empty or has no data rows" }, { status: 400 });
  }

  // Load existing enrollments to check duplicates
  const existing = await redis.get<Enrollment[]>("outreach:enrollments") ?? [];
  const existingEmails = new Set(existing.map(e => e.leadEmail.toLowerCase()));

  const report = {
    total: rows.length,
    enrolled: 0,
    skipped_international: 0,
    skipped_duplicate: 0,
    skipped_invalid_email: 0,
    skipped_unverified: 0,
    enrolled_list: [] as string[],
    duplicate_list: [] as string[],
    invalid_list: [] as string[],
  };

  const newEnrollments: Enrollment[] = [];

  for (const row of rows) {
    const email = (row[COL.email] ?? "").trim().toLowerCase();

    // Email validation
    if (!isValidEmail(email)) {
      report.skipped_invalid_email++;
      if (email) report.invalid_list.push(email);
      continue;
    }

    // Verification filter — skip entries explicitly marked invalid/risky
    const verif = (row[COL.verification] ?? "").trim().toLowerCase();
    if (verif === "invalid" || verif === "risky") {
      report.skipped_unverified++;
      continue;
    }

    // US filter
    if (usOnly && classifyCountry(row) !== "US") {
      report.skipped_international++;
      continue;
    }

    // Duplicate check
    if (existingEmails.has(email)) {
      report.skipped_duplicate++;
      report.duplicate_list.push(email);
      continue;
    }

    const enrollment = buildEnrollment(row, sequenceId);
    newEnrollments.push(enrollment);
    existingEmails.add(email); // prevent duplicates within the batch itself
    report.enrolled++;
    report.enrolled_list.push(`${row[COL.company] || email} <${email}>`);
  }

  if (newEnrollments.length > 0) {
    // Prepend new enrollments so they appear first in the admin list (GET slices to 200)
    await redis.set("outreach:enrollments", [...newEnrollments, ...existing]);
  }

  return NextResponse.json({
    ok: true,
    sequenceId,
    ...report,
    message: `Enrolled ${report.enrolled} leads into '${sequenceId}'. ${report.skipped_duplicate} duplicates skipped. ${report.skipped_international} non-US skipped. ${report.skipped_invalid_email} invalid emails skipped.`,
  });
}
