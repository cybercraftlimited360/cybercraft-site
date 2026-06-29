"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Building2, Users, Target, Wrench, DollarSign, User } from "lucide-react";
import CursorGlow from "@/components/ui/cursor-glow";

const INDUSTRIES = [
  "Real Estate", "Healthcare & Medical", "Legal & Law",
  "E-Commerce & Retail", "Finance & Insurance", "Hospitality & Restaurant",
  "Construction & Trades", "Marketing Agency", "Coaching & Consulting",
  "Education & Training", "Logistics & Delivery", "Technology & SaaS", "Other",
];

const PAIN_POINTS = [
  "Missing calls & losing leads", "Too much time on repetitive admin",
  "Slow or no follow-up with prospects", "High customer service volume",
  "Manual data entry & reporting", "Inconsistent sales outreach",
  "Slow content creation", "No visibility into business performance",
  "Security & compliance concerns", "High staffing costs",
];

const GOALS = [
  "Automate customer support 24/7", "Book more appointments automatically",
  "Generate and qualify leads on autopilot", "Reduce team workload & overhead",
  "Increase revenue without hiring", "Speed up content & marketing output",
  "Improve response time to enquiries", "Get real-time business analytics",
  "Protect my business from cyber threats", "Build a premium brand presence",
];

const SERVICES = [
  { name: "Custom AI Chatbot", cat: "cyan" },
  { name: "Voice AI Agent", cat: "cyan" },
  { name: "AI Phone Agent", cat: "cyan" },
  { name: "AI Sales Agent", cat: "purple" },
  { name: "AI Ads & Marketing", cat: "purple" },
  { name: "AI Content Engine", cat: "purple" },
  { name: "Workflow & CRM Automation", cat: "green" },
  { name: "Document Intelligence", cat: "green" },
  { name: "Lead Intelligence", cat: "green" },
  { name: "Premium Website Design", cat: "amber" },
  { name: "AI Analytics Dashboard", cat: "amber" },
  { name: "AI Cybersecurity", cat: "amber" },
];

const TOOLS = [
  "HubSpot", "Salesforce", "GoHighLevel", "Zoho CRM",
  "Google Workspace", "Microsoft 365", "Slack", "Shopify",
  "WordPress / Wix", "QuickBooks", "None / Spreadsheets", "Other",
];

const BUDGETS = [
  "$500 – $800/mo", "$800 – $1,200/mo", "$1,200 – $2,000/mo",
  "$2,000 – $3,500/mo", "$3,500+/mo", "Not sure yet",
];

const TIMELINES = [
  "ASAP — ready to start now", "Within 1 month", "1–3 months", "Exploring options",
];

type FormData = {
  // Step 1 — Business
  businessName: string;
  industry: string;
  website: string;
  teamSize: string;
  yearsInBusiness: string;
  // Step 2 — Challenges
  painPoints: string[];
  biggestChallenge: string;
  // Step 3 — Goals
  goals: string[];
  whatSuccess: string;
  // Step 4 — Services
  servicesInterested: string[];
  existingTools: string[];
  // Step 5 — Budget
  budget: string;
  timeline: string;
  additionalNotes: string;
  // Step 6 — Contact
  name: string;
  email: string;
  phone: string;
  preferredContact: string;
};

const EMPTY: FormData = {
  businessName: "", industry: "", website: "", teamSize: "", yearsInBusiness: "",
  painPoints: [], biggestChallenge: "",
  goals: [], whatSuccess: "",
  servicesInterested: [], existingTools: [],
  budget: "", timeline: "", additionalNotes: "",
  name: "", email: "", phone: "", preferredContact: "Email",
};

const STEPS = [
  { icon: Building2, label: "Business", title: "Tell us about your business" },
  { icon: Target, label: "Challenges", title: "What's slowing you down?" },
  { icon: Users, label: "Goals", title: "What do you want AI to achieve?" },
  { icon: Wrench, label: "Services", title: "Services & existing tools" },
  { icon: DollarSign, label: "Budget", title: "Investment & timeline" },
  { icon: User, label: "Contact", title: "How can we reach you?" },
];

function Toggle({ label, active, color = "cyan", onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    cyan: "rgba(0,212,255,0.15) border-[rgba(0,212,255,0.4)] text-[#00d4ff]",
    purple: "rgba(124,58,237,0.15) border-[rgba(124,58,237,0.4)] text-[#a78bfa]",
    green: "rgba(34,197,94,0.12) border-[rgba(34,197,94,0.35)] text-[#22c55e]",
    amber: "rgba(245,158,11,0.12) border-[rgba(245,158,11,0.35)] text-[#f59e0b]",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left ${
        active
          ? `bg-[${colors[color]?.split(" ")[0]}] ${colors[color]?.split(" ").slice(1).join(" ")} scale-[1.02]`
          : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25 hover:text-white/75"
      }`}
      style={active ? { background: colors[color]?.split(" ")[0] } : {}}
      type="button"
    >
      {active && <span className="mr-1.5">✓</span>}{label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/40">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#00d4ff]/50 focus:bg-white/[0.06] transition-all";

export default function IntakePage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof FormData, val: string) => setForm(f => ({ ...f, [key]: val }));

  const toggle = (key: "painPoints" | "goals" | "servicesInterested" | "existingTools", val: string) =>
    setForm(f => {
      const arr = f[key] as string[];
      return { ...f, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });

  const canNext = () => {
    if (step === 0) return form.businessName && form.industry && form.teamSize;
    if (step === 1) return form.painPoints.length > 0;
    if (step === 2) return form.goals.length > 0;
    if (step === 3) return form.servicesInterested.length > 0;
    if (step === 4) return form.budget && form.timeline;
    if (step === 5) return form.name && form.email;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submit failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-lg"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center mx-auto mb-8">
            <Check size={36} strokeWidth={3} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">You're all set, {form.name.split(" ")[0]}.</h1>
          <p className="text-white/60 text-lg leading-relaxed mb-8">
            We've received your intake form and our founder will review it personally. Expect a tailored response within <strong className="text-white">24 hours</strong> with specific recommendations for {form.businessName}.
          </p>
          <a
            href="https://calendly.com/cybercraftlimited/30min"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white font-bold text-sm tracking-widest uppercase px-8 py-4 rounded-xl no-underline hover:opacity-90 transition-opacity"
          >
            Book Your Strategy Call Now <ArrowRight size={16} />
          </a>
          <p className="mt-6 text-white/30 text-sm">Or we'll reach out by email within 24 hours.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c12] text-white">
      <CursorGlow />
      {/* Top bar */}
      <div className="h-1 bg-gradient-to-r from-[#00d4ff] via-[#7c3aed] to-[#00d4ff]" />

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/[0.06]">
        <a href="/" className="text-xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] bg-clip-text text-transparent no-underline">
          CyberCraft360
        </a>
        <span className="text-xs text-white/30 font-medium tracking-widest uppercase">AI Intake Form</span>
      </div>

      {/* Progress steps */}
      <div className="px-6 py-6 border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < step ? "bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] text-white"
                      : i === step ? "bg-[#00d4ff]/20 border border-[#00d4ff]/50 text-[#00d4ff]"
                      : "bg-white/5 border border-white/10 text-white/30"
                    }`}
                  >
                    {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${i === step ? "text-white" : i < step ? "text-white/50" : "text-white/25"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px transition-all ${i < step ? "bg-gradient-to-r from-[#00d4ff] to-[#7c3aed]" : "bg-white/10"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Form body */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step heading */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                {React.createElement(STEPS[step].icon, { size: 18, className: "text-[#00d4ff]" })}
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#00d4ff]">Step {step + 1} of {STEPS.length}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{STEPS[step].title}</h1>
            </div>

            {/* ── STEP 0 — BUSINESS ── */}
            {step === 0 && (
              <div className="flex flex-col gap-5">
                <Field label="Business / Company Name *">
                  <input className={inputCls} placeholder="e.g. Smith Real Estate Group" value={form.businessName} onChange={e => set("businessName", e.target.value)} />
                </Field>
                <Field label="Industry *">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {INDUSTRIES.map(ind => (
                      <Toggle key={ind} label={ind} active={form.industry === ind} onClick={() => set("industry", ind)} />
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Business Website">
                    <input className={inputCls} placeholder="yourwebsite.com" value={form.website} onChange={e => set("website", e.target.value)} />
                  </Field>
                  <Field label="Years in Business">
                    <select className={inputCls} value={form.yearsInBusiness} onChange={e => set("yearsInBusiness", e.target.value)}>
                      <option value="">Select...</option>
                      {["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Team Size *">
                  <div className="flex flex-wrap gap-2">
                    {["Just me", "2–5", "6–15", "16–50", "50+"].map(v => (
                      <Toggle key={v} label={v} active={form.teamSize === v} onClick={() => set("teamSize", v)} />
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* ── STEP 1 — CHALLENGES ── */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <Field label="What's slowing your business down? (Select all that apply) *">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PAIN_POINTS.map(p => (
                      <Toggle key={p} label={p} active={form.painPoints.includes(p)} onClick={() => toggle("painPoints", p)} />
                    ))}
                  </div>
                </Field>
                <Field label="Describe your biggest challenge in your own words">
                  <textarea
                    className={`${inputCls} resize-none h-28`}
                    placeholder="e.g. We miss a lot of inbound calls after hours and lose those leads to competitors..."
                    value={form.biggestChallenge}
                    onChange={e => set("biggestChallenge", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {/* ── STEP 2 — GOALS ── */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <Field label="What do you want AI to help you achieve? (Select all that apply) *">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GOALS.map(g => (
                      <Toggle key={g} label={g} active={form.goals.includes(g)} onClick={() => toggle("goals", g)} />
                    ))}
                  </div>
                </Field>
                <Field label="What does success look like for you in 6 months?">
                  <textarea
                    className={`${inputCls} resize-none h-28`}
                    placeholder="e.g. I want my AI to handle all initial customer enquiries so my team can focus on closing deals..."
                    value={form.whatSuccess}
                    onChange={e => set("whatSuccess", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {/* ── STEP 3 — SERVICES & TOOLS ── */}
            {step === 3 && (
              <div className="flex flex-col gap-6">
                <Field label="Which services are you most interested in? (Select all that apply) *">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SERVICES.map(s => (
                      <Toggle key={s.name} label={s.name} color={s.cat} active={form.servicesInterested.includes(s.name)} onClick={() => toggle("servicesInterested", s.name)} />
                    ))}
                  </div>
                </Field>
                <Field label="What tools & software does your business currently use?">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TOOLS.map(t => (
                      <Toggle key={t} label={t} active={form.existingTools.includes(t)} onClick={() => toggle("existingTools", t)} />
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* ── STEP 4 — BUDGET & TIMELINE ── */}
            {step === 4 && (
              <div className="flex flex-col gap-6">
                <Field label="What monthly investment range works for your business? *">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BUDGETS.map(b => (
                      <Toggle key={b} label={b} active={form.budget === b} onClick={() => set("budget", b)} />
                    ))}
                  </div>
                </Field>
                <Field label="When are you looking to get started? *">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TIMELINES.map(t => (
                      <Toggle key={t} label={t} active={form.timeline === t} onClick={() => set("timeline", t)} />
                    ))}
                  </div>
                </Field>
                <Field label="Anything else you'd like us to know?">
                  <textarea
                    className={`${inputCls} resize-none h-28`}
                    placeholder="Any specific requirements, integrations, compliance needs, or questions..."
                    value={form.additionalNotes}
                    onChange={e => set("additionalNotes", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {/* ── STEP 5 — CONTACT ── */}
            {step === 5 && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Your Full Name *">
                    <input className={inputCls} placeholder="John Smith" value={form.name} onChange={e => set("name", e.target.value)} />
                  </Field>
                  <Field label="Email Address *">
                    <input className={inputCls} type="email" placeholder="john@business.com" value={form.email} onChange={e => set("email", e.target.value)} />
                  </Field>
                </div>
                <Field label="Phone Number">
                  <input className={inputCls} type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} />
                </Field>
                <Field label="Preferred Contact Method">
                  <div className="flex flex-wrap gap-2">
                    {["Email", "Phone call", "WhatsApp", "Text message"].map(v => (
                      <Toggle key={v} label={v} active={form.preferredContact === v} onClick={() => set("preferredContact", v)} />
                    ))}
                  </div>
                </Field>

                {/* Summary preview */}
                <div className="mt-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30 mb-1">Summary of Your Submission</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-white/40">Business: </span><span className="text-white font-medium">{form.businessName}</span></div>
                    <div><span className="text-white/40">Industry: </span><span className="text-white font-medium">{form.industry}</span></div>
                    <div><span className="text-white/40">Team: </span><span className="text-white font-medium">{form.teamSize}</span></div>
                    <div><span className="text-white/40">Budget: </span><span className="text-white font-medium">{form.budget}</span></div>
                    <div className="col-span-2"><span className="text-white/40">Services: </span><span className="text-white font-medium">{form.servicesInterested.join(", ") || "—"}</span></div>
                    <div className="col-span-2"><span className="text-white/40">Timeline: </span><span className="text-white font-medium">{form.timeline}</span></div>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/[0.06]">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-sm font-semibold text-white/50 hover:text-white hover:border-white/25 transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`rounded-full transition-all ${i === step ? "w-5 h-1.5 bg-[#00d4ff]" : i < step ? "w-1.5 h-1.5 bg-[#7c3aed]" : "w-1.5 h-1.5 bg-white/15"}`} />
            ))}
          </div>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-bold tracking-wide disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
            >
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] text-white text-sm font-bold tracking-wide disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
            >
              {submitting ? "Submitting..." : "Submit & Get My Recommendations"} <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
