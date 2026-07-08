import { NextRequest, NextResponse } from "next/server";

const PAYPAL_BASE = process.env.PAYPAL_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials not configured");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("PayPal auth error:", JSON.stringify(data), "ENV:", process.env.PAYPAL_ENV, "BASE:", PAYPAL_BASE);
    throw new Error(data.error_description || data.error || "PayPal auth failed");
  }
  return data.access_token;
}

async function createFirstInvoice(
  token: string,
  { customerName, customerEmail, serviceName, setupFee, monthlyFee, notes }: {
    customerName: string; customerEmail: string; serviceName: string;
    setupFee: number; monthlyFee: number; notes?: string;
  }
) {
  const items: object[] = [];
  if (setupFee > 0) {
    items.push({
      name: `${serviceName} — One-Time Setup Fee`,
      description: "Initial configuration, onboarding, and deployment",
      quantity: "1",
      unit_amount: { currency_code: "USD", value: setupFee.toFixed(2) },
      unit_of_measure: "QUANTITY",
    });
  }
  if (monthlyFee > 0) {
    items.push({
      name: `${serviceName} — Month 1 Subscription`,
      description: "AI system management, monitoring, retraining & support",
      quantity: "1",
      unit_amount: { currency_code: "USD", value: monthlyFee.toFixed(2) },
      unit_of_measure: "QUANTITY",
    });
  }

  const totalAmount = setupFee + monthlyFee;
  const due = new Date();
  due.setDate(due.getDate() + 7);
  const dueDate = due.toISOString().split("T")[0];

  const res = await fetch(`${PAYPAL_BASE}/v2/invoicing/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      detail: {
        invoice_number: `CC360-${Date.now()}`,
        invoice_date: new Date().toISOString().split("T")[0],
        payment_term: { term_type: "DUE_ON_DATE_SPECIFIED", due_date: dueDate },
        currency_code: "USD",
        note: notes || "Thank you for choosing CyberCraft360. Your AI system will be live within the agreed timeframe.",
        memo: "This invoice covers your one-time setup fee and first month. A separate recurring subscription link will be sent for subsequent months.",
      },
      invoicer: {
        name: { given_name: "CyberCraft360" },
        email_address: process.env.PAYPAL_BUSINESS_EMAIL || "",
        website: "https://cybercraft360.com",
      },
      primary_recipients: [{
        billing_info: {
          name: {
            given_name: customerName.split(" ")[0],
            surname: customerName.split(" ").slice(1).join(" ") || ".",
          },
          email_address: customerEmail,
        },
      }],
      items,
      amount: {
        breakdown: {
          item_total: { currency_code: "USD", value: totalAmount.toFixed(2) },
        },
      },
      configuration: { allow_tip: false, tax_calculated_after_discount: false, tax_inclusive: false },
    }),
  });

  const invoice = await res.json();
  if (!res.ok) {
    console.error("PayPal invoice create error:", JSON.stringify(invoice));
    throw new Error(invoice.message || invoice.error_description || JSON.stringify(invoice));
  }
  return invoice.id as string;
}

async function createRecurringSubscription(
  token: string,
  { customerName, customerEmail, serviceName, monthlyFee }: {
    customerName: string; customerEmail: string; serviceName: string; monthlyFee: number;
  }
): Promise<string> {
  // 1. Create a product
  const productRes = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: `CyberCraft360 — ${serviceName}`,
      description: `Monthly AI subscription for ${serviceName}`,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  const product = await productRes.json();
  if (!productRes.ok) throw new Error(product.message || "Failed to create product");

  // 2. Create a billing plan
  const planRes = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      product_id: product.id,
      name: `${serviceName} Monthly`,
      description: `Monthly subscription for ${serviceName} — billed automatically every month`,
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 = infinite until cancelled
          pricing_scheme: {
            fixed_price: { value: monthlyFee.toFixed(2), currency_code: "USD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
  const plan = await planRes.json();
  if (!planRes.ok) throw new Error(plan.message || "Failed to create billing plan");

  // 3. Create a subscription and get the approval link
  // Start billing next month (they already paid month 1 in the invoice)
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() + 1);

  const subRes = await fetch(`${PAYPAL_BASE}/v1/billing/agreements`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: `${serviceName} — Monthly Subscription`,
      description: `Auto-billed $${monthlyFee}/month for ${customerName}`,
      start_date: startDate.toISOString(),
      plan: { id: plan.id },
      payer: {
        payment_method: "paypal",
        payer_info: {
          email: customerEmail,
          first_name: customerName.split(" ")[0],
          last_name: customerName.split(" ").slice(1).join(" ") || ".",
        },
      },
    }),
  });
  const sub = await subRes.json();
  if (!subRes.ok) throw new Error(sub.message || "Failed to create subscription");

  // Return the approval URL for the client to authorize
  const approvalLink = sub.links?.find((l: any) => l.rel === "approval_url")?.href;
  return approvalLink || "";
}

async function sendSubscriptionEmail(
  token: string,
  customerEmail: string,
  customerName: string,
  serviceName: string,
  monthlyFee: number,
  approvalUrl: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !approvalUrl) return;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0c12;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c12;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
        <tr><td style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></td></tr>
        <tr><td style="padding:36px 36px 24px;">
          <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);">CyberCraft360</span><br/>
          <span style="font-size:22px;font-weight:700;color:#ffffff;margin-top:8px;display:block;">Set Up Your Monthly Subscription</span>
        </td></tr>
        <tr><td style="padding:0 36px;"><div style="height:1px;background:rgba(255,255,255,0.06);"></div></td></tr>
        <tr><td style="padding:28px 36px;">
          <p style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.7;margin:0 0 20px;">
            Hi ${customerName.split(" ")[0]},<br/><br/>
            Your first invoice covers your setup and Month 1. To make future payments automatic, please authorize your <strong style="color:#fff;">${serviceName}</strong> monthly subscription below — you'll be charged <strong style="color:#00d4ff;">$${monthlyFee}/month</strong> starting next month.
          </p>
          <p style="font-size:13px;color:rgba(255,255,255,0.35);margin:0 0 28px;">You can cancel anytime from your PayPal account.</p>
          <a href="${approvalUrl}" style="display:inline-block;padding:14px 32px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase;">
            Authorize Monthly Billing →
          </a>
        </td></tr>
        <tr><td style="padding:24px 36px;border-top:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:11px;color:rgba(255,255,255,0.15);">CyberCraft360 · cybercraft360.com · Houston, TX</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: "CyberCraft360 <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Authorize your ${serviceName} monthly subscription — CyberCraft360`,
      html,
    }),
  });
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

    const token = await getAccessToken();

    // 1. Send first invoice (setup + month 1)
    const invoiceId = await createFirstInvoice(token, {
      customerName, customerEmail, serviceName,
      setupFee: setup, monthlyFee: monthly, notes,
    });

    await fetch(`${PAYPAL_BASE}/v2/invoicing/invoices/${invoiceId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ send_to_invoicer: true, send_to_recipient: true }),
    });

    // 2. If monthly fee, set up recurring subscription
    let subscriptionApprovalUrl = "";
    if (monthly > 0) {
      try {
        subscriptionApprovalUrl = await createRecurringSubscription(token, {
          customerName, customerEmail, serviceName, monthlyFee: monthly,
        });
        // Email the client their subscription approval link
        await sendSubscriptionEmail(token, customerEmail, customerName, serviceName, monthly, subscriptionApprovalUrl);
      } catch (subErr) {
        console.error("Subscription setup error (non-fatal):", subErr);
      }
    }

    return NextResponse.json({ ok: true, invoiceId, subscriptionApprovalUrl });
  } catch (err) {
    console.error("Invoice route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
