import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Enrollment, SentEmail } from "@/lib/email-sequences";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [enrollments, sent] = await Promise.all([
    redis.get<Enrollment[]>("outreach:enrollments") ?? [],
    redis.get<SentEmail[]>("outreach:sent_emails") ?? [],
  ]) as [Enrollment[], SentEmail[]];

  const totalEnrolled = enrollments.length;
  const active = enrollments.filter(e => e.status === "active").length;
  const replied = enrollments.filter(e => e.status === "replied").length;
  const completed = enrollments.filter(e => e.status === "completed").length;
  const unsubscribed = enrollments.filter(e => e.status === "unsubscribed").length;
  const totalSent = sent.length;
  const totalOpened = sent.filter(s => s.opened).length;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const replyRate = totalSent > 0 ? Math.round((replied / totalSent) * 100) : 0;

  // Last 7 days sent
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const sentLast7 = sent.filter(s => s.sentAt > cutoff).length;

  return NextResponse.json({
    totalEnrolled, active, replied, completed, unsubscribed,
    totalSent, totalOpened, openRate, replyRate, sentLast7,
    recentSent: sent.slice(0, 50),
  });
}
