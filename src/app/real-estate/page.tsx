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

// ─── Amy demo conversation ────────────────────────────────────────────────────
const DEMO_MESSAGES = [
  { role: "caller", text: "Hi, I saw your listing on Zillow for the property on Oak Street." },
  { role: "amy", text: "Hey! Yes, that's a great one — just listed last week. Are you looking to buy or just getting a feel for the market?" },
  { role: "caller", text: "We're ready to buy. Looking for a 3-bed under $650k in that area." },
  { role: "amy", text: "Perfect, that fits right in. I have two other properties that match exactly — one just came back on market. Can I grab your name and email so I can send those over?" },
  { role: "caller", text: "Sure, I'm Michael Davis. mike.davis@email.com" },
  { role: "amy", text: "Got it, Michael. I'll send you those listings now. Want to schedule a showing for Oak Street this week? I have Thursday at 2pm or Saturday morning open." },
];

function AmyDemoChat() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    }, visibleCount === 0 ? 400 : 1800);
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
            <p>See how Amy handles an 11pm inquiry.</p>
          </div>
        )}
      </div>
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

  // Illustrative assumption: 25% of leads arrive after hours / go unanswered
  const captureRate = 0.25;
  const additionalLeads = Math.round(leads * captureRate);
  const additionalClosings = additionalLeads * (convRate / 100);
  const additionalRevenue = Math.round(additionalClosings * commission);

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : `$${n}`;

  return (
    <div className="re-roi-wrapper">
      <div className="re-roi-disclaimer">
        <span className="re-disclaimer-icon">⚠</span>
        <span>Illustrative estimate only — based entirely on the assumptions you enter below. Actual results will vary and depend on many factors including your market, follow-up quality, and lead sources. This calculator is not a guarantee or projection of any kind.</span>
      </div>

      <div className="re-roi-grid">
        <div className="re-roi-inputs">
          <label className="re-roi-label">
            Monthly leads received
            <input
              type="range" min={10} max={500} step={5} value={leads}
              onChange={e => setLeads(+e.target.value)}
              className="re-range"
            />
            <span className="re-range-val">{leads} leads/mo</span>
          </label>

          <label className="re-roi-label">
            Your current close rate
            <input
              type="range" min={1} max={30} step={0.5} value={convRate}
              onChange={e => setConvRate(+e.target.value)}
              className="re-range"
            />
            <span className="re-range-val">{convRate}%</span>
          </label>

          <label className="re-roi-label">
            Average commission per closing
            <input
              type="range" min={2000} max={50000} step={500} value={commission}
              onChange={e => setCommission(+e.target.value)}
              className="re-range"
            />
            <span className="re-range-val">{fmt(commission)}</span>
          </label>

          <p className="re-roi-assumption">
            * Calculator assumes 25% of your leads arrive after hours or go unanswered — a common industry estimate. Adjust your inputs to explore different scenarios.
          </p>
        </div>

        <div className="re-roi-results">
          <div className="re-roi-tile">
            <span className="re-roi-tile-val">{additionalLeads}</span>
            <span className="re-roi-tile-label">Additional leads<br/>captured per month</span>
          </div>
          <div className="re-roi-tile re-roi-tile-accent">
            <span className="re-roi-tile-val">{fmt(additionalRevenue)}</span>
            <span className="re-roi-tile-label">Illustrative additional<br/>revenue per month</span>
          </div>
          <p className="re-roi-caveat">
            This is an illustrative estimate based on your inputs, not a guarantee. Results depend on your specific market conditions, lead quality, and business execution.
          </p>
        </div>
      </div>
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
        const d = await res.json();
        throw new Error(d.error || "Something went wrong.");
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
        <input className="re-input" placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} required />
        <input className="re-input" type="email" placeholder="Email address *" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="re-form-row">
        <input className="re-input" type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
        <select className="re-input re-select" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">Your role</option>
          <option value="Real Estate Agent">Real Estate Agent</option>
          <option value="Broker">Broker / Team Lead</option>
          <option value="Property Manager">Property Manager</option>
          <option value="Investor">Investor</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <select className="re-input re-select re-full" value={interest} onChange={e => setInterest(e.target.value)}>
        <option value="">What are you looking to solve?</option>
        <option value="Missing after-hours calls">Missing after-hours calls</option>
        <option value="Lead qualification">Lead qualification</option>
        <option value="Showing scheduling">Showing scheduling</option>
        <option value="Follow-up automation">Follow-up automation</option>
        <option value="General inquiry">General inquiry / multiple items</option>
      </select>
      <textarea className="re-input re-textarea" placeholder="Anything specific you'd like Amy to help with? (optional)" value={message} onChange={e => setMessage(e.target.value)} rows={3} />

      {source === "callback" && (
        <label className="re-consent-label">
          <input type="checkbox" checked={callbackConsent} onChange={e => setCallbackConsent(e.target.checked)} className="re-checkbox" />
          <span>
            I consent to being contacted by CyberCraft360 via phone call. You may opt out at any time.
            By checking this box you agree to receive a call from our team.
          </span>
        </label>
      )}

      {error && <p className="re-form-error">{error}</p>}

      <button type="submit" className="re-submit-btn" disabled={loading}>
        {loading ? "Sending..." : source === "callback" ? "Request Callback" : "Talk to Amy →"}
      </button>
      <p className="re-form-note">No spam. No obligation. We'll respond within minutes during business hours.</p>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RealEstatePage() {
  const utm = useUTM();
  const [talkFormSuccess, setTalkFormSuccess] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"talk" | "callback">("talk");

  // Track page view with UTM
  useEffect(() => {
    gtag("event", "re_page_view", {
      event_category: "real_estate",
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
    });
  }, [utm]);

  const capabilities = [
    { icon: "📞", title: "Respond Instantly", desc: "Answers every call 24/7 — no voicemail, no missed opportunities." },
    { icon: "🎯", title: "Qualify Leads", desc: "Asks the right questions to separate serious buyers and sellers from browsers." },
    { icon: "🏠", title: "Answer Questions", desc: "Handles property inquiries, pricing questions, and availability — trained on your listings." },
    { icon: "📋", title: "Capture Details", desc: "Collects name, contact info, timeline, and budget — every lead fully documented." },
    { icon: "📅", title: "Schedule Showings", desc: "Books appointments directly into your calendar without back-and-forth." },
    { icon: "🔄", title: "Follow Up", desc: "Sends timely follow-ups to warm leads who haven't responded yet." },
    { icon: "🔔", title: "Notify Your Team", desc: "Alerts you and your agents the moment a hot lead comes in." },
  ];

  const useCases = [
    { title: "Buyer Leads", desc: "Qualify buyers on timeline, budget, and location before they ever reach your desk." },
    { title: "Seller Leads", desc: "Capture property details and seller motivation for a warm hand-off every time." },
    { title: "Property Inquiries", desc: "Answer questions about listing details, neighborhood, and pricing at any hour." },
    { title: "Showing Requests", desc: "Schedule showings automatically and confirm with both parties instantly." },
    { title: "Open House Follow-Up", desc: "Re-engage every open house visitor within minutes of leaving the property." },
    { title: "After-Hours Questions", desc: "The 11pm Zillow inquiry gets a real response — not a form, not a voicemail." },
    { title: "Lead Qualification", desc: "Score and route leads by buying timeline, pre-approval status, and motivation." },
    { title: "Appointment Requests", desc: "Handle all inbound appointment requests and calendar booking without manual scheduling." },
  ];

  const steps = [
    { num: "1", title: "Connect", desc: "We integrate with your phone system, CRM, and calendar. Works with most major real estate tools." },
    { num: "2", title: "Configure", desc: "Amy is trained on your listings, team, areas, and workflows — not a generic bot." },
    { num: "3", title: "Launch", desc: "Go live typically within 48–72 hours. Amy starts handling calls and inquiries immediately." },
    { num: "4", title: "Improve", desc: "You get weekly summaries. We refine Amy's responses based on real call outcomes." },
  ];

  return (
    <>
      {/* SEO */}
      <title>AI Receptionist for Real Estate | CyberCraft360</title>
      <meta name="description" content="Amy is an AI front desk built for real estate teams. Responds to leads 24/7, qualifies buyers and sellers, schedules showings, and notifies your team — automatically." />

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
              Amy answers every call, qualifies every lead, and schedules every showing — day and night. Built specifically for real estate teams.
            </p>
            <div className="re-hero-ctas">
              <a href="#talk-to-amy" className="re-btn-primary" onClick={() => gtag("event", "re_cta_hero_talk", { event_category: "real_estate" })}>
                Talk to Amy
              </a>
              <Link href="/book" className="re-btn-secondary" onClick={() => gtag("event", "re_cta_hero_demo", { event_category: "real_estate" })}>
                Book a Free Demo
              </Link>
              <a href="#roi-calculator" className="re-btn-ghost">
                Calculate Your ROI
              </a>
            </div>
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
            <h2 className="re-section-headline">Real Estate Doesn't Stop<br />When Your Office Does.</h2>
            <p className="re-section-sub">Leads come in at 10pm. Buyers call during your showing. Sellers want answers on Sunday morning.</p>
            <div className="re-problem-grid">
              {[
                { icon: "📵", prob: "Missed call at 11pm", outcome: "Lead calls the next agent instead" },
                { icon: "📭", prob: "Voicemail unanswered for 6 hours", outcome: "Buyer has moved on before you reply" },
                { icon: "📋", prob: "Showing request lost in your inbox", outcome: "Appointment never booked" },
                { icon: "🏃", prob: "New inquiry during an open house", outcome: "No one picks up, lead goes cold" },
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
            <h2 className="re-section-headline re-center">Seven Things Amy Handles<br />So You Don't Have To</h2>
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
                  "Lead already signed with another agent",
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
                  "Amy answers on the first ring, every time",
                  "Lead is qualified and interest is captured",
                  "Showing is scheduled before the call ends",
                  "You receive a full summary notification",
                  "Hot lead is flagged and ready for follow-up",
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
            <h2 className="re-section-headline re-center">Every Situation. Handled.</h2>
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
            <h2 className="re-section-headline re-center">What Could You Be Leaving<br />on the Table?</h2>
            <ROICalculator />
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="re-section" id="how-it-works">
          <div className="re-container">
            <div className="re-eyebrow re-eyebrow-center">How It Works</div>
            <h2 className="re-section-headline re-center">From Sign-Up to<br />First Call in 48 Hours</h2>
            <div className="re-steps">
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
                <h3>TCPA-Conscious Design</h3>
                <p>Amy obtains consent before outbound calls and follows opt-out requests immediately.</p>
              </div>
              <div className="re-trust-item">
                <span className="re-trust-icon">🔒</span>
                <h3>Data Privacy</h3>
                <p>Lead data stays in your account. We never sell, share, or use your contacts for any other purpose.</p>
              </div>
              <div className="re-trust-item">
                <span className="re-trust-icon">🔧</span>
                <h3>Bespoke, Not a Template</h3>
                <p>Amy is configured for your team, your listings, your brand voice — not a one-size-fits-all chatbot.</p>
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
              <div className="re-pricing-badge">Real Estate Plan</div>
              <div className="re-pricing-from">Starting from</div>
              <div className="re-pricing-price">$700<span>/mo</span></div>
              <p className="re-pricing-note">Includes setup, training on your listings, and ongoing refinement. Exact pricing depends on call volume and integration requirements.</p>
              <ul className="re-pricing-features">
                <li>✓ 24/7 call answering and lead capture</li>
                <li>✓ CRM and calendar integration</li>
                <li>✓ Showing scheduling automation</li>
                <li>✓ Weekly performance summaries</li>
                <li>✓ Dedicated setup support</li>
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
            <h2 className="re-section-headline re-center">Ready to Stop Missing Leads?</h2>

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
                      <h3>We've got you.</h3>
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
                      <p>Amy will call you shortly. Make sure your phone is on.</p>
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
        .re-hero-sub { font-size: 17px; color: rgba(255,255,255,0.6); line-height: 1.65; margin-bottom: 32px; max-width: 480px; }
        .re-hero-ctas { display: flex; flex-wrap: wrap; gap: 12px; }
        .re-hero-demo { display: flex; justify-content: center; }

        /* ── Amy Chat ── */
        .re-chat-container { background: oklch(0.16 0.008 240); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; width: 100%; max-width: 420px; }
        .re-chat-header { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .re-chat-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, oklch(0.78 0.13 207), #7c3aed); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #000; flex-shrink: 0; }
        .re-chat-name { font-size: 14px; font-weight: 700; }
        .re-chat-status { display: flex; align-items: center; gap: 6px; font-size: 11px; color: rgba(255,255,255,0.4); }
        .re-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; display: inline-block; }
        .re-chat-time { margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.3); }
        .re-chat-messages { padding: 16px; min-height: 260px; display: flex; flex-direction: column; gap: 10px; }
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
        .re-chat-placeholder { display: flex; align-items: center; justify-content: center; height: 200px; color: rgba(255,255,255,0.2); font-size: 14px; text-align: center; }
        .re-demo-btn { display: block; width: 100%; padding: 14px; background: oklch(0.78 0.13 207 / 0.15); border: 1px solid oklch(0.78 0.13 207 / 0.4); color: oklch(0.78 0.13 207); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; border-top: 1px solid rgba(255,255,255,0.07); }
        .re-demo-btn:hover:not(:disabled) { background: oklch(0.78 0.13 207 / 0.25); }
        .re-demo-btn:disabled { opacity: 0.5; cursor: default; }

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
        .re-usecase-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 48px; }
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
        .re-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: oklch(0.78 0.13 207); cursor: pointer; }
        .re-range-val { font-size: 20px; font-weight: 800; color: oklch(0.78 0.13 207); }
        .re-roi-assumption { font-size: 12px; color: rgba(255,255,255,0.3); line-height: 1.5; margin: 4px 0 0; }
        .re-roi-results { display: flex; flex-direction: column; gap: 20px; justify-content: center; }
        .re-roi-tile { background: oklch(0.16 0.007 240); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 28px 24px; text-align: center; }
        .re-roi-tile-accent { border-color: oklch(0.78 0.13 207 / 0.4); background: oklch(0.78 0.13 207 / 0.07); }
        .re-roi-tile-val { display: block; font-size: 44px; font-weight: 900; color: oklch(0.78 0.13 207); font-variant-numeric: tabular-nums; line-height: 1; }
        .re-roi-tile-label { display: block; font-size: 13px; color: rgba(255,255,255,0.45); margin-top: 8px; line-height: 1.4; }
        .re-roi-caveat { font-size: 11px; color: rgba(255,190,0,0.6); line-height: 1.5; border: 1px solid rgba(255,190,0,0.15); border-radius: 8px; padding: 10px 14px; }

        /* ── How It Works / Steps ── */
        .re-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 48px; }
        .re-step { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }
        .re-step-num { width: 44px; height: 44px; border-radius: 50%; background: oklch(0.78 0.13 207 / 0.15); border: 2px solid oklch(0.78 0.13 207 / 0.5); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: oklch(0.78 0.13 207); flex-shrink: 0; }
        .re-step-title { font-size: 18px; font-weight: 700; margin: 0 0 6px; }
        .re-step-desc { font-size: 14px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.55; }

        /* ── Trust ── */
        .re-trust-section { background: oklch(0.15 0.006 240); }
        .re-trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 48px; }
        .re-trust-item { padding: 24px; background: oklch(0.18 0.008 240); border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); }
        .re-trust-icon { font-size: 28px; display: block; margin-bottom: 12px; }
        .re-trust-item h3 { font-size: 15px; font-weight: 700; margin: 0 0 8px; }
        .re-trust-item p { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.55; }

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
        .re-select { cursor: pointer; }
        .re-select option { background: #1a1d2a; }
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
        .re-footer-links { display: flex; gap: 20px; }
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
          .re-steps { grid-template-columns: 1fr 1fr; }
          .re-roi-grid { grid-template-columns: 1fr; }
          .re-nav-links .re-nav-link { display: none; }
        }
        @media (max-width: 600px) {
          .re-section { padding: 56px 0; }
          .re-problem-grid, .re-capabilities-grid, .re-trust-grid, .re-usecase-grid, .re-steps { grid-template-columns: 1fr; }
          .re-form-row { grid-template-columns: 1fr; }
          .re-footer-top { flex-direction: column; gap: 20px; }
          .re-footer-bottom { flex-direction: column; gap: 8px; }
          .re-nav { padding: 14px 18px; }
          .re-hero-headline { font-size: 30px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </>
  );
}
