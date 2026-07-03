"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INDUSTRIES = [
  "Healthcare", "Dental", "Law Firm", "Insurance", "Construction",
  "Roofing", "HVAC", "Plumbing", "Real Estate", "Accounting",
  "Manufacturing", "Retail", "E-Commerce", "Other",
];

const TASKS = [
  { id: "support",   label: "Customer Support",       ai: "AI Customer Support (Nova)",    icon: "🎧" },
  { id: "calls",    label: "Phone Calls",              ai: "AI Receptionist (Ava)",          icon: "📞" },
  { id: "appts",    label: "Appointment Scheduling",   ai: "AI Receptionist (Ava)",          icon: "📅" },
  { id: "leads",    label: "Lead Qualification",       ai: "AI Sales Agent (Atlas)",         icon: "🎯" },
  { id: "crm",      label: "CRM Updates",              ai: "Workflow Automation (Pulse)",    icon: "📊" },
  { id: "email",    label: "Email Follow-ups",         ai: "AI Sales Agent (Atlas)",         icon: "✉️" },
  { id: "data",     label: "Data Entry",               ai: "Workflow Automation (Pulse)",    icon: "⌨️" },
  { id: "reports",  label: "Reports",                  ai: "AI Analytics",                   icon: "📈" },
  { id: "workflow", label: "Internal Workflows",       ai: "Workflow Automation (Pulse)",    icon: "⚙️" },
  { id: "mktg",     label: "Marketing",                ai: "AI Marketing Agent (Orion)",     icon: "📣" },
];

const AI_AUTOMATION_PCT: Record<string, number> = {
  support: 0.72, calls: 0.85, appts: 0.80, leads: 0.68,
  crm: 0.90, email: 0.75, data: 0.88, reports: 0.70, workflow: 0.78, mktg: 0.60,
};

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;
    const dur = 700;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisp(from + (to - from) * ease);
      if (t < 1) requestAnimationFrame(tick);
      else { setDisp(to); prev.current = to; }
    };
    requestAnimationFrame(tick);
  }, [value]);
  const fmt = decimals > 0 ? disp.toFixed(decimals) : Math.round(disp).toLocaleString();
  return <>{prefix}{fmt}{suffix}</>;
}

function CircleProgress({ pct, color, size = 80, label, value }: { pct: number; color: string; size?: number; label: string; value: string }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, color, letterSpacing: "-0.01em" }}>{value}</span>
        </div>
      </div>
      <span style={{ fontSize: "0.58rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: size }}>{label}</span>
    </div>
  );
}

function Slider({ label, hint, value, min, max, step, prefix = "", suffix = "", format, onChange }: {
  label: string; hint?: string; value: number; min: number; max: number; step: number;
  prefix?: string; suffix?: string; format?: (v: number) => string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : `${prefix}${value.toLocaleString()}${suffix}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>{label}</div>
          {hint && <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.22)", marginTop: "2px" }}>{hint}</div>}
        </div>
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#00d4ff", whiteSpace: "nowrap" }}>{display}</span>
      </div>
      <div style={{ position: "relative", height: "6px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "3px", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: "3px", background: "linear-gradient(90deg, #00d4ff, #7c3aed)", width: `${pct}%`, transition: "width 0.1s" }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%", margin: 0 }} />
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%,-50%)", width: "18px", height: "18px", borderRadius: "50%", background: "#00d4ff", border: "3px solid rgba(10,12,18,1)", boxShadow: "0 0 14px rgba(0,212,255,0.7)", pointerEvents: "none", transition: "left 0.1s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.18)" }}>{prefix}{min.toLocaleString()}{suffix}</span>
        <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.18)" }}>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}

export default function ProductivityCalculator() {
  const [industry, setIndustry] = useState("Healthcare");
  const [employees, setEmployees] = useState(8);
  const [hourlyWage, setHourlyWage] = useState(28);
  const [hoursPerWeek, setHoursPerWeek] = useState(18);
  const [selectedTasks, setSelectedTasks] = useState<string[]>(["calls", "appts", "crm", "email"]);

  const toggleTask = (id: string) =>
    setSelectedTasks(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  // Weighted average automation % based on selected tasks
  const avgAutomation = selectedTasks.length > 0
    ? selectedTasks.reduce((sum, id) => sum + (AI_AUTOMATION_PCT[id] ?? 0.7), 0) / selectedTasks.length
    : 0.7;

  const hoursPerMonth = hoursPerWeek * 4.33;
  const totalHoursLost = Math.round(employees * hoursPerMonth);
  const hoursRecovered = Math.round(totalHoursLost * avgAutomation);
  const monthlyPayroll = Math.round(employees * hourlyWage * hoursPerMonth);
  const monthlySavings = Math.round(monthlyPayroll * avgAutomation);
  const annualSavings = monthlySavings * 12;

  // Suggested AI workforce (deduplicated)
  const suggested = [...new Set(selectedTasks.map(id => TASKS.find(t => t.id === id)?.ai).filter(Boolean) as string[])];

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-8 items-start">

        {/* LEFT — Inputs */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          style={{ display: "flex", flexDirection: "column", gap: "28px", padding: "32px", borderRadius: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "4px" }}>Configure Your Business</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Tell us about your team</div>
          </div>

          {/* Industry */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Industry</label>
            <div style={{ position: "relative" }}>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                style={{ width: "100%", padding: "12px 40px 12px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", fontSize: "0.85rem", fontWeight: 600, appearance: "none", cursor: "pointer", outline: "none", fontFamily: "inherit" }}
              >
                {INDUSTRIES.map(ind => <option key={ind} value={ind} style={{ background: "#0a0c12" }}>{ind}</option>)}
              </select>
              <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#00d4ff", fontSize: "0.7rem" }}>▾</div>
            </div>
          </div>

          <Slider label="Employees on repetitive tasks" value={employees} min={1} max={100} step={1} onChange={setEmployees} format={v => `${v} ${v === 1 ? "employee" : "employees"}`} />

          <Slider label="Average hourly wage" value={hourlyWage} min={15} max={75} step={1} prefix="$" suffix="/hr" onChange={setHourlyWage} />

          <Slider
            label="Hours per week on repetitive work"
            hint="Answering calls · Scheduling · Data entry · CRM updates · Email follow-ups"
            value={hoursPerWeek} min={1} max={40} step={1} suffix=" hrs/wk"
            onChange={setHoursPerWeek}
          />

          {/* Tasks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Tasks to automate</div>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.22)", marginTop: "2px" }}>Select all that apply</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
              {TASKS.map(task => {
                const active = selectedTasks.includes(task.id);
                return (
                  <motion.button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "9px 12px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
                      background: active ? "rgba(0,212,255,0.09)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? "rgba(0,212,255,0.35)" : "rgba(255,255,255,0.08)"}`,
                      transition: "all 0.18s",
                    }}
                  >
                    <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>{task.icon}</span>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: active ? "#00d4ff" : "rgba(255,255,255,0.45)", lineHeight: 1.3 }}>{task.label}</span>
                    {active && <span style={{ marginLeft: "auto", color: "#00d4ff", fontSize: "0.65rem" }}>✓</span>}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* RIGHT — Results */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "88px" }}
        >
          {/* Annual headline */}
          <div style={{ padding: "28px", borderRadius: "20px", background: "linear-gradient(135deg, rgba(0,212,255,0.09), rgba(124,58,237,0.08))", border: "1px solid rgba(0,212,255,0.22)", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% -10%, rgba(0,212,255,0.15) 0%, transparent 65%)", pointerEvents: "none" }} />
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "8px" }}>Estimated Annual Productivity Opportunity</div>
            <div style={{ fontSize: "clamp(2.6rem, 5vw, 3.8rem)", fontWeight: 800, color: "#00d4ff", lineHeight: 1, letterSpacing: "-0.02em" }}>
              $<AnimatedNumber value={annualSavings} />
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginTop: "8px" }}>in recoverable payroll & productivity for {industry}</div>
          </div>

          {/* Circle progress row */}
          <div style={{ padding: "22px 16px", borderRadius: "18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-around", alignItems: "flex-start" }}>
            <CircleProgress pct={employees / 100} color="#00d4ff" label="Employees Impacted" value={`${employees}`} />
            <CircleProgress pct={hoursRecovered / Math.max(totalHoursLost, 1)} color="#7c3aed" label="Hours Recovered" value={`${hoursRecovered >= 1000 ? (hoursRecovered / 1000).toFixed(1) + "k" : hoursRecovered}`} />
            <CircleProgress pct={avgAutomation} color="#22c55e" label="Tasks Automated" value={`${Math.round(avgAutomation * 100)}%`} />
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "Monthly payroll on repetitive work", value: monthlyPayroll, prefix: "$", color: "rgba(239,68,68,0.8)", icon: "💸" },
              { label: "Monthly savings opportunity", value: monthlySavings, prefix: "$", color: "#22c55e", icon: "💰" },
              { label: "Hours recovered per month", value: hoursRecovered, suffix: " hrs", color: "#00d4ff", icon: "⏱️" },
              { label: "Annual productivity gain", value: annualSavings, prefix: "$", color: "#a855f7", icon: "📈" },
            ].map(({ label, value, prefix = "", suffix = "", color, icon }) => (
              <div key={label} style={{ padding: "18px 16px", borderRadius: "14px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: "1.1rem", marginBottom: "6px" }}>{icon}</div>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "6px", lineHeight: 1.4 }}>{label}</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color, lineHeight: 1 }}>
                  <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
                </div>
              </div>
            ))}
          </div>

          {/* Suggested AI Workforce */}
          {suggested.length > 0 && (
            <div style={{ padding: "18px 20px", borderRadius: "14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(0,212,255,0.7)", marginBottom: "10px" }}>
                🤖 Suggested AI Workforce for {industry}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {suggested.map(name => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#22c55e", fontSize: "0.72rem", flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "2px" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 1.4 }}>
              Imagine reinvesting those hours<br />into growing your business.
            </div>
            <motion.a href="/book" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ display: "block", padding: "14px", borderRadius: "14px", background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", textAlign: "center" }}>
              📅 Get My Free AI Strategy Session
            </motion.a>
            <motion.a href="#demo" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ display: "block", padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", textAlign: "center" }}>
              Talk With an AI Consultant →
            </motion.a>
            <p style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6, marginTop: "2px" }}>
              This calculator provides estimated productivity opportunities based on industry averages. Every business is different — during your complimentary AI Strategy Session, we&apos;ll provide a customized automation roadmap tailored specifically to your operations.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
