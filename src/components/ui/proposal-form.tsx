"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "idle" | "loading" | "success" | "error";

const INDUSTRIES = [
  "E-commerce / Retail", "Real Estate / PropTech", "Finance / Insurance",
  "Healthcare / MedTech", "Legal / Professional Services", "Hospitality / Travel",
  "Marketing / Media Agency", "SaaS / Technology", "Construction / Trades",
  "Education / EdTech", "Recruitment / HR", "Other",
];

const LOADING_STEPS = [
  "Analysing your challenge...",
  "Selecting the right AI stack...",
  "Calculating your ROI estimate...",
  "Crafting your bespoke proposal...",
  "Rendering your PDF...",
];

function InputField({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "12px",
          padding: "13px 16px",
          fontSize: "0.88rem",
          color: "rgba(255,255,255,0.85)",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(0,212,255,0.06)" : "none",
        }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "12px",
          padding: "13px 16px",
          fontSize: "0.88rem",
          color: value ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.2s",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          paddingRight: "40px",
        }}
      >
        <option value="" style={{ background: "#0f1117", color: "rgba(255,255,255,0.5)" }}>Select your industry</option>
        {INDUSTRIES.map(ind => (
          <option key={ind} value={ind} style={{ background: "#0f1117", color: "#fff" }}>{ind}</option>
        ))}
      </select>
    </div>
  );
}

function LoadingState() {
  const [step, setStep] = useState(0);

  useState(() => {
    const intervals = LOADING_STEPS.map((_, i) =>
      setTimeout(() => setStep(i), i * 1100)
    );
    return () => intervals.forEach(clearTimeout);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ textAlign: "center", padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}
    >
      {/* Animated orb */}
      <div style={{ position: "relative", width: "72px", height: "72px" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#00d4ff",
            borderRightColor: "rgba(0,212,255,0.2)",
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", inset: "8px", borderRadius: "50%",
            border: "1px solid transparent",
            borderBottomColor: "#7c3aed",
            borderLeftColor: "rgba(124,58,237,0.2)",
          }}
        />
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#00d4ff" }}
          />
        </div>
      </div>

      <div>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.6)", margin: 0, marginBottom: "8px" }}
          >
            {LOADING_STEPS[step]}
          </motion.p>
        </AnimatePresence>
        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", margin: 0 }}>
          This usually takes 10–15 seconds
        </p>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: "6px" }}>
        {LOADING_STEPS.map((_, i) => (
          <motion.div
            key={i}
            animate={{ background: i <= step ? "#00d4ff" : "rgba(255,255,255,0.1)" }}
            transition={{ duration: 0.3 }}
            style={{ width: "6px", height: "6px", borderRadius: "50%" }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function SuccessState({ email, headline, services }: {
  email: string;
  headline: string;
  services: { name: string; why: string; price: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* Success header */}
      <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          style={{
            width: "52px", height: "52px", borderRadius: "50%",
            background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
        <p style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Proposal sent!</p>
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Check <strong style={{ color: "rgba(255,255,255,0.6)" }}>{email}</strong>
        </p>
      </div>

      {/* Headline preview */}
      <div style={{
        padding: "16px 20px", borderRadius: "12px",
        background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.12)",
      }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(0,212,255,0.5)", margin: "0 0 6px" }}>Your proposal headline</p>
        <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.5 }}>{headline}</p>
      </div>

      {/* Services preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: 0 }}>Recommended for you</p>
        {services.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", borderRadius: "10px",
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                background: i === 0 ? "#00d4ff" : i === 1 ? "#7c3aed" : "#e64dff",
              }} />
              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)" }}>{s.name}</span>
            </div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00d4ff" }}>{s.price}</span>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.a
        href="/book"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          display: "block", textAlign: "center", padding: "14px",
          borderRadius: "12px", fontSize: "0.75rem", fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none",
          background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff",
        }}
      >
        Book Your Free Strategy Call →
      </motion.a>
    </motion.div>
  );
}

export default function ProposalForm() {
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [challenge, setChallenge] = useState("");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<{ headline: string; services: { name: string; why: string; price: string }[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = company.trim() && industry && challenge.trim() && email.trim() && phase === "idle";

  async function handleSubmit() {
    if (!canSubmit) return;
    setPhase("loading");
    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, industry, challenge, email }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed");
      setResult({ headline: data.headline, services: data.services });
      setPhase("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong — please try again.");
      setPhase("error");
    }
  }

  return (
    <div className="grid grid-cols-2 gap-12 items-center max-w-5xl mx-auto w-full">
      {/* Left — context */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ display: "flex", flexDirection: "column", gap: "28px" }}
      >
        {/* What's inside */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { icon: "✦", label: "Tailored service recommendations", desc: "2–3 AI solutions matched specifically to your industry and challenge." },
            { icon: "✦", label: "Custom ROI estimate", desc: "Real numbers based on your business type — not generic projections." },
            { icon: "✦", label: "Deployment timeline", desc: "A clear path from discovery call to live AI in your business." },
            { icon: "✦", label: "Delivered as a branded PDF", desc: "A document you can share internally — ready to present to your team." },
          ].map(({ icon, label, desc }) => (
            <div key={label} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <span style={{ color: "#00d4ff", fontSize: "0.7rem", marginTop: "3px", flexShrink: 0 }}>{icon}</span>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.8)", margin: "0 0 3px" }}>{label}</p>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div style={{
          padding: "16px 20px", borderRadius: "14px",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ fontSize: "0.8rem", fontStyle: "italic", color: "rgba(255,255,255,0.45)", margin: "0 0 10px", lineHeight: 1.6 }}>
            "I sent the proposal to my board and they approved the AI project the same afternoon. The numbers made it an easy decision."
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.6rem", fontWeight: 700, color: "#00d4ff",
            }}>DK</div>
            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>David Kaur · VP Sales, Orbis Group</span>
          </div>
        </div>
      </motion.div>

      {/* Right — form / states */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{
          padding: "36px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
        }}
      >
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <InputField label="Company name" value={company} onChange={setCompany} placeholder="e.g. Acme Corp" />
              <SelectField label="Industry" value={industry} onChange={setIndustry} />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Biggest challenge
                </label>
                <textarea
                  value={challenge}
                  onChange={e => setChallenge(e.target.value)}
                  placeholder="e.g. We spend 20 hours a week on manual customer support and can't scale..."
                  rows={3}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "13px 16px",
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.85)",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "none",
                    lineHeight: 1.5,
                  }}
                  onFocus={e => { e.target.style.border = "1px solid rgba(0,212,255,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,212,255,0.06)"; }}
                  onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <InputField label="Your email" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />

              <motion.button
                onClick={handleSubmit}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                style={{
                  width: "100%", padding: "15px",
                  borderRadius: "12px", border: "none",
                  background: canSubmit ? "linear-gradient(135deg, #00d4ff, #7c3aed)" : "rgba(255,255,255,0.05)",
                  color: canSubmit ? "#fff" : "rgba(255,255,255,0.2)",
                  fontWeight: 700, fontSize: "0.8rem",
                  letterSpacing: "0.15em", textTransform: "uppercase",
                  cursor: canSubmit ? "pointer" : "default",
                  transition: "background 0.3s, color 0.3s",
                }}
              >
                Generate My AI Proposal →
              </motion.button>

              <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", textAlign: "center", margin: 0 }}>
                Free · No commitment · Delivered in under 30 seconds
              </p>
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LoadingState />
            </motion.div>
          )}

          {phase === "success" && result && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SuccessState email={email} headline={result.headline} services={result.services} />
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
            >
              <div style={{
                width: "48px", height: "48px", borderRadius: "50%",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", margin: 0 }}>{errorMsg}</p>
              <button onClick={() => setPhase("idle")} style={{
                padding: "10px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.78rem",
              }}>Try again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
