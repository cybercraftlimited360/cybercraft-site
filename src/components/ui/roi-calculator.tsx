"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;
    const duration = 600;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(from + (to - from) * ease);
      if (t < 1) requestAnimationFrame(tick);
      else { setDisplayed(to); prevRef.current = to; }
    };
    requestAnimationFrame(tick);
  }, [value]);

  const fmt = decimals > 0 ? displayed.toFixed(decimals) : Math.round(displayed).toLocaleString();
  return <>{prefix}{fmt}{suffix}</>;
}

function Slider({ label, hint, value, min, max, step, prefix = "", suffix = "", format, onChange }: {
  label: string; hint?: string; value: number; min: number; max: number; step: number;
  prefix?: string; suffix?: string; format?: (v: number) => string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : `${prefix}${value.toLocaleString()}${suffix}`;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>{label}</span>
          {hint && <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.22)", marginTop: "1px" }}>{hint}</div>}
        </div>
        <span style={{ fontSize: "1rem", fontWeight: 800, color: "#00d4ff", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{display}</span>
      </div>
      <div style={{ position: "relative", height: "6px" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "3px", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: "3px", background: "linear-gradient(90deg, #00d4ff, #7c3aed)", width: `${pct}%`, transition: "width 0.1s" }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", height: "100%", margin: 0 }}
        />
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)", width: "16px", height: "16px", borderRadius: "50%", background: "#00d4ff", border: "2px solid rgba(10,12,18,0.9)", boxShadow: "0 0 12px rgba(0,212,255,0.6)", pointerEvents: "none", transition: "left 0.1s" }} />
      </div>
    </div>
  );
}

export default function ROICalculator() {
  const [monthlyCalls, setMonthlyCalls] = useState(400);
  const [employees, setEmployees] = useState(3);
  const [appointments, setAppointments] = useState(80);
  const [missedCalls, setMissedCalls] = useState(60);
  const [avgSale, setAvgSale] = useState(500);

  // Core calculations
  const capturedCalls = Math.round(missedCalls * 0.83);
  const newAppointments = Math.round(capturedCalls * 0.28);
  const additionalRevenue = Math.round(newAppointments * avgSale);

  const routineCallMinutes = monthlyCalls * 0.35 * 7;
  const missedCallFollowUpMinutes = missedCalls * 5;
  const appointmentAdminMinutes = appointments * 4;
  const totalMinutes = routineCallMinutes + missedCallFollowUpMinutes + appointmentAdminMinutes;
  const hoursSaved = Math.round(totalMinutes / 60);

  const laborRate = 22;
  const laborSavings = Math.round(hoursSaved * laborRate);

  const annualValue = (laborSavings + additionalRevenue) * 12;
  const monthlyValue = laborSavings + additionalRevenue;

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-start">

        {/* Left — inputs */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          style={{ padding: "32px", borderRadius: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "28px" }}
        >
          <div>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "4px" }}>Your Business</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Tell us about your numbers</div>
          </div>

          <Slider label="Monthly calls received" hint="Total incoming calls per month" value={monthlyCalls} min={50} max={5000} step={50} onChange={setMonthlyCalls} format={v => v.toLocaleString()} />
          <Slider label="Team members handling calls" hint="Staff spending time on phones & admin" value={employees} min={1} max={30} step={1} onChange={setEmployees} format={v => `${v} ${v === 1 ? "person" : "people"}`} />
          <Slider label="Appointments booked monthly" hint="Confirmed bookings per month" value={appointments} min={5} max={1000} step={5} onChange={setAppointments} format={v => v.toLocaleString()} />
          <Slider label="Missed calls per month" hint="Calls that go unanswered" value={missedCalls} min={5} max={500} step={5} onChange={setMissedCalls} format={v => v.toLocaleString()} />
          <Slider label="Average sale / appointment value" value={avgSale} min={50} max={10000} step={50} prefix="$" onChange={setAvgSale} />
        </motion.div>

        {/* Right — results */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {/* Total annual value — hero number */}
          <div style={{ padding: "28px 28px 24px", borderRadius: "20px", background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.07))", border: "1px solid rgba(0,212,255,0.2)", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "10px" }}>
              Estimated Annual Value of AI
            </div>
            <div style={{ fontSize: "clamp(2.4rem, 5vw, 3.5rem)", fontWeight: 800, color: "#00d4ff", lineHeight: 1, letterSpacing: "-0.02em" }}>
              $<AnimatedNumber value={annualValue} />
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", marginTop: "8px" }}>per year in recovered value for your business</div>
          </div>

          {/* Three result cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[
              { label: "Hours Saved", value: <AnimatedNumber value={hoursSaved} suffix=" hrs" />, sub: "per month", color: "#00d4ff", icon: "⏱️", detail: `${(hoursSaved * 12).toLocaleString()} hrs/yr` },
              { label: "Labor Savings", value: <><span style={{ fontSize: "0.75em" }}>$</span><AnimatedNumber value={laborSavings} /></>, sub: "per month", color: "#7c3aed", icon: "💰", detail: `$${(laborSavings * 12).toLocaleString()}/yr` },
              { label: "New Revenue", value: <><span style={{ fontSize: "0.75em" }}>$</span><AnimatedNumber value={additionalRevenue} /></>, sub: "per month", color: "#22c55e", icon: "📈", detail: `From ${newAppointments} new appts` },
            ].map(({ label, value, sub, color, icon, detail }) => (
              <div key={label} style={{ padding: "16px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                <div style={{ fontSize: "1.1rem", marginBottom: "6px" }}>{icon}</div>
                <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color, lineHeight: 1, marginBottom: "3px" }}>{value}</div>
                <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.25)", marginBottom: "4px" }}>{sub}</div>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, color: `${color}80` }}>{detail}</div>
              </div>
            ))}
          </div>

          {/* Opportunity breakdown */}
          <div style={{ padding: "18px 20px", borderRadius: "14px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,197,94,0.6)", marginBottom: "12px" }}>
              📞 Opportunities Currently Slipping Away
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { label: "Missed calls per month", value: missedCalls.toLocaleString(), color: "rgba(239,68,68,0.7)" },
                { label: "Calls AI would capture", value: `${capturedCalls.toLocaleString()} (83%)`, color: "#22c55e" },
                { label: "New appointments from those calls", value: newAppointments.toLocaleString(), color: "#00d4ff" },
                { label: "Monthly revenue recovered", value: `$${additionalRevenue.toLocaleString()}`, color: "#a855f7" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{label}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly breakdown */}
          <div style={{ padding: "16px 20px", borderRadius: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.4rem" }}>⚡</span>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                $<AnimatedNumber value={monthlyValue} /> extra value every month
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                From {hoursSaved} hours saved + {newAppointments} new appointments captured
              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.a
            href="/book"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ display: "block", padding: "15px", borderRadius: "14px", background: "linear-gradient(135deg, #00d4ff, #7c3aed)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none", textAlign: "center", cursor: "pointer", marginTop: "2px" }}
          >
            📅 Book My Free Strategy Session →
          </motion.a>
          <p style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", textAlign: "center", letterSpacing: "0.08em" }}>
            45 minutes · No commitment · We build your custom AI roadmap
          </p>
        </motion.div>
      </div>
    </div>
  );
}
