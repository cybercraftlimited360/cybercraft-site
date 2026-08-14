"use client";
import { useState } from "react";

const QUESTIONS = [
  {
    q: "Are you missing calls when you're busy or after hours?",
    why: "Every missed call is a lead that calls your competitor next. An AI receptionist answers instantly 24/7, books the appointment, and sends a confirmation — without you touching the phone.",
  },
  {
    q: "Are you or your staff spending more than 2 hours a day on repetitive tasks?",
    why: "Appointment reminders, data entry, follow-up emails, answering the same questions — most businesses reclaim 20–30 hours a week within the first month of automation.",
  },
  {
    q: "Do your leads go more than 5 minutes without a response?",
    why: "78% of customers buy from the business that responds first. If you're following up the next morning, you've already lost most of them. AI follows up in under 60 seconds.",
  },
  {
    q: "Are you relying on manual follow-up to close deals?",
    why: "Most sales happen on the 5th–8th touchpoint. Nobody has time to do that manually. An AI sales agent follows up automatically until they respond.",
  },
  {
    q: "Would 24/7 coverage meaningfully grow your revenue?",
    why: "If even 20% of your revenue comes from after-hours opportunities you're missing — calls, form submissions, chat — AI pays for itself in weeks, not months.",
  },
];

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
      <div style={{ height: 3, background: "linear-gradient(90deg, #00d4ff, #7c3aed)" }} />

      <div style={{ padding: "32px 36px" }}>
        {state !== "done" ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>📋</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#00d4ff", marginBottom: 4 }}>Free Download</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>The 5-Question AI Readiness Checklist</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "6px 0 0", lineHeight: 1.5 }}>
                  Find out in 2 minutes whether your business is ready for AI — and exactly where to start.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
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
                  padding: "12px 22px", borderRadius: 10, border: "none",
                  cursor: state === "loading" ? "not-allowed" : "pointer",
                  background: state === "loading" ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #00d4ff, #7c3aed)",
                  color: "#fff", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {state === "loading" ? "Sending…" : "Send Me the Checklist →"}
              </button>
            </form>
            {state === "error" && (
              <p style={{ fontSize: 12, color: "#f87171", marginTop: 4 }}>Something went wrong — try again.</p>
            )}
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>No spam. One email with your checklist, that's it.</p>
          </>
        ) : (
          <>
            {/* Inline checklist shown immediately */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>✅</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Checklist sent to {email}</div>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 28px" }}>Check your inbox. Here's your checklist right now:</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {QUESTIONS.map((item, i) => (
                  <div key={i} style={{ padding: "16px 18px", borderRadius: 12, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)",
                        color: "#00d4ff", fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{i + 1}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>{item.q}</div>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 0 32px", lineHeight: 1.6 }}>{item.why}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>What's your score?</div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 14px", lineHeight: 1.6 }}>
                  <span style={{ color: "#00d4ff", fontWeight: 600 }}>1–2 yes:</span> One urgent gap to fix first. &nbsp;
                  <span style={{ color: "#7c3aed", fontWeight: 600 }}>3–4 yes:</span> AI would make a real difference today. &nbsp;
                  <span style={{ color: "#e64dff", fontWeight: 600 }}>5 yes:</span> You're leaving revenue on the table every week.
                </p>
                <a href="/book" style={{ display: "inline-block", padding: "11px 20px", borderRadius: 9, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", color: "#fff", fontWeight: 700, fontSize: 12, textDecoration: "none", letterSpacing: "0.04em" }}>
                  Book a Free AI Audit →
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
