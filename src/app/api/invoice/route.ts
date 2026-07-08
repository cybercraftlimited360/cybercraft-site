import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { redis } from "@/lib/redis";
import { logActivity } from "@/lib/activity";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  setupFee: number;
  monthlyFee: number;
  total: number;
  notes: string;
  status: "sent" | "paid" | "overdue" | "cancelled";
  sentAt: string;
  dueDate: string;
}

function buildPayPalLink(amount: number, serviceName: string): string {
  const email = process.env.PAYPAL_BUSINESS_EMAIL || "";
  return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(email)}&amount=${amount.toFixed(2)}&currency_code=USD&item_name=${encodeURIComponent(serviceName)}&no_shipping=1`;
}

function buildInvoiceEmail({
  customerName, serviceName, setupFee, monthlyFee, notes,
  invoiceNumber, dueDate, payLink, invoiceDate,
}: {
  customerName: string; serviceName: string; setupFee: number; monthlyFee: number;
  notes: string; invoiceNumber: string; dueDate: string; payLink: string; invoiceDate: string;
}) {
  const total = setupFee + monthlyFee;
  const firstName = customerName.split(" ")[0];

  const itemRows = [
    setupFee > 0 && `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:14px;font-weight:600;color:#fff;">${serviceName} — One-Time Setup Fee</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:3px;">Initial configuration, onboarding & deployment</div>
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;white-space:nowrap;vertical-align:top;">
          <span style="font-size:15px;font-weight:700;color:#00d4ff;">$${setupFee.toLocaleString()}</span>
        </td>
      </tr>`,
    monthlyFee > 0 && `
      <tr>
        <td style="padding:14px 20px;">
          <div style="font-size:14px;font-weight:600;color:#fff;">${serviceName} — Month 1 Subscription</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:3px;">AI system management, monitoring, retraining & support</div>
        </td>
        <td style="padding:14px 20px;text-align:right;vertical-align:top;">
          <span style="font-size:15px;font-weight:700;color:#7c3aed;">$${monthlyFee.toLocaleString()}</span>
        </td>
      </tr>`,
  ].filter(Boolean).join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0a0c12;font-family:'Inter',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c12;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:580px;" cellpadding="0" cellspacing="0">

      <!-- Top bar -->
      <tr><td style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);border-radius:3px 3px 0 0;"></td></tr>

      <!-- Header -->
      <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;padding:28px 32px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);">CyberCraft360</div>
              <div style="font-size:24px;font-weight:800;color:#fff;margin-top:6px;">Invoice</div>
            </td>
            <td align="right" valign="top">
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:3px;">#${invoiceNumber}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:3px;">Issued: ${invoiceDate}</div>
              <div style="font-size:11px;color:#f59e0b;font-weight:600;">Due: ${dueDate}</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Bill to -->
      <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;padding:0 32px 20px;">
        <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:20px;"></div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:8px;">Bill To</div>
        <div style="font-size:15px;font-weight:700;color:#fff;">${customerName}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:3px;">${customerName.split(" ")[0]},</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:8px;line-height:1.6;">Thank you for choosing CyberCraft360. Please find your invoice details below and complete payment by the due date to ensure uninterrupted service.</div>
      </td></tr>

      <!-- Line items -->
      <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;padding:0 32px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;">
          <tr style="background:rgba(0,0,0,0.3);">
            <td style="padding:10px 20px;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Description</td>
            <td style="padding:10px 20px;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);text-align:right;">Amount</td>
          </tr>
          ${itemRows}
          <tr style="background:rgba(0,212,255,0.05);">
            <td style="padding:16px 20px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Total Due Now</td>
            <td style="padding:16px 20px;text-align:right;"><span style="font-size:22px;font-weight:800;color:#00d4ff;">$${total.toLocaleString()}</span></td>
          </tr>
        </table>
      </td></tr>

      <!-- Pay button -->
      <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td align="center">
            <a href="${payLink}" style="display:inline-block;padding:16px 48px;border-radius:12px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:14px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
              Pay $${total.toLocaleString()} via PayPal →
            </a>
          </td></tr>
          <tr><td align="center" style="padding-top:12px;">
            <span style="font-size:11px;color:rgba(255,255,255,0.25);">Secure payment powered by PayPal</span>
          </td></tr>
        </table>
      </td></tr>

      ${monthlyFee > 0 ? `
      <!-- Recurring -->
      <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;padding:0 32px 20px;">
        <div style="padding:14px 18px;border-radius:10px;background:rgba(124,58,237,0.07);border:1px solid rgba(124,58,237,0.2);">
          <p style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;margin:0;">
            ↻ After this payment, you will receive a separate email to authorize your <strong style="color:rgba(255,255,255,0.7);">$${monthlyFee.toLocaleString()}/month</strong> recurring subscription starting Month 2. You may cancel at any time.
          </p>
        </div>
      </td></tr>` : ""}

      ${notes ? `
      <!-- Notes -->
      <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;padding:0 32px 20px;">
        <p style="font-size:12px;color:rgba(255,255,255,0.4);line-height:1.7;margin:0;font-style:italic;">"${notes}"</p>
      </td></tr>` : ""}

      <!-- Disclaimers -->
      <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;padding:20px 32px;">
        <div style="height:1px;background:rgba(255,255,255,0.05);margin-bottom:16px;"></div>
        <div style="font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.2);margin-bottom:10px;">Terms & Conditions</div>
        <p style="font-size:10px;color:rgba(255,255,255,0.25);line-height:1.65;margin:0 0 6px;">
          <strong style="color:rgba(255,255,255,0.35);">No Refunds:</strong> All services are non-refundable once work has commenced. Digital services cannot be returned. By completing payment you agree to this policy.
        </p>
        <p style="font-size:10px;color:rgba(255,255,255,0.25);line-height:1.65;margin:0 0 6px;">
          <strong style="color:rgba(255,255,255,0.35);">Chargeback Policy:</strong> Filing a chargeback without first contacting us in writing constitutes breach of contract. CyberCraft360 reserves the right to recover all associated fees and legal costs.
        </p>
        <p style="font-size:10px;color:rgba(255,255,255,0.25);line-height:1.65;margin:0 0 6px;">
          <strong style="color:rgba(255,255,255,0.35);">Scope:</strong> This invoice covers only the services listed above. Additional features require a separate agreement.
        </p>
        <p style="font-size:10px;color:rgba(255,255,255,0.25);line-height:1.65;margin:0;">
          <strong style="color:rgba(255,255,255,0.35);">Governing Law:</strong> This agreement is governed by the laws of the State of Texas. Disputes are resolved through binding arbitration in Harris County, TX. A full copy of our terms is attached to this email as a PDF.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#0f1117;border-radius:0 0 16px 16px;border:1px solid rgba(255,255,255,0.07);border-top:1px solid rgba(255,255,255,0.05);padding:18px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><span style="font-size:10px;color:rgba(255,255,255,0.2);">CyberCraft360 · cybercraft360.com · Houston, TX</span></td>
            <td align="right"><span style="font-size:10px;color:rgba(255,255,255,0.2);">Questions? Reply to this email</span></td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const {
      customerName, customerEmail, serviceName, setupFee, monthlyFee, notes,
    }: {
      customerName: string; customerEmail: string; serviceName: string;
      setupFee?: number; monthlyFee?: number; notes?: string;
    } = await req.json();

    if (!customerEmail || !customerName || !serviceName) {
      return NextResponse.json({ error: "customerName, customerEmail, and serviceName are required" }, { status: 400 });
    }

    const setup = setupFee || 0;
    const monthly = monthlyFee || 0;
    if (setup === 0 && monthly === 0) {
      return NextResponse.json({ error: "At least one of setupFee or monthlyFee must be provided" }, { status: 400 });
    }

    const total = setup + monthly;
    const invoiceNumber = `CC360-${Date.now()}`;
    const now = new Date();
    const invoiceDate = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const due = new Date(now);
    due.setDate(due.getDate() + 7);
    const dueDate = due.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const payLink = buildPayPalLink(total, `${serviceName} — CyberCraft360`);

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber, invoiceDate, dueDate, customerName, customerEmail,
      serviceName, setupFee: setup, monthlyFee: monthly,
      notes: notes || "", payLink,
    });

    const html = buildInvoiceEmail({
      customerName, serviceName, setupFee: setup, monthlyFee: monthly,
      notes: notes || "", invoiceNumber, dueDate, invoiceDate, payLink,
    });

    // Send invoice to client with PDF attached
    await sendEmail({
      to: customerEmail,
      subject: `Invoice ${invoiceNumber} — CyberCraft360 ($${total.toLocaleString()} due ${dueDate})`,
      html,
      attachments: [{
        filename: `CyberCraft360-Invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    });

    // Save invoice to Redis
    const invoiceRecord: Invoice = {
      id: invoiceNumber,
      invoiceNumber,
      customerName,
      customerEmail,
      serviceName,
      setupFee: setup,
      monthlyFee: monthly,
      total,
      notes: notes || "",
      status: "sent",
      sentAt: now.toISOString(),
      dueDate: due.toISOString(),
    };
    const invoices = await redis.get<Invoice[]>("invoices:all") ?? [];
    invoices.unshift(invoiceRecord);
    await redis.set("invoices:all", invoices);

    // Log activity
    logActivity({
      type: "invoice",
      title: `Invoice sent to ${customerName}`,
      detail: `${serviceName} · $${total.toLocaleString()}`,
      clientName: customerName,
      amount: total,
    }).catch(() => {});

    // Notify owner
    sendEmail({
      to: "cybercraftlimited@gmail.com",
      subject: `📄 Invoice Sent — ${customerName} · $${total.toLocaleString()} (${serviceName})`,
      html: `
        <div style="font-family:system-ui,sans-serif;background:#0a0c12;padding:32px;border-radius:12px;max-width:500px;margin:0 auto;">
          <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);border-radius:3px;margin-bottom:24px;"></div>
          <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 8px;">CyberCraft360</p>
          <h2 style="color:#fff;font-size:20px;margin:0 0 24px;">📄 Invoice Sent</h2>
          <table style="width:100%;border-collapse:collapse;">
            ${[
              ["Invoice #", invoiceNumber],
              ["Client", customerName],
              ["Email", customerEmail],
              ["Service", serviceName],
              ["Setup Fee", `$${setup.toLocaleString()}`],
              ["Monthly Fee", `$${monthly.toLocaleString()}`],
              ["Total", `$${total.toLocaleString()}`],
              ["Due Date", dueDate],
            ].map(([label, value], i) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:10px 0;font-size:11px;color:rgba(255,255,255,0.4);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;width:110px;">${label}</td>
                <td style="padding:10px 0;font-size:13px;color:${i === 6 ? "#00d4ff" : "#fff"};font-weight:${i === 6 ? "700" : "400"};">${value}</td>
              </tr>`).join("")}
          </table>
          <div style="margin-top:20px;padding:12px 16px;background:rgba(0,212,255,0.07);border:1px solid rgba(0,212,255,0.15);border-radius:8px;">
            <p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0;">PDF invoice with full terms attached. Client has been notified at <strong style="color:rgba(255,255,255,0.7);">${customerEmail}</strong>.</p>
          </div>
        </div>`,
      attachments: [{
        filename: `CyberCraft360-Invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    }).catch(() => {});

    return NextResponse.json({ ok: true, invoiceNumber, total, dueDate });
  } catch (err) {
    console.error("Invoice route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
