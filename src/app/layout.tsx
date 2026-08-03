import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import VisitTracker from "@/components/ui/visit-tracker";

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
  verification: {
    google: "QyVX4wH85g9Mf-eGJLSKXOAVq0cqk3akN7AKUtAuE6o",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-S3S1H7YRF4" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-S3S1H7YRF4', { page_path: window.location.pathname });
        `}</Script>
      </head>
      <body className="min-h-full flex flex-col">
        <VisitTracker />
        {children}
      </body>
    </html>
  );
}
