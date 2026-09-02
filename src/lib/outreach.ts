// Shared outreach utilities — single source of truth for scoring, flags, enrichment

export const INDUSTRIES: Record<string, string[]> = {
  "HVAC":        ["HVAC contractor", "heating and cooling company", "air conditioning repair"],
  "Dental":      ["dental office", "dentist", "dental clinic"],
  "Real Estate": ["real estate agent", "real estate broker", "realtor"],
  "Plumbing":    ["plumber", "plumbing company", "plumbing service"],
  "Roofing":     ["roofing company", "roofer", "roof repair"],
  "Auto Repair": ["auto repair shop", "mechanic", "car repair"],
  "Cleaning":    ["cleaning company", "cleaning service", "janitorial service"],
  "Law Firm":    ["law firm", "attorney", "lawyer office", "legal services"],
  "Med Spa":     ["med spa", "medical spa", "aesthetic clinic", "medspa"],
};

export const INDUSTRY_PAIN: Record<string, string> = {
  "HVAC":        "missing calls during peak season when techs are on the road",
  "Dental":      "patients calling after hours and booking with a competitor instead",
  "Real Estate": "leads going cold because follow-up takes too long",
  "Plumbing":    "missing emergency calls on nights and weekends",
  "Roofing":     "losing storm-season leads to faster-responding competitors",
  "Auto Repair": "customers hanging up when put on hold too long",
  "Cleaning":    "missing quote requests outside business hours",
  "Law Firm":    "missing intake calls that represent thousands in potential fees",
  "Med Spa":     "losing high-ticket bookings to competitors who answer faster",
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
  { industry: "Law Firm",    cities: ["New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ"] },
  { industry: "Med Spa",     cities: ["Los Angeles, CA", "Miami, FL", "New York, NY", "Dallas, TX", "Las Vegas, NV"] },
];

// Pain signals detected in Google reviews
export const MISSED_CALL_SIGNALS = [
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

// Competitor keywords — businesses that mention bad experiences with these are poaching targets
const COMPETITOR_SIGNALS = [
  "webfx", "hibu", "yodle", "thryv", "scorpion", "dex media", "dexmedia",
  "podium", "birdeye", "broadly", "vendasta", "chatmeter", "reputation.com",
  "digital agency", "marketing agency", "seo company", "web design company",
  "disappointed with", "switched from", "left my previous", "fired our agency",
  "waste of money", "overcharged", "no results", "didn't deliver", "poor service",
];

export function getFlags(detail: any, reviewTexts: string[]): string[] {
  const flags: string[] = [];
  if (!detail.website) flags.push("No website");
  const periods = detail.opening_hours?.periods ?? [];
  if (periods.some((p: any) => p.open?.time === "0000" && !p.close)) flags.push("Open 24/7");
  const rText = reviewTexts.join(" ").toLowerCase();
  if (MISSED_CALL_SIGNALS.some(s => rText.includes(s))) flags.push("Missed call signals");
  if ((detail.user_ratings_total ?? 0) < 20) flags.push("Very few reviews");
  // Competitor poaching — unhappy with another agency/tool
  if (COMPETITOR_SIGNALS.some(s => rText.includes(s))) flags.push("Competitor dissatisfied");
  return flags;
}

// Enrichment: scrape website for email, owner name, social links
const JUNK_EMAIL_PATTERNS = [
  /noreply/i, /no-reply/i, /donotreply/i, /do-not-reply/i, /wordpress/i, /sentry/i,
  /example\./i, /wix\.com/i, /squarespace\.com/i, /godaddy/i, /hostgator/i,
  /mailer/i, /bounce/i,
  /^(support|admin|webmaster|test|demo|user|email|mail|help|sales|marketing|team|staff|office|service|services|hello|contact|general|enquir|feedback|press|media|pr|newsletter|unsubscribe|customerservice|customer-service|recruiting)@/i,
  /placeholder/i, /yourdomain/i, /domain\.com/i, /company\.com/i,
  /\.png$/i, /\.jpg$/i, /\.gif$/i, /\.svg$/i, /\.css$/i, /\.js$/i,
  /sampleemail/i, /myemail/i, /yourname/i, /someone@/i,
  /2x\./i, /1x\./i, // image srcset artifacts
  /^(privacy|legal|dmca|abuse|spam|careers|jobs|hr|billing|invoice)@/i,
  /@(gmail|yahoo|hotmail|outlook|aol|icloud|live|msn|protonmail)\.com$/i, // personal inboxes
];

// Only accept emails found in mailto: links or visible contact sections — not just anywhere in HTML
function extractEmailsFromHtml(html: string): string[] {
  const emails: string[] = [];

  // Priority 1: mailto: links (most reliable — these are real clickable contacts)
  const mailtoMatches = [...html.matchAll(/mailto:([^\s"'?#>]+)/g)];
  for (const m of mailtoMatches) {
    try {
      const decoded = decodeURIComponent(m[1]).trim().toLowerCase();
      if (/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,8}$/.test(decoded)) {
        emails.push(decoded);
      }
    } catch { /* skip malformed encoding */ }
  }

  // Priority 2: emails near contact keywords in visible text sections
  // Strip scripts, styles, and attributes first to reduce noise
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s(?:src|href|data-[a-z-]+|class|id|style)="[^"]*"/g, "");

  const contactSection = stripped.match(/(?:contact|email us|reach us|get in touch|write to us|email:?|e-mail:?)[\s\S]{0,300}/i);
  if (contactSection) {
    const inSection = [...contactSection[0].matchAll(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,8})/g)];
    for (const m of inSection) emails.push(m[1].trim().toLowerCase());
  }

  return emails;
}

// Check that the email domain has MX records (proves it can receive mail)
async function domainHasMx(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, {
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    return Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    return false;
  }
}

export async function enrichLead(website: string): Promise<Partial<{
  email: string; ownerName: string; facebookUrl: string; linkedinUrl: string;
}>> {
  const result: any = {};
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    clearTimeout(timeout);
    if (!res.ok) return result;
    const html = await res.text();

    // Email — extract only from mailto links and contact sections, then MX-validate
    const candidates = extractEmailsFromHtml(html);
    for (const email of candidates) {
      if (JUNK_EMAIL_PATTERNS.some(p => p.test(email))) continue;
      if (email.length > 60) continue;
      // Must have a real TLD (2-8 chars), not a file extension pattern
      const tld = email.split(".").pop() ?? "";
      if (tld.length < 2 || tld.length > 8) continue;
      // MX check — only send to domains that can actually receive email
      const hasMx = await domainHasMx(email);
      if (!hasMx) continue;
      result.email = email.trim();
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
    const fbMatch = html.match(/https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|login|dialog|plugins|groups)([a-zA-Z0-9._\-]{3,})/);
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
