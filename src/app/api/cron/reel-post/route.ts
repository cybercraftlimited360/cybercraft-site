import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { REEL_CAMPAIGNS } from "@/app/api/admin/reels/generate-script/route";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

  try {
    // Pick next unused reel campaign index
    const used = await redis.get<number[]>("reels:used_campaign_indexes") ?? [];
    const unused = REEL_CAMPAIGNS.map((_, i) => i).filter(i => !used.includes(i));
    let campaignIdx = unused.length > 0 ? unused[0] : 0;
    if (unused.length === 0) {
      await redis.set("reels:used_campaign_indexes", []);
      campaignIdx = 0;
    }

    const campaign = REEL_CAMPAIGNS[campaignIdx];

    // Generate script via our own endpoint
    const scriptRes = await fetch(`${siteUrl}/api/admin/reels/generate-script`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": makeToken(process.env.ADMIN_SECRET ?? "") },
      body: JSON.stringify({ campaignIndex: campaignIdx }),
    });
    if (!scriptRes.ok) throw new Error("Script generation failed");
    const { script, suggestedClips } = await scriptRes.json();

    // Generate voiceover
    const voiceRes = await fetch(`${siteUrl}/api/admin/reels/generate-voiceover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": makeToken(process.env.ADMIN_SECRET ?? "") },
      body: JSON.stringify({ script: script.voiceoverScript }),
    });
    const voiceData = voiceRes.ok ? await voiceRes.json() : null;

    // Store as pending reel for admin review
    const reelId = `reels:pending:${Date.now()}`;
    const pending = {
      id: reelId,
      campaignIndex: campaignIdx,
      campaign: campaign.campaign,
      week: campaign.week,
      day: campaign.day,
      script,
      suggestedClips,
      audioUrl: voiceData?.audioUrl ?? null,
      generatedAt: new Date().toISOString(),
      status: "pending_review",
    };

    await redis.set(reelId, pending, { ex: 7 * 24 * 3600 }); // 7 days

    // Add to pending list
    const list = await redis.get<string[]>("reels:pending_list") ?? [];
    list.unshift(reelId);
    await redis.set("reels:pending_list", list.slice(0, 20));

    // Mark campaign used
    const updatedUsed = await redis.get<number[]>("reels:used_campaign_indexes") ?? [];
    if (!updatedUsed.includes(campaignIdx)) {
      updatedUsed.push(campaignIdx);
      await redis.set("reels:used_campaign_indexes", updatedUsed);
    }

    console.log(`[reel-cron] Week ${campaign.week} ${campaign.day} — ${campaign.campaign}`);
    return NextResponse.json({ ok: true, campaign: campaign.campaign, week: campaign.week });

  } catch (err) {
    console.error("[reel-cron]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

function makeToken(s: string) { return Buffer.from(`cc360:${s}:v2`).toString("base64"); }
