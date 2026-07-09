import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const AVAIL_FILE = path.join(process.cwd(), "data", "availability.json");

async function readJson(file: string) {
  try { return JSON.parse(await fs.readFile(file, "utf-8")); } catch { return null; }
}

function isAdmin(req: NextRequest) {
  return req.nextUrl.searchParams.get("secret") === process.env.ADMIN_SECRET ||
    req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const avail = await readJson(AVAIL_FILE);
  return NextResponse.json(avail ?? {});
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    await fs.writeFile(AVAIL_FILE, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

