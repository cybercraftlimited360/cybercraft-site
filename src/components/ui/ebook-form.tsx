"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INDUSTRIES = ["Technology", "Healthcare", "Real Estate", "Finance", "Legal", "Beauty & Wellness", "Restaurant & Food", "Retail", "Education", "Construction", "Marketing & Agency", "Other"];
const TONES = ["Professional & Authoritative", "Friendly & Conversational", "Educational & Informative", "Motivational & Inspiring"];

export default function EbookForm({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", businessName: "", industry: "",
    topic: "", audience: "", keyPoints: "", tone: TONES[0],
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/ebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setDone(data.title);
    } catch (e: any) {
      setError(e.message || "Failed to generate eBook");
    } finally {
      setLoading(false);
    }
  }

  const accent = "#f97316";

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
    textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 6, display: "block",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }} />

      {/* Modal */}
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}
        style={{ position: "relative", width: "100%", maxWidth: 540, background: "#0f1117", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Top bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, #ec4899)` }} />

        <div style={{ padding: "32px 32px 28px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: accent, margin: "0 0 6px" }}>CyberCraft360 · AI eBook Generator</p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>📖 Generate Your Free eBook</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "6px 0 0" }}>AI-written, professionally designed PDF — in your inbox in 60 seconds</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 22, cursor: "pointer", padding: "0 0 0 12px", lineHeight: 1 }}>✕</button>
          </div>

          {/* Progress */}
          {!done && (
            <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
              {[1, 2].map(s => (
                <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? `linear-gradient(90deg, ${accent}, #ec4899)` : "rgba(255,255,255,0.08)", transition: "background 0.3s" }} />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "20px 0 12px" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📖</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>Your eBook is on its way!</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 8px" }}>
                  <strong style={{ color: accent }}>"{done}"</strong>
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 28px" }}>
                  Check your inbox at <strong style={{ color: "rgba(255,255,255,0.7)" }}>{form.email}</strong> — your professionally designed PDF eBook is on its way.
                </p>
                <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, textAlign: "left" }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
                    💡 <strong style={{ color: accent }}>Want more content like this automatically?</strong> We build AI content engines that write your blog posts, social media, email newsletters, and eBooks every week — hands-free.
                  </p>
                </div>
                <a href="/book" style={{ display: "inline-block", padding: "13px 28px", borderRadius: 10, background: `linear-gradient(135deg, ${accent}, #ec4899)`, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em" }}>
                  Book a Free Strategy Call →
                </a>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>Step 1 of 2 — About You</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Your Name *</label>
                    <input style={inputStyle} placeholder="John Smith" value={form.name} onChange={e => set("name", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address *</label>
                    <input style={inputStyle} type="email" placeholder="john@yourbusiness.com" value={form.email} onChange={e => set("email", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Business Name *</label>
                    <input style={inputStyle} placeholder="Your Business Name" value={form.businessName} onChange={e => set("businessName", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Industry</label>
                    <select style={{ ...inputStyle, cursor: "pointer" }} value={form.industry} onChange={e => set("industry", e.target.value)}>
                      <option value="">Select your industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.name || !form.email || !form.businessName}
                  style={{ marginTop: 24, width: "100%", padding: 14, borderRadius: 12, border: "none", fontWeight: 700, fontSize: 15, cursor: !form.name || !form.email || !form.businessName ? "not-allowed" : "pointer",
                    background: !form.name || !form.email || !form.businessName ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${accent}, #ec4899)`, color: "#fff" }}>
                  Continue →
                </button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>Step 2 of 2 — Your eBook</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>eBook Topic / Title *</label>
                    <input style={inputStyle} placeholder="e.g. 10 Ways AI Can Save Your Business 20 Hours a Week" value={form.topic} onChange={e => set("topic", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Target Audience</label>
                    <input style={inputStyle} placeholder="e.g. Small business owners in the beauty industry" value={form.audience} onChange={e => set("audience", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Key Points to Cover</label>
                    <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="e.g. Cost savings, time savings, customer experience, real examples..." value={form.keyPoints} onChange={e => set("keyPoints", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Writing Tone</label>
                    <select style={{ ...inputStyle, cursor: "pointer" }} value={form.tone} onChange={e => set("tone", e.target.value)}>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                {error && <p style={{ fontSize: 13, color: "#ef4444", margin: "12px 0 0" }}>{error}</p>}
                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button onClick={() => setStep(1)} style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>← Back</button>
                  <button
                    onClick={submit}
                    disabled={loading || !form.topic}
                    style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", fontWeight: 700, fontSize: 15, cursor: loading || !form.topic ? "not-allowed" : "pointer",
                      background: loading || !form.topic ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${accent}, #ec4899)`, color: "#fff" }}>
                    {loading ? "✍️ Writing your eBook…" : "📖 Generate My eBook →"}
                  </button>
                </div>
                {loading && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", margin: "12px 0 0" }}>
                    AI is writing your eBook — this takes about 30–60 seconds…
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
