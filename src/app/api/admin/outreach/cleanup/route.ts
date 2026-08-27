import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Enrollment } from "@/lib/email-sequences";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

const BLOCKED_DOMAINS = new Set([
  "example.com", "domain.com", "test.com", "email.com", "placeholder.com",
  "yourdomain.com", "yourcompany.com", "company.com", "business.com",
  // Consumer email providers — not business contacts
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com",
  "live.com", "msn.com", "ymail.com", "googlemail.com", "me.com", "mac.com",
  "protonmail.com", "proton.me", "tutanota.com", "zoho.com",
]);

const JUNK_LOCAL_PATTERNS = [
  /^noreply/, /^no-reply/, /^donotreply/, /^mailer/, /^bounce/, /^postmaster/,
  /^admin/, /^webmaster/, /^root/, /^hostmaster/, /^abuse/, /^spam/,
  /^privacy/, /^legal/, /^dmca/, /^support/, /^billing/, /^invoice/,
  /^careers/, /^jobs/, /^hr/, /^sales/, /^marketing/, /^notifications?/,
];

function isValidBusinessEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const lower = email.toLowerCase().trim();
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,8}$/.test(lower)) return false;
  const [local, domain] = lower.split("@");
  if (!local || !domain) return false;
  if (BLOCKED_DOMAINS.has(domain)) return false;
  if (JUNK_LOCAL_PATTERNS.some(p => p.test(local))) return false;
  // Must have a real domain structure
  if (!domain.includes(".")) return false;
  const tld = domain.split(".").pop() ?? "";
  if (tld.length < 2 || tld.length > 8) return false;
  return true;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const enrollments: Enrollment[] = await redis.get("outreach:enrollments") ?? [];
  const before = enrollments.length;

  const cleaned = enrollments.filter(e => isValidBusinessEmail(e.leadEmail));
  const removed = before - cleaned.length;
  const removedList = enrollments
    .filter(e => !isValidBusinessEmail(e.leadEmail))
    .map(e => ({ name: e.leadName, email: e.leadEmail }));

  await redis.set("outreach:enrollments", cleaned);

  return NextResponse.json({ ok: true, before, after: cleaned.length, removed, removedList });
}
