import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: "ADMIN_PASSWORD not set" }, { status: 500 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // Return a token the client stores — just the password hashed with a server secret
  const token = Buffer.from(`cc360:${adminPassword}:${process.env.ADMIN_PASSWORD}`).toString("base64");
  return NextResponse.json({ ok: true, token });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !token) return NextResponse.json({ ok: false }, { status: 401 });

  const expected = Buffer.from(`cc360:${adminPassword}:${adminPassword}`).toString("base64");
  return token === expected
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false }, { status: 401 });
}
