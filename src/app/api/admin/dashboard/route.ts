import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getBookings } from "@/lib/redis";

function verifyToken(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !token) return false;
  const expected = Buffer.from(`cc360:${adminPassword}:${adminPassword}`).toString("base64");
  return token === expected;
}

const PAYPAL_BASE = process.env.PAYPAL_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalToken(): Promise<string | null> {
  try {
    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });
    const d = await res.json();
    return d.access_token ?? null;
  } catch {
    return null;
  }
}

async function getPayPalStats(token: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];

  // Fetch invoices
  const [monthRes, yearRes, draftRes] = await Promise.all([
    fetch(`${PAYPAL_BASE}/v2/invoicing/invoices?page_size=100&page=1&total_count_required=true&fields=all`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${PAYPAL_BASE}/v2/invoicing/invoices?page_size=100&page=1&total_count_required=true&fields=all`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`${PAYPAL_BASE}/v2/invoicing/invoices?page_size=100&page=1&total_count_required=true&fields=all`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  const allInvoicesRes = await fetch(
    `${PAYPAL_BASE}/v2/invoicing/invoices?page_size=100&page=1&total_count_required=true`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const allInvoicesData = await allInvoicesRes.json();
  const invoices: any[] = allInvoicesData.items ?? [];

  let totalRevenue = 0;
  let monthRevenue = 0;
  let outstanding = 0;
  let invoicesPaid = 0;
  let invoicesUnpaid = 0;
  let invoicesCancelled = 0;
  const recentInvoices: any[] = [];

  for (const inv of invoices) {
    const amount = parseFloat(inv.amount?.value ?? inv.detail?.amount?.breakdown?.item_total?.value ?? "0");
    const status = inv.status;
    const invoiceDate = inv.detail?.invoice_date ?? "";
    const recipientName = inv.primary_recipients?.[0]?.billing_info?.name;
    const name = recipientName
      ? `${recipientName.given_name ?? ""} ${recipientName.surname ?? ""}`.trim()
      : "Unknown";
    const email = inv.primary_recipients?.[0]?.billing_info?.email_address ?? "";

    if (status === "PAID") {
      totalRevenue += amount;
      invoicesPaid++;
      if (invoiceDate >= monthStart) monthRevenue += amount;
    } else if (status === "SENT" || status === "PARTIALLY_PAID") {
      outstanding += amount;
      invoicesUnpaid++;
    } else if (status === "CANCELLED") {
      invoicesCancelled++;
    }

    recentInvoices.push({
      id: inv.id,
      number: inv.detail?.invoice_number,
      client: name,
      email,
      amount,
      status,
      date: invoiceDate,
      service: inv.items?.[0]?.name ?? "Service",
    });
  }

  // Sort recent invoices newest first
  recentInvoices.sort((a, b) => (b.date > a.date ? 1 : -1));

  // Fetch subscriptions (new v1 billing subscriptions)
  let activeSubscriptions = 0;
  let mrr = 0;
  let cancelledThisMonth = 0;
  const subscriptionsList: any[] = [];

  try {
    // List subscriptions via agreements (legacy) — best effort
    const subsRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions?page_size=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (subsRes.ok) {
      const subsData = await subsRes.json();
      const subs: any[] = subsData.subscriptions ?? subsData.agreements ?? [];
      for (const sub of subs) {
        const state = sub.status ?? sub.state;
        const amount = parseFloat(sub.plan?.billing_cycles?.[0]?.pricing_scheme?.fixed_price?.value ?? sub.plan?.payment_definitions?.[0]?.amount?.value ?? "0");
        if (state === "ACTIVE") {
          activeSubscriptions++;
          mrr += amount;
        }
        if ((state === "CANCELLED" || state === "SUSPENDED") && sub.update_time?.startsWith(monthStart.slice(0, 7))) {
          cancelledThisMonth++;
        }
        subscriptionsList.push({ id: sub.id, status: state, amount, name: sub.name ?? "" });
      }
    }
  } catch {}

  return {
    totalRevenue,
    monthRevenue,
    outstanding,
    invoicesPaid,
    invoicesUnpaid,
    invoicesCancelled,
    activeSubscriptions,
    mrr,
    cancelledThisMonth,
    recentInvoices: recentInvoices.slice(0, 10),
    subscriptionsList: subscriptionsList.slice(0, 10),
  };
}

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    // ── Redis data ──────────────────────────────────────────────────────────
    const [bookings, leadsRaw, chatStats, laurenStats, dailyKeys] = await Promise.all([
      getBookings(),
      redis.get<any[]>("leads:all"),
      redis.hgetall("chat:stats"),
      redis.hgetall("lauren:stats"),
      redis.keys("chat:daily:*"),
    ]);

    const leads = leadsRaw ?? [];
    const leadsThisMonth = leads.filter(l => (l.capturedAt ?? "").startsWith(monthStart.slice(0, 7))).length;

    const upcoming = bookings.filter(b => b.date >= now.toISOString().split("T")[0] && b.status !== "cancelled");
    const cancelledBookings = bookings.filter(b => b.status === "cancelled");
    const bookingsThisMonth = bookings.filter(b => b.date.startsWith(monthStart.slice(0, 7)));

    // Daily chat activity (last 14 days)
    const daily: Record<string, { conversations: number; leads: number }> = {};
    await Promise.all(
      dailyKeys
        .filter(k => k.replace("chat:daily:", "") >= new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0])
        .map(async k => {
          const date = k.replace("chat:daily:", "");
          const rec = await redis.hgetall(k);
          if (rec) daily[date] = { conversations: Number(rec.conversations ?? 0), leads: Number(rec.leads ?? 0) };
        })
    );

    // ── PayPal data ─────────────────────────────────────────────────────────
    let paypal = null;
    const ppToken = await getPayPalToken();
    if (ppToken) {
      paypal = await getPayPalStats(ppToken);
    }

    return NextResponse.json({
      leads: {
        total: leads.length,
        thisMonth: leadsThisMonth,
        withPhone: leads.filter(l => l.phone).length,
        recent: leads.slice(-5).reverse(),
      },
      bookings: {
        total: bookings.length,
        upcoming: upcoming.length,
        thisMonth: bookingsThisMonth.length,
        cancelled: cancelledBookings.length,
        upcomingList: upcoming.slice(0, 5).sort((a, b) => a.date.localeCompare(b.date)),
      },
      chat: {
        totalConversations: Number(chatStats?.totalConversations ?? 0),
        totalLeads: Number(chatStats?.totalLeads ?? 0),
        totalMessages: Number(chatStats?.totalMessages ?? 0),
        bookingClicks: Number(chatStats?.bookingClicks ?? 0),
        daily,
      },
      lauren: {
        totalCalls: Number(laurenStats?.totalCalls ?? 0),
      },
      paypal,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
