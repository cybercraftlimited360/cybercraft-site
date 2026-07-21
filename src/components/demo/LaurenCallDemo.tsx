"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "idle" | "form" | "calling" | "success" | "error";

export default function LaurenCallDemo() {
  const [stage, setStage] = useState<Stage>("idle");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  async function placeCall() {
    if (!phone || !agreed) return;
    setStage("calling");
    setError("");
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: name || "there",
          company: "your business",
          challenge: "This is a live demo call from the CyberCraft360 website. The visitor wants to experience Amy firsthand.",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStage("success");
      } else {
        setError(data.error || "Call failed. Please try again.");
        setStage("error");
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setStage("error");
    }
  }

  function reset() {
    setStage("idle");
    setPhone("");
    setName("");
    setAgreed(false);
    setError("");
  }

  return (
    <section className="px-[5vw] md:px-[6vw] py-20 md:py-28 border-t border-border/40">
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-0.5 rounded-full" style={{ background: "#e64dff" }} />
            <span style={{ color: "#e64dff" }} className="text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Live Voice Demo</span>
            <div className="w-8 h-0.5 rounded-full" style={{ background: "#e64dff" }} />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground leading-tight mb-4"
            style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif" }}>
            Let Amy Call <em>You</em> Right Now
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Enter your phone number. Amy — our AI voice agent — will call you in seconds. Have a real conversation. Ask her anything. This is exactly what we build for businesses.
          </p>
        </motion.div>

        <AnimatePresence>
          {stage === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
                {[
                  { icon: "⚡", title: "Calls in Seconds", desc: "Amy dials your number the moment you click" },
                  { icon: "🧠", title: "Real AI", desc: "Not a recording — she adapts to everything you say" },
                  { icon: "🎯", title: "Feel the Difference", desc: "Experience what your customers will hear" },
                ].map(item => (
                  <div key={item.title} style={{ padding: "16px 14px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{item.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => setStage("form")}
                  style={{
                    padding: "15px 40px", borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg, #e64dff, #7c3aed)",
                    color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 0 40px rgba(230,77,255,0.25)",
                  }}
                >
                  🎙️ Call Me Now — It's Free
                </button>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 10 }}>No credit card · No sign-up · Just an AI call</p>
              </div>
            </motion.div>
          )}

          {stage === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20, padding: "28px 24px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: "linear-gradient(135deg, rgba(230,77,255,0.2), rgba(124,58,237,0.2))",
                    border: "1px solid rgba(230,77,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                  }}>
                    🎙️
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 3px" }}>Amy — AI Voice Agent</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse-dot 2s infinite" }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Ready to call · Average wait: &lt;5 seconds</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 7 }}>Your Name (optional)</label>
                    <input
                      placeholder="So Amy knows who she's calling"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{ width: "100%", padding: "13px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 7 }}>Your Phone Number *</label>
                    <input
                      placeholder="(832) 555-1234"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      type="tel"
                      style={{ width: "100%", padding: "13px 16px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, outline: "none" }}
                    />
                  </div>

                  <div
                    onClick={() => setAgreed(a => !a)}
                    style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", padding: "12px 14px", borderRadius: 10, background: agreed ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${agreed ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s" }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${agreed ? "#22c55e" : "rgba(255,255,255,0.2)"}`, background: agreed ? "rgba(34,197,94,0.2)" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#22c55e", flexShrink: 0, marginTop: 1 }}>
                      {agreed ? "✓" : ""}
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
                      I agree to receive a single AI demo call from CyberCraft360. This call is for demonstration purposes only. Standard carrier rates may apply.
                    </p>
                  </div>

                  <button
                    onClick={placeCall}
                    disabled={!phone || !agreed}
                    style={{
                      padding: "14px", borderRadius: 12, border: "none",
                      background: !phone || !agreed ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #e64dff, #7c3aed)",
                      color: "#fff", fontSize: 14, fontWeight: 700,
                      cursor: !phone || !agreed ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    🎙️ Call Me Now
                  </button>
                  <button onClick={reset} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer" }}>← Cancel</button>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "calling" && (
            <motion.div key="calling" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 24px" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(230,77,255,0.3)", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
                <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: "2px solid rgba(230,77,255,0.5)", animation: "ping 1.5s cubic-bezier(0,0,0.2,1) 0.4s infinite" }} />
                <div style={{ position: "absolute", inset: 16, borderRadius: "50%", background: "linear-gradient(135deg,#e64dff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  🎙️
                </div>
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>Amy is calling you…</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>Answer your phone in the next few seconds</p>
            </motion.div>
          )}

          {stage === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>📲</div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#22c55e", margin: "0 0 10px" }}>Your phone should be ringing!</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.6 }}>
                Amy is calling right now. Pick up and have a real conversation with her.<br />
                Ask about pricing, services, booking — anything. She handles it all.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <a href="/book" style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  Book a Free Strategy Call →
                </a>
                <button onClick={reset} style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                  Try Again
                </button>
              </div>
            </motion.div>
          )}

          {stage === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} style={{ textAlign: "center", padding: "40px 24px" }}>
              <p style={{ fontSize: 16, color: "#ef4444", margin: "0 0 8px" }}>⚠️ {error}</p>
              <button onClick={() => setStage("form")} style={{ padding: "11px 24px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>← Try Again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes ping { 75%,100% { transform:scale(1.8); opacity:0; } }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </section>
  );
}
