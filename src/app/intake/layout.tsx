import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Your Free AI Proposal — CyberCraft360",
  description: "Tell us about your business and get a custom AI proposal. CyberCraft360 builds AI front desks, lead automation, and workflow automation for US service businesses.",
};

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
