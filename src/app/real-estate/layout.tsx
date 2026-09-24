import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Receptionist for Real Estate | CyberCraft360",
  description:
    "Amy is an AI front desk built for real estate teams. Responds to leads 24/7, qualifies buyers and sellers, schedules showings, and notifies your team — automatically.",
  openGraph: {
    title: "AI Receptionist for Real Estate | CyberCraft360",
    description:
      "Amy handles every call 24/7 — qualifying leads, scheduling showings, and following up — so your team never misses another opportunity.",
    url: "https://cybercraft360.com/real-estate",
    siteName: "CyberCraft360",
    type: "website",
  },
};

export default function RealEstateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
