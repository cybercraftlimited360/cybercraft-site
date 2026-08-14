import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const entry = { email: email.trim().toLowerCase(), source: source ?? "blog", createdAt: new Date().toISOString() };

    const existing = await redis.get<any[]>("leads:checklist") ?? [];
    const alreadyExists = existing.some((e: any) => e.email === entry.email);
    if (!alreadyExists) {
      existing.unshift(entry);
      await redis.set("leads:checklist", existing.slice(0, 500));
    }

    // Notify owner
    const notifyRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CyberCraft360 <noreply@cybercraft360.com>",
        to: ["cybercraftlimited@gmail.com"],
        subject: `New checklist lead: ${entry.email}`,
        html: `<p>New AI Readiness Checklist download from <strong>${entry.email}</strong></p><p>Source: ${entry.source}</p><p>${entry.createdAt}</p>`,
      }),
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[checklist] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
