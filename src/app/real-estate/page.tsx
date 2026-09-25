"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// ─── UTM helper ──────────────────────────────────────────────────────────────
function useUTM() {
  const [utm, setUtm] = useState<Record<string, string>>({});
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    const out: Record<string, string> = {};
    for (const k of keys) {
      const v = p.get(k);
      if (v) out[k.replace("utm_", "")] = v;
    }
    setUtm(out);
  }, []);
  return utm;
}

// ─── GA4 event helper ─────────────────────────────────────────────────────────
function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && (window as Record<string, unknown>).gtag) {
    ((window as Record<string, unknown>).gtag as (...a: unknown[]) => void)(...args);
  }
}

// ─── Demo messages (aligned with dashboard example) ───────────────────────────
const DEMO_MESSAGES = [
  { role: "caller", text: "Hi, I saw your listing on Zillow for 123 Main Street. Is it still available?" },
  { role: "amy", text: "Hi! Yes, 123 Main Street is still available — it just listed. Are you looking to buy, or still getting a feel for the market?" },
  { role: "caller", text: "We're ready to buy. Looking for a 3-bedroom in the $400–450K range in that area." },
  { role: "amy", text: "That's a great match. Can I get your name and best email? I'd love to send you some other properties that fit too." },
  { role: "caller", text: "Sure — I'm Sarah Johnson. sarah.johnson@email.com" },
  { role: "amy", text: "Thanks, Sarah. Are you currently working with an agent, and what's your timeline for moving?" },
  { role: "caller", text: "No agent yet, and we're hoping to move within the next 90 days." },
  { role: "amy", text: "Got it. Would you like to schedule a showing for 123 Main? I have Friday at 11am available. Your agent will receive a full summary of our conversation." },
];

const WORKFLOW_STEPS = [
  { label: "Lead arrived", icon: "📥" },
  { label: "Amy responded", icon: "💬" },
  { label: "Lead qualified", icon: "✓" },
  { label: "Showing requested", icon: "📅" },
  { label: "Summary ready", icon: "📋" },
];

function AmyDemoChat() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDone = !isPlaying && visibleCount === DEMO_MESSAGES.length;

  function startDemo() {
    setVisibleCount(0);
    setIsPlaying(true);
  }

  useEffect(() => {
    if (!isPlaying) return;
    if (visibleCount >= DEMO_MESSAGES.length) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setVisibleCount(c => c + 1);
    }, visibleCount === 0 ? 400 : 1600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, visibleCount]);

  return (
    <div className="re-chat-container">
      <div className="re-chat-header">
        <div className="re-chat-avatar">A</div>
        <div>
          <div className="re-chat-name">Amy</div>
          <div className="re-chat-status">
            <span className="re-status-dot" />
            AI Front Desk · CyberCraft360
          </div>
        </div>
        <div className="re-chat-time">11:47 PM</div>
      </div>
      <div className="re-chat-messages">
        {DEMO_MESSAGES.slice(0, visibleCount).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`re-chat-bubble ${msg.role === "amy" ? "re-bubble-amy" : "re-bubble-caller"}`}
          >
            {msg.role === "amy" && <span className="re-bubble-label">Amy</span>}
            {msg.role === "caller" && <span className="re-bubble-label re-label-caller">Caller</span>}
            <p>{msg.text}</p>
          </motion.div>
        ))}
        {isPlaying && visibleCount < DEMO_MESSAGES.length && (
          <div className="re-typing-indicator">
            <span /><span /><span />
          </div>
        )}
        {!isPlaying && visibleCount === 0 && (
          <div className="re-chat-placeholder">
            <p>See how Amy handles an 11pm buyer inquiry.</p>
          </div>
        )}
      </div>

      {isDone && (
        <div className="re-workflow-bar">
          {WORKFLOW_STEPS.map((step, i) => (
            <motion.div
              key={i}
              className="re-workflow-step"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
            >
              <span className="re-workflow-icon">{step.icon}</span>
              <span className="re-workflow-label">{step.label}</span>
              {i < WORKFLOW_STEPS.length - 1 && <span className="re-workflow-arrow">›</span>}
            </motion.div>
          ))}
        </div>
      )}

      <button
        className={`re-demo-btn ${isPlaying ? "re-demo-btn-active" : ""}`}
        onClick={startDemo}
        disabled={isPlaying}
      >
        {isPlaying ? "Playing..." : visibleCount > 0 ? "▶ Replay Demo" : "▶ Play Demo"}
      </button>
    </div>
  );
}

// ─── FAQ Item ────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`re-faq-item ${open ? "re-faq-open" : ""}`}>
      <button className="re-faq-q" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <span>{q}</span>
        <span className="re-faq-chevron">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="re-faq-a">{a}</div>}
    </div>
  );
}

// ─── ROI Calculator ───────────────────────────────────────────────────────────
function ROICalculator() {
  const [leads, setLeads] = useState(80);
  const [minutes, setMinutes] = useState(20);
  const [assistRate, setAssistRate] = useState(60);
  const [hourlyRate, setHourlyRate] = useState(75);
  const [showRevenue, setShowRevenue] = useState(false);
  const [convRate, setConvRate] = useState(5);
  const [commission, setCommission] = useState(8000);
  const [showMethod, setShowMethod] = useState(false);

  const hoursPerMonth = Math.round((leads * minutes * (assistRate / 100)) / 60);
  const moneySaved = Math.round(hoursPerMonth * hourlyRate);

  const amyAssisted = Math.round(leads * (assistRate / 100));
  const additionalRevenue = Math.round(amyAssisted * (convRate / 100) * commission);

  const fmtMoney = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `$${n}`;

  const minutePresets = [5, 10, 15, 20, 30];
  const ratePresets = [25, 50, 75, 100];

  return (
    <div className="re-roi-wrapper">
      <div className="re-roi-disclaimer">
        <span className="re-disclaimer-icon">⚠</span>
        <span>
          Illustrative scenario based entirely on the assumptions you enter. Adjust inputs to model your business.
          This does not predict actual results or guarantee outcomes.
        </span>
      </div>

      <div className="re-roi-grid">
        <div className="re-roi-inputs">
          <label className="re-roi-label" htmlFor="roi-leads">
            How many leads come in per month?
            <input
              id="roi-leads"
              type="range" min={10} max={500} step={5} value={leads}
              onChange={e => setLeads(+e.target.value)}
              className="re-range"
              aria-label="Monthly leads received"
            />
            <span className="re-range-val">{leads} leads/mo</span>
          </label>

          <div className="re-roi-label">
            How long does each lead interaction take you?
            <div className="re-preset-btns">
              {minutePresets.map(m => (
                <button
                  key={m}
                  className={`re-preset-btn ${minutes === m ? "re-preset-btn-active" : ""}`}
                  onClick={() => setMinutes(m)}
                  type="button"
                >
                  {m} min
                </button>
              ))}
            </div>
            <input
              type="range" min={5} max={45} step={5} value={minutes}
              onChange={e => setMinutes(+e.target.value)}
              className="re-range"
              aria-label="Minutes per lead interaction"
            />
            <span className="re-range-val">{minutes} min/lead</span>
          </div>

          <label className="re-roi-label" htmlFor="roi-assist">
            What percentage of that repetitive lead-handling work could Amy assist with?
            <span className="re-roi-helper">This is your assumption. Adjust it based on your workflow.</span>
            <input
              id="roi-assist"
              type="range" min={10} max={90} step={5} value={assistRate}
              onChange={e => setAssistRate(+e.target.value)}
              className="re-range"
              aria-label="Percentage Amy could assist with"
            />
            <span className="re-range-val">{assistRate}% — Amy assists</span>
          </label>

          <div className="re-roi-label">
            What&apos;s your time worth per hour?
            <div className="re-preset-btns">
              {ratePresets.map(r => (
                <button
                  key={r}
                  className={`re-preset-btn ${hourlyRate === r ? "re-preset-btn-active" : ""}`}
                  onClick={() => setHourlyRate(r)}
                  type="button"
                >
                  ${r}
                </button>
              ))}
            </div>
            <input
              type="range" min={25} max={200} step={25} value={hourlyRate}
              onChange={e => setHourlyRate(+e.target.value)}
              className="re-range"
              aria-label="Hourly rate"
            />
            <span className="re-range-val">${hourlyRate}/hr</span>
          </div>
        </div>

        <div className="re-roi-results">
          <div className="re-roi-tile re-roi-tile-primary">
            <span className="re-roi-tile-eyebrow">Hours back every month</span>
            <span className="re-roi-tile-val">{hoursPerMonth}</span>
            <span className="re-roi-tile-label">hours saved per month</span>
          </div>
          <div className="re-roi-tile re-roi-tile-accent">
            <span className="re-roi-tile-eyebrow">Value of that time</span>
            <span className="re-roi-tile-val">{fmtMoney(moneySaved)}</span>
            <span className="re-roi-tile-label">at ${hourlyRate}/hr — illustrative</span>
          </div>
          <p className="re-roi-caveat">
            All figures are illustrative based on your inputs only — not a forecast or guarantee.
          </p>

          <button
            className="re-revenue-toggle"
            onClick={() => setShowRevenue(v => !v)}
            type="button"
          >
            {showRevenue ? "▾" : "▸"} Also model revenue opportunity
          </button>

          {showRevenue && (
            <div className="re-revenue-section">
              <label className="re-roi-label re-roi-label-sm" htmlFor="roi-conv">
                Your close rate
                <input
                  id="roi-conv"
                  type="range" min={1} max={30} step={0.5} value={convRate}
                  onChange={e => setConvRate(+e.target.value)}
                  className="re-range"
                  aria-label="Close rate"
                />
                <span className="re-range-val re-range-val-sm">{convRate}%</span>
              </label>
              <label className="re-roi-label re-roi-label-sm" htmlFor="roi-commission">
                Average commission per closing
                <input
                  id="roi-commission"
                  type="range" min={2000} max={50000} step={500} value={commission}
                  onChange={e => setCommission(+e.target.value)}
                  className="re-range"
                  aria-label="Average commission"
                />
                <span className="re-range-val re-range-val-sm">{fmtMoney(commission)}</span>
              </label>
              <div className="re-roi-tile re-roi-tile-revenue">
                <span className="re-roi-tile-eyebrow">Illustrative revenue opportunity</span>
                <span className="re-roi-tile-val re-roi-tile-val-sm">{fmtMoney(additionalRevenue)}</span>
                <span className="re-roi-tile-label">from {amyAssisted} Amy-assisted leads/mo</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        className="re-methodology-toggle"
        onClick={() => setShowMethod(v => !v)}
        aria-expanded={showMethod}
        type="button"
      >
        {showMethod ? "▾" : "▸"} How is this calculated?
      </button>
      {showMethod && (
        <div className="re-methodology-body">
          <p><strong>Hours saved</strong> = Leads × Minutes per lead × % Amy handles ÷ 60</p>
          <p><strong>Time value</strong> = Hours saved × your hourly rate</p>
          <p><strong>Revenue opportunity</strong> = Leads × % Amy handles × close rate × average commission</p>
          <p>
            Not a prediction or guarantee. Actual results depend on your market, lead quality,
            follow-up execution, and many other factors outside any system&apos;s control.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Amy Call Form ────────────────────────────────────────────────────────────
function AmyCallForm({ utm, onSuccess }: { utm: Record<string, string>; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) { setError("Name and email are required."); return; }
    if (!phone) { setError("Phone number is required so Amy can call you."); return; }
    if (!consent) { setError("Please check the box to request Amy's call."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/real-estate/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, role, interest, message, callbackConsent: true, source: "callback", utm }),
      });
      if (!res.ok) {
        let errMsg = "Something went wrong. Please try again.";
        try {
          const d = await res.json();
          if (d.error) errMsg = d.error;
        } catch { /* response was not JSON */ }
        throw new Error(errMsg);
      }
      gtag("event", "re_amy_call_requested", { event_category: "real_estate" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="re-form">
      <div className="re-form-row">
        <input className="re-input" placeholder="Your name *" aria-label="Your name" value={name} onChange={e => setName(e.target.value)} required />
        <input className="re-input" type="email" placeholder="Email address *" aria-label="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="re-form-row">
        <input className="re-input" type="tel" placeholder="Phone number *" aria-label="Phone number" value={phone} onChange={e => setPhone(e.target.value)} required />
        <select className="re-input re-select" value={role} onChange={e => setRole(e.target.value)} aria-label="Your role">
          <option value="">Your role</option>
          <option value="Real Estate Agent">Real Estate Agent</option>
          <option value="Broker / Team Lead">Broker / Team Lead</option>
          <option value="Property Manager">Property Manager</option>
          <option value="Investor">Investor</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <select className="re-input re-select re-full" value={interest} onChange={e => setInterest(e.target.value)} aria-label="Biggest lead-handling challenge">
        <option value="">What&apos;s your biggest lead-handling challenge? (optional)</option>
        <option value="Missed calls">Missed calls</option>
        <option value="Slow lead response">Slow lead response</option>
        <option value="Lead qualification">Lead qualification</option>
        <option value="Showing scheduling">Showing scheduling</option>
        <option value="Follow-up">Follow-up</option>
        <option value="After-hours inquiries">After-hours inquiries</option>
        <option value="Other">Other</option>
      </select>
      <textarea
        className="re-input re-textarea"
        placeholder="Anything specific you&apos;d like Amy to cover on the call? (optional)"
        aria-label="Tell us more"
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={2}
      />
      <label className="re-consent-label">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="re-checkbox" aria-required="true" />
        <span>
          I request a call from Amy, CyberCraft360&apos;s AI voice assistant, at the number provided above.{" "}
          <Link href="/privacy" className="re-trust-link">Privacy Policy</Link>
        </span>
      </label>

      {error && <p className="re-form-error">{error}</p>}

      <button type="submit" className="re-submit-btn" disabled={loading}>
        {loading ? "Requesting..." : "Call Amy Now →"}
      </button>
      <p className="re-form-note">After submitting, Amy will typically call within a few moments to walk you through the system.</p>
      <p className="re-form-note re-form-note-alt">
        Prefer a walkthrough with our team? <Link href="/book" className="re-trust-link">Book your free Amy demo →</Link>
      </p>
    </form>
  );
}

// ─── Timezone list (major global zones) ──────────────────────────────────────
const US_TIMEZONES = [
  { value: "America/New_York",      label: "Eastern (ET) — New York" },
  { value: "America/Chicago",       label: "Central (CT) — Chicago" },
  { value: "America/Denver",        label: "Mountain (MT) — Denver" },
  { value: "America/Phoenix",       label: "Arizona (no DST)" },
  { value: "America/Los_Angeles",   label: "Pacific (PT) — Los Angeles" },
  { value: "America/Anchorage",     label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu",      label: "Hawaii (HST)" },
  { value: "America/Toronto",       label: "Eastern — Toronto" },
  { value: "America/Vancouver",     label: "Pacific — Vancouver" },
  { value: "Europe/London",         label: "GMT/BST — London" },
  { value: "Europe/Dublin",         label: "GMT/IST — Dublin" },
  { value: "Europe/Paris",          label: "CET — Paris / Amsterdam" },
  { value: "Europe/Berlin",         label: "CET — Berlin / Frankfurt" },
  { value: "Asia/Dubai",            label: "GST — Dubai" },
  { value: "Asia/Riyadh",          label: "AST — Riyadh" },
  { value: "Asia/Karachi",         label: "PKT — Karachi" },
  { value: "Asia/Kolkata",         label: "IST — India" },
  { value: "Asia/Singapore",       label: "SGT — Singapore" },
  { value: "Australia/Sydney",     label: "AEST — Sydney" },
  { value: "Australia/Melbourne",  label: "AEST — Melbourne" },
  { value: "Pacific/Auckland",     label: "NZST — Auckland" },
];

const TIME_WINDOWS = [
  { value: "morning",   label: "Morning — 9 AM to 12 PM" },
  { value: "afternoon", label: "Afternoon — 12 PM to 4 PM" },
  { value: "evening",   label: "Evening — 4 PM to 7 PM" },
];

// ─── Schedule Callback Form ───────────────────────────────────────────────────
function ScheduleCallbackForm({ utm, onSuccess }: { utm: Record<string, string>; onSuccess: () => void }) {
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [role, setRole]           = useState("");
  const [interest, setInterest]   = useState("");
  const [date, setDate]           = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [timezone, setTimezone]   = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "America/Chicago"; }
  });
  const [consent, setConsent]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Min date = tomorrow
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();
  // Max date = 14 days out
  const maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  })();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) { setError("Name and email are required."); return; }
    if (!phone) { setError("Phone number is required."); return; }
    if (!date) { setError("Please select a date."); return; }
    if (!timeWindow) { setError("Please select a preferred time window."); return; }
    if (!consent) { setError("Please check the consent box to schedule a callback."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/real-estate/schedule-callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, role, interest, date, timeWindow, timezone, utm }),
      });
      if (!res.ok) {
        let errMsg = "Something went wrong. Please try again.";
        try { const d = await res.json(); if (d.error) errMsg = d.error; } catch { /* not JSON */ }
        throw new Error(errMsg);
      }
      gtag("event", "re_callback_scheduled", { event_category: "real_estate" });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="re-form">
      <div className="re-form-row">
        <input className="re-input" placeholder="Your name *" aria-label="Your name" value={name} onChange={e => setName(e.target.value)} required />
        <input className="re-input" type="email" placeholder="Email address *" aria-label="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="re-form-row">
        <input className="re-input" type="tel" placeholder="Phone number *" aria-label="Phone number" value={phone} onChange={e => setPhone(e.target.value)} required />
        <select className="re-input re-select" value={role} onChange={e => setRole(e.target.value)} aria-label="Your role">
          <option value="">Your role</option>
          <option value="Real Estate Agent">Real Estate Agent</option>
          <option value="Broker / Team Lead">Broker / Team Lead</option>
          <option value="Property Manager">Property Manager</option>
          <option value="Investor">Investor</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <select className="re-input re-select re-full" value={interest} onChange={e => setInterest(e.target.value)} aria-label="Biggest lead-handling challenge">
        <option value="">What&apos;s your biggest lead-handling challenge? (optional)</option>
        <option value="Missed calls">Missed calls</option>
        <option value="Slow lead response">Slow lead response</option>
        <option value="Lead qualification">Lead qualification</option>
        <option value="Showing scheduling">Showing scheduling</option>
        <option value="Follow-up">Follow-up</option>
        <option value="After-hours inquiries">After-hours inquiries</option>
        <option value="Other">Other</option>
      </select>

      <div className="re-form-row">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Preferred Date *</label>
          <input className="re-input" type="date" aria-label="Preferred date" value={date} min={minDate} max={maxDate} onChange={e => setDate(e.target.value)} required style={{ colorScheme: "dark" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Time Window *</label>
          <select className="re-input re-select" aria-label="Preferred time window" value={timeWindow} onChange={e => setTimeWindow(e.target.value)} required>
            <option value="">Select window</option>
            {TIME_WINDOWS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Your Timezone</label>
        <select className="re-input re-select re-full" aria-label="Your timezone" value={timezone} onChange={e => setTimezone(e.target.value)}>
          {US_TIMEZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
        </select>
      </div>

      <label className="re-consent-label">
        <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="re-checkbox" aria-required="true" />
        <span>
          I request a callback from Amy, CyberCraft360&apos;s AI voice assistant, at the number provided above, during my selected time window.{" "}
          <a href="/privacy" style={{ color: "#00d4ff" }}>Privacy Policy</a>
        </span>
      </label>

      {error && <p className="re-form-error">{error}</p>}

      <button type="submit" className="re-submit-btn" disabled={loading}>
        {loading ? "Scheduling..." : "Schedule My Callback →"}
      </button>
      <p className="re-form-note">Amy will call your number during the time window you selected. You&apos;ll receive an email confirmation.</p>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RealEstatePage() {
  const utm = useUTM();
  const [callSuccess, setCallSuccess]             = useState(false);
  const [scheduleSuccess, setScheduleSuccess]     = useState(false);
  const [amyTab, setAmyTab]                       = useState<"now" | "schedule">("now");

  useEffect(() => {
    gtag("event", "re_page_view", {
      event_category: "real_estate",
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
    });
  }, [utm]);


  const steps = [
    {
      num: "1",
      title: "Discover",
      desc: "We learn your business: how leads come in, how your team handles them, what matters most to your clients.",
    },
    {
      num: "2",
      title: "Connect",
      desc: "Connect applicable supported systems — your phone, calendar, CRM, and other tools used in your workflow.",
    },
    {
      num: "3",
      title: "Configure",
      desc: "Amy is configured around your business, team, workflows, listings, and brand voice — not a generic template.",
    },
    {
      num: "4",
      title: "Test",
      desc: "We run structured conversations and workflow tests before anything goes live.",
    },
    {
      num: "5",
      title: "Launch",
      desc: "Go live after configuration, testing, and your approval.",
    },
    {
      num: "6",
      title: "Improve",
      desc: "Review real conversations and refine the system over time with your team.",
    },
  ];

  return (
    <>
      <div className="re-page">
        {/* ── Nav ── */}
        <nav className="re-nav">
          <Link href="/" className="re-nav-logo">
            <img src="/logo-icon.svg" alt="CyberCraft360" className="re-nav-logo-img" />
            <span className="re-nav-logo-text">CyberCraft360</span>
          </Link>
          <div className="re-nav-links">
            <a href="#how-it-works" className="re-nav-link">How It Works</a>
            <a href="#how-amy-fits" className="re-nav-link">Custom Setup</a>
            <a href="#have-amy-call-me" className="re-nav-link">Talk to Amy</a>
            <Link href="/book" className="re-nav-cta">Book Amy Demo</Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="re-hero">
          <motion.div
            className="re-hero-content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="re-eyebrow">Amy · AI Front Desk for Real Estate</div>
            <h1 className="re-hero-headline">
              Real Estate Leads<br />
              <span className="re-headline-accent">Don&apos;t Wait.</span><br />
              Neither Does Amy.
            </h1>
            <p className="re-hero-sub">
              Amy responds to calls and inquiries, qualifies prospects, and helps schedule showings — day and night. Built for real estate teams.
            </p>
            <p className="re-hero-lead-note">
              When a buyer calls at 11pm, Amy can answer. When an inquiry comes in, Amy works to qualify and capture it — so your team starts the next day with context, not cold callbacks.
            </p>
            <div className="re-hero-ctas">
              <a
                href="#have-amy-call-me"
                className="re-btn-primary re-btn-hero-primary"
                onClick={() => gtag("event", "re_cta_hero_call", { event_category: "real_estate" })}
              >
                Talk to Amy
              </a>
              <Link
                href="/book"
                className="re-btn-secondary"
                onClick={() => gtag("event", "re_cta_hero_demo", { event_category: "real_estate" })}
              >
                Book Your Free Amy Demo
              </Link>
              <a href="#roi-calculator" className="re-btn-ghost">
                See the ROI
              </a>
            </div>
            <p className="re-hero-cta-note">Enter your number and Amy will call you — experience the real thing.</p>
          </motion.div>
          <motion.div
            className="re-hero-demo"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AmyDemoChat />
          </motion.div>
        </section>

        {/* ── Problem ── */}
        <section className="re-section re-problem">
          <div className="re-container">
            <div className="re-illustrative-label">Illustrative Scenario</div>
            <h2 className="re-section-headline re-center">Real Estate Doesn&apos;t Stop<br />When Your Office Does.</h2>
            <p className="re-section-sub">A lead comes in at 11pm. Here&apos;s how the workflow can look — with and without Amy.</p>
            <div className="re-timeline-comparison">
              <div className="re-timeline-col">
                <div className="re-timeline-col-header re-col-without">Without Amy</div>
                {[
                  { time: "11:02 PM", event: "Buyer calls about 123 Main St.", note: "Phone rings. No answer." },
                  { time: "11:03 PM", event: "Voicemail left", note: "Buyer hangs up — leaves a generic message." },
                  { time: "11:04 PM", event: "Zillow inquiry sent too", note: "Buyer isn't sure you got the call." },
                  { time: "7:41 AM", event: "You see the voicemail", note: "8+ hours later. No context on what they want." },
                  { time: "8:15 AM", event: "You call back", note: "No answer. They may have moved on." },
                ].map((row, i) => (
                  <div key={i} className="re-tl-row re-tl-without">
                    <span className="re-tl-time">{row.time}</span>
                    <span className="re-tl-dot re-tl-dot-bad" />
                    <div className="re-tl-content">
                      <span className="re-tl-event">{row.event}</span>
                      <span className="re-tl-note">{row.note}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="re-timeline-col">
                <div className="re-timeline-col-header re-col-with">With Amy</div>
                {[
                  { time: "11:02 PM", event: "Buyer calls about 123 Main St.", note: "Amy answers." },
                  { time: "11:04 PM", event: "Amy qualifies the lead", note: "Budget, timeline, representation — all captured." },
                  { time: "11:06 PM", event: "Showing offered", note: "Friday 11am. Lead says yes." },
                  { time: "11:07 PM", event: "You get a summary", note: "Sarah Johnson · $400–450K · No agent · Friday 11am." },
                  { time: "8:00 AM", event: "You start the day with context", note: "Lead details captured, qualification information collected, next step identified." },
                ].map((row, i) => (
                  <div key={i} className="re-tl-row re-tl-with">
                    <span className="re-tl-time">{row.time}</span>
                    <span className="re-tl-dot re-tl-dot-good" />
                    <div className="re-tl-content">
                      <span className="re-tl-event">{row.event}</span>
                      <span className="re-tl-note">{row.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── What Amy Does ── */}
        <section className="re-section">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">What Amy Does</div>
            <h2 className="re-section-headline re-center">Three Outcomes.<br />One AI Front Desk.</h2>
            <div className="re-cap-groups">
              {[
                {
                  group: "RESPOND",
                  color: "blue",
                  headline: "Be there when inquiries come in",
                  items: [
                    { icon: "📞", title: "Available 24/7", desc: "Amy can respond to incoming calls and inquiries during showings, evenings, weekends, and other times your team is unavailable." },
                    { icon: "🔔", title: "Notify Your Team", desc: "Alerts your team when a lead completes the configured qualification workflow or when an urgent conversation needs attention." },
                  ],
                },
                {
                  group: "QUALIFY",
                  color: "purple",
                  headline: "Know who's worth calling back",
                  items: [
                    { icon: "🎯", title: "Qualify Leads", desc: "Asks the questions that matter — timeline, budget, location, representation — before the lead reaches your desk." },
                    { icon: "📋", title: "Capture Details", desc: "Contact info, intent, and context — structured and ready for your team to act on." },
                    { icon: "🏠", title: "Answer Questions", desc: "Configured to handle common property, pricing, and availability questions using your approved information." },
                  ],
                },
                {
                  group: "MOVE FORWARD",
                  color: "green",
                  headline: "Start with context, not a cold callback.",
                  items: [
                    { icon: "📅", title: "Schedule Showings", desc: "Helps prospects move toward an appointment or showing based on the information captured during the conversation." },
                    { icon: "🔄", title: "Surface Follow-Ups", desc: "Identifies conversations that need follow-up and keeps your team informed on what requires attention." },
                  ],
                },
              ].map((group, gi) => (
                <motion.div
                  key={gi}
                  className={`re-cap-group re-cap-group-${group.color}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: gi * 0.1 }}
                >
                  <div className="re-cap-group-header">
                    <span className={`re-cap-group-label re-cap-group-label-${group.color}`}>{group.group}</span>
                    <h3 className="re-cap-group-headline">{group.headline}</h3>
                  </div>
                  <div className="re-cap-group-items">
                    {group.items.map((item, ii) => (
                      <div key={ii} className="re-cap-item">
                        <span className="re-cap-icon">{item.icon}</span>
                        <div>
                          <h4 className="re-cap-title">{item.title}</h4>
                          <p className="re-cap-desc">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Agent Dashboard ── */}
        <section className="re-section re-dashboard-section">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">What You Receive</div>
            <h2 className="re-section-headline re-center">While Amy Talks to the Lead,<br />You See This.</h2>
            <p className="re-section-sub">Every conversation becomes a structured lead summary — delivered to your team the moment it&apos;s ready.</p>

            <div className="re-dashboard-wrapper">
              <div className="re-dashboard-meta-row">
                <span className="re-dashboard-new-badge">
                  <span className="re-dashboard-dot" />
                  Qualification Complete
                </span>
                <span className="re-dashboard-example-tag">Illustrative example</span>
              </div>

              <motion.div
                className="re-dashboard-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="re-dashboard-header">
                  <div className="re-dashboard-avatar">SJ</div>
                  <div className="re-dashboard-identity">
                    <div className="re-dashboard-name">Sarah Johnson</div>
                    <div className="re-dashboard-type-badge">Buyer</div>
                  </div>
                  <div className="re-dashboard-timestamp">Today · 11:49 PM</div>
                </div>

                <div className="re-dashboard-fields">
                  <div className="re-dashboard-field">
                    <span className="re-df-label">Budget</span>
                    <span className="re-df-value">$400K–$450K</span>
                  </div>
                  <div className="re-dashboard-field">
                    <span className="re-df-label">Timeline</span>
                    <span className="re-df-value">1–3 months</span>
                  </div>
                  <div className="re-dashboard-field">
                    <span className="re-df-label">Location</span>
                    <span className="re-df-value">Houston</span>
                  </div>
                  <div className="re-dashboard-field">
                    <span className="re-df-label">Representation</span>
                    <span className="re-df-value re-df-highlight">None</span>
                  </div>
                  <div className="re-dashboard-field">
                    <span className="re-df-label">Property Interest</span>
                    <span className="re-df-value">123 Main Street</span>
                  </div>
                  <div className="re-dashboard-field">
                    <span className="re-df-label">Showing</span>
                    <span className="re-df-value re-df-green">Friday · 11:00 AM</span>
                  </div>
                </div>

                <div className="re-dashboard-summary">
                  <span className="re-dashboard-summary-label">Conversation Summary</span>
                  <p className="re-dashboard-summary-text">
                    &ldquo;Sarah is looking for a 3-bedroom home in the $400–450K range and wants to move within 90 days. She is not currently represented.&rdquo;
                  </p>
                </div>

                <div className="re-dashboard-actions" aria-hidden="true">
                  <span className="re-dashboard-mockup-note">Illustrative interface</span>
                  <button className="re-dashboard-btn-primary re-dashboard-btn-mockup" disabled tabIndex={-1} style={{ pointerEvents: "none", opacity: 0.45 }}>View Conversation</button>
                  <button className="re-dashboard-btn-secondary re-dashboard-btn-mockup" disabled tabIndex={-1} style={{ pointerEvents: "none", opacity: 0.45 }}>Contact Lead</button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── ROI Calculator ── */}
        <section className="re-section" id="roi-calculator">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">ROI Calculator</div>
            <h2 className="re-section-headline re-center">See What Amy Could Give Back<br />to Your Business</h2>
            <p className="re-section-sub">Use your own numbers to explore an illustrative scenario.</p>
            <ROICalculator />
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="re-section" id="how-it-works">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">How It Works</div>
            <h2 className="re-section-headline re-center">From Your Business<br />to Your Amy</h2>
            <p className="re-section-sub">
              Deployment timeline depends on call volume, integrations, knowledge configuration,
              calendar and CRM setup, testing, and workflow complexity.
            </p>
            <div className="re-steps re-steps-6">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="re-step"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="re-step-num">{step.num}</div>
                  <div className="re-step-content">
                    <h3 className="re-step-title">{step.title}</h3>
                    <p className="re-step-desc">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="re-timeline-note">
              <span className="re-timeline-badge">Typical deployment: 2–4 weeks</span>
              <span className="re-timeline-badge re-timeline-badge-muted">Complex integrations or custom workflows: ~4–6 weeks</span>
            </div>
          </div>
        </section>

        {/* ── Trust ── */}
        <section className="re-section re-trust-section">
          <div className="re-container">
            <h2 className="re-section-headline re-center">Built for Real Estate Professionals</h2>
            <div className="re-trust-grid">
              <div className="re-trust-item">
                <span className="re-trust-icon">🌍</span>
                <h3>Built for Real Estate Teams</h3>
                <p>Built around common U.S. residential and commercial real-estate workflows.</p>
              </div>
              <div className="re-trust-item">
                <span className="re-trust-icon">⚖️</span>
                <h3>Consent-First Design</h3>
                <p>Amy&apos;s demo callback is initiated only after the visitor explicitly requests the call. Outbound workflows are configured around your team&apos;s consent practices.</p>
              </div>
              <div className="re-trust-item">
                <span className="re-trust-icon">🔒</span>
                <h3>Data Privacy</h3>
                <p>
                  We don&apos;t sell your lead data or use your contacts for third-party marketing.{" "}
                  <Link href="/privacy" className="re-trust-link">Privacy Policy →</Link>
                </p>
              </div>
              <div className="re-trust-item">
                <span className="re-trust-icon">🔧</span>
                <h3>Configured for Your Team</h3>
                <p>Amy is configured for your workflows, your listings, and your brand voice — not a one-size-fits-all chatbot.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Custom Setup / Configuration ── */}
        <section className="re-section" id="how-amy-fits">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">Built Around Your Workflow</div>
            <h2 className="re-section-headline re-center">A Setup That Fits<br />the Way Your Team Works</h2>
            <p className="re-section-sub">
              Every real-estate team handles leads differently. We&apos;ll learn how your team currently works,
              identify where Amy can help, and recommend a setup based on your call volume, workflows, and integrations.
            </p>
            <div className="re-config-factors">
              {[
                { icon: "📞", title: "Call Volume", desc: "How many conversations Amy needs to support." },
                { icon: "🔄", title: "Workflow", desc: "How you want inquiries qualified and routed." },
                { icon: "🔧", title: "Integrations", desc: "The systems Amy needs to work with." },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="re-config-factor"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="re-config-icon">{f.icon}</span>
                  <h3 className="re-config-title">{f.title}</h3>
                  <p className="re-config-desc">{f.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="re-config-ctas">
              <Link href="/book" className="re-btn-primary re-config-cta-primary">
                Book Your Free Amy Demo
              </Link>
              <a href="#have-amy-call-me" className="re-btn-secondary re-config-cta-secondary">
                Talk to Amy
              </a>
            </div>
            <p className="re-config-microcopy">See the experience first. We&apos;ll discuss the right setup for your business afterward.</p>
          </div>
        </section>

        {/* ── Have Amy Call Me ── */}
        <section className="re-section re-form-section" id="have-amy-call-me">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">Experience the Real Thing</div>
            <h2 className="re-section-headline re-center">Talk to Amy.</h2>
            <p className="re-section-sub">
              Get a call from Amy — the same AI your leads would speak to. Choose to have her call you now or pick a time that works for you.
            </p>

            {/* Tab switcher */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "32px" }}>
              {[
                { key: "now",      label: "☎ Call Amy Now",       desc: "Request a demo call — Amy typically calls within a few moments" },
                { key: "schedule", label: "📅 Schedule a Callback", desc: "Pick a date and time window" },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAmyTab(tab.key as "now" | "schedule")}
                  style={{
                    padding: "12px 22px",
                    borderRadius: "10px",
                    border: amyTab === tab.key ? "1.5px solid #00d4ff" : "1px solid rgba(255,255,255,0.12)",
                    background: amyTab === tab.key ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.03)",
                    color: amyTab === tab.key ? "#00d4ff" : "rgba(255,255,255,0.5)",
                    fontWeight: 700,
                    fontSize: "13px",
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                  <div style={{ fontSize: "10px", fontWeight: 400, opacity: 0.7, marginTop: "2px" }}>{tab.desc}</div>
                </button>
              ))}
            </div>

            {amyTab === "now" ? (
              callSuccess ? (
                <div className="re-form-success">
                  <span className="re-success-icon">✓</span>
                  <h3>Amy&apos;s call is on the way.</h3>
                  <p>During business hours, expect a call within minutes. Check your email for a confirmation.</p>
                </div>
              ) : (
                <AmyCallForm utm={utm} onSuccess={() => setCallSuccess(true)} />
              )
            ) : (
              scheduleSuccess ? (
                <div className="re-form-success">
                  <span className="re-success-icon">✓</span>
                  <h3>Callback scheduled.</h3>
                  <p>Amy will call you during your selected time window. You&apos;ll receive a confirmation email shortly.</p>
                </div>
              ) : (
                <ScheduleCallbackForm utm={utm} onSuccess={() => setScheduleSuccess(true)} />
              )
            )}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="re-section re-faq-section">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">Common Questions</div>
            <h2 className="re-section-headline re-center">What Teams Ask<br />Before Getting Started</h2>
            <div className="re-faq-list">
              {[
                {
                  q: "Is Amy a real person or an AI?",
                  a: "Amy is an AI voice assistant built by CyberCraft360. She's designed to handle incoming real estate calls naturally and professionally. She does not represent herself as a human to callers who sincerely ask.",
                },
                {
                  q: "What happens when Amy gets a question she can't answer?",
                  a: "Amy is configured with your business information, listings, and approved talking points. For questions outside her scope, she captures the caller's details and flags the conversation for your team to follow up.",
                },
                {
                  q: "How does the Amy call demo work?",
                  a: "When you click \"Have Amy Call Me\" and provide your number, Amy will call you — typically within minutes during business hours. You'll experience the real system, not a simulation.",
                },
                {
                  q: "Do I need to integrate my CRM or calendar?",
                  a: "Integration is part of the setup and configuration process. We work with your team to connect Amy to the tools you already use. The scope depends on your stack and workflow requirements.",
                },
                {
                  q: "How long does setup take?",
                  a: "Typical deployment is 2–4 weeks. More complex integrations, high call volumes, or custom workflows may take approximately 4–6 weeks. We'll give you a specific estimate after the discovery session.",
                },
                {
                  q: "What if I get a lot of leads from Zillow or HAR?",
                  a: "Amy handles inbound phone calls. If your Zillow or HAR leads come in via phone, Amy responds to those calls. Leads that come through web forms go to your CRM or email as usual — Amy handles the conversation once a caller dials your number.",
                },
              ].map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="re-footer">
          <div className="re-container">
            <div className="re-footer-top">
              <div>
                <div className="re-footer-brand-row">
                  <img src="/logo-icon.svg" alt="CyberCraft360" className="re-footer-logo-img" />
                  <span className="re-footer-brand">CyberCraft360</span>
                </div>
                <p className="re-footer-tagline">AI automation for US service businesses.</p>
              </div>
              <div className="re-footer-links">
                <Link href="/">Home</Link>
                <Link href="/book">Book Your Free Amy Demo</Link>
                <Link href="/privacy">Privacy Policy</Link>
                <a href="mailto:info@cybercraft360.com">Contact</a>
              </div>
            </div>
            <div className="re-footer-bottom">
              <span>© {new Date().getFullYear()} CyberCraft360. All rights reserved.</span>
              <span>Houston, TX · info@cybercraft360.com</span>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        /* ── Reset / Base ── */
        .re-page { background: oklch(0.13 0.004 240); color: rgba(255,255,255,0.88); font-family: var(--font-jakarta, 'Space Grotesk', system-ui, sans-serif); min-height: 100vh; }

        /* ── Nav ── */
        .re-nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; border-bottom: 1px solid rgba(255,255,255,0.06); position: sticky; top: 0; background: oklch(0.13 0.004 240 / 0.92); backdrop-filter: blur(12px); z-index: 50; }
        .re-nav-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
        .re-nav-logo-img { height: 32px; width: auto; display: block; }
        .re-nav-logo-text { font-size: 15px; font-weight: 800; color: rgba(255,255,255,0.9); letter-spacing: -0.01em; }
        .re-nav-links { display: flex; align-items: center; gap: 24px; }
        .re-nav-link { color: rgba(255,255,255,0.55); text-decoration: none; font-size: 14px; transition: color .2s; }
        .re-nav-link:hover { color: #fff; }
        .re-nav-cta { background: oklch(0.78 0.13 207); color: #000; font-size: 13px; font-weight: 700; padding: 8px 18px; border-radius: 8px; text-decoration: none; transition: opacity .2s; }
        .re-nav-cta:hover { opacity: 0.85; }

        /* ── Buttons ── */
        .re-btn-primary { display: inline-block; background: oklch(0.78 0.13 207); color: #000; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-decoration: none; transition: opacity .2s, transform .15s; letter-spacing: 0.01em; }
        .re-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .re-btn-hero-primary { font-size: 16px; padding: 15px 32px; box-shadow: 0 0 32px oklch(0.78 0.13 207 / 0.3); }
        .re-btn-secondary { display: inline-block; border: 1.5px solid oklch(0.78 0.13 207); color: oklch(0.78 0.13 207); font-size: 15px; font-weight: 600; padding: 13px 28px; border-radius: 10px; text-decoration: none; transition: all .2s; }
        .re-btn-secondary:hover { background: oklch(0.78 0.13 207 / 0.1); }
        .re-btn-ghost { display: inline-block; color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; padding: 13px 20px; border-radius: 10px; text-decoration: none; transition: color .2s; border: 1px solid rgba(255,255,255,0.12); }
        .re-btn-ghost:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

        /* ── Container ── */
        .re-container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

        /* ── Section ── */
        .re-section { padding: 80px 0; }
        .re-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: oklch(0.78 0.13 207); margin-bottom: 14px; }
        .re-eyebrow-center { text-align: center; }
        .re-section-headline { font-size: clamp(28px, 4vw, 44px); font-weight: 800; line-height: 1.15; margin: 0 0 16px; }
        .re-section-headline.re-center { text-align: center; }
        .re-section-sub { font-size: 17px; color: rgba(255,255,255,0.6); max-width: 560px; margin: 0 auto 48px; text-align: center; line-height: 1.6; }
        .re-headline-accent { color: oklch(0.78 0.13 207); }

        /* ── Hero ── */
        .re-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; padding: 80px 32px 60px; max-width: 1200px; margin: 0 auto; }
        .re-hero-headline { font-size: clamp(32px, 5vw, 54px); font-weight: 900; line-height: 1.1; margin: 0 0 20px; }
        .re-hero-sub { font-size: 17px; color: rgba(255,255,255,0.6); line-height: 1.65; margin-bottom: 10px; max-width: 480px; }
        .re-hero-lead-note { font-size: 14px; color: rgba(255,255,255,0.38); line-height: 1.6; margin-bottom: 28px; max-width: 480px; }
        .re-hero-ctas { display: flex; flex-wrap: wrap; gap: 12px; }
        .re-hero-cta-note { font-size: 13px; color: rgba(255,255,255,0.3); margin-top: 12px; }
        .re-hero-demo { display: flex; justify-content: center; }

        /* ── Amy Chat ── */
        .re-chat-container { background: oklch(0.16 0.008 240); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; width: 100%; max-width: 420px; }
        .re-chat-header { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .re-chat-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, oklch(0.78 0.13 207), #7c3aed); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #000; flex-shrink: 0; }
        .re-chat-name { font-size: 14px; font-weight: 700; }
        .re-chat-status { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,0.4); }
        .re-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; display: inline-block; }
        .re-chat-time { margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.3); }
        .re-chat-messages { padding: 16px; min-height: 220px; display: flex; flex-direction: column; gap: 10px; max-height: 340px; overflow-y: auto; }
        .re-chat-bubble { max-width: 88%; }
        .re-bubble-amy { align-self: flex-start; }
        .re-bubble-caller { align-self: flex-end; }
        .re-bubble-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 4px; }
        .re-label-caller { text-align: right; }
        .re-chat-bubble p { margin: 0; font-size: 13.5px; line-height: 1.5; padding: 10px 14px; border-radius: 12px; }
        .re-bubble-amy p { background: rgba(255,255,255,0.07); border-radius: 4px 12px 12px 12px; }
        .re-bubble-caller p { background: oklch(0.78 0.13 207 / 0.18); border-radius: 12px 4px 12px 12px; color: rgba(255,255,255,0.9); }
        .re-typing-indicator { display: flex; gap: 5px; padding: 10px 14px; background: rgba(255,255,255,0.07); border-radius: 4px 12px 12px 12px; width: fit-content; }
        .re-typing-indicator span { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.35); animation: typing 1.2s infinite; }
        .re-typing-indicator span:nth-child(2) { animation-delay: .2s; }
        .re-typing-indicator span:nth-child(3) { animation-delay: .4s; }
        @keyframes typing { 0%,60%,100% { opacity:.35; transform: translateY(0); } 30% { opacity:1; transform: translateY(-4px); } }
        .re-chat-placeholder { display: flex; align-items: center; justify-content: center; height: 180px; color: rgba(255,255,255,0.2); font-size: 14px; text-align: center; }
        .re-demo-btn { display: block; width: 100%; padding: 14px; background: oklch(0.78 0.13 207 / 0.15); border: none; border-top: 1px solid rgba(255,255,255,0.07); color: oklch(0.78 0.13 207); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; }
        .re-demo-btn:hover:not(:disabled) { background: oklch(0.78 0.13 207 / 0.25); }
        .re-demo-btn:disabled { opacity: 0.5; cursor: default; }

        /* ── Workflow summary bar ── */
        .re-workflow-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 10px 14px; background: rgba(34,197,94,0.06); border-top: 1px solid rgba(34,197,94,0.15); }
        .re-workflow-step { display: flex; align-items: center; gap: 4px; font-size: 11px; color: rgba(34,197,94,0.85); white-space: nowrap; }
        .re-workflow-icon { font-size: 12px; }
        .re-workflow-label { font-weight: 600; letter-spacing: 0.03em; }
        .re-workflow-arrow { color: rgba(255,255,255,0.2); font-size: 14px; margin-left: 2px; }

        /* ── Problem / Timeline ── */
        .re-problem { background: oklch(0.15 0.006 240); }
        .re-timeline-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 48px; }
        .re-timeline-col { background: oklch(0.17 0.008 240); border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
        .re-timeline-col-header { padding: 14px 20px; font-size: 11px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
        .re-col-without { background: rgba(255,60,60,0.08); color: rgba(255,100,100,0.8); border-bottom: 1px solid rgba(255,60,60,0.15); }
        .re-col-with { background: rgba(0,212,130,0.07); color: rgba(34,197,94,0.9); border-bottom: 1px solid rgba(34,197,94,0.15); }
        .re-tl-row { display: grid; grid-template-columns: 76px 12px 1fr; align-items: start; gap: 10px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .re-tl-row:last-child { border-bottom: none; }
        .re-tl-time { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); font-variant-numeric: tabular-nums; padding-top: 2px; }
        .re-tl-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 3px; flex-shrink: 0; }
        .re-tl-dot-bad { background: rgba(255,80,80,0.7); box-shadow: 0 0 6px rgba(255,80,80,0.4); }
        .re-tl-dot-good { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,0.5); }
        .re-tl-content { display: flex; flex-direction: column; gap: 3px; }
        .re-tl-event { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); line-height: 1.3; }
        .re-tl-note { font-size: 12px; color: rgba(255,255,255,0.35); line-height: 1.4; }

        /* ── Capabilities ── */
        .re-cap-groups { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 48px; }
        .re-cap-group { border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
        .re-cap-group-blue { border-color: oklch(0.78 0.13 207 / 0.25); }
        .re-cap-group-purple { border-color: rgba(124,58,237,0.3); }
        .re-cap-group-green { border-color: rgba(34,197,94,0.25); }
        .re-cap-group-header { padding: 20px 22px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); background: oklch(0.16 0.007 240); }
        .re-cap-group-label { display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; border-radius: 4px; padding: 3px 8px; margin-bottom: 8px; }
        .re-cap-group-label-blue { color: oklch(0.78 0.13 207); background: oklch(0.78 0.13 207 / 0.12); }
        .re-cap-group-label-purple { color: rgb(167,139,250); background: rgba(124,58,237,0.15); }
        .re-cap-group-label-green { color: #22c55e; background: rgba(34,197,94,0.1); }
        .re-cap-group-headline { font-size: 15px; font-weight: 700; margin: 0; color: rgba(255,255,255,0.85); }
        .re-cap-group-items { display: flex; flex-direction: column; gap: 0; background: oklch(0.155 0.006 240); }
        .re-cap-item { display: flex; gap: 14px; align-items: flex-start; padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .re-cap-item:last-child { border-bottom: none; }
        .re-cap-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
        .re-cap-title { font-size: 14px; font-weight: 700; margin: 0 0 4px; }
        .re-cap-desc { font-size: 13px; color: rgba(255,255,255,0.45); margin: 0; line-height: 1.5; }

        /* ── Agent Dashboard ── */
        .re-dashboard-section { background: oklch(0.15 0.006 240); }
        .re-dashboard-wrapper { max-width: 640px; margin: 0 auto; }
        .re-dashboard-meta-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .re-dashboard-new-badge { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; color: #22c55e; letter-spacing: 0.05em; text-transform: uppercase; }
        .re-dashboard-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse-dot 2s infinite; flex-shrink: 0; }
        @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .re-dashboard-example-tag { font-size: 11px; color: rgba(255,190,0,0.6); background: rgba(255,190,0,0.07); border: 1px solid rgba(255,190,0,0.2); border-radius: 5px; padding: 3px 9px; font-weight: 600; letter-spacing: 0.05em; }
        .re-dashboard-card { background: oklch(0.17 0.008 240); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.4); }
        .re-dashboard-header { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .re-dashboard-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, oklch(0.78 0.13 207 / 0.4), #7c3aed50); border: 2px solid oklch(0.78 0.13 207 / 0.3); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: oklch(0.78 0.13 207); flex-shrink: 0; }
        .re-dashboard-identity { flex: 1; }
        .re-dashboard-name { font-size: 17px; font-weight: 700; color: #fff; }
        .re-dashboard-type-badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: oklch(0.78 0.13 207); background: oklch(0.78 0.13 207 / 0.1); border-radius: 4px; padding: 2px 8px; margin-top: 4px; }
        .re-dashboard-timestamp { font-size: 12px; color: rgba(255,255,255,0.25); margin-left: auto; white-space: nowrap; }
        .re-dashboard-fields { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .re-dashboard-field { padding: 14px 20px; border-right: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .re-dashboard-field:nth-child(3n) { border-right: none; }
        .re-df-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 4px; }
        .re-df-value { display: block; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.85); }
        .re-df-highlight { color: oklch(0.78 0.13 207); }
        .re-df-green { color: #22c55e; }
        .re-dashboard-summary { padding: 18px 24px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .re-dashboard-summary-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-bottom: 8px; }
        .re-dashboard-summary-text { font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.6; margin: 0; font-style: italic; }
        .re-dashboard-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 12px 24px 16px; }
        .re-dashboard-mockup-note { font-size: 10px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,0.2); width: 100%; }
        .re-dashboard-btn-primary { background: oklch(0.78 0.13 207); color: #000; font-size: 13px; font-weight: 700; border: none; border-radius: 8px; padding: 10px 18px; cursor: not-allowed; opacity: 0.9; font-family: inherit; }
        .re-dashboard-btn-secondary { background: transparent; color: rgba(255,255,255,0.55); font-size: 13px; font-weight: 600; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 18px; cursor: not-allowed; font-family: inherit; }

        /* ── Before/After ── */
        .re-ba-section { background: oklch(0.15 0.006 240); }
        .re-ba-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 32px; align-items: start; margin-top: 48px; }
        .re-ba-col { background: oklch(0.18 0.008 240); border-radius: 14px; padding: 28px; border: 1px solid rgba(255,255,255,0.07); }
        .re-ba-after { border-color: oklch(0.78 0.13 207 / 0.3); }
        .re-ba-label { font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,100,100,0.7); margin-bottom: 20px; }
        .re-ba-label-after { color: oklch(0.78 0.13 207); }
        .re-ba-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px; font-size: 14px; line-height: 1.45; color: rgba(255,255,255,0.7); }
        .re-ba-x { color: rgba(255,80,80,0.7); flex-shrink: 0; font-weight: 700; }
        .re-ba-check { color: #22c55e; flex-shrink: 0; font-weight: 700; }
        .re-ba-divider { font-size: 28px; color: rgba(255,255,255,0.15); display: flex; align-items: center; padding-top: 40px; }

        /* ── Use Cases ── */
        .re-usecase-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 48px; }
        .re-usecase-card { background: oklch(0.16 0.007 240); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 22px 18px; transition: border-color .2s; }
        .re-usecase-card:hover { border-color: oklch(0.78 0.13 207 / 0.3); }
        .re-usecase-title { font-size: 14px; font-weight: 700; margin: 0 0 8px; color: oklch(0.78 0.13 207); }
        .re-usecase-desc { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.5; }

        /* ── ROI Calculator ── */
        .re-roi-wrapper { max-width: 860px; margin: 0 auto; }
        .re-roi-disclaimer { display: flex; gap: 12px; background: rgba(255,190,0,0.07); border: 1px solid rgba(255,190,0,0.25); border-radius: 10px; padding: 14px 18px; font-size: 13px; color: rgba(255,190,0,0.85); line-height: 1.5; margin-bottom: 32px; }
        .re-disclaimer-icon { flex-shrink: 0; font-size: 16px; }
        .re-roi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .re-roi-inputs { display: flex; flex-direction: column; gap: 24px; }
        .re-roi-label { display: flex; flex-direction: column; gap: 8px; font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.7); }
        .re-roi-label-sm { font-size: 13px; }
        .re-preset-btns { display: flex; gap: 6px; flex-wrap: wrap; }
        .re-preset-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 600; padding: 5px 10px; cursor: pointer; transition: all .15s; font-family: inherit; }
        .re-preset-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
        .re-preset-btn-active { background: oklch(0.78 0.13 207 / 0.2); border-color: oklch(0.78 0.13 207 / 0.5); color: oklch(0.78 0.13 207); }
        .re-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.15); outline: none; cursor: pointer; }
        .re-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: oklch(0.78 0.13 207); cursor: pointer; box-shadow: 0 0 0 3px oklch(0.78 0.13 207 / 0.2); }
        .re-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: oklch(0.78 0.13 207); cursor: pointer; border: none; }
        .re-range::-moz-range-track { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.15); }
        .re-range:focus-visible { outline: 2px solid oklch(0.78 0.13 207); outline-offset: 4px; }
        .re-range-val { font-size: 20px; font-weight: 800; color: oklch(0.78 0.13 207); }
        .re-range-val-sm { font-size: 16px; }
        .re-roi-results { display: flex; flex-direction: column; gap: 16px; justify-content: flex-start; }
        .re-roi-tile { background: oklch(0.16 0.007 240); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 22px 24px; text-align: center; }
        .re-roi-tile-primary { border-color: rgba(255,255,255,0.12); }
        .re-roi-tile-accent { border-color: oklch(0.78 0.13 207 / 0.4); background: oklch(0.78 0.13 207 / 0.07); }
        .re-roi-tile-revenue { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.05); margin-top: 8px; }
        .re-roi-tile-eyebrow { display: block; font-size: 10px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 8px; }
        .re-roi-tile-val { display: block; font-size: 48px; font-weight: 900; color: oklch(0.78 0.13 207); font-variant-numeric: tabular-nums; line-height: 1; }
        .re-roi-tile-val-sm { font-size: 36px; color: #22c55e; }
        .re-roi-tile-label { display: block; font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 6px; line-height: 1.4; }
        .re-roi-caveat { font-size: 11px; color: rgba(255,190,0,0.6); line-height: 1.5; border: 1px solid rgba(255,190,0,0.15); border-radius: 8px; padding: 10px 14px; margin: 0; }
        .re-revenue-toggle { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 600; cursor: pointer; padding: 4px 0; font-family: inherit; transition: color .2s; text-align: left; }
        .re-revenue-toggle:hover { color: rgba(255,255,255,0.7); }
        .re-revenue-section { display: flex; flex-direction: column; gap: 14px; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; }
        .re-methodology-toggle { margin-top: 24px; background: none; border: none; color: rgba(255,255,255,0.35); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; font-family: inherit; transition: color .2s; }
        .re-methodology-toggle:hover { color: rgba(255,255,255,0.6); }
        .re-methodology-body { margin-top: 12px; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }
        .re-methodology-body p { margin: 0 0 10px; }
        .re-methodology-body strong { color: rgba(255,255,255,0.65); }

        /* ── How It Works / Steps ── */
        .re-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 48px; }
        .re-steps-5 { grid-template-columns: repeat(5, 1fr); }
        .re-steps-6 { grid-template-columns: repeat(6, 1fr); }
        .re-step { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }
        .re-step-num { width: 44px; height: 44px; border-radius: 50%; background: oklch(0.78 0.13 207 / 0.15); border: 2px solid oklch(0.78 0.13 207 / 0.5); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: oklch(0.78 0.13 207); flex-shrink: 0; }
        .re-step-title { font-size: 18px; font-weight: 700; margin: 0 0 6px; }
        .re-step-desc { font-size: 14px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.55; }
        .re-timeline-note { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 40px; }
        .re-timeline-badge { font-size: 13px; font-weight: 600; padding: 8px 16px; border-radius: 8px; background: oklch(0.78 0.13 207 / 0.1); border: 1px solid oklch(0.78 0.13 207 / 0.3); color: oklch(0.78 0.13 207); }
        .re-timeline-badge-muted { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); }

        /* ── Trust ── */
        .re-trust-section { background: oklch(0.15 0.006 240); }
        .re-trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 48px; }
        .re-trust-item { padding: 24px; background: oklch(0.18 0.008 240); border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); }
        .re-trust-icon { font-size: 28px; display: block; margin-bottom: 12px; }
        .re-trust-item h3 { font-size: 15px; font-weight: 700; margin: 0 0 8px; }
        .re-trust-item p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.55; }
        .re-trust-link { color: oklch(0.78 0.13 207); text-decoration: none; font-weight: 600; }
        .re-trust-link:hover { text-decoration: underline; }

        /* ── Pricing ── */
        .re-pricing-container { text-align: center; }
        .re-pricing-card { max-width: 480px; margin: 48px auto 0; background: oklch(0.16 0.007 240); border: 1px solid oklch(0.78 0.13 207 / 0.4); border-radius: 18px; padding: 36px; }
        .re-pricing-badge { display: inline-block; background: oklch(0.78 0.13 207 / 0.15); color: oklch(0.78 0.13 207); font-size: 11px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; border-radius: 6px; padding: 5px 12px; margin-bottom: 20px; }
        .re-pricing-from { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
        .re-pricing-price { font-size: 52px; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 16px; }
        .re-pricing-price span { font-size: 22px; color: rgba(255,255,255,0.4); font-weight: 500; }
        .re-pricing-note { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.6; margin-bottom: 24px; }
        .re-pricing-features { list-style: none; padding: 0; margin: 0 0 32px; display: flex; flex-direction: column; gap: 10px; text-align: left; }
        .re-pricing-features li { font-size: 14px; color: rgba(255,255,255,0.7); }
        .re-pricing-cta { display: inline-block; }

        /* ── Form ── */
        .re-form-section { background: oklch(0.15 0.006 240); }
        .re-form-tabs { display: flex; gap: 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; max-width: 360px; margin: 0 auto 32px; }
        .re-tab { flex: 1; padding: 11px 20px; background: transparent; border: none; color: rgba(255,255,255,0.45); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; }
        .re-tab-active { background: oklch(0.78 0.13 207 / 0.15); color: oklch(0.78 0.13 207); }
        .re-form { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }
        .re-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .re-input { background: oklch(0.18 0.008 240); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 14px; color: #fff; font-size: 14px; outline: none; transition: border-color .2s; width: 100%; box-sizing: border-box; font-family: inherit; }
        .re-input:focus { border-color: oklch(0.78 0.13 207 / 0.6); }
        .re-input::placeholder { color: rgba(255,255,255,0.25); }
        .re-select { cursor: pointer; color-scheme: dark; }
        .re-select option { background: #1a1d2a; color: #fff; }
        .re-full { width: 100%; }
        .re-textarea { resize: vertical; }
        .re-consent-label { display: flex; gap: 10px; align-items: flex-start; font-size: 12.5px; color: rgba(255,255,255,0.45); line-height: 1.55; cursor: pointer; }
        .re-checkbox { width: 16px; height: 16px; flex-shrink: 0; accent-color: oklch(0.78 0.13 207); margin-top: 2px; cursor: pointer; }
        .re-form-error { font-size: 13px; color: rgba(255,80,80,0.85); }
        .re-submit-btn { background: oklch(0.78 0.13 207); color: #000; font-size: 15px; font-weight: 700; border: none; border-radius: 10px; padding: 14px 24px; cursor: pointer; transition: opacity .2s; letter-spacing: 0.01em; font-family: inherit; }
        .re-submit-btn:hover:not(:disabled) { opacity: 0.88; }
        .re-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .re-form-note { font-size: 12px; color: rgba(255,255,255,0.25); text-align: center; margin: 0; }
        .re-form-note-alt { margin-top: 6px; color: rgba(255,255,255,0.3); }
        .re-form-success { max-width: 560px; margin: 0 auto; text-align: center; padding: 48px 24px; background: oklch(0.78 0.13 207 / 0.06); border: 1px solid oklch(0.78 0.13 207 / 0.2); border-radius: 14px; }
        .re-success-icon { display: block; font-size: 36px; margin-bottom: 16px; color: #22c55e; }
        .re-form-success h3 { font-size: 22px; font-weight: 700; margin: 0 0 10px; }
        .re-form-success p { font-size: 15px; color: rgba(255,255,255,0.5); margin: 0; }

        /* ── FAQ ── */
        .re-faq-section { background: oklch(0.15 0.006 240); }
        .re-faq-list { max-width: 720px; margin: 48px auto 0; display: flex; flex-direction: column; gap: 0; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
        .re-faq-item { border-bottom: 1px solid rgba(255,255,255,0.06); }
        .re-faq-item:last-child { border-bottom: none; }
        .re-faq-q { width: 100%; background: none; border: none; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; text-align: left; font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.85); cursor: pointer; font-family: inherit; transition: background .15s; }
        .re-faq-q:hover { background: rgba(255,255,255,0.03); }
        .re-faq-chevron { font-size: 20px; font-weight: 300; color: oklch(0.78 0.13 207); flex-shrink: 0; }
        .re-faq-a { padding: 0 24px 20px; font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.65; }
        .re-faq-open .re-faq-q { color: #fff; background: rgba(255,255,255,0.02); }

        /* ── Footer ── */
        .re-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 40px 0; }
        .re-footer-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .re-footer-brand-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .re-footer-logo-img { height: 24px; width: auto; }
        .re-footer-brand { font-size: 15px; font-weight: 800; color: rgba(255,255,255,0.85); }
        .re-footer-tagline { font-size: 13px; color: rgba(255,255,255,0.3); margin: 0; }
        .re-footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
        .re-footer-links a { font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none; transition: color .2s; }
        .re-footer-links a:hover { color: #fff; }
        .re-footer-bottom { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.2); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; }

        /* ── Illustrative label ── */
        .re-illustrative-label { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 3px 10px; margin: 0 auto 20px; display: block; width: fit-content; }

        /* ── Video placeholder ── */
        .re-video-placeholder-section { background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .re-video-placeholder { border: 1.5px dashed rgba(255,255,255,0.12); border-radius: 14px; max-width: 640px; margin: 0 auto; overflow: hidden; background: rgba(255,255,255,0.02); }
        .re-video-placeholder-inner { padding: 56px 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; }
        .re-video-play-icon { width: 56px; height: 56px; border-radius: 50%; border: 2px solid rgba(0,212,255,0.35); display: flex; align-items: center; justify-content: center; font-size: 20px; color: rgba(0,212,255,0.5); }
        .re-video-placeholder-label { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.35); margin: 0; }
        .re-video-placeholder-sub { font-size: 12px; color: rgba(255,255,255,0.2); margin: 0; }

        /* ── Config factors ── */
        .re-config-factors { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 40px 0 36px; }
        .re-config-factor { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 28px 24px; text-align: center; }
        .re-config-icon { font-size: 28px; display: block; margin-bottom: 12px; }
        .re-config-title { font-size: 15px; font-weight: 700; color: #fff; margin: 0 0 8px; }
        .re-config-desc { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin: 0; }
        .re-config-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; }
        .re-config-cta-primary { text-decoration: none; }
        .re-config-cta-secondary { text-decoration: none; }
        .re-config-microcopy { text-align: center; font-size: 13px; color: rgba(255,255,255,0.3); margin: 0; }

        /* ── ROI helper text ── */
        .re-roi-helper { display: block; font-size: 11px; color: rgba(255,255,255,0.35); margin: 4px 0 8px; font-style: italic; }

        /* ── Mobile ── */
        @media (max-width: 900px) {
          .re-hero { grid-template-columns: 1fr; padding: 48px 20px 32px; }
          .re-hero-demo { order: -1; }
          .re-chat-container { max-width: 100%; }
          .re-timeline-comparison { grid-template-columns: 1fr; }
          .re-cap-groups { grid-template-columns: 1fr; }
          .re-trust-grid { grid-template-columns: 1fr 1fr; }
          .re-usecase-grid { grid-template-columns: 1fr 1fr; }
          .re-ba-grid { grid-template-columns: 1fr; }
          .re-ba-divider { display: none; }
          .re-steps, .re-steps-5, .re-steps-6 { grid-template-columns: repeat(3, 1fr); }
          .re-roi-grid { grid-template-columns: 1fr; }
          .re-nav-links .re-nav-link { display: none; }
          .re-dashboard-fields { grid-template-columns: 1fr 1fr; }
          .re-dashboard-field:nth-child(3n) { border-right: 1px solid rgba(255,255,255,0.05); }
          .re-dashboard-field:nth-child(2n) { border-right: none; }
        }
        @media (max-width: 600px) {
          .re-section { padding: 56px 0; }
          .re-trust-grid, .re-steps, .re-steps-5, .re-steps-6 { grid-template-columns: 1fr 1fr; }
          .re-usecase-grid { grid-template-columns: 1fr; }
          .re-form-row { grid-template-columns: 1fr; }
          .re-config-factors { grid-template-columns: 1fr; }
          .re-footer-top { flex-direction: column; gap: 20px; }
          .re-footer-bottom { flex-direction: column; gap: 8px; }
          .re-nav { padding: 14px 18px; }
          .re-hero-headline { font-size: 30px; }
          .re-dashboard-fields { grid-template-columns: 1fr 1fr; }
          .re-workflow-bar { gap: 3px; }
          .re-workflow-label { display: none; }
          .re-timeline-note { flex-direction: column; align-items: center; }
          .re-tl-row { grid-template-columns: 60px 10px 1fr; gap: 8px; padding: 12px 14px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </>
  );
}
