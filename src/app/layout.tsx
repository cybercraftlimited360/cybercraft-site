import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import "./globals.css";
import VisitTracker from "@/components/ui/visit-tracker";
import SmoothScroll from "@/components/ui/smooth-scroll";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "CyberCraft360 — Automate Everything. Secure Anything.",
  description: "Bespoke AI solutions built from scratch for your business. Custom chatbots, voice agents, workflow automation and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <VisitTracker />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
