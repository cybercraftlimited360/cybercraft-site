// Shared outreach utilities — single source of truth for scoring, flags, enrichment

export const INDUSTRIES: Record<string, string[]> = {
  "HVAC":        ["HVAC contractor", "heating and cooling company", "air conditioning repair"],
  "Dental":      ["dental office", "dentist", "dental clinic"],
  "Real Estate": ["real estate agent", "real estate broker", "realtor"],
  "Plumbing":    ["plumber", "plumbing company", "plumbing service"],
  "Roofing":     ["roofing company", "roofer", "roof repair"],
  "Auto Repair": ["auto repair shop", "mechanic", "car repair"],
  "Cleaning":    ["cleaning company", "cleaning service", "janitorial service"],
};

export const INDUSTRY_PAIN: Record<string, string> = {
  "HVAC":        "missing calls during peak season when techs are on the road",
  "Dental":      "patients calling after hours and booking with a competitor instead",
  "Real Estate": "leads going cold because follow-up takes too long",
  "Plumbing":    "missing emergency calls on nights and weekends",
  "Roofing":     "losing storm-season leads to faster-responding competitors",
  "Auto Repair": "customers hanging up when put on hold too long",
  "Cleaning":    "missing quote requests outside business hours",
};

// Weekly auto-scrape rotation
export const WEEKLY_TARGETS = [
  { industry: "HVAC",        cities: ["Chicago, IL", "Phoenix, AZ", "Dallas, TX", "Atlanta, GA", "Denver, CO"] },
  { industry: "Dental",      cities: ["Los Angeles, CA", "Houston, TX", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA"] },
  { industry: "Real Estate", cities: ["New York, NY", "Miami, FL", "Las Vegas, NV", "Austin, TX", "Seattle, WA"] },
  { industry: "Plumbing",    cities: ["Chicago, IL", "Columbus, OH", "Charlotte, NC", "Indianapolis, IN", "Nashville, TN"] },
  { industry: "Roofing",     cities: ["Dallas, TX", "Houston, TX", "Atlanta, GA", "Tampa, FL", "Orlando, FL"] },
  { industry: "Auto Repair", cities: ["Los Angeles, CA", "Detroit, MI", "San Jose, CA", "Memphis, TN", "Louisville, KY"] },
  { industry: "Cleaning",    cities: ["New York, NY", "Boston, MA", "Washington, DC", "Portland, OR", "Denver, CO"] },
];

// Pain signals detected in Google reviews
const MISSED_CALL_SIGNALS = [
  "busy", "no answer", "voicemail", "didn't call back", "never called back",
  "hard to reach", "waited", "slow response", "took forever", "left a message",
  "no one picked up", "couldn't get through", "keep calling",
];

// Score a lead — higher = better prospect
// weights param allows learned adjustments from conversion data
export function scoreLead(
  detail: any,
  reviewTexts: string[],
  weights: Record<string, number> = {}
): number {
  const w = {
    lowReviews20: weights.lowReviews20 ?? 30,
    lowReviews50: weights.lowReviews50 ?? 25,
    lowReviews100: weights.lowReviews100 ?? 15,
    sweetSpotRating: weights.sweetSpotRating ?? 15,
    goodRating: weights.goodRating ?? 8,
    noWebsite: weights.noWebsite ?? 20,
    hasWebsite: weights.hasWebsite ?? 5,
    open24h: weights.open24h ?? 20,
    hasPhone: weights.hasPhone ?? 10,
    missedCallSignal: weights.missedCallSignal ?? 8,
  };

  let score = 0;
  const rc = detail.user_ratings_total ?? 0;
  const rat = detail.rating ?? 0;

  if (rc < 20) score += w.lowReviews20;
  else if (rc < 50) score += w.lowReviews50;
  else if (rc < 100) score += w.lowReviews100;

  if (rat >= 3.5 && rat <= 4.2) score += w.sweetSpotRating;
  else if (rat > 4.2 && rat < 4.6) score += w.goodRating;

  if (!detail.website) score += w.noWebsite;
  else score += w.hasWebsite;

  const periods = detail.opening_hours?.periods ?? [];
  if (periods.some((p: any) => p.open?.time === "0000" && !p.close)) score += w.open24h;

  if (detail.formatted_phone_number) score += w.hasPhone;

  const rText = reviewTexts.join(" ").toLowerCase();
  const signalCount = MISSED_CALL_SIGNALS.filter(s => rText.includes(s)).length;
  score += Math.min(signalCount, 3) * w.missedCallSignal; // cap at 3 signals

  return score;
}

export function getFlags(detail: any, reviewTexts: string[]): string[] {
  const flags: string[] = [];
  if (!detail.website) flags.push("No website");
  const periods = detail.opening_hours?.periods ?? [];
  if (periods.some((p: any) => p.open?.time === "0000" && !p.close)) flags.push("Open 24/7");
  const rText = reviewTexts.join(" ").toLowerCase();
  if (MISSED_CALL_SIGNALS.some(s => rText.includes(s))) flags.push("Missed call signals");
  if ((detail.user_ratings_total ?? 0) < 20) flags.push("Very few reviews");
  return flags;
}

// Enrichment: scrape website for email, owner name, social links
const JUNK_EMAIL_PATTERNS = [
  /noreply/i, /no-reply/i, /donotreply/i, /wordpress/i, /sentry/i,
  /example\.com/, /wix\.com/, /squarespace\.com/, /godaddy/i, /hostgator/i,
  /mailer/i, /bounce/i, /support@(?!cybercraft)/i,
];

export async function enrichLead(website: string): Promise<Partial<{
  email: string; ownerName: string; facebookUrl: string; linkedinUrl: string;
}>> {
  const result: any = {};
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return result;
    const html = await res.text();

    // Email — pick first valid, non-junk email
    const emailMatches = [...html.matchAll(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g)];
    for (const m of emailMatches) {
      const email = m[0].toLowerCase();
      if (JUNK_EMAIL_PATTERNS.some(p => p.test(email))) continue;
      if (email.length > 60) continue;
      result.email = email;
      break;
    }

    // Owner name
    const ownerPatterns = [
      /(?:owner|founder|president|ceo|principal)[:\s,–-]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /(?:meet|about|hi,?\s+i'm)\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    ];
    for (const pattern of ownerPatterns) {
      const m = html.match(pattern);
      if (m?.[1] && m[1].split(" ").every(w => w.length > 1)) {
        result.ownerName = m[1]; break;
      }
    }

    // Facebook
    const fbMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|login|dialog)([a-zA-Z0-9._\-]{3,})/);
    if (fbMatch) result.facebookUrl = fbMatch[0].split(/['"?\s]/)[0];

    // LinkedIn
    const liMatch = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9._\-]{2,})/);
    if (liMatch) result.linkedinUrl = liMatch[0].split(/['"?\s]/)[0];

  } catch { /* silent */ }
  return result;
}

// Monitor keywords — specific enough to avoid false positives
// Require either: 1 high-confidence keyword OR 2+ medium keywords
export const MONITOR_HIGH_CONFIDENCE = [
  "missed call", "missing calls", "calls going to voicemail", "no receptionist",
  "need a receptionist", "hiring receptionist", "answering service",
  "AI receptionist", "AI for my business", "overwhelmed with calls",
  "lost a lead", "lost leads", "can't keep up with calls",
];

export const MONITOR_MEDIUM_CONFIDENCE = [
  "after hours", "can't answer", "no one answers", "too many calls",
  "automate my", "automation for", "follow up with leads", "lead follow up",
  "chatbot for", "booking appointments", "reduce no shows", "no-show",
  "voicemail", "call volume", "answering calls",
];

export function detectPainPoints(text: string): { isRelevant: boolean; matched: string[]; confidence: "high" | "medium" | "low" } {
  const lower = text.toLowerCase();
  const highMatches = MONITOR_HIGH_CONFIDENCE.filter(k => lower.includes(k.toLowerCase()));
  const medMatches = MONITOR_MEDIUM_CONFIDENCE.filter(k => lower.includes(k.toLowerCase()));

  if (highMatches.length >= 1) return { isRelevant: true, matched: [...highMatches, ...medMatches], confidence: "high" };
  if (medMatches.length >= 2) return { isRelevant: true, matched: medMatches, confidence: "medium" };
  return { isRelevant: false, matched: [], confidence: "low" };
}
