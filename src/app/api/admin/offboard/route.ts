import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/mailer";

function verifyToken(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:${pw}`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientName, clientEmail, reason } = await req.json();
  if (!clientName) return NextResponse.json({ error: "clientName required" }, { status: 400 });

  const record = { name: clientName, email: clientEmail, reason: reason || "Manual offboard", date: new Date().toISOString() };

  const offboarded = await redis.get<any[]>("clients:offboarded") ?? [];
  offboarded.unshift(record);
  await redis.set("clients:offboarded", offboarded.slice(0, 200));

  logActivity({
    type: "cancellation",
    title: `Client offboarded â€” ${clientName}`,
    detail: reason || "Manually marked as churned",
    clientName,
  }).catch(() => {});

  sendEmail({
    to: "cybercraftlimited@gmail.com",
    subject: `ðŸ“¤ Client Offboarded â€” ${clientName}`,
    html: `<div style="font-family:system-ui;padding:24px;background:#0a0c12;border-radius:12px;max-width:480px;">
      <div style="height:3px;background:linear-gradient(90deg,#ef4444,#f59e0b);border-radius:2px;margin-bottom:20px;"></div>
      <p style="color:rgba(255,255,255,0.3);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 8px;">CyberCraft360</p>
      <h2 style="color:#fff;margin:0 0 20px;font-size:18px;">ðŸ“¤ Client Offboarded</h2>
      <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 8px;"><strong style="color:#fff;">${clientName}</strong>${clientEmail ? ` Â· ${clientEmail}` : ""}</p>
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0;">Reason: ${reason || "Not specified"}</p>
    </div>`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

