"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Answers = { businessType: string; employees: string; challenge: string; volume: string; areas: string[] };
type Employee = { emoji: string; name: string; role: string; why: string; color: string };
type Blueprint = { intro: string; employees: Employee[]; benefits: string[]; timeline: string };
type ChatMsg = { role: "user" | "assistant"; content: string };

const STEPS = [
  {
    id: "businessType",
    q: "What type of business do you own?",
    chips: ["Dental Practice", "Law Firm", "Insurance Agency", "Real Estate", "Healthcare", "Roofing / Construction", "E-Commerce", "Restaurant", "Consulting / Coaching", "Other"],
    multi: false,
  },
  {
    id: "employees",
    q: "How many employees do you currently have?",
    chips: ["Just me", "2–5", "6–20", "21–50", "50+"],
    multi: false,
  },
  {
    id: "challenge",
    q: "What's your biggest challenge right now?",
    chips: ["Missing calls & losing leads", "Slow customer response", "Manual admin & paperwork", "Inconsistent lead follow-up", "Appointment scheduling", "Marketing & content", "Low team productivity", "Other"],
    multi: false,
  },
  {
    id: "volume",
    q: "How many customer inquiries or calls do you receive each month?",
    chips: ["Under 100", "100–500", "500–1,000", "Over 1,000"],
    multi: false,
  },
  {
    id: "areas",
    q: "Which areas would you like to automate? Select all that apply.",
    chips: ["Customer Support", "Phone Calls", "Appointment Booking", "Sales & Lead Follow-Up", "CRM & Data Entry", "Marketing & Content", "Operations & Workflows", "Reporting & Analytics"],
    multi: true,
  },
] as const;

function buildBlueprint(a: Answers): Blueprint {
  const emps: Employee[] = [];
  const benefits: string[] = [];
  const ch = a.challenge.toLowerCase();
  const ar = a.areas.map(x => x.toLowerCase());

  if (ch.includes("call") || ch.includes("lead") || ar.includes("phone calls") || ar.includes("appointment booking"))
    emps.push({ emoji: "🤖", name: "Ava", role: "AI Receptionist", why: "Answers every call 24/7, books appointments automatically, and captures every lead — even at 2am.", color: "#00d4ff" });

  if (ch.includes("customer") || ch.includes("response") || ar.includes("customer support"))
    emps.push({ emoji: "🎧", name: "Nova", role: "AI Customer Support", why: "Handles hundreds of customer questions simultaneously with instant, accurate responses.", color: "#7c3aed" });

  if (ch.includes("follow") || ch.includes("lead follow") || ar.includes("sales & lead follow-up"))
    emps.push({ emoji: "💼", name: "Atlas", role: "AI Sales Agent", why: "Contacts new leads within seconds, qualifies prospects, and books meetings directly into your calendar.", color: "#a855f7" });

  if (ch.includes("admin") || ch.includes("paperwork") || ar.includes("crm & data entry") || ar.includes("operations & workflows"))
    emps.push({ emoji: "⚙️", name: "Pulse", role: "Workflow Automation", why: "Eliminates CRM updates, data entry, and repetitive admin — saving you dozens of hours a month.", color: "#10b981" });

  if (ch.includes("marketing") || ar.includes("marketing & content"))
    emps.push({ emoji: "📈", name: "Orion", role: "AI Marketing Agent", why: "Produces on-brand social content, email campaigns, and ad copy at scale — every single day.", color: "#f59e0b" });

  if (emps.length === 0) {
    emps.push({ emoji: "🤖", name: "Ava", role: "AI Receptionist", why: "Answers every call 24/7, captures leads, and books appointments automatically.", color: "#00d4ff" });
    emps.push({ emoji: "💼", name: "Atlas", role: "AI Sales Agent", why: "Follows up with leads instantly and books more qualified meetings.", color: "#a855f7" });
  }

  const top3 = emps.slice(0, 3);

  if (ch.includes("call") || ch.includes("lead")) benefits.push("Zero missed calls or lost leads");
  if (ch.includes("customer") || ch.includes("response")) benefits.push("Instant 24/7 customer responses");
  if (ch.includes("admin") || ch.includes("paperwork")) benefits.push("Hours of admin work eliminated every week");
  if (ch.includes("follow")) benefits.push("100% of leads followed up automatically");
  benefits.push("Scale operations without increasing headcount");
  benefits.push("Faster customer response times across every channel");

  const bizMap: Record<string, string> = {
    "Dental Practice": "dental practice", "Law Firm": "law firm", "Insurance Agency": "insurance agency",
    "Real Estate": "real estate business", "Healthcare": "healthcare practice", "Roofing / Construction": "contracting business",
    "E-Commerce": "e-commerce store", "Restaurant": "restaurant", "Consulting / Coaching": "consulting practice", "Other": "business",
  };
  const biz = bizMap[a.businessType] || "business";
  const tl = (a.employees === "Just me" || a.employees === "2–5") ? "2–3 weeks" : "4–6 weeks";

  return {
    intro: `Based on your ${biz} with ${a.employees} employee${a.employees === "Just me" ? "" : "s"}, here's what I recommend:`,
    employees: top3,
    benefits: benefits.slice(0, 4),
    timeline: tl,
  };
}

function BlueprintCard({ blueprint, onBook, onChat }: { blueprint: Blueprint; onBook: () => void; onChat: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.03)", margin: "4px 0" }}
    >
      <div style={{ height: "2px", background: "linear-gradient(90deg, #00d4ff, #7c3aed)" }} />
      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#00d4ff", marginBottom: "6px" }}>
          ✦ Your AI Automation Blueprint
        </div>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "12px", lineHeight: 1.5 }}>
          {blueprint.intro}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
          {blueprint.employees.map(emp => (
            <div key={emp.name} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", borderRadius: "10px", background: `${emp.color}08`, border: `1px solid ${emp.color}18` }}>
              <span style={{ fontSize: "1.1rem", lineHeight: 1, marginTop: "1px" }}>{emp.emoji}</span>
              <div>
                <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{emp.name} — {emp.role}</div>
                <div style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.45, marginTop: "2px" }}>{emp.why}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "14px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "8px" }}>Estimated Benefits</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {blueprint.benefits.map(b => (
              <div key={b} style={{ display: "flex", gap: "7px", alignItems: "flex-start" }}>
                <span style={{ color: "#22c55e", fontSize: "0.7rem", lineHeight: 1.6, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Est. Timeline</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00d4ff" }}>{blueprint.timeline} to go live</span>
        </div>

        <a
          href="/book"
          onClick={onBook}
          style={{ display: "block", textAlign: "center", padding: "10px 12px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff", marginBottom: "7px" }}
        >
          📅 Book My Free Strategy Session
        </a>
        <button
          onClick={onChat}
          style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
        >
          Continue Exploring AI Solutions →
        </button>
      </div>
    </motion.div>
  );
}

function Chip({ label, selected, onClick, accent = "#00d4ff" }: { label: string; selected?: boolean; onClick: () => void; accent?: string }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: "6px 12px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 600,
        cursor: "pointer", border: "1px solid", transition: "all 0.15s",
        background: selected ? `${accent}20` : "rgba(255,255,255,0.04)",
        borderColor: selected ? accent : "rgba(255,255,255,0.12)",
        color: selected ? accent : "rgba(255,255,255,0.6)",
        letterSpacing: "0.02em",
      }}
    >
      {selected ? `✓ ${label}` : label}
    </motion.button>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0); // 0–4 = questions, 5 = blueprint, 6 = free chat
  const [answers, setAnswers] = useState<Answers>({ businessType: "", employees: "", challenge: "", volume: "", areas: [] });
  const [pendingAreas, setPendingAreas] = useState<string[]>([]);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [proactiveTriggered, setProactiveTriggered] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [answeredSteps, setAnsweredSteps] = useState<{ q: string; a: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setShowLabel(true), 3000);
    const t2 = setTimeout(() => setShowLabel(false), 7500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const triggerProactive = useCallback(() => {
    if (proactiveTriggered) return;
    setProactiveTriggered(true);
    setOpen(true);
  }, [proactiveTriggered]);

  useEffect(() => {
    const timer = setTimeout(triggerProactive, 30000);
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 5) triggerProactive(); };
    document.addEventListener("mouseleave", onLeave);
    return () => { clearTimeout(timer); document.removeEventListener("mouseleave", onLeave); };
  }, [triggerProactive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stepIdx, blueprint, chatMsgs, showThinking, answeredSteps]);

  useEffect(() => {
    if (open && stepIdx === 6) setTimeout(() => chatInputRef.current?.focus(), 300);
  }, [open, stepIdx]);

  function answerStep(value: string) {
    const step = STEPS[stepIdx];
    const newAnsweredSteps = [...answeredSteps, { q: step.q, a: value }];
    setAnsweredSteps(newAnsweredSteps);
    setAnswers(prev => ({ ...prev, [step.id]: value }));

    if (stepIdx < 4) {
      setStepIdx(stepIdx + 1);
    } else {
      // Step 5 done → generate blueprint
      const finalAnswers = { ...answers, areas: pendingAreas };
      setAnswers(finalAnswers);
      setShowThinking(true);
      setTimeout(() => {
        setShowThinking(false);
        setBlueprint(buildBlueprint(finalAnswers));
        setStepIdx(5);
      }, 1800);
    }
  }

  function confirmAreas() {
    answerStep(pendingAreas.join(", ") || "Various areas");
  }

  function toggleArea(area: string) {
    setPendingAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const blueprintContext = [
      answers.businessType && `Business type: ${answers.businessType}`,
      answers.employees && `Team size: ${answers.employees}`,
      answers.challenge && `Biggest challenge: ${answers.challenge}`,
      answers.volume && `Monthly inquiries: ${answers.volume}`,
      answers.areas?.length && `Areas to automate: ${answers.areas.join(", ")}`,
    ].filter(Boolean).join("\n");
    const updated: ChatMsg[] = [...chatMsgs, { role: "user", content: text }];
    setChatMsgs(updated);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          blueprintContext,
        }),
      });
      const data = await res.json();
      setChatMsgs(prev => [...prev, { role: "assistant", content: data.reply || "Let me look into that for you." }]);
    } catch {
      setChatMsgs(prev => [...prev, { role: "assistant", content: "Network issue — please try again." }]);
    } finally {
      setChatLoading(false);
    }
  }

  const currentStep = STEPS[stepIdx < 5 ? stepIdx : 4];
  const progress = Math.min(stepIdx / 5, 1);

  return (
    <>
      {/* Floating label */}
      <AnimatePresence>
        {showLabel && !open && (
          <motion.div
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            style={{ position: "fixed", bottom: "36px", right: "96px", zIndex: 9999, padding: "8px 14px", borderRadius: "999px", background: "rgba(10,12,18,0.92)", border: "1px solid rgba(0,212,255,0.2)", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap", pointerEvents: "none" }}
          >
            Meet IRIS ✦
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.div style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 9999 }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2, duration: 0.4 }}>
        {!open && (
          <>
            <motion.span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(0,212,255,0.4)" }} animate={{ scale: [1, 1.7], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
            <motion.span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(124,58,237,0.35)" }} animate={{ scale: [1, 1.9], opacity: [0.4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }} />
          </>
        )}
        <motion.button
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}
          aria-label="Open IRIS AI Consultant"
          style={{ position: "relative", width: "56px", height: "56px", borderRadius: "50%", border: "1px solid rgba(0,212,255,0.35)", background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))", backdropFilter: "blur(20px)", boxShadow: "0 0 24px rgba(0,212,255,0.2), 0 8px 32px rgba(0,0,0,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </motion.svg>
            ) : (
              <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </motion.svg>
            )}
          </AnimatePresence>
          {blueprint && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: "absolute", top: "2px", right: "2px", width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e", border: "2px solid rgba(10,12,18,0.9)" }} />
          )}
        </motion.button>
      </motion.div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ position: "fixed", bottom: "96px", right: "28px", zIndex: 9999, width: "360px", maxHeight: "580px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(10,12,18,0.97)", backdropFilter: "blur(32px) saturate(160%)", boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.06)", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Header */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(135deg, rgba(0,212,255,0.07), rgba(124,58,237,0.06))", display: "flex", alignItems: "center", gap: "11px", flexShrink: 0 }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #00d4ff, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1rem" }}>
                🤖
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.01em" }}>IRIS</div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>AI Business Consultant · Online now</span>
                </div>
              </div>
              {/* Progress dots */}
              {stepIdx < 5 && (
                <div style={{ display: "flex", gap: "4px", alignItems: "center", marginRight: "4px" }}>
                  {STEPS.map((_, i) => (
                    <div key={i} style={{ width: i === stepIdx ? "16px" : "6px", height: "6px", borderRadius: "999px", background: i < stepIdx ? "#22c55e" : i === stepIdx ? "#00d4ff" : "rgba(255,255,255,0.12)", transition: "all 0.3s" }} />
                  ))}
                </div>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "5px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", transition: "color 0.2s, background 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                aria-label="Close chat"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>

              {/* Opening message */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ padding: "12px 15px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-line" }}>
                  {`👋 Welcome to CyberCraft360.\n\nI'm IRIS, your AI Business Consultant.\n\nIn just 2 minutes, I'll recommend the best AI employees for your specific business.\n\nLet's get started.`}
                </div>
              </motion.div>

              {/* Answered steps */}
              {answeredSteps.map(({ q, a }, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.79rem", color: "rgba(255,255,255,0.6)" }}>{q}</div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ padding: "8px 14px", borderRadius: "14px 14px 4px 14px", background: "linear-gradient(135deg, #00d4ff, #7c3aed)", fontSize: "0.79rem", color: "#fff", fontWeight: 600 }}>{a}</div>
                  </div>
                </motion.div>
              ))}

              {/* Current question */}
              {stepIdx < 5 && !showThinking && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={stepIdx}>
                  <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.85)", marginBottom: "10px" }}>
                    {currentStep.q}
                    {currentStep.multi && <span style={{ display: "block", fontSize: "0.68rem", color: "rgba(255,255,255,0.3)", marginTop: "4px", letterSpacing: "0.06em" }}>Select all that apply, then click Confirm.</span>}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {currentStep.chips.map(chip => (
                      <Chip
                        key={chip}
                        label={chip}
                        selected={currentStep.multi ? pendingAreas.includes(chip) : false}
                        onClick={() => {
                          if (currentStep.multi) {
                            toggleArea(chip);
                          } else {
                            answerStep(chip);
                          }
                        }}
                      />
                    ))}
                    {currentStep.multi && (
                      <motion.button
                        onClick={confirmAreas}
                        disabled={pendingAreas.length === 0}
                        whileHover={{ scale: pendingAreas.length > 0 ? 1.03 : 1 }}
                        whileTap={{ scale: 0.97 }}
                        style={{ padding: "7px 16px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, cursor: pendingAreas.length > 0 ? "pointer" : "default", border: "1px solid", letterSpacing: "0.06em", background: pendingAreas.length > 0 ? "linear-gradient(135deg, #00d4ff, #7c3aed)" : "rgba(255,255,255,0.03)", borderColor: pendingAreas.length > 0 ? "transparent" : "rgba(255,255,255,0.1)", color: pendingAreas.length > 0 ? "#fff" : "rgba(255,255,255,0.25)", marginTop: "4px" }}
                      >
                        {pendingAreas.length > 0 ? `Confirm (${pendingAreas.length} selected) →` : "Select at least one"}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Thinking indicator */}
              {showThinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ padding: "11px 16px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {[0, 1, 2].map(i => (
                        <motion.span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00d4ff", display: "block" }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>Analyzing your business...</span>
                  </div>
                </motion.div>
              )}

              {/* Blueprint */}
              {blueprint && stepIdx === 5 && (
                <BlueprintCard
                  blueprint={blueprint}
                  onBook={() => setOpen(false)}
                  onChat={() => setStepIdx(6)}
                />
              )}

              {/* Free chat phase */}
              {stepIdx === 6 && (
                <>
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", fontSize: "0.8rem", lineHeight: 1.55, color: "rgba(255,255,255,0.8)" }}>
                      I&apos;d love to tell you more. What questions do you have about implementing AI in your business?
                    </div>
                  </motion.div>
                  {chatMsgs.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "82%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? "linear-gradient(135deg, #00d4ff, #7c3aed)" : "rgba(255,255,255,0.06)", border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.07)" : "none", fontSize: "0.8rem", lineHeight: 1.55, color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </div>
                    </motion.div>
                  ))}
                  {chatLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex" }}>
                      <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "4px" }}>
                        {[0, 1, 2].map(i => (
                          <motion.span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00d4ff", display: "block" }} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Free chat input */}
            {stepIdx === 6 && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px", flexShrink: 0, background: "rgba(0,0,0,0.2)" }}>
                <input
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()}
                  placeholder="Ask IRIS anything..."
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px", padding: "9px 13px", fontSize: "0.8rem", color: "rgba(255,255,255,0.9)", outline: "none", fontFamily: "inherit" }}
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  style={{ width: "38px", height: "38px", borderRadius: "11px", flexShrink: 0, background: chatInput.trim() && !chatLoading ? "linear-gradient(135deg, #00d4ff, #7c3aed)" : "rgba(255,255,255,0.06)", border: "none", cursor: chatInput.trim() && !chatLoading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
