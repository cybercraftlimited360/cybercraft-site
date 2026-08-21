import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { Enrollment, SentEmail } from "@/lib/email-sequences";

// 1x1 transparent GIF
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const enrollmentId = searchParams.get("id");
  const step = parseInt(searchParams.get("step") ?? "-1");

  if (enrollmentId && step >= 0) {
    try {
      // Mark enrollment step as opened
      const enrollments: Enrollment[] = await redis.get("outreach:enrollments") ?? [];
      const updated = enrollments.map(e => {
        if (e.id !== enrollmentId) return e;
        if (e.openedSteps.includes(step)) return e;
        return { ...e, openedSteps: [...e.openedSteps, step] };
      });
      await redis.set("outreach:enrollments", updated);

      // Mark sent log as opened
      const sent: SentEmail[] = await redis.get("outreach:sent_emails") ?? [];
      const updatedSent = sent.map(s => {
        if (s.enrollmentId !== enrollmentId || s.step !== step || s.opened) return s;
        return { ...s, opened: true, openedAt: new Date().toISOString() };
      });
      await redis.set("outreach:sent_emails", updatedSent);
    } catch { /* tracking is non-critical */ }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
