"use client";
import { useEffect } from "react";

export default function CalendlyEmbed({ url }: { url: string }) {
  useEffect(() => {
    const existingScript = document.getElementById("calendly-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "calendly-script";
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const existingLink = document.getElementById("calendly-css");
    if (!existingLink) {
      const link = document.createElement("link");
      link.id = "calendly-css";
      link.rel = "stylesheet";
      link.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div
      className="calendly-inline-widget w-full rounded-xl overflow-hidden"
      data-url={`${url}?hide_gdpr_banner=1&background_color=0f1117&text_color=ffffff&primary_color=00d4ff`}
      style={{ minWidth: "320px", height: "700px", border: "1px solid rgba(255,255,255,0.08)" }}
    />
  );
}
