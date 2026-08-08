import { NextRequest, NextResponse } from "next/server";

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("x-admin-token") === Buffer.from(`cc360:${secret}:v2`).toString("base64");
}

// Curated Facebook groups relevant to small business owners by industry
const FB_GROUPS: Record<string, Array<{ name: string; url: string; members: string; desc: string }>> = {
  "General Business": [
    { name: "Small Business Owners Network", url: "https://www.facebook.com/groups/smallbusinessownersnetwork", members: "500K+", desc: "Owners sharing tips, tools, and referrals" },
    { name: "Entrepreneurs & Small Business Owners", url: "https://www.facebook.com/groups/entrepreneursandbusiness", members: "300K+", desc: "Startup and SMB owners helping each other grow" },
    { name: "Small Business Owners USA", url: "https://www.facebook.com/groups/smallbusinessownersusa", members: "150K+", desc: "US-focused owner community" },
    { name: "Business Owners & Entrepreneurs", url: "https://www.facebook.com/groups/businessownersandentrepreneurs", members: "200K+", desc: "Discussions on growth, operations, marketing" },
    { name: "Female Entrepreneurs Network", url: "https://www.facebook.com/groups/femaleentrepreneursnetwork", members: "400K+", desc: "Women-led businesses across all industries" },
  ],
  "HVAC": [
    { name: "HVAC Contractors Business Tips", url: "https://www.facebook.com/groups/hvaccontractors", members: "45K+", desc: "HVAC business owners sharing operational advice" },
    { name: "HVAC Business Growth", url: "https://www.facebook.com/groups/hvacbusinessgrowth", members: "20K+", desc: "Marketing and scaling HVAC companies" },
    { name: "HVAC & Plumbing Business Owners", url: "https://www.facebook.com/groups/hvacplumbingbusiness", members: "30K+", desc: "Trades business owners sharing strategies" },
  ],
  "Dental": [
    { name: "Dental Practice Owners", url: "https://www.facebook.com/groups/dentalpracticeowners", members: "25K+", desc: "Dentists and practice managers sharing business tips" },
    { name: "Dental Business Network", url: "https://www.facebook.com/groups/dentalbusinessnetwork", members: "15K+", desc: "Growth strategies for dental practices" },
  ],
  "Real Estate": [
    { name: "Real Estate Agents USA", url: "https://www.facebook.com/groups/realestateagentsusa", members: "120K+", desc: "Agents sharing leads, tips, and tools" },
    { name: "Real Estate Investing & Business", url: "https://www.facebook.com/groups/realestateinvestingbusiness", members: "80K+", desc: "Investors and agents building their business" },
    { name: "Real Estate Business Owners", url: "https://www.facebook.com/groups/realestatebusinessowners", members: "40K+", desc: "Brokers and team leads sharing growth strategies" },
  ],
  "Plumbing": [
    { name: "Plumbing Business Owners", url: "https://www.facebook.com/groups/plumbingbusinessowners", members: "18K+", desc: "Plumbers sharing business and marketing tips" },
    { name: "Trades Business Owners", url: "https://www.facebook.com/groups/tradesbusinessowners", members: "35K+", desc: "All trades — plumbing, electrical, HVAC" },
  ],
  "Roofing": [
    { name: "Roofing Contractors Business", url: "https://www.facebook.com/groups/roofingcontractorsbusiness", members: "22K+", desc: "Roofers sharing business growth strategies" },
    { name: "Roofing Business Network", url: "https://www.facebook.com/groups/roofingbusinessnetwork", members: "14K+", desc: "Marketing, leads, and operations for roofers" },
  ],
  "Auto Repair": [
    { name: "Auto Repair Shop Owners", url: "https://www.facebook.com/groups/autorepairshopowners", members: "28K+", desc: "Shop owners sharing tools, tips, and struggles" },
    { name: "Auto Shop Business Growth", url: "https://www.facebook.com/groups/autoshopbusiness", members: "12K+", desc: "Marketing and operations for auto shops" },
  ],
  "Cleaning": [
    { name: "Cleaning Business Owners", url: "https://www.facebook.com/groups/cleaningbusinessowners", members: "55K+", desc: "Residential and commercial cleaning businesses" },
    { name: "Cleaning Business Success", url: "https://www.facebook.com/groups/cleaningbusinesssuccess", members: "30K+", desc: "Scaling and marketing cleaning companies" },
  ],
};

// LinkedIn search URLs for decision makers by industry
const LI_SEARCHES: Record<string, Array<{ title: string; url: string; desc: string }>> = {
  "HVAC": [
    { title: "HVAC Company Owners", url: "https://www.linkedin.com/search/results/people/?keywords=HVAC%20owner&titleFilter=%5B%22Owner%22%2C%22Founder%22%2C%22President%22%5D", desc: "Owners and founders of HVAC companies" },
    { title: "HVAC Operations Managers", url: "https://www.linkedin.com/search/results/people/?keywords=HVAC%20operations%20manager", desc: "Decision makers managing HVAC operations" },
  ],
  "Dental": [
    { title: "Dental Practice Owners", url: "https://www.linkedin.com/search/results/people/?keywords=dental%20practice%20owner", desc: "Dentists who own their practice" },
    { title: "Dental Office Managers", url: "https://www.linkedin.com/search/results/people/?keywords=dental%20office%20manager", desc: "Office managers who handle operations" },
  ],
  "Real Estate": [
    { title: "Real Estate Brokers & Team Leads", url: "https://www.linkedin.com/search/results/people/?keywords=real%20estate%20broker&titleFilter=%5B%22Broker%22%2C%22Team%20Lead%22%2C%22Owner%22%5D", desc: "Brokers and team leads who manage agents" },
    { title: "Real Estate Agency Owners", url: "https://www.linkedin.com/search/results/people/?keywords=real%20estate%20agency%20owner", desc: "Owners of real estate agencies" },
  ],
  "Plumbing": [
    { title: "Plumbing Company Owners", url: "https://www.linkedin.com/search/results/people/?keywords=plumbing%20company%20owner", desc: "Owners of plumbing businesses" },
    { title: "Plumbing Contractors", url: "https://www.linkedin.com/search/results/people/?keywords=plumbing%20contractor%20owner", desc: "Contractors running their own companies" },
  ],
  "Roofing": [
    { title: "Roofing Company Owners", url: "https://www.linkedin.com/search/results/people/?keywords=roofing%20company%20owner", desc: "Owners of roofing businesses" },
    { title: "Roofing Contractors", url: "https://www.linkedin.com/search/results/people/?keywords=roofing%20contractor%20founder", desc: "Founders of roofing companies" },
  ],
  "Auto Repair": [
    { title: "Auto Shop Owners", url: "https://www.linkedin.com/search/results/people/?keywords=auto%20repair%20shop%20owner", desc: "Owners of auto repair businesses" },
    { title: "Automotive Service Managers", url: "https://www.linkedin.com/search/results/people/?keywords=automotive%20service%20manager", desc: "Service managers who influence buying decisions" },
  ],
  "Cleaning": [
    { title: "Cleaning Business Owners", url: "https://www.linkedin.com/search/results/people/?keywords=cleaning%20business%20owner", desc: "Owners of cleaning companies" },
    { title: "Janitorial Company Owners", url: "https://www.linkedin.com/search/results/people/?keywords=janitorial%20company%20owner", desc: "Commercial cleaning company owners" },
  ],
};

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get("industry") ?? "General Business";

  const groups = [
    ...(FB_GROUPS["General Business"] ?? []),
    ...(FB_GROUPS[industry] ?? []),
  ];

  const linkedin = LI_SEARCHES[industry] ?? [];

  return NextResponse.json({ groups, linkedin });
}
