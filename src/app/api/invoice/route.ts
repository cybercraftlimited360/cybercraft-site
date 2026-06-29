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
  if (!res.ok) throw new Error(data.error_description || "PayPal auth failed");
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const {
      customerName,
      customerEmail,
      serviceName,
      setupFee,
      monthlyFee,
      notes,
    }: {
      customerName: string;
      customerEmail: string;
      serviceName: string;
      setupFee?: number;
      monthlyFee?: number;
      notes?: string;
    } = await req.json();

    if (!customerEmail || !customerName || !serviceName) {
      return NextResponse.json({ error: "customerName, customerEmail, and serviceName are required" }, { status: 400 });
    }

    const token = await getAccessToken();

    // Build line items
    const items: object[] = [];
    if (setupFee && setupFee > 0) {
      items.push({
        name: `${serviceName} — One-Time Setup Fee`,
        description: "Initial configuration, onboarding, and deployment",
        quantity: "1",
        unit_amount: { currency_code: "USD", value: setupFee.toFixed(2) },
        unit_of_measure: "QUANTITY",
      });
    }
    if (monthlyFee && monthlyFee > 0) {
      items.push({
        name: `${serviceName} — Monthly Subscription (Month 1)`,
        description: "AI system management, monitoring, retraining & support",
        quantity: "1",
        unit_amount: { currency_code: "USD", value: monthlyFee.toFixed(2) },
        unit_of_measure: "QUANTITY",
      });
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "At least one of setupFee or monthlyFee must be provided" }, { status: 400 });
    }

    const totalAmount = (setupFee || 0) + (monthlyFee || 0);

    // Due date: 7 days from today
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const dueDate = due.toISOString().split("T")[0];

    // Create draft invoice
    const createRes = await fetch(`${PAYPAL_BASE}/v2/invoicing/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        detail: {
          invoice_number: `CC360-${Date.now()}`,
          invoice_date: new Date().toISOString().split("T")[0],
          payment_term: { term_type: "DUE_ON_DATE_SPECIFIED", due_date: dueDate },
          currency_code: "USD",
          note: notes || "Thank you for choosing CyberCraft360. We look forward to building your AI system.",
          memo: "All prices in USD. Monthly subscription billed on the same date each month.",
        },
        invoicer: {
          name: { given_name: "CyberCraft360" },
          email_address: process.env.PAYPAL_BUSINESS_EMAIL || "",
          website: "https://cybercraft360.com",
          logo_url: "https://cybercraft360.com/logo.png",
        },
        primary_recipients: [
          {
            billing_info: {
              name: {
                given_name: customerName.split(" ")[0],
                surname: customerName.split(" ").slice(1).join(" ") || ".",
              },
              email_address: customerEmail,
            },
          },
        ],
        items,
        amount: {
          breakdown: {
            item_total: { currency_code: "USD", value: totalAmount.toFixed(2) },
          },
        },
        configuration: {
          allow_tip: false,
          tax_calculated_after_discount: false,
          tax_inclusive: false,
        },
      }),
    });

    const invoice = await createRes.json();
    if (!createRes.ok) {
      console.error("PayPal create invoice error:", invoice);
      return NextResponse.json({ error: invoice.message || "Failed to create invoice" }, { status: 500 });
    }

    const invoiceId = invoice.id;

    // Send the invoice to the customer
    const sendRes = await fetch(`${PAYPAL_BASE}/v2/invoicing/invoices/${invoiceId}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        send_to_invoicer: true,
        send_to_recipient: true,
        additional_recipients: [],
      }),
    });

    if (!sendRes.ok) {
      const sendErr = await sendRes.json().catch(() => ({}));
      console.error("PayPal send invoice error:", sendErr);
      return NextResponse.json({ error: "Invoice created but failed to send" }, { status: 500 });
    }

    console.log(`PayPal invoice ${invoiceId} sent to ${customerEmail}`);
    return NextResponse.json({ ok: true, invoiceId });
  } catch (err) {
    console.error("Invoice route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
