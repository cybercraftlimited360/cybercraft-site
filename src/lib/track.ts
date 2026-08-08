"use client";

export function trackEvent(event: string) {
  if (typeof sessionStorage === "undefined") return;
  const sid = sessionStorage.getItem("cc_sid");
  if (!sid) return;
  fetch("/api/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: sid, event }),
  }).catch(() => {});
}
