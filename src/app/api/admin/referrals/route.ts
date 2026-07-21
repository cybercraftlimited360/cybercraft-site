import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function auth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

function makeCode(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  const suffix = Math.random().toString(36).slice(2, 5);
  return `${base}-${suffix}`;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const referrals = await redis.get<any[]>("referrals:all") ?? [];
  return NextResponse.json({ referrals });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, id, clientName, email, reward, referredName, referredEmail, code } = await req.json();

  if (action === "create") {
    const referrals = await redis.get<any[]>("referrals:all") ?? [];
    const newCode = makeCode(clientName || "ref");
    const entry = {
      id: Date.now().toString(),
      clientName, email: email || "",
      code: newCode,
      reward: reward || "1 month free",
      referrals: [],
      createdAt: new Date().toISOString(),
    };
    referrals.push(entry);
    await redis.set("referrals:all", referrals);
    return NextResponse.json({ ok: true, code: newCode, entry });
  }

  if (action === "log-referral") {
    const referrals = await redis.get<any[]>("referrals:all") ?? [];
    const updated = referrals.map(r => {
      if (r.code !== code) return r;
      return {
        ...r,
        referrals: [...(r.referrals || []), {
          name: referredName || "Unknown",
          email: referredEmail || "",
          convertedAt: new Date().toISOString(),
          status: "pending",
        }],
      };
    });
    await redis.set("referrals:all", updated);
    return NextResponse.json({ ok: true });
  }

  if (action === "mark-rewarded") {
    const referrals = await redis.get<any[]>("referrals:all") ?? [];
    const updated = referrals.map(r =>
      r.id === id ? { ...r, rewarded: true, rewardedAt: new Date().toISOString() } : r
    );
    await redis.set("referrals:all", updated);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const referrals = await redis.get<any[]>("referrals:all") ?? [];
    await redis.set("referrals:all", referrals.filter(r => r.id !== id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
