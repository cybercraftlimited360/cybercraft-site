"use client";
import { useEffect } from "react";

export default function VisitTracker() {
  useEffect(() => {
    // Fire once per page load, after a short delay so it doesn't block rendering
    const t = setTimeout(() => {
      fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: window.location.pathname,
          referrer: document.referrer || "",
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return null;
}
