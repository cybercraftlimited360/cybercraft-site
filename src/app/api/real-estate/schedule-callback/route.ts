import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";

const OWNER_EMAIL = "info@cybercraft360.com";

export interface ScheduledCallback {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  interest: string;
  date: string;          // YYYY-MM-DD in user's timezone
  timeWindow: "morning" | "afternoon" | "evening"; // 9-12, 12-16, 16-19
  timezone: string;      // IANA tz, e.g. "America/Chicago"
  utm: Record<string, string>;
  status: "pending" | "called" | "failed";
  createdAt: string;
}

const WINDOW_LABELS: Record<string, string> = {
  morning:   "9 AM – 12 PM",
  afternoon: "12 PM – 4 PM",
  evening:   "4 PM – 7 PM",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, role, interest, date, timeWindow, timezone, utm } = body;

    if (!name || !email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    if (!date) return NextResponse.json({ error: "Please select a date." }, { status: 400 });
    if (!timeWindow || !["morning", "afternoon", "evening"].includes(timeWindow)) {
      return NextResponse.json({ error: "Please select a valid time window." }, { status: 400 });
    }

    const cb: ScheduledCallback = {
      id: `re_cb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      role: String(role || "").trim(),
      interest: String(interest || "").trim(),
      date: String(date).trim(),
      timeWindow: timeWindow as ScheduledCallback["timeWindow"],
      timezone: String(timezone || "America/Chicago").trim(),
      utm: utm || {},
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Store in Redis list for the cron to pick up
    const existing = await redis.get<ScheduledCallback[]>("realestate:scheduled_callbacks") ?? [];
    await redis.set("realestate:scheduled_callbacks", [cb, ...existing]);

    // Notify owner
    const windowLabel = WINDOW_LABELS[cb.timeWindow] ?? cb.timeWindow;
    sendEmail({
      to: OWNER_EMAIL,
      subject: `📅 Amy Callback Scheduled — ${cb.name} on ${cb.date} (${windowLabel} ${cb.timezone})`,
      html: `<div style="font-family:sans-serif;padding:24px;background:#0a0c12;color:#fff;">
        <h2 style="color:#00d4ff;">New Scheduled Callback</h2>
        <p><strong>Name:</strong> ${cb.name}</p>
        <p><strong>Email:</strong> ${cb.email}</p>
        <p><strong>Phone:</strong> ${cb.phone}</p>
        <p><strong>Role:</strong> ${cb.role || "—"}</p>
        <p><strong>Date:</strong> ${cb.date}</p>
        <p><strong>Window:</strong> ${windowLabel}</p>
        <p><strong>Timezone:</strong> ${cb.timezone}</p>
        <p style="font-size:12px;color:rgba(255,255,255,0.3);">${cb.createdAt}</p>
      </div>`,
    }).catch(err => console.error("[schedule-callback] owner email error:", err));

    // Confirmation email to the lead
    sendEmail({
      to: cb.email,
      subject: `Your Amy callback is scheduled — ${cb.date}`,
      html: `<div style="font-family:sans-serif;padding:24px;max-width:540px;background:#0a0c12;color:#fff;">
        <h2 style="color:#00d4ff;">Your callback is confirmed.</h2>
        <p>Hi ${cb.name},</p>
        <p>Amy will call you on <strong>${cb.date}</strong> during the <strong>${windowLabel}</strong> window in <strong>${cb.timezone}</strong>.</p>
        <p>Make sure your phone is available. Amy will introduce herself and walk you through exactly how she handles real estate leads.</p>
        <p style="margin-top:24px;">Questions? Reply to this email or reach us at <a href="mailto:${OWNER_EMAIL}" style="color:#00d4ff;">${OWNER_EMAIL}</a>.</p>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:24px;">CyberCraft360 · Houston, TX</p>
      </div>`,
    }).catch(err => console.error("[schedule-callback] confirmation email error:", err));

    return NextResponse.json({ ok: true, id: cb.id });
  } catch (err) {
    console.error("[schedule-callback] error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
