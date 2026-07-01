import { NextRequest, NextResponse } from "next/server";
import { getBookings, saveBookings } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookings = await getBookings();
  const booking = bookings.find(b => b.id === id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ booking });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { date, time } = await req.json();

  if (!date || !time) return NextResponse.json({ error: "date and time required" }, { status: 400 });

  const bookings = await getBookings();
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const booking = bookings[idx];
  if (booking.status === "cancelled") return NextResponse.json({ error: "Booking is cancelled" }, { status: 400 });

  const conflict = bookings.find((b, i) => i !== idx && b.date === date && b.time === time && b.status !== "cancelled");
  if (conflict) return NextResponse.json({ error: "That slot was just taken. Please pick another time." }, { status: 409 });

  const oldDate = booking.date;
  const oldTime = booking.time;
  bookings[idx] = { ...booking, date, time };
  await saveBookings(bookings);

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const oldLabel  = new Date(`${oldDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const baseUrl   = process.env.NEXT_PUBLIC_SITE_URL || "https://cybercraft360.com";

  sendEmail({
    to: booking.email,
    subject: `Your Session Has Been Rescheduled — ${dateLabel}`,
    html: `
<div style="background:#0a0c12;padding:40px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></div>
    <div style="padding:36px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 12px;">CyberCraft360</p>
      <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">Session Rescheduled</h1>
      <p style="font-size:13px;color:rgba(255,255,255,0.4);margin:0 0 24px;">Moved from <strong style="color:rgba(255,255,255,0.6)">${oldLabel} at ${fmt12(oldTime)} CT</strong>.</p>
      <div style="background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <div style="margin-bottom:10px;"><div style="font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">New Date</div><div style="color:#fff;font-weight:600;font-size:15px;">${dateLabel}</div></div>
        <div><div style="font-size:11px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">New Time</div><div style="color:#fff;font-weight:600;font-size:15px;">${fmt12(time)} CT</div></div>
      </div>
      <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0;">Need to change again? <a href="${baseUrl}/reschedule/${id}" style="color:#00d4ff;">Click here</a>.</p>
    </div>
  </div>
</div>`,
  }).catch(() => {});

  sendEmail({
    to: "cybercraftlimited@gmail.com",
    subject: `🔄 Rescheduled — ${booking.name} → ${dateLabel} at ${fmt12(time)} CT`,
    html: `<div style="font-family:system-ui;padding:28px;background:#f9fafb;"><h2 style="margin:0 0 16px;">Booking Rescheduled</h2><p><strong>${booking.name}</strong> (${booking.company}) moved their session.<br>Was: ${oldLabel} at ${fmt12(oldTime)} CT<br>Now: ${dateLabel} at ${fmt12(time)} CT<br>Email: ${booking.email}</p></div>`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
