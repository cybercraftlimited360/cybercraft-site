import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { REEL_CAMPAIGNS } from "@/app/api/admin/reels/generate-script/route";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

function makeAdminToken() {
  return Buffer.from(`cc360:${process.env.ADMIN_SECRET ?? ""}:v2`).toString("base64");
}

function buildCaptions(script: any): Record<string, string> {
  const vo = script?.voiceoverScript ?? "";
  const hook = script?.hook ?? vo;
  return {
    instagram: `${hook}\n\nSchedule Your Discovery → CyberCraft360.com\n\n#AIEngineering #BusinessAutomation #AIAgency #WorkflowAutomation #IntelligentSystems #CyberCraft360`,
    facebook: `${vo}\n\nSchedule Your Discovery → CyberCraft360.com`,
    linkedin: `${vo}\n\nSchedule Your Discovery → CyberCraft360.com\n\n#AIEngineering #BusinessAutomation #IntelligentSystems #OperationalExcellence #CyberCraft360`,
  };
}

export async function GET(req: NextRequest) {
  // DISABLED — reel scheduling paused
  return NextResponse.json({ ok: false, disabled: true, message: "Reel scheduling is currently disabled" });

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Pick next unused campaign
    const used = await redis.get<number[]>("reels:used_campaign_indexes") ?? [];
    const allIdxs = REEL_CAMPAIGNS.map((_, i) => i);
    let unused = allIdxs.filter(i => !used.includes(i));
    if (unused.length === 0) {
      await redis.set("reels:used_campaign_indexes", []);
      unused = allIdxs;
    }
    const campaignIdx = unused[0];
    const campaign = REEL_CAMPAIGNS[campaignIdx];
    const token = makeAdminToken();

    // 1. Generate script + B-roll clips
    const scriptRes = await fetch(`${SITE_URL}/api/admin/reels/generate-script`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ campaignIndex: campaignIdx }),
    });
    if (!scriptRes.ok) throw new Error(`Script generation failed: ${scriptRes.status}`);
    const { script, suggestedClips } = await scriptRes.json();

    // 2. Generate voiceover
    const voiceRes = await fetch(`${SITE_URL}/api/admin/reels/generate-voiceover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ script: script.voiceoverScript }),
    });
    const voiceData = voiceRes.ok ? await voiceRes.json() : null;
    if (!voiceData?.audioUrl) throw new Error("Voiceover generation failed");

    // 3. Submit to Shotstack for rendering + auto-posting via webhook
    const renderRes = await fetch(`${SITE_URL}/api/admin/reels/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({
        script,
        voiceoverUrl: voiceData.audioUrl,
        clips: suggestedClips ?? [],
        campaignIndex: campaignIdx,
        platforms: ["instagram", "facebook", "linkedin"],
        captions: buildCaptions(script),
      }),
    });

    const renderData = renderRes.ok ? await renderRes.json() : null;

    // Mark campaign as used regardless of render result
    const updatedUsed = await redis.get<number[]>("reels:used_campaign_indexes") ?? [];
    if (!updatedUsed.includes(campaignIdx)) {
      updatedUsed.push(campaignIdx);
      await redis.set("reels:used_campaign_indexes", updatedUsed);
    }

    if (!renderData?.renderId) {
      // Shotstack not configured — log and return
      console.warn("[reel-cron] Render skipped (no SHOTSTACK_API_KEY or render failed)");
      return NextResponse.json({ ok: true, campaign: campaign.campaign, week: campaign.week, renderSkipped: true });
    }

    console.log(`[reel-cron] Wk${campaign.week} ${campaign.day} — render submitted: ${renderData.renderId}`);
    return NextResponse.json({ ok: true, campaign: campaign.campaign, week: campaign.week, renderId: renderData.renderId });

  } catch (err) {
    console.error("[reel-cron]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
