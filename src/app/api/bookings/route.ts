import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { createCalendarEvent } from "@/lib/google-calendar";

// On Vercel the project root is read-only — use /tmp for writes
const BOOK_FILE  = process.env.VERCEL ? "/tmp/bookings.json" : path.join(process.cwd(), "data", "bookings.json");
const AVAIL_FILE = path.join(process.cwd(), "data", "availability.json");

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

async function readJson(file: string) {
  try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return null; }
}

async function writeJson(file: string, data: unknown) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function sendConfirmationEmails(booking: {
  id: string; name: string; email: string; company: string;
  phone: string; date: string; time: string; message: string; timezone: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const dateLabel = new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Email to client
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "CyberCraft360 <onboarding@resend.dev>",
      to: [booking.email],
      subject: `Your Strategy Session is Confirmed — ${dateLabel}`,
      html: `
<div style="background:#0a0c12;padding:40px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></div>
    <div style="padding:36px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 12px;">CyberCraft360</p>
      <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">You're booked in.</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.5);margin:0 0 28px;">We're looking forward to speaking with you.</p>
      <div style="background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
          <span style="color:#00d4ff;font-size:18px;">📅</span>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Date</div>
            <div style="color:#fff;font-weight:600;font-size:15px;">${dateLabel}</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <span style="color:#00d4ff;font-size:18px;">⏰</span>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Time</div>
            <div style="color:#fff;font-weight:600;font-size:15px;">${fmt12(booking.time)} CT</div>
          </div>
        </div>
      </div>
      <p style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.7;margin:0 0 20px;">
        Our founder will call you directly at the scheduled time.
      </p>
      <a href="https://cybercraft360.com/reschedule/${booking.id}" style="display:inline-block;padding:10px 22px;border-radius:9px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);font-size:12px;font-weight:600;letter-spacing:0.06em;text-decoration:none;margin-bottom:24px;">
        🔄 Need to reschedule?
      </a>
      <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;">CyberCraft360 · Bespoke AI Agency · Houston, TX</p>
    </div>
  </div>
</div>`,
    }),
  }).catch(() => {});

  // Notification to owner
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "CyberCraft360 Scheduler <onboarding@resend.dev>",
      to: ["cybercraftlimited@gmail.com"],
      subject: `📅 New Booking — ${booking.name} (${booking.company}) — ${dateLabel} at ${booking.time}`,
      html: `
<div style="font-family:system-ui,sans-serif;padding:32px;background:#f9fafb;max-width:560px;">
  <h2 style="margin:0 0 20px;color:#111;">New Strategy Session Booked</h2>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#666;width:140px;">Name</td><td style="padding:8px 0;font-weight:600;color:#111;">${booking.name}</td></tr>
    <tr><td style="padding:8px 0;color:#666;">Company</td><td style="padding:8px 0;font-weight:600;color:#111;">${booking.company}</td></tr>
    <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;color:#111;">${booking.email}</td></tr>
    <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;color:#111;">${booking.phone || "—"}</td></tr>
    <tr><td style="padding:8px 0;color:#666;">Date</td><td style="padding:8px 0;font-weight:600;color:#0066cc;">${dateLabel}</td></tr>
    <tr><td style="padding:8px 0;color:#666;">Time</td><td style="padding:8px 0;font-weight:600;color:#0066cc;">${booking.time} CT</td></tr>
    ${booking.message ? `<tr><td style="padding:8px 0;color:#666;vertical-align:top;">Note</td><td style="padding:8px 0;color:#111;">${booking.message}</td></tr>` : ""}
  </table>
  <p style="margin:20px 0 0;font-size:12px;color:#999;">Booking ID: ${booking.id}</p>
</div>`,
    }),
  }).catch(() => {});
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bookings = (await readJson(BOOK_FILE)) ?? [];
  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, phone, date, time, message, timezone } = body;

    if (!name || !email || !date || !time) {
      return NextResponse.json({ error: "Name, email, date and time are required." }, { status: 400 });
    }

    // Double-check slot is still available
    const avail = await readJson(AVAIL_FILE);
    const bookings: { date: string; time: string; status: string }[] = (await readJson(BOOK_FILE)) ?? [];

    const conflict = bookings.find(b => b.date === date && b.time === time && b.status !== "cancelled");
    if (conflict) {
      return NextResponse.json({ error: "That slot was just taken. Please pick another time." }, { status: 409 });
    }

    const booking = {
      id: generateId(),
      name, email,
      company: company || "",
      phone: phone || "",
      date, time,
      message: message || "",
      timezone: timezone || avail?.timezone || "America/Chicago",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      gcal_event_id: null as string | null,
    };

    // Try to add to Google Calendar (no-op if not configured)
    const slotDuration = avail?.slotDuration ?? 30;
    const [h, m] = time.split(":").map(Number);
    const startDT = new Date(`${date}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`);
    const endDT   = new Date(startDT.getTime() + slotDuration * 60000);

    const gcalId = await createCalendarEvent({
      summary: `Strategy Session — ${name} (${company || "CyberCraft360"})`,
      description: `Name: ${name}\nCompany: ${company}\nEmail: ${email}\nPhone: ${phone}\n${message ? `\nNote: ${message}` : ""}`,
      startDateTime: startDT.toISOString(),
      endDateTime:   endDT.toISOString(),
      attendeeEmail: email,
      attendeeName:  name,
    });
    if (gcalId) booking.gcal_event_id = gcalId;

    // Save booking
    bookings.push(booking);
    await writeJson(BOOK_FILE, bookings);

    // Send emails (non-blocking for response)
    sendConfirmationEmails(booking).catch(() => {});

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch (err) {
    console.error("Booking error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
