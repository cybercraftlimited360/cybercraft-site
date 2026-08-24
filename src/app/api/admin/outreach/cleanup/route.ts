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
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com",
]);

function isValidBusinessEmail(email: string): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lower)) return false;
  const domain = lower.split("@")[1];
  if (BLOCKED_DOMAINS.has(domain)) return false;
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
