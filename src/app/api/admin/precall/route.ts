import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

const SERVICES: Record<string, { name: string; price: string; pitch: string }> = {
  ai_receptionist:   { name: "AI Receptionist",        price: "$500–800/mo",  pitch: "Answers every call 24/7 in your business name, qualifies leads, books appointments automatically" },
  website:           { name: "Website / Landing Page",  price: "$800–1,500",   pitch: "Fast, mobile-first site that converts visitors — built in days, not weeks" },
  review_automation: { name: "Review Automation",       price: "$200–400/mo",  pitch: "Automatically asks happy customers for reviews — grows your rating on autopilot" },
  booking_system:    { name: "Online Booking System",   price: "$300–600/mo",  pitch: "Let clients self-book 24/7 — reduces no-shows with automated reminders" },
  social_automation: { name: "Social Media Automation", price: "$300–500/mo",  pitch: "AI posts to Facebook, Instagram & LinkedIn weekly — consistent presence without the effort" },
  lead_followup:     { name: "Lead Follow-Up AI",       price: "$400–700/mo",  pitch: "Instantly texts and emails every new lead within 60 seconds — 78% higher conversion rate" },
  reputation_mgmt:   { name: "Reputation Management",   price: "$300–500/mo",  pitch: "Responds to negative reviews, suppresses bad results, highlights positives" },
  ai_chatbot:        { name: "AI Website Chatbot",      price: "$200–400/mo",  pitch: "Answers questions and captures leads from your website 24/7" },
};

async function scrapeWebsite(url: string): Promise<{ html: string; emails: string[]; phone: string; hasBooking: boolean; hasChatbot: boolean; hasReviews: boolean; socialLinks: string[]; }> {
  const result = { html: "", emails: [] as string[], phone: "", hasBooking: false, hasChatbot: false, hasReviews: false, socialLinks: [] as string[] };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url.startsWith("http") ? url : `https://${url}`, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    clearTimeout(timeout);
    if (!res.ok) return result;
    const html = await res.text();
    result.html = html.slice(0, 25000); // limit for AI context

    // Emails
    const mailtos = [...html.matchAll(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,8})/g)];
    result.emails = [...new Set(mailtos.map(m => m[1].toLowerCase()))].slice(0, 3);

    // Phone
    const phoneMatch = html.match(/(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) result.phone = phoneMatch[0];

    // Booking signals
    const bookingKeywords = /book\s*now|schedule|appointment|calendly|acuityscheduling|setmore|square\s*appointments|booknow|book\s*a\s*call/i;
    result.hasBooking = bookingKeywords.test(html);

    // Chatbot signals
    const chatKeywords = /intercom|drift|tidio|livechat|zendesk|freshchat|crisp|tawk\.to|chatbot|chat\s*widget/i;
    result.hasChatbot = chatKeywords.test(html);

    // Review widgets
    const reviewKeywords = /google\s*review|trustpilot|yelp|reviews\.io|birdeye|podium|grade\.us/i;
    result.hasReviews = reviewKeywords.test(html);

    // Social links
    const socials = [...html.matchAll(/https?:\/\/(?:www\.)?(facebook|instagram|linkedin|twitter|x)\.com\/[a-zA-Z0-9._\-]{2,}/g)];
    result.socialLinks = [...new Set(socials.map(m => m[0].split(/['"?\s]/)[0]))].slice(0, 6);
  } catch { /* silent */ }
  return result;
}

async function lookupGoogleMaps(businessName: string, city: string, apiKey: string) {
  try {
    const q = encodeURIComponent(`${businessName} ${city}`);
    const searchRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${q}&key=${apiKey}`);
    const searchData = await searchRes.json();
    const place = searchData.results?.[0];
    if (!place) return null;

    const detailRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,rating,user_ratings_total,formatted_address,opening_hours,reviews,business_status&key=${apiKey}`);
    const detailData = await detailRes.json();
    return detailData.result ?? null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessName, website, city } = await req.json() as { businessName: string; website?: string; city?: string };
  if (!businessName) return NextResponse.json({ error: "businessName required" }, { status: 400 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
  const groqKey = process.env.GROQ_API_KEY ?? "";
  if (!groqKey) return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });

  // 1. Google Maps lookup
  const gmaps = apiKey ? await lookupGoogleMaps(businessName, city ?? "", apiKey) : null;
  const siteUrl = website || gmaps?.website || null;

  // 2. Website scrape
  const siteData = siteUrl ? await scrapeWebsite(siteUrl) : null;

  // 3. Build context for AI analysis
  const rating = gmaps?.rating ?? null;
  const reviewCount = gmaps?.user_ratings_total ?? 0;
  const hasWebsite = !!siteUrl;
  const phone = siteData?.phone || gmaps?.formatted_phone_number || null;
  const hasSocial = (siteData?.socialLinks?.length ?? 0) > 0;
  const hasBooking = siteData?.hasBooking ?? false;
  const hasChatbot = siteData?.hasChatbot ?? false;
  const hasReviewWidget = siteData?.hasReviews ?? false;
  const address = gmaps?.formatted_address ?? "";
  const reviews = (gmaps?.reviews ?? []).map((r: any) => r.text).slice(0, 5).join("\n---\n");

  // Extract visible text from HTML — strip tags, collapse whitespace
  const visibleText = siteData?.html
    ? siteData.html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 3000)
    : "No website";

  const contextSummary = `
Business: ${businessName}
City: ${city || "Unknown"}
Address: ${address}
Phone: ${phone || "Not found"}
Website: ${siteUrl || "NO WEBSITE — this is a major gap"}
Google Rating: ${rating ? `${rating}/5` : "Not found on Google"} (${reviewCount} reviews)
Online booking detected: ${hasBooking ? "YES" : "NO"}
Chatbot/live chat detected: ${hasChatbot ? "YES" : "NO"}
Review widget on site: ${hasReviewWidget ? "YES" : "NO"}
Social media: ${hasSocial ? siteData?.socialLinks?.join(", ") : "NONE FOUND"}
Contact email visible: ${siteData?.emails?.length ? siteData.emails.join(", ") : "NOT VISIBLE"}
Recent Google reviews: ${reviews || "None available"}
Website visible text (for context): ${visibleText}
`.trim();

  // 4. AI analysis
  const aiPrompt = `You are a sharp sales intelligence analyst for CyberCraft360, an AI automation agency for US service businesses. We sell: AI receptionist, websites, review automation, online booking, social media automation, AI chatbot, lead follow-up AI, and reputation management.

Analyze this prospect and produce a detailed pre-call brief for Saad (the founder) so he walks into the sales call knowing exactly what to pitch and why.

PROSPECT DATA:
${contextSummary}

Return a JSON object with EXACTLY this structure:
{
  "snapshot": {
    "businessType": "string — what kind of business this is",
    "yearsInBusiness": "string — estimate based on review dates/website or 'Unknown'",
    "targetCustomer": "string — who their customers likely are",
    "estimatedRevenue": "string — rough annual revenue estimate based on reviews/size",
    "overallHealth": "strong|growing|struggling|unknown",
    "healthReason": "string — 1 sentence why"
  },
  "strengths": ["array of 3-5 genuine business strengths"],
  "weaknesses": [
    {
      "issue": "string — specific problem",
      "impact": "string — what revenue/leads this is costing them",
      "urgency": "high|medium|low"
    }
  ],
  "painPoints": ["array of 4-6 specific pain points based on the data — be specific, not generic"],
  "missedOpportunities": ["array of 3-5 things competitors likely do that this business doesn't"],
  "recommendedServices": [
    {
      "serviceKey": "one of: ai_receptionist|website|review_automation|booking_system|social_automation|lead_followup|reputation_mgmt|ai_chatbot",
      "priority": 1,
      "whyNow": "string — specific reason based on their data why this is urgent for THEM",
      "expectedROI": "string — realistic ROI estimate",
      "openingLine": "string — exact first sentence Saad should say to introduce this service naturally in conversation"
    }
  ],
  "callStrategy": {
    "icebreaker": "string — a specific, genuine compliment or observation to open with",
    "keyQuestion": "string — the single most powerful discovery question to ask",
    "mainPitch": "string — 2-3 sentence core pitch tailored to this business",
    "objectionHandling": {
      "tooExpensive": "string — how to handle price objection for this specific business",
      "notInterested": "string — re-engagement angle specific to their situation",
      "alreadyHaveSomething": "string — how to differentiate from whatever they currently use"
    },
    "closingAsk": "string — exact closing ask/CTA for this call"
  },
  "competitorIntel": "string — 2-3 sentences on what competitors in their space typically offer that this business is missing",
  "redFlags": ["array of any warning signs — difficult client signals, low budget indicators, etc — or empty array"],
  "dealPotential": {
    "estimatedMonthlyValue": "string — realistic MRR estimate if they sign",
    "closeChance": "high|medium|low",
    "closeReason": "string — why you rated this close chance"
  }
}

Be SPECIFIC to this business. Use their actual review count, rating, website status, location. Do not be generic. The weakness impact should include real numbers where possible.`;

  let analysis: any = null;
  let aiError: string | null = null;
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a sales intelligence analyst. Always respond with valid, complete JSON only. Never truncate your response. Fill every field." },
          { role: "user", content: aiPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(55000),
    });
    const groqData = await groqRes.json();
    if (!groqRes.ok) {
      aiError = `Groq API error: ${groqData.error?.message ?? JSON.stringify(groqData)}`;
      console.error("[precall]", aiError);
    } else {
      const raw = groqData.choices?.[0]?.message?.content ?? "{}";
      try {
        analysis = JSON.parse(raw);
      } catch {
        aiError = "JSON parse failed: " + raw.slice(0, 200);
        console.error("[precall] JSON parse error:", raw.slice(0, 500));
      }
    }
  } catch (e: any) {
    aiError = String(e).slice(0, 200);
    console.error("[precall] fetch error:", aiError);
  }

  // Attach service details to recommendations
  if (analysis?.recommendedServices) {
    analysis.recommendedServices = analysis.recommendedServices.slice(0, 4).map((s: any) => ({
      ...s,
      ...SERVICES[s.serviceKey],
    }));
  }

  return NextResponse.json({
    ok: true,
    aiError,
    businessName,
    gmaps: gmaps ? {
      rating: gmaps.rating,
      reviewCount: gmaps.user_ratings_total,
      address: gmaps.formatted_address,
      phone: gmaps.formatted_phone_number,
      website: gmaps.website,
      status: gmaps.business_status,
    } : null,
    website: siteUrl,
    hasWebsite,
    hasBooking,
    hasChatbot,
    hasReviewWidget,
    hasSocial,
    socialLinks: siteData?.socialLinks ?? [],
    emails: siteData?.emails ?? [],
    phone,
    analysis,
  });
}
