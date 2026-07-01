import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const BOOK_FILE = process.env.VERCEL ? "/tmp/bookings.json" : path.join(process.cwd(), "data", "bookings.json");

async function readBookings() {
  try { return JSON.parse(await fs.readFile(BOOK_FILE, "utf-8")); } catch { return []; }
}
async function writeBookings(data: unknown) {
  await fs.writeFile(BOOK_FILE, JSON.stringify(data, null, 2));
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookings = await readBookings();
  const booking = bookings.find((b: { id: string }) => b.id === id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ booking });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { date, time } = await req.json();

  if (!date || !time) return NextResponse.json({ error: "date and time required" }, { status: 400 });

  const bookings: Array<{ id: string; date: string; time: string; status: string; name: string; email: string; company: string }> = await readBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const booking = bookings[idx];
  if (booking.status === "cancelled") return NextResponse.json({ error: "Booking is cancelled" }, { status: 400 });

  // Check new slot is free
  const conflict = bookings.find((b, i) => i !== idx && b.date === date && b.time === time && b.status !== "cancelled");
  if (conflict) return NextResponse.json({ error: "That slot was just taken. Please pick another time." }, { status: 409 });

  const oldDate = booking.date;
  const oldTime = booking.time;
  bookings[idx] = { ...booking, date, time };
  await writeBookings(bookings);

  // Send reschedule confirmation emails
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const oldLabel = new Date(`${oldDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    function fmt12(t: string) {
      const [h, m] = t.split(":").map(Number);
      return `${h % 12 || 12}:${m.toString().padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";

    // Email to client
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "CyberCraft360 <onboarding@resend.dev>",
        to: [booking.email],
        subject: `Your Session Has Been Rescheduled — ${dateLabel}`,
        html: `
<div style="background:#0a0c12;padding:40px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></div>
    <div style="padding:36px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 12px;">CyberCraft360</p>
      <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">Session Rescheduled</h1>
      <p style="font-size:13px;color:rgba(255,255,255,0.4);margin:0 0 24px;">Your strategy session has been moved from <strong style="color:rgba(255,255,255,0.6)">${oldLabel} at ${fmt12(oldTime)} CT</strong>.</p>
      <div style="background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
          <span style="color:#00d4ff;font-size:18px;">📅</span>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">New Date</div>
            <div style="color:#fff;font-weight:600;font-size:15px;">${dateLabel}</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <span style="color:#00d4ff;font-size:18px;">⏰</span>
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">New Time</div>
            <div style="color:#fff;font-weight:600;font-size:15px;">${fmt12(time)} CT</div>
          </div>
        </div>
      </div>
      <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0 0 20px;">Need to change again? <a href="${baseUrl}/reschedule/${id}" style="color:#00d4ff;">Click here to reschedule</a>.</p>
      <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;">CyberCraft360 · Bespoke AI Agency · Houston, TX</p>
    </div>
  </div>
</div>`,
      }),
    }).catch(() => {});

    // Notify owner
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: "CyberCraft360 Scheduler <onboarding@resend.dev>",
        to: ["cybercraftlimited@gmail.com"],
        subject: `🔄 Rescheduled — ${booking.name} moved to ${dateLabel} at ${fmt12(time)}`,
        html: `<div style="font-family:system-ui;padding:28px;background:#f9fafb;"><h2 style="margin:0 0 16px;">Booking Rescheduled</h2><p><strong>${booking.name}</strong> (${booking.company}) moved their session.<br>Was: ${oldLabel} at ${fmt12(oldTime)} CT<br>Now: ${dateLabel} at ${fmt12(time)} CT<br>Email: ${booking.email}</p></div>`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
