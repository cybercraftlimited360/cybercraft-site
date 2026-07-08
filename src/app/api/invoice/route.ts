import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";

function buildPayPalLink(amount: number, serviceName: string): string {
  const email = process.env.PAYPAL_BUSINESS_EMAIL || "";
  return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(email)}&amount=${amount.toFixed(2)}&currency_code=USD&item_name=${encodeURIComponent(serviceName)}&no_shipping=1`;
}

function buildInvoiceEmail({
  customerName, serviceName, setupFee, monthlyFee, notes, invoiceNumber, dueDate, payLink,
}: {
  customerName: string; serviceName: string; setupFee: number; monthlyFee: number;
  notes: string; invoiceNumber: string; dueDate: string; payLink: string;
}) {
  const total = setupFee + monthlyFee;
  const firstName = customerName.split(" ")[0];

  const rows = [
    setupFee > 0 && `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:14px;font-weight:600;color:#fff;">${serviceName} — One-Time Setup Fee</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:3px;">Initial configuration, onboarding & deployment</div>
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;white-space:nowrap;">
          <span style="font-size:15px;font-weight:700;color:#00d4ff;">$${setupFee.toLocaleString()}</span>
        </td>
      </tr>`,
    monthlyFee > 0 && `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:14px;font-weight:600;color:#fff;">${serviceName} — Month 1 Subscription</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:3px;">AI system management, monitoring & support</div>
        </td>
        <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;white-space:nowrap;">
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
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <!-- Header -->
        <tr><td style="background:#0f1117;border-radius:16px 16px 0 0;border:1px solid rgba(255,255,255,0.07);border-bottom:none;padding:32px 32px 24px;">
          <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);border-radius:2px;margin-bottom:24px;"></div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);">CyberCraft360</div>
                <div style="font-size:22px;font-weight:800;color:#fff;margin-top:6px;">Invoice</div>
              </td>
              <td align="right" valign="top">
                <div style="font-size:11px;color:rgba(255,255,255,0.3);">#${invoiceNumber}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;">Due ${dueDate}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;border-bottom:none;padding:0 32px 24px;">
          <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0;">
            Hi ${firstName},<br/><br/>
            Thank you for choosing CyberCraft360. Please find your invoice details below.
          </p>
        </td></tr>

        <!-- Line items -->
        <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;border-bottom:none;padding:0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.07);border-radius:12px;overflow:hidden;">
            ${rows}
            <tr style="background:rgba(0,212,255,0.04);">
              <td style="padding:16px 20px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Total Due Now</div>
              </td>
              <td style="padding:16px 20px;text-align:right;">
                <span style="font-size:20px;font-weight:800;color:#00d4ff;">$${total.toLocaleString()}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Pay button -->
        <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;border-bottom:none;padding:28px 32px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="${payLink}" style="display:inline-block;padding:15px 40px;border-radius:12px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:14px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
                Pay $${total.toLocaleString()} via PayPal →
              </a>
            </td></tr>
          </table>
        </td></tr>

        ${monthlyFee > 0 ? `
        <!-- Recurring note -->
        <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;border-bottom:none;padding:0 32px 24px;">
          <div style="padding:14px 18px;border-radius:10px;background:rgba(124,58,237,0.07);border:1px solid rgba(124,58,237,0.18);">
            <p style="font-size:12px;color:rgba(255,255,255,0.45);line-height:1.6;margin:0;">
              ↻ After this payment, you will receive a separate email to set up your <strong style="color:rgba(255,255,255,0.7);">$${monthlyFee.toLocaleString()}/month</strong> recurring subscription starting Month 2.
            </p>
          </div>
        </td></tr>` : ""}

        ${notes ? `
        <!-- Notes -->
        <tr><td style="background:#0f1117;border:1px solid rgba(255,255,255,0.07);border-top:none;border-bottom:none;padding:0 32px 24px;">
          <p style="font-size:13px;color:rgba(255,255,255,0.4);line-height:1.7;margin:0;font-style:italic;">"${notes}"</p>
        </td></tr>` : ""}

        <!-- Footer -->
        <tr><td style="background:#0f1117;border-radius:0 0 16px 16px;border:1px solid rgba(255,255,255,0.07);border-top:1px solid rgba(255,255,255,0.05);padding:20px 32px;">
          <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:0;line-height:1.6;">
            CyberCraft360 · cybercraft360.com · Houston, TX<br/>
            Questions? Reply to this email or call us directly.
          </p>
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
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const dueDate = due.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const payLink = buildPayPalLink(total, `${serviceName} — CyberCraft360`);
    const html = buildInvoiceEmail({
      customerName, serviceName, setupFee: setup, monthlyFee: monthly,
      notes: notes || "", invoiceNumber, dueDate, payLink,
    });

    // Send invoice to client
    await sendEmail({
      to: customerEmail,
      subject: `Invoice ${invoiceNumber} — CyberCraft360 ($${total.toLocaleString()} due ${dueDate})`,
      html,
    });

    // Notify owner
    sendEmail({
      to: "cybercraftlimited@gmail.com",
      subject: `📄 Invoice sent to ${customerName} — $${total.toLocaleString()} (${serviceName})`,
      html: `<p style="font-family:sans-serif;color:#333;">Invoice <strong>${invoiceNumber}</strong> sent to <strong>${customerName}</strong> (${customerEmail}).<br/>Service: ${serviceName}<br/>Setup: $${setup.toLocaleString()} · Monthly: $${monthly.toLocaleString()} · Total: $${total.toLocaleString()}<br/>Due: ${dueDate}</p>`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, invoiceNumber, total, dueDate });
  } catch (err) {
    console.error("Invoice route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
