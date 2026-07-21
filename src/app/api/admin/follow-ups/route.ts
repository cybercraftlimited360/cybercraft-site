import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

// GET — return leads that need follow-up (pending, no booking, >24h old)
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const leads = await redis.get<any[]>("leads:all") ?? [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const due = leads.filter(l => {
    if (l.followUpStatus === "done") return false;
    if (!l.capturedAt) return false;
    return new Date(l.capturedAt).getTime() < cutoff;
  }).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return NextResponse.json({ due });
}

// POST — mark a lead follow-up as done or trigger Lauren call
export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, leadName, leadCompany, phone, name, company, challenge } = await req.json();

  if (action === "mark-done") {
    const leads = await redis.get<any[]>("leads:all") ?? [];
    const updated = leads.map(l =>
      l.name === leadName && l.company === leadCompany
        ? { ...l, followUpStatus: "done", followedUpAt: new Date().toISOString() }
        : l
    );
    await redis.set("leads:all", updated);
    return NextResponse.json({ ok: true });
  }

  if (action === "call") {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";
    try {
      const res = await fetch(`${base}/api/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": req.headers.get("x-admin-token") || "" },
        body: JSON.stringify({ phone, name, company, challenge }),
      });
      const d = await res.json();
      if (d.ok) {
        // Mark follow-up as done
        const leads = await redis.get<any[]>("leads:all") ?? [];
        const updated = leads.map(l =>
          l.name === name && l.company === company
            ? { ...l, followUpStatus: "done", followedUpAt: new Date().toISOString() }
            : l
        );
        await redis.set("leads:all", updated);
        return NextResponse.json({ ok: true, callSid: d.callSid });
      }
      return NextResponse.json({ ok: false, error: d.error });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
