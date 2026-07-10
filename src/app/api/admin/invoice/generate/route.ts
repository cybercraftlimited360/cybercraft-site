import { NextRequest, NextResponse } from "next/server";

function verify(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!verify(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerName, customerEmail, serviceName, total, notes } = await req.json();

  if (!customerName || !customerEmail || !total) {
    return NextResponse.json({ error: "customerName, customerEmail, and total are required" }, { status: 400 });
  }

  // Forward to the main invoice route — it handles PDF, email, Redis, and activity logging
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${origin}/api/invoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerName,
      customerEmail,
      serviceName: serviceName || "AI Services",
      setupFee: total,
      monthlyFee: 0,
      notes: notes || "",
    }),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.error || "Invoice failed" }, { status: 500 });
  return NextResponse.json({ ok: true, ...data });
}
