"use client";
import { useState } from "react";

export default function BlogChecklistCTA({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("loading");
    try {
      const res = await fetch("/api/leads/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      setState(data.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div style={{
      margin: "48px 0",
      borderRadius: 20,
      border: "1px solid rgba(0,212,255,0.2)",
      background: "linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))",
      overflow: "hidden",
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #00d4ff, #7c3aed)" }} />

      <div style={{ padding: "32px 36px" }}>
        {state === "done" ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>You're on the list</div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: 0 }}>
              We'll send the checklist to {email}. Check your inbox in the next few minutes.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>📋</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#00d4ff", marginBottom: 4 }}>
                  Free Download
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                  The 5-Question AI Readiness Checklist
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "6px 0 0", lineHeight: 1.5 }}>
                  Find out in 2 minutes whether your business is ready for AI — and exactly where to start.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {["Are you losing leads after hours?", "Is manual follow-up costing you time?", "Where would AI have the biggest impact?"].map(q => (
                <span key={q} style={{
                  fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6, padding: "4px 10px",
                }}>{q}</span>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  flex: "1 1 220px", padding: "12px 16px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)",
                  color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                disabled={state === "loading"}
                style={{
                  padding: "12px 22px", borderRadius: 10, border: "none", cursor: state === "loading" ? "not-allowed" : "pointer",
                  background: state === "loading" ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #00d4ff, #7c3aed)",
                  color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {state === "loading" ? "Sending…" : "Send Me the Checklist →"}
              </button>
            </form>

            {state === "error" && (
              <p style={{ fontSize: 12, color: "#f87171", marginTop: 8 }}>Something went wrong — try again or email cybercraftlimited@gmail.com</p>
            )}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 10 }}>No spam. One email with your checklist, that's it.</p>
          </>
        )}
      </div>
    </div>
  );
}
