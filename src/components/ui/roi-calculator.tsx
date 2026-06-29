"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SERVICES = [
  { id: "chatbot", label: "AI Chatbot", cost: 500 },
  { id: "voice", label: "Voice AI Agent", cost: 700 },
  { id: "phone", label: "AI Phone Agent", cost: 800 },
  { id: "sales", label: "AI Sales Agent", cost: 900 },
  { id: "workflow", label: "Workflow Automation", cost: 800 },
  { id: "content", label: "AI Content Engine", cost: 600 },
  { id: "docs", label: "Document Intelligence", cost: 950 },
  { id: "leads", label: "Lead Intelligence", cost: 850 },
  { id: "website", label: "Premium Website", cost: 1500 },
  { id: "ads", label: "AI Ads & Marketing", cost: 1000 },
  { id: "analytics", label: "AI Analytics Dashboard", cost: 1100 },
  { id: "security", label: "AI Cybersecurity", cost: 1200 },
];

function Slider({ label, value, min, max, step, prefix = "", suffix = "", onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  prefix?: string; suffix?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>{label}</span>
        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#00d4ff" }}>{prefix}{value.toLocaleString()}{suffix}</span>
      </div>
      <div className="relative" style={{ height: "4px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "2px", background: "rgba(255,255,255,0.08)" }} />
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: "2px",
          background: "linear-gradient(90deg, #00d4ff, #7c3aed)",
          width: `${((value - min) / (max - min)) * 100}%`,
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%", margin: 0,
          }}
        />
        <div style={{
          position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
          left: `${((value - min) / (max - min)) * 100}%`,
          width: "14px", height: "14px", borderRadius: "50%",
          background: "#00d4ff", border: "2px solid rgba(0,212,255,0.3)",
          boxShadow: "0 0 10px rgba(0,212,255,0.5)",
          pointerEvents: "none",
        }} />
      </div>
      <div className="flex justify-between">
        <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>{prefix}{min.toLocaleString()}{suffix}</span>
        <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}

export default function ROICalculator() {
  const [employees, setEmployees] = useState(3);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [selectedService, setSelectedService] = useState("chatbot");
  const [showResults, setShowResults] = useState(false);

  const service = SERVICES.find(s => s.id === selectedService)!;
  const weeklyManualCost = employees * hourlyRate * hoursPerWeek;
  const monthlyManualCost = weeklyManualCost * 4.33;
  const aiMonthlyCost = service.cost;
  const monthlySavings = monthlyManualCost - aiMonthlyCost;
  const annualSavings = monthlySavings * 12;
  const roi = Math.round((monthlySavings / aiMonthlyCost) * 100);
  const paybackWeeks = Math.ceil(aiMonthlyCost / (weeklyManualCost || 1));

  const handleCalculate = () => setShowResults(true);

  return (
    <div className="grid grid-cols-2 gap-12 items-start max-w-5xl mx-auto w-full">
      {/* Left — inputs */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{
          padding: "36px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        <Slider label="Employees on repetitive tasks" value={employees} min={1} max={20} step={1} onChange={setEmployees} />
        <Slider label="Average hourly rate" value={hourlyRate} min={10} max={150} step={5} prefix="$" onChange={setHourlyRate} />
        <Slider label="Hours per week on manual work" value={hoursPerWeek} min={5} max={60} step={5} suffix="h" onChange={setHoursPerWeek} />

        {/* Service selector */}
        <div className="flex flex-col gap-3">
          <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Service you need</span>
          <div className="grid grid-cols-2 gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {SERVICES.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedService(s.id); setShowResults(false); }}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: `1px solid ${selectedService === s.id ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.07)"}`,
                  background: selectedService === s.id ? "rgba(0,212,255,0.08)" : "rgba(255,255,255,0.02)",
                  color: selectedService === s.id ? "#00d4ff" : "rgba(255,255,255,0.4)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                {s.label}
                <div style={{ fontSize: "0.62rem", opacity: 0.6, marginTop: "2px" }}>from ${s.cost}/mo</div>
              </button>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCalculate}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
            border: "none",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Calculate My ROI →
        </motion.button>
      </motion.div>

      {/* Right — results */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: "48px 36px",
                borderRadius: "20px",
                border: "1px dashed rgba(255,255,255,0.08)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                minHeight: "400px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2.5rem", opacity: 0.15 }}>$</div>
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
                Adjust the sliders and hit<br />Calculate to see your savings.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Big savings number */}
              <div style={{
                padding: "32px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))",
                border: "1px solid rgba(0,212,255,0.15)",
                textAlign: "center",
              }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>Annual savings with AI</p>
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", fontWeight: 800, color: "#00d4ff", lineHeight: 1, margin: "0 0 8px" }}
                >
                  ${annualSavings > 0 ? annualSavings.toLocaleString() : "0"}
                </motion.p>
                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>per year back in your pocket</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Current monthly cost", value: `$${monthlyManualCost.toLocaleString()}`, sub: "in manual labour", color: "rgba(255,255,255,0.6)" },
                  { label: "AI subscription", value: `$${aiMonthlyCost.toLocaleString()}/mo`, sub: service.label, color: "#00d4ff" },
                  { label: "Monthly savings", value: `$${monthlySavings > 0 ? monthlySavings.toLocaleString() : 0}`, sub: "every month", color: "#22c55e" },
                  { label: "ROI", value: `${roi > 0 ? roi : 0}%`, sub: "return on investment", color: "#a855f7" },
                ].map(({ label, value, sub, color }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    style={{
                      padding: "20px",
                      borderRadius: "14px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p style={{ fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>{label}</p>
                    <p style={{ fontSize: "1.3rem", fontWeight: 700, color, marginBottom: "2px" }}>{value}</p>
                    <p style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.25)" }}>{sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Payback period */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  padding: "16px 20px",
                  borderRadius: "12px",
                  background: "rgba(34,197,94,0.05)",
                  border: "1px solid rgba(34,197,94,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "1rem" }}>⚡</span>
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", margin: 0 }}>
                  Your AI pays for itself in <strong style={{ color: "#22c55e" }}>{paybackWeeks} week{paybackWeeks !== 1 ? "s" : ""}</strong> — then it's pure profit.
                </p>
              </motion.div>

              {/* CTA */}
              <motion.a
                href="#contact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                style={{
                  display: "block",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Book a Free Strategy Call to Get Started →
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
