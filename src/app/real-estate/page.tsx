"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
            <p>See how Amy handles an 11pm inquiry from a qualified buyer.</p>
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

// ─── ROI Calculator ───────────────────────────────────────────────────────────
function ROICalculator() {
  const [leads, setLeads] = useState(50);
  const [convRate, setConvRate] = useState(5);
  const [commission, setCommission] = useState(8000);
  const [delayedRate, setDelayedRate] = useState(30);
  const [assistRate, setAssistRate] = useState(50);
  const [showMethod, setShowMethod] = useState(false);

  const opportunityLeads = Math.round(leads * (delayedRate / 100));
  const amyAssisted = Math.round(opportunityLeads * (assistRate / 100));
  const additionalRevenue = Math.round(amyAssisted * (convRate / 100) * commission);

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `$${n}`;

  return (
    <div className="re-roi-wrapper">
      <div className="re-roi-disclaimer">
        <span className="re-disclaimer-icon">⚠</span>
        <span>
          Illustrative scenario based entirely on the assumptions you enter below. Adjust the inputs to model different outcomes for your business.
          This calculator does not predict actual revenue or guarantee results.
        </span>
      </div>

      <div className="re-roi-grid">
        <div className="re-roi-inputs">
          <label className="re-roi-label" htmlFor="roi-leads">
            Monthly leads received
            <input
              id="roi-leads"
              type="range" min={10} max={500} step={5} value={leads}
              onChange={e => setLeads(+e.target.value)}
              className="re-range"
              aria-label="Monthly leads received"
            />
            <span className="re-range-val">{leads} leads/mo</span>
          </label>

          <label className="re-roi-label" htmlFor="roi-delayed">
            % of leads that receive delayed or no response
            <input
              id="roi-delayed"
              type="range" min={5} max={80} step={5} value={delayedRate}
              onChange={e => setDelayedRate(+e.target.value)}
              className="re-range"
              aria-label="Percentage of leads with delayed or no response"
            />
            <span className="re-range-val">{delayedRate}% of leads</span>
          </label>

          <label className="re-roi-label" htmlFor="roi-assist">
            % of those leads Amy could help engage
            <input
              id="roi-assist"
              type="range" min={10} max={90} step={5} value={assistRate}
              onChange={e => setAssistRate(+e.target.value)}
              className="re-range"
              aria-label="Percentage of delayed leads Amy could assist"
            />
            <span className="re-range-val">{assistRate}% assisted</span>
          </label>

          <label className="re-roi-label" htmlFor="roi-conv">
            Your current close rate
            <input
              id="roi-conv"
              type="range" min={1} max={30} step={0.5} value={convRate}
              onChange={e => setConvRate(+e.target.value)}
              className="re-range"
              aria-label="Current close rate"
            />
            <span className="re-range-val">{convRate}%</span>
          </label>

          <label className="re-roi-label" htmlFor="roi-commission">
            Average commission per closing
            <input
              id="roi-commission"
              type="range" min={2000} max={50000} step={500} value={commission}
              onChange={e => setCommission(+e.target.value)}
              className="re-range"
              aria-label="Average commission per closing"
            />
            <span className="re-range-val">{fmt(commission)}</span>
          </label>
        </div>

        <div className="re-roi-results">
          <div className="re-roi-tile">
            <span className="re-roi-tile-val">{amyAssisted}</span>
            <span className="re-roi-tile-label">Additional leads<br />Amy could assist per month</span>
          </div>
          <div className="re-roi-tile re-roi-tile-accent">
            <span className="re-roi-tile-val">{fmt(additionalRevenue)}</span>
            <span className="re-roi-tile-label">Illustrative additional<br />revenue per month</span>
          </div>
          <p className="re-roi-caveat">
            All numbers are illustrative and based entirely on your inputs — not a forecast or guarantee of any kind.
          </p>
        </div>
      </div>

      <button
        className="re-methodology-toggle"
        onClick={() => setShowMethod(v => !v)}
        aria-expanded={showMethod}
      >
        {showMethod ? "▾" : "▸"} How is this calculated?
      </button>
      {showMethod && (
        <div className="re-methodology-body">
          <p>The calculator uses only the five assumptions you enter:</p>
          <ol>
            <li><strong>Opportunity leads</strong> = Monthly leads × % with delayed/no response</li>
            <li><strong>Leads Amy assists</strong> = Opportunity leads × % Amy could engage</li>
            <li><strong>Additional closings</strong> = Leads Amy assists × your close rate</li>
            <li><strong>Illustrative revenue</strong> = Additional closings × average commission</li>
          </ol>
          <p>
            This is not a prediction, a projection, or a representation of CyberCraft360 customer results.
            The calculator does not guarantee additional closings or revenue. Actual outcomes depend on your specific market,
            lead quality, follow-up execution, and many other factors outside any system's control.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Lead form ────────────────────────────────────────────────────────────────
function LeadForm({ source, utm, onSuccess }: { source: "talk-to-amy" | "callback" | "demo"; utm: Record<string, string>; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");
  const [callbackConsent, setCallbackConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) { setError("Name and email are required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/real-estate/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, role, interest, message, callbackConsent, source, utm }),
      });
      if (!res.ok) {
        let errMsg = "Something went wrong. Please try again.";
        try {
          const d = await res.json();
          if (d.error) errMsg = d.error;
        } catch { /* response was not JSON — use default message */ }
        throw new Error(errMsg);
      }
      gtag("event", "re_lead_submitted", { event_category: "real_estate", source });
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
        <input className="re-input" type="tel" placeholder="Phone number" aria-label="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
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
        <option value="">What&apos;s your biggest lead-handling challenge?</option>
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
        placeholder="Tell us more about your current lead process or what you&apos;d like Amy to help with (optional)"
        aria-label="Tell us more"
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={3}
      />

      {source === "callback" && (
        <label className="re-consent-label">
          <input type="checkbox" checked={callbackConsent} onChange={e => setCallbackConsent(e.target.checked)} className="re-checkbox" />
          <span>
            I&apos;d like CyberCraft360 to contact me by phone. By checking this box you consent to receiving a call from our team.
            You may opt out at any time.
          </span>
        </label>
      )}

      {error && <p className="re-form-error">{error}</p>}

      <button type="submit" className="re-submit-btn" disabled={loading}>
        {loading ? "Sending..." : source === "callback" ? "Request Callback" : "Talk to Amy →"}
      </button>
      <p className="re-form-note">No spam. No obligation. We&apos;ll respond within minutes during business hours.</p>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RealEstatePage() {
  const utm = useUTM();
  const [talkFormSuccess, setTalkFormSuccess] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"talk" | "callback">("talk");

  useEffect(() => {
    gtag("event", "re_page_view", {
      event_category: "real_estate",
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
    });
  }, [utm]);

  const capabilities = [
    {
      icon: "📞",
      title: "Respond Instantly",
      desc: "Responds to incoming calls and inquiries 24/7, including when your team is unavailable.",
    },
    {
      icon: "🎯",
      title: "Qualify Leads",
      desc: "Asks the questions your team needs to understand buyer and seller intent — timeline, budget, location, representation.",
    },
    {
      icon: "🏠",
      title: "Answer Questions",
      desc: "Can be configured to answer common property, pricing, and availability questions using approved business and listing information.",
    },
    {
      icon: "📋",
      title: "Capture Details",
      desc: "Captures contact details, timeline, budget, and other information your team needs — structured and ready to act on.",
    },
    {
      icon: "📅",
      title: "Schedule Showings",
      desc: "Helps qualified prospects move toward an appointment or showing without unnecessary back-and-forth.",
    },
    {
      icon: "🔄",
      title: "Follow Up",
      desc: "Can help identify follow-up opportunities and keep your team informed on conversations that need attention.",
    },
    {
      icon: "🔔",
      title: "Notify Your Team",
      desc: "Alerts your team when a conversation requires attention or a qualified lead has been identified.",
    },
  ];

  const useCases = [
    { title: "Buyer Leads", desc: "Qualify buyers on timeline, budget, and location before they ever reach your desk." },
    { title: "Seller Leads", desc: "Capture property details and seller motivation for a warm hand-off to your team." },
    { title: "Property Inquiries", desc: "Respond to questions about listing details, neighborhood, and pricing at any hour." },
    { title: "Showing Requests", desc: "Help qualified prospects schedule showings without manual back-and-forth." },
    { title: "Open House Follow-Up", desc: "Re-engage open house visitors promptly after the event." },
    { title: "After-Hours Inquiries", desc: "The 11pm Zillow inquiry gets a real, structured response — not a form or voicemail." },
    { title: "Lead Qualification", desc: "Gather buying timeline, pre-approval status, and motivation before your agent calls back." },
    { title: "Appointment Requests", desc: "Handle inbound appointment requests and guide prospects toward a scheduled time." },
    { title: "AI Lead Follow-Up", desc: "Keep conversations moving when prospects don't respond immediately. Amy can help identify follow-up opportunities and keep your team informed." },
  ];

  const steps = [
    {
      num: "1",
      title: "Connect",
      desc: "Connect your phone, calendar, CRM, and any other systems your team relies on.",
    },
    {
      num: "2",
      title: "Configure",
      desc: "Amy is configured around your business, team, workflows, listings, and brand voice — not a generic template.",
    },
    {
      num: "3",
      title: "Test",
      desc: "We run structured conversations and workflow tests before anything goes live.",
    },
    {
      num: "4",
      title: "Launch",
      desc: "Go live after configuration, testing, and your approval.",
    },
    {
      num: "5",
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
            <span className="re-logo-cc">CC</span>
            <span className="re-logo-360">360</span>
          </Link>
          <div className="re-nav-links">
            <a href="#how-it-works" className="re-nav-link">How It Works</a>
            <a href="#pricing" className="re-nav-link">Pricing</a>
            <a href="#talk-to-amy" className="re-nav-link">Talk to Amy</a>
            <Link href="/book" className="re-nav-cta">Book Demo</Link>
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
              Never Let Another<br />
              <span className="re-headline-accent">Real Estate Lead</span><br />
              Go Unanswered.
            </h1>
            <p className="re-hero-sub">
              Amy responds to calls and inquiries, qualifies prospects, and helps schedule showings — day and night. Built specifically for real estate teams.
            </p>
            <p className="re-hero-lead-note">
              Leads arrive from Zillow, HAR, Realtor.com, your website, and social media. Amy helps you handle every opportunity — so nothing waits.
            </p>
            <div className="re-hero-ctas">
              <a
                href="#talk-to-amy"
                className="re-btn-primary re-btn-hero-primary"
                onClick={() => gtag("event", "re_cta_hero_talk", { event_category: "real_estate" })}
              >
                Talk to Amy — Try It Live
              </a>
              <Link
                href="/book"
                className="re-btn-secondary"
                onClick={() => gtag("event", "re_cta_hero_demo", { event_category: "real_estate" })}
              >
                Book a Free Demo
              </Link>
              <a href="#roi-calculator" className="re-btn-ghost">
                Calculate Your ROI
              </a>
            </div>
            <p className="re-hero-cta-note">See what your leads would experience before you commit.</p>
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
            <h2 className="re-section-headline">Real Estate Doesn&apos;t Stop<br />When Your Office Does.</h2>
            <p className="re-section-sub">Leads come in at 10pm. Buyers call during your showing. Sellers want answers on Sunday morning.</p>
            <div className="re-problem-grid">
              {[
                { icon: "📵", prob: "Missed call at 11pm", outcome: "Lead may call another agent instead." },
                { icon: "📭", prob: "Voicemail unanswered for 6 hours", outcome: "A buyer may have moved on before you reply." },
                { icon: "📋", prob: "Showing request comes in during an open house", outcome: "A showing request can get buried in the inbox." },
                { icon: "🏃", prob: "New inquiry while you&apos;re with another client", outcome: "A new inquiry can sit unanswered until you&apos;re free." },
              ].map((item, i) => (
                <div key={i} className="re-problem-card">
                  <span className="re-problem-icon">{item.icon}</span>
                  <p className="re-problem-text">{item.prob}</p>
                  <div className="re-problem-arrow">→</div>
                  <p className="re-problem-outcome">{item.outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What Amy Does ── */}
        <section className="re-section">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">What Amy Does</div>
            <h2 className="re-section-headline re-center">Seven Things Amy Handles<br />So You Don&apos;t Have To</h2>
            <div className="re-capabilities-grid">
              {capabilities.map((cap, i) => (
                <motion.div
                  key={i}
                  className="re-cap-card"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                >
                  <span className="re-cap-icon">{cap.icon}</span>
                  <h3 className="re-cap-title">{cap.title}</h3>
                  <p className="re-cap-desc">{cap.desc}</p>
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
                  New Qualified Lead
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

                <div className="re-dashboard-actions">
                  <button className="re-dashboard-btn-primary" disabled>View Conversation</button>
                  <button className="re-dashboard-btn-secondary" disabled>Contact Lead</button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Before / After ── */}
        <section className="re-section re-ba-section">
          <div className="re-container">
            <h2 className="re-section-headline re-center">Before Amy. After Amy.</h2>
            <div className="re-ba-grid">
              <div className="re-ba-col re-ba-before">
                <div className="re-ba-label">Before</div>
                {[
                  "Phone rings at 9pm — no one answers",
                  "Lead leaves a voicemail",
                  "You return the call 8 hours later",
                  "Lead has already moved on",
                  "You never knew what they were looking for",
                ].map((line, i) => (
                  <div key={i} className="re-ba-row">
                    <span className="re-ba-x">✕</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <div className="re-ba-divider">→</div>
              <div className="re-ba-col re-ba-after">
                <div className="re-ba-label re-ba-label-after">After Amy</div>
                {[
                  "Amy responds to incoming inquiries when your team is unavailable",
                  "Lead is qualified and interest is captured",
                  "Qualified prospects can be guided toward a showing or appointment",
                  "You receive a structured conversation summary",
                  "Important conversations are surfaced for agent follow-up",
                ].map((line, i) => (
                  <div key={i} className="re-ba-row">
                    <span className="re-ba-check">✓</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Use Cases ── */}
        <section className="re-section">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">Use Cases</div>
            <h2 className="re-section-headline re-center">Common Scenarios Amy Is Built For</h2>
            <div className="re-usecase-grid">
              {useCases.map((uc, i) => (
                <div key={i} className="re-usecase-card">
                  <h3 className="re-usecase-title">{uc.title}</h3>
                  <p className="re-usecase-desc">{uc.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ROI Calculator ── */}
        <section className="re-section" id="roi-calculator">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">ROI Calculator</div>
            <h2 className="re-section-headline re-center">Model the Opportunity<br />for Your Business</h2>
            <ROICalculator />
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="re-section" id="how-it-works">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">How It Works</div>
            <h2 className="re-section-headline re-center">From Sign-Up to Launch</h2>
            <p className="re-section-sub">
              Deployment timeline depends on call volume, integrations, knowledge configuration,
              calendar and CRM setup, testing, and workflow complexity.
            </p>
            <div className="re-steps re-steps-5">
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
                <span className="re-trust-icon">🇺🇸</span>
                <h3>US Real Estate Focus</h3>
                <p>Built specifically for US residential and commercial real estate workflows and regulations.</p>
              </div>
              <div className="re-trust-item">
                <span className="re-trust-icon">⚖️</span>
                <h3>Consent-First Design</h3>
                <p>Outbound callback workflows are initiated only after the prospect explicitly requests a call. No unsolicited outreach.</p>
              </div>
              <div className="re-trust-item">
                <span className="re-trust-icon">🔒</span>
                <h3>Data Privacy</h3>
                <p>
                  Lead data stays in your account. We do not sell, share, or use your contacts for any other purpose.{" "}
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

        {/* ── Pricing ── */}
        <section className="re-section" id="pricing">
          <div className="re-container re-pricing-container">
            <div className="re-eyebrow re-eyebrow-center">Pricing</div>
            <h2 className="re-section-headline re-center">Transparent Pricing.<br />No Surprises.</h2>
            <div className="re-pricing-card">
              <div className="re-pricing-badge">Real Estate Teams &amp; Brokerages</div>
              <div className="re-pricing-from">Starting from</div>
              <div className="re-pricing-price">$700<span>/mo</span></div>
              <p className="re-pricing-note">
                Includes setup, configuration on your business and listings, and ongoing refinement.
                Exact pricing depends on call volume and integration requirements.
              </p>
              <ul className="re-pricing-features">
                <li>✓ 24/7 call response and lead capture</li>
                <li>✓ Configured for your team and listings</li>
                <li>✓ Calendar and CRM integration</li>
                <li>✓ Structured lead summaries and team alerts</li>
                <li>✓ Dedicated setup and onboarding support</li>
              </ul>
              <Link href="/book" className="re-btn-primary re-pricing-cta">
                Book a Free Demo →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Talk to Amy / Callback form ── */}
        <section className="re-section re-form-section" id="talk-to-amy">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">Get Started</div>
            <h2 className="re-section-headline re-center">See What Amy Would Do<br />With Your Next Lead.</h2>
            <p className="re-section-sub">
              Tell us a little about your business and your current lead process. We&apos;ll show you how Amy could fit into your workflow.
            </p>

            <div className="re-form-tabs">
              <button
                className={`re-tab ${activeTab === "talk" ? "re-tab-active" : ""}`}
                onClick={() => setActiveTab("talk")}
              >
                Talk to Amy
              </button>
              <button
                className={`re-tab ${activeTab === "callback" ? "re-tab-active" : ""}`}
                onClick={() => setActiveTab("callback")}
              >
                Request Callback
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "talk" && (
                <motion.div key="talk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {talkFormSuccess ? (
                    <div className="re-form-success">
                      <span className="re-success-icon">✓</span>
                      <h3>We&apos;ve got you.</h3>
                      <p>Amy will be in touch within minutes. Check your email for a confirmation.</p>
                    </div>
                  ) : (
                    <LeadForm source="talk-to-amy" utm={utm} onSuccess={() => setTalkFormSuccess(true)} />
                  )}
                </motion.div>
              )}
              {activeTab === "callback" && (
                <motion.div key="callback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {callbackSuccess ? (
                    <div className="re-form-success">
                      <span className="re-success-icon">✓</span>
                      <h3>Callback requested.</h3>
                      <p>Our team will be in touch. Make sure your phone is on.</p>
                    </div>
                  ) : (
                    <LeadForm source="callback" utm={utm} onSuccess={() => setCallbackSuccess(true)} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="re-footer">
          <div className="re-container">
            <div className="re-footer-top">
              <div>
                <div className="re-footer-brand">CyberCraft360</div>
                <p className="re-footer-tagline">AI automation for US service businesses.</p>
              </div>
              <div className="re-footer-links">
                <Link href="/">Home</Link>
                <Link href="/book">Book a Demo</Link>
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
        .re-nav-logo { display: flex; align-items: baseline; gap: 1px; text-decoration: none; }
        .re-logo-cc { font-size: 18px; font-weight: 800; color: oklch(0.78 0.13 207); }
        .re-logo-360 { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.5); }
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

        /* ── Problem ── */
        .re-problem { background: oklch(0.15 0.006 240); }
        .re-problem-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 48px; }
        .re-problem-card { background: oklch(0.18 0.008 240); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 24px; text-align: center; }
        .re-problem-icon { font-size: 28px; display: block; margin-bottom: 12px; }
        .re-problem-text { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); margin: 0 0 10px; line-height: 1.4; }
        .re-problem-arrow { font-size: 18px; color: rgba(255,0,80,0.6); margin-bottom: 10px; }
        .re-problem-outcome { font-size: 13px; color: rgba(255,60,60,0.75); margin: 0; line-height: 1.4; }

        /* ── Capabilities ── */
        .re-capabilities-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 48px; }
        .re-cap-card { background: oklch(0.16 0.007 240); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 24px 20px; transition: border-color .2s; }
        .re-cap-card:hover { border-color: oklch(0.78 0.13 207 / 0.4); }
        .re-cap-icon { font-size: 26px; display: block; margin-bottom: 12px; }
        .re-cap-title { font-size: 15px; font-weight: 700; margin: 0 0 8px; }
        .re-cap-desc { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.55; }

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
        .re-dashboard-actions { display: flex; gap: 10px; padding: 16px 24px; }
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
        .re-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.15); outline: none; cursor: pointer; }
        .re-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: oklch(0.78 0.13 207); cursor: pointer; box-shadow: 0 0 0 3px oklch(0.78 0.13 207 / 0.2); }
        .re-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: oklch(0.78 0.13 207); cursor: pointer; border: none; }
        .re-range::-moz-range-track { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.15); }
        .re-range:focus-visible { outline: 2px solid oklch(0.78 0.13 207); outline-offset: 4px; }
        .re-range-val { font-size: 20px; font-weight: 800; color: oklch(0.78 0.13 207); }
        .re-roi-results { display: flex; flex-direction: column; gap: 20px; justify-content: center; }
        .re-roi-tile { background: oklch(0.16 0.007 240); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 28px 24px; text-align: center; }
        .re-roi-tile-accent { border-color: oklch(0.78 0.13 207 / 0.4); background: oklch(0.78 0.13 207 / 0.07); }
        .re-roi-tile-val { display: block; font-size: 44px; font-weight: 900; color: oklch(0.78 0.13 207); font-variant-numeric: tabular-nums; line-height: 1; }
        .re-roi-tile-label { display: block; font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 8px; line-height: 1.4; }
        .re-roi-caveat { font-size: 11px; color: rgba(255,190,0,0.6); line-height: 1.5; border: 1px solid rgba(255,190,0,0.15); border-radius: 8px; padding: 10px 14px; }
        .re-methodology-toggle { margin-top: 24px; background: none; border: none; color: rgba(255,255,255,0.35); font-size: 13px; font-weight: 600; cursor: pointer; padding: 0; font-family: inherit; transition: color .2s; }
        .re-methodology-toggle:hover { color: rgba(255,255,255,0.6); }
        .re-methodology-body { margin-top: 12px; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }
        .re-methodology-body p { margin: 0 0 10px; }
        .re-methodology-body ol { margin: 0 0 10px; padding-left: 18px; }
        .re-methodology-body li { margin-bottom: 6px; }
        .re-methodology-body strong { color: rgba(255,255,255,0.65); }

        /* ── How It Works / Steps ── */
        .re-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 48px; }
        .re-steps-5 { grid-template-columns: repeat(5, 1fr); }
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
        .re-form-success { max-width: 560px; margin: 0 auto; text-align: center; padding: 48px 24px; background: oklch(0.78 0.13 207 / 0.06); border: 1px solid oklch(0.78 0.13 207 / 0.2); border-radius: 14px; }
        .re-success-icon { display: block; font-size: 36px; margin-bottom: 16px; color: #22c55e; }
        .re-form-success h3 { font-size: 22px; font-weight: 700; margin: 0 0 10px; }
        .re-form-success p { font-size: 15px; color: rgba(255,255,255,0.5); margin: 0; }

        /* ── Footer ── */
        .re-footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 40px 0; }
        .re-footer-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .re-footer-brand { font-size: 16px; font-weight: 800; color: oklch(0.78 0.13 207); margin-bottom: 6px; }
        .re-footer-tagline { font-size: 13px; color: rgba(255,255,255,0.3); margin: 0; }
        .re-footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
        .re-footer-links a { font-size: 13px; color: rgba(255,255,255,0.4); text-decoration: none; transition: color .2s; }
        .re-footer-links a:hover { color: #fff; }
        .re-footer-bottom { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.2); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; }

        /* ── Mobile ── */
        @media (max-width: 900px) {
          .re-hero { grid-template-columns: 1fr; padding: 48px 20px 32px; }
          .re-hero-demo { order: -1; }
          .re-chat-container { max-width: 100%; }
          .re-problem-grid, .re-capabilities-grid, .re-trust-grid { grid-template-columns: 1fr 1fr; }
          .re-usecase-grid { grid-template-columns: 1fr 1fr; }
          .re-ba-grid { grid-template-columns: 1fr; }
          .re-ba-divider { display: none; }
          .re-steps, .re-steps-5 { grid-template-columns: 1fr 1fr; }
          .re-roi-grid { grid-template-columns: 1fr; }
          .re-nav-links .re-nav-link { display: none; }
          .re-dashboard-fields { grid-template-columns: 1fr 1fr; }
          .re-dashboard-field:nth-child(3n) { border-right: 1px solid rgba(255,255,255,0.05); }
          .re-dashboard-field:nth-child(2n) { border-right: none; }
        }
        @media (max-width: 600px) {
          .re-section { padding: 56px 0; }
          .re-problem-grid, .re-capabilities-grid, .re-trust-grid, .re-steps, .re-steps-5 { grid-template-columns: 1fr; }
          .re-usecase-grid { grid-template-columns: 1fr; }
          .re-form-row { grid-template-columns: 1fr; }
          .re-footer-top { flex-direction: column; gap: 20px; }
          .re-footer-bottom { flex-direction: column; gap: 8px; }
          .re-nav { padding: 14px 18px; }
          .re-hero-headline { font-size: 30px; }
          .re-dashboard-fields { grid-template-columns: 1fr 1fr; }
          .re-workflow-bar { gap: 3px; }
          .re-workflow-label { display: none; }
          .re-timeline-note { flex-direction: column; align-items: center; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </>
  );
}
