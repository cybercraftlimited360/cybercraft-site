import { NextRequest, NextResponse } from "next/server";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const botUrl = process.env.LINKEDIN_BOT_URL;
  const botSecret = process.env.LINKEDIN_BOT_SECRET || "cc360-linkedin-bot";

  if (!botUrl) {
    return NextResponse.json({ error: "LINKEDIN_BOT_URL not configured. Set up ngrok and add the URL to Vercel env vars." }, { status: 500 });
  }

  try {
    const res = await fetch(`${botUrl}/run`, {
      method: "POST",
      headers: { "x-bot-secret": botSecret, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: "Could not reach bot server: " + e.message + ". Make sure your PC is on and bot-server.js is running." }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const botUrl = process.env.LINKEDIN_BOT_URL;
  const botSecret = process.env.LINKEDIN_BOT_SECRET || "cc360-linkedin-bot";

  if (!botUrl) return NextResponse.json({ online: false, error: "LINKEDIN_BOT_URL not set" });

  try {
    const res = await fetch(`${botUrl}/status`, {
      headers: { "x-bot-secret": botSecret },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json({ online: true, ...data });
  } catch {
    return NextResponse.json({ online: false });
  }
}
