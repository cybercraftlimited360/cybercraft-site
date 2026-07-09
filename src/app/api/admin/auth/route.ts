import { NextRequest, NextResponse } from "next/server";

function makeToken(secret: string) {
  return Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_SECRET;

  if (!adminPassword) {
    return NextResponse.json({ error: "ADMIN_SECRET env var not configured on server." }, { status: 500 });
  }

  // Trim whitespace — password managers often add trailing spaces
  if (password?.trim() !== adminPassword.trim()) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, token: makeToken(adminPassword) });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const adminPassword = process.env.ADMIN_SECRET;
  if (!adminPassword || !token) return NextResponse.json({ ok: false }, { status: 401 });
  return token === makeToken(adminPassword)
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false }, { status: 401 });
}
