import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const eventType = event.event_type;

    if (eventType === "BILLING.SUBSCRIPTION.CANCELLED" || eventType === "BILLING.SUBSCRIPTION.SUSPENDED") {
      const sub = event.resource;
      const email = sub?.subscriber?.email_address || "";
      const name = `${sub?.subscriber?.name?.given_name || ""} ${sub?.subscriber?.name?.surname || ""}`.trim();
      const planName = sub?.plan_id || "Unknown Plan";

      // Log to activity feed
      logActivity({
        type: "cancellation",
        title: `Subscription cancelled — ${name || email}`,
        detail: `Plan: ${planName} · ${eventType === "BILLING.SUBSCRIPTION.SUSPENDED" ? "Suspended" : "Cancelled"}`,
        clientName: name || email,
      }).catch(() => {});

      // Mark client as churned in Redis
      const clients = await redis.get<any[]>("clients:offboarded") ?? [];
      clients.unshift({ email, name, planName, reason: eventType, date: new Date().toISOString() });
      await redis.set("clients:offboarded", clients.slice(0, 200));

      // Notify owner
      sendEmail({
        to: "cybercraftlimited@gmail.com",
        subject: `⚠️ Subscription Cancelled — ${name || email}`,
        html: `<div style="font-family:system-ui;padding:24px;background:#0a0c12;border-radius:12px;max-width:500px;">
          <div style="height:3px;background:linear-gradient(90deg,#ef4444,#f59e0b);border-radius:2px;margin-bottom:20px;"></div>
          <p style="color:rgba(255,255,255,0.3);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 8px;">CyberCraft360</p>
          <h2 style="color:#fff;margin:0 0 20px;font-size:18px;">⚠️ Client Subscription Cancelled</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:12px;width:100px;">Client</td><td style="padding:8px 0;color:#fff;font-size:13px;">${name || "Unknown"}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:12px;">Email</td><td style="padding:8px 0;color:#fff;font-size:13px;">${email}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:12px;">Plan</td><td style="padding:8px 0;color:#fff;font-size:13px;">${planName}</td></tr>
            <tr><td style="padding:8px 0;color:rgba(255,255,255,0.4);font-size:12px;">Status</td><td style="padding:8px 0;color:#ef4444;font-size:13px;font-weight:700;">${eventType}</td></tr>
          </table>
          <p style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:20px;">Consider reaching out to understand why they left and whether they can be retained.</p>
        </div>`,
      }).catch(() => {});
    }

    if (eventType === "INVOICING.INVOICE.PAID") {
      const inv = event.resource;
      const invoiceId = inv?.id;
      const amount = inv?.amount?.value;
      const recipientEmail = inv?.primary_recipients?.[0]?.billing_info?.email_address;

      // Update invoice status in Redis
      const invoices = await redis.get<any[]>("invoices:all") ?? [];
      const idx = invoices.findIndex(i => i.invoiceNumber === invoiceId || i.id === invoiceId);
      if (idx !== -1) {
        invoices[idx].status = "paid";
        invoices[idx].paidAt = new Date().toISOString();
        await redis.set("invoices:all", invoices);
      }

      logActivity({
        type: "payment",
        title: `Invoice paid — ${recipientEmail || invoiceId}`,
        detail: `$${amount} received`,
        amount: parseFloat(amount) || 0,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PayPal webhook error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
