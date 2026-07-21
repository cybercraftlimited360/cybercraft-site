"use client";

import { useEffect, useRef, useState } from "react";
import { X, Play, Pause, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  service?: string; // agent name e.g. "Amy", "Echo", "Pulse"
}

/* ─── typing helper ────────────────────────────────────────────── */
function Typed({ value, speed = 32 }: { value: string; speed?: number }) {
  const [typed, setTyped] = useState("");
  const done = useRef(false);
  useEffect(() => {
    done.current = false; setTyped("");
    let i = 0;
    const t = setInterval(() => {
      i++; setTyped(value.slice(0, i));
      if (i >= value.length) { clearInterval(t); done.current = true; }
    }, speed);
    return () => clearInterval(t);
  }, [value, speed]);
  return <>{typed}<span className="opacity-60 animate-pulse">|</span></>;
}

/* ─── bubble ───────────────────────────────────────────────────── */
function Bubble({ role, text, color }: { role: string; text: string; color: string }) {
  const isLeft = role !== "customer" && role !== "visitor" && role !== "lead";
  return (
    <div className={`flex gap-2 items-end ${isLeft ? "" : "flex-row-reverse"}`}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mb-0.5"
        style={{ background: isLeft ? color : "rgba(255,255,255,0.08)", color: "#fff" }}>
        {role[0].toUpperCase()}
      </div>
      <div className="rounded-2xl px-3 py-2 text-[13px] max-w-[75%] leading-snug"
        style={{
          background: isLeft ? `${color}22` : "rgba(255,255,255,0.06)",
          border: `1px solid ${isLeft ? color + "44" : "rgba(255,255,255,0.09)"}`,
          color: "#e4e6f0",
        }}>
        {text}
      </div>
    </div>
  );
}

/* ─── stat pill ────────────────────────────────────────────────── */
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="font-bold text-base" style={{ color }}>{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

/* ─── tag ──────────────────────────────────────────────────────── */
function Tag({ text, color, pulse }: { text: string; color: string; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: `${color}18`, border: `1px solid ${color}33`, color }}>
      {pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: color }} />}
      {text}
    </span>
  );
}

/* ─── ring animation ───────────────────────────────────────────── */
function Ring({ color, emoji }: { color: string; emoji: string }) {
  return (
    <div className="relative inline-flex items-center justify-center mx-auto">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl relative z-10"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
        {emoji}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="absolute inset-0 rounded-full animate-ping"
          style={{ background: `${color}18`, animationDelay: `${i * 0.3}s`, animationDuration: "1.8s" }} />
      ))}
    </div>
  );
}

/* ─── service demo definitions ─────────────────────────────────── */
type SceneId = string;
interface Scene { id: SceneId; label: string; duration: number }
interface ServiceDemo {
  color: string;
  emoji: string;
  scenes: Scene[];
  render: (scene: number, tick: number, color: string) => React.ReactNode;
}

function useTick(playing: boolean) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setTick(n => n + 1), 600);
    return () => clearInterval(t);
  }, [playing]);
  return tick;
}

function SceneAva(scene: number, tick: number, color: string) {
  const lines = [
    { role: "ava", text: "Thank you for calling! This is Ava with Houston Dental — how can I help you today?" },
    { role: "customer", text: "Hi, I need to book a cleaning appointment." },
    { role: "ava", text: "Absolutely! Are mornings or afternoons better for you?" },
    { role: "customer", text: "Mornings, maybe Tuesday or Wednesday?" },
    { role: "ava", text: "Tuesday at 9am works perfectly. Can I get your name?" },
    { role: "customer", text: "Sarah Collins." },
    { role: "ava", text: "Got it Sarah — you're all set for Tuesday at 9am. Sending a confirmation text now!" },
  ];
  const calItems = ["Mon — Full", "Tue 9am — Sarah Collins ✓", "Tue 11am — James R.", "Wed 10am — Available"];

  if (scene === 0) return (
    <div className="text-center space-y-5">
      <div className="text-xs text-gray-500 font-mono">Incoming call · Houston Dental · 2:14 AM</div>
      <Ring color={color} emoji="📞" />
      <div className="text-white font-semibold">Ava answers instantly</div>
      <div className="flex justify-center gap-3 flex-wrap">
        <Tag text="0s wait time" color={color} pulse />
        <Tag text="24 / 7 / 365" color="#22c55e" />
      </div>
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
      <div className="text-xs text-gray-500 font-mono mb-3">Live call transcript</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono mb-2">Calendar · updated in real time</div>
      {calItems.map((item, i) => (
        <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${i === 1 ? "scale-[1.02]" : "opacity-60"}`}
          style={{ background: i === 1 ? `${color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${i === 1 ? color + "44" : "rgba(255,255,255,0.07)"}` }}>
          <span className="text-sm">{i === 1 ? "🟢" : "⬜"}</span>
          <span className="text-sm" style={{ color: i === 1 ? "#fff" : "#8b8fa8" }}>{item}</span>
        </div>
      ))}
    </div>
  );
  if (scene === 3) return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-gray-500 font-mono">Results after 30 days</div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Calls answered" value="100%" color={color} />
        <Stat label="Appts booked" value="312" color="#22c55e" />
        <Stat label="After-hours" value="47%" color="#f59e0b" />
      </div>
      <Tag text="Zero missed calls" color={color} pulse />
    </div>
  );
}

function SceneNova(scene: number, tick: number, color: string) {
  const lines = [
    { role: "customer", text: "My order hasn't arrived and it's been 8 days!" },
    { role: "nova", text: "I'm really sorry about that — let me pull up your order right now. Can I get your order number?" },
    { role: "customer", text: "It's CC-48821." },
    { role: "nova", text: "Found it. Your package is in transit — looks like a carrier delay. It's arriving tomorrow by 6pm." },
    { role: "customer", text: "Okay, what if it doesn't show up tomorrow?" },
    { role: "nova", text: "If it doesn't arrive by tomorrow evening, I'll automatically issue a full refund. I'm also applying a 15% discount to your next order right now." },
  ];
  const issues = ["Order status inquiry", "Password reset", "Refund request", "Appointment rescheduling", "Product question"];

  if (scene === 0) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">Support queue · Monday 7:42 AM</div>
      <div className="flex justify-between items-center px-4 py-3 rounded-xl mb-2"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <span className="text-sm text-gray-300">Tickets this morning</span>
        <span className="font-bold text-white">47</span>
      </div>
      {issues.map((item, i) => (
        <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300`}
          style={{ background: `${color}12`, border: `1px solid ${color}25`, opacity: tick > i ? 1 : 0.3 }}>
          <span className="text-xs font-mono" style={{ color }}>{tick > i ? "✓ Resolved" : "Pending"}</span>
          <span className="text-sm text-gray-300">{item}</span>
          {tick > i && <span className="ml-auto text-xs text-gray-500">&lt;2s</span>}
        </div>
      ))}
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
      <div className="text-xs text-gray-500 font-mono mb-3">Live support chat</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500 font-mono">Customer satisfaction</div>
      {[["Response time","&lt;2 seconds","was 4 hours"],["Resolution rate","94%","was 71%"],["CSAT score","4.9 / 5","was 3.6"],["Escalations","6%","was 45%"]].map(([label, val, old]) => (
        <div key={label as string} className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-sm text-gray-400 flex-1">{label as string}</span>
          <span className="font-bold text-sm" style={{ color }} dangerouslySetInnerHTML={{ __html: val as string }} />
          <span className="text-[11px] text-gray-600 line-through">{old as string}</span>
        </div>
      ))}
    </div>
  );
  if (scene === 3) return (
    <div className="text-center space-y-5">
      <div className="text-xs text-gray-500 font-mono">Cost comparison · monthly</div>
      <div className="grid grid-cols-2 gap-4">
        {[["Human team (3 agents)","$14,400 / mo","❌"],["Nova AI","~$800 / mo","✅"]].map(([label, cost, icon]) => (
          <div key={label as string} className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-2xl mb-2">{icon as string}</div>
            <div className="text-xs text-gray-400 mb-1">{label as string}</div>
            <div className="font-bold text-sm text-white">{cost as string}</div>
          </div>
        ))}
      </div>
      <Tag text="94% lower support cost" color={color} pulse />
    </div>
  );
}

function SceneAtlas(scene: number, tick: number, color: string) {
  const lines = [
    { role: "atlas", text: "Hey Marcus, it's Atlas from Houston Roofing — you just requested a free estimate, right?" },
    { role: "lead", text: "Yeah, I filled out the form like 2 minutes ago." },
    { role: "atlas", text: "Perfect timing! Quick question — is this for storm damage or more of a planned replacement?" },
    { role: "lead", text: "Storm damage actually, pretty bad hail last week." },
    { role: "atlas", text: "Got it. Insurance claim situation — we do those a lot. Want me to get you with our estimator tomorrow morning?" },
    { role: "lead", text: "Yeah that works, 9am?" },
    { role: "atlas", text: "9am is yours. Sending a confirmation to your phone now. See you tomorrow!" },
  ];

  if (scene === 0) return (
    <div className="text-center space-y-5">
      <div className="text-xs text-gray-500 font-mono">Lead submitted form · 11:47 PM</div>
      <div className="relative">
        <Ring color={color} emoji="⚡" />
      </div>
      <div className="text-white font-semibold">Atlas calls in 52 seconds</div>
      <div className="text-xs text-gray-500">Industry average: 42 hours</div>
      <div className="flex justify-center gap-3">
        <Tag text="52s response" color={color} pulse />
        <Tag text="vs 42hr avg" color="#ef4444" />
      </div>
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
      <div className="text-xs text-gray-500 font-mono mb-3">Outbound qualification call</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">CRM updated automatically</div>
      {[["Name","Marcus Johnson"],["Status","Qualified → Appointment Set"],["Meeting","Tomorrow 9:00 AM"],["Type","Insurance Claim"],["Score","91 / 100"]].map(([k,v]) => (
        <div key={k} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-xs text-gray-500 w-20 flex-shrink-0">{k}</span>
          <span className="text-sm text-white">{v}</span>
        </div>
      ))}
    </div>
  );
  if (scene === 3) return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-gray-500 font-mono">Pipeline impact · 90 days</div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Leads contacted" value="100%" color={color} />
        <Stat label="Response time" value="&lt;90s" color="#22c55e" />
        <Stat label="Meetings booked" value="+340%" color={color} />
        <Stat label="Revenue added" value="$84k" color="#f59e0b" />
      </div>
    </div>
  );
}

function SceneEcho(scene: number, tick: number, color: string) {
  const lines = [
    { role: "echo", text: "Hey there! 👋 Looking for anything specific, or just browsing?" },
    { role: "visitor", text: "I need a website for my restaurant, how much does it cost?" },
    { role: "echo", text: "Great question! Depends on the features — do you need online ordering, reservations, or just an info site?" },
    { role: "visitor", text: "Reservations and a menu, nothing too crazy." },
    { role: "echo", text: "That's a popular combo — we've done a few of those. You'd be looking at $1,200-2,000 typically. Want a free quote?" },
    { role: "visitor", text: "Yeah, how do I get one?" },
    { role: "echo", text: "Drop your email and I'll have someone send a custom breakdown within the hour. No obligation." },
  ];

  if (scene === 0) return (
    <div className="text-center space-y-5">
      <div className="text-xs text-gray-500 font-mono">Website visitor · arrived via Google</div>
      <div className="mx-auto w-full max-w-xs rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex gap-1.5 px-3 py-2" style={{ background: "#1a1b24" }}>
          {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
        </div>
        <div className="p-4" style={{ background: "#13141b" }}>
          <div className="h-2 rounded-full w-3/4 mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="h-2 rounded-full w-1/2 mb-6" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className={`flex items-end gap-2 transition-all duration-500 ${tick > 0 ? "opacity-100" : "opacity-0"}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: color }}>E</div>
            <div className="rounded-2xl px-3 py-2 text-xs text-gray-200"
              style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
              Hey! 👋 Can I help you find anything?
            </div>
          </div>
        </div>
      </div>
      <Tag text="Engages in 1.2 seconds" color={color} pulse />
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
      <div className="text-xs text-gray-500 font-mono mb-3">Website chat · live conversation</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">Lead captured automatically</div>
      <div className="rounded-xl p-4 space-y-3" style={{ background: "#13141b", border: `1px solid ${color}33` }}>
        {[["Name","Restaurant visitor"],["Intent","Website with reservations + menu"],["Budget","$1,200–2,000"],["Source","Google → Echo chat"],["Status","Quote requested"]].map(([k,v]) => (
          <div key={k} className="flex gap-3">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">{k}</span>
            <span className="text-xs text-white">{v}</span>
          </div>
        ))}
      </div>
      <Tag text="Added to CRM instantly" color={color} pulse />
    </div>
  );
  if (scene === 3) return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-gray-500 font-mono">Conversion lift · 60 days</div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Visitors engaged" value="68%" color={color} />
        <Stat label="Leads captured" value="+220%" color="#22c55e" />
        <Stat label="Bounce rate" value="-41%" color="#f59e0b" />
      </div>
      <Tag text="Always converting" color={color} pulse />
    </div>
  );
}

function ScenePulse(scene: number, tick: number, color: string) {
  const steps = [
    { icon: "📧", label: "New inquiry email received", done: tick >= 1 },
    { icon: "📋", label: "Contact added to CRM", done: tick >= 2 },
    { icon: "📅", label: "Follow-up task created", done: tick >= 3 },
    { icon: "📤", label: "Welcome email sent automatically", done: tick >= 4 },
    { icon: "🔔", label: "Team Slack notification sent", done: tick >= 5 },
  ];
  const tasks = ["Send invoice → QuickBooks update → Receipt emailed","New hire form → IT notified → Accounts created","Contract signed → Project created → Kickoff scheduled","Support ticket → Routed → SLA timer started"];

  if (scene === 0) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">Without Pulse · Monday morning</div>
      {["Check email (30 min)","Update CRM manually (45 min)","Send follow-ups (20 min)","Generate reports (40 min)","Data entry (60 min)"].map((task, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl opacity-70"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <span className="text-xs text-red-400">✗</span>
          <span className="text-sm text-gray-300">{task}</span>
        </div>
      ))}
      <div className="text-center text-xs text-gray-500 pt-1">3.25 hrs of manual work · every single day</div>
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">With Pulse · trigger → automatic</div>
      {steps.map((s, i) => (
        <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500`}
          style={{ background: s.done ? `${color}12` : "rgba(255,255,255,0.03)", border: `1px solid ${s.done ? color + "33" : "rgba(255,255,255,0.06)"}`, opacity: s.done ? 1 : 0.35 }}>
          <span>{s.icon}</span>
          <span className="text-sm" style={{ color: s.done ? "#fff" : "#4b5263" }}>{s.label}</span>
          {s.done && <span className="ml-auto text-[11px]" style={{ color }}>Done</span>}
        </div>
      ))}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">Sample workflows running 24/7</div>
      {tasks.map((task, i) => (
        <div key={i} className="px-4 py-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex gap-1.5 items-center flex-wrap">
            {task.split("→").map((step, j) => (
              <span key={j} className="flex items-center gap-1.5">
                <span className="text-xs text-gray-300">{step.trim()}</span>
                {j < task.split("→").length - 1 && <ChevronRight size={11} className="text-gray-600" />}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
  if (scene === 3) return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-gray-500 font-mono">Time saved · per month</div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Hours automated" value="87 hrs" color={color} />
        <Stat label="Error rate" value="~0%" color="#22c55e" />
        <Stat label="Tasks completed" value="1,240" color={color} />
        <Stat label="Cost saved" value="$4,350" color="#f59e0b" />
      </div>
    </div>
  );
}

function SceneOrion(scene: number, tick: number, color: string) {
  const posts = [
    "🏠 Most homeowners don't realize their HVAC loses 15% efficiency every 5 years. Here's what to watch for before summer hits... [Read more]",
    "We just saved a Houston restaurant $2,400/month in food waste using AI inventory tracking. No new staff. Just smarter systems.",
    "❓ Quick poll: What's the #1 thing slowing down your business right now? (Employees / Admin work / Marketing / Finding clients)",
  ];

  if (scene === 0) return (
    <div className="text-center space-y-4">
      <div className="text-xs text-gray-500 font-mono">Content brief → Orion generates</div>
      <div className="rounded-xl p-4 text-left" style={{ background: "#13141b", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-xs text-gray-500 mb-2">Brief</div>
        <div className="text-sm text-gray-300">
          {tick > 0 ? <Typed value="HVAC company, Houston. Target: homeowners. Tone: helpful expert. Goal: drive service bookings. Brand voice: warm, local." /> : <span className="opacity-0">_</span>}
        </div>
      </div>
      {tick > 2 && (
        <div className="flex justify-center gap-2 flex-wrap animate-fade-in">
          {["LinkedIn","Instagram","Email","Blog","Google Ad"].map(p => <Tag key={p} text={p} color={color} />)}
        </div>
      )}
      {tick > 3 && <Tag text="5 assets generated in 12 seconds" color={color} pulse />}
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">Generated social posts · ready to publish</div>
      {posts.slice(0, Math.min(tick + 1, posts.length)).map((post, i) => (
        <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-xs text-gray-300 leading-relaxed">{post}</div>
          <div className="flex gap-2 mt-2">
            <Tag text="LinkedIn" color={color} /><Tag text="Facebook" color="#3b82f6" />
          </div>
        </div>
      ))}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">Email campaign · auto-scheduled</div>
      {[
        { label: "Subject", value: "Is your AC ready for Houston summer?" },
        { label: "Segment", value: "Customers > 2 years no service" },
        { label: "Send time", value: "Tue 9am · highest open rate window" },
        { label: "Predicted open", value: "34% (industry avg: 19%)" },
        { label: "CTA", value: "Book summer tune-up — $49 special" },
      ].map(({ label, value }) => (
        <div key={label} className="flex gap-3 px-4 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
          <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
          <span className="text-xs text-white">{value}</span>
        </div>
      ))}
    </div>
  );
  if (scene === 3) return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-gray-500 font-mono">Marketing output · per month</div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Posts published" value="62" color={color} />
        <Stat label="Emails sent" value="4,800" color="#22c55e" />
        <Stat label="Ad variations" value="18" color={color} />
        <Stat label="Team hours saved" value="54 hrs" color="#f59e0b" />
      </div>
    </div>
  );
}

function SceneAmy(scene: number, tick: number, color: string) {
  const lines = [
    { role: "amy", text: "Hey, it's Amy from CyberCraft360 — good time?" },
    { role: "lead", text: "Yeah, what's this about?" },
    { role: "amy", text: "Honestly just a quick one — I saw Marcus Auto and wanted to ask what's eating the most time in your day right now?" },
    { role: "lead", text: "Probably missing calls when we're heads-down on a car." },
    { role: "amy", text: "That's exactly what we fix. AI that answers every call 24/7 so you never lose a lead. Want 30 minutes with Saad?" },
    { role: "lead", text: "Sure, yeah." },
    { role: "amy", text: "Perfect — what's the best email for the calendar invite?" },
  ];

  if (scene === 0) return (
    <div className="text-center space-y-5">
      <div className="text-xs text-gray-500 font-mono">Outbound call · Amy calling Marcus</div>
      <Ring color={color} emoji="🎙️" />
      <div className="text-white font-semibold">Amy calling Marcus — 47s after form submit</div>
      <Tag text="Sounds human" color={color} pulse />
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
      <div className="text-xs text-gray-500 font-mono mb-3">Live call transcript</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">Admin dashboard · real time</div>
      <div className="rounded-xl p-4" style={{ background: "#13141b", border: `1px solid ${color}33` }}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-white font-semibold">Marcus Johnson</div>
            <div className="text-gray-400 text-xs">Marcus Auto Repair</div>
          </div>
          <Tag text="Booked" color="#22c55e" pulse />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Duration" value="2m 14s" color={color} />
          <Stat label="Turns" value="7" color={color} />
          <Stat label="Response" value="47s" color="#22c55e" />
        </div>
      </div>
    </div>
  );
  if (scene === 3) return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-gray-500 font-mono">You receive this instantly</div>
      <div className="rounded-xl p-4 text-left" style={{ background: "#13141b", border: "1px solid rgba(34,197,94,0.3)" }}>
        <div className="text-sm font-semibold text-white mb-1">📞 Amy Booked: Marcus — Marcus Auto Repair</div>
        <div className="text-xs text-gray-400 mb-3">just now · cybercraftlimited@gmail.com</div>
        {[["Email","marcus@marcusauto.com"],["Availability","Weekday mornings"],["Need","Missing calls during busy hours"]].map(([k,v]) => (
          <div key={k} className="flex gap-2 text-xs mb-1">
            <span className="text-gray-500 w-20">{k}</span>
            <span className="text-gray-200">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SceneAegis(scene: number, tick: number, color: string) {
  const events = [
    { time: "02:14:07", type: "Anomaly detected", detail: "Unusual login — Singapore IP", severity: "high" },
    { time: "02:14:08", type: "Auto-blocked", detail: "IP range blacklisted", severity: "ok" },
    { time: "02:14:09", type: "MFA triggered", detail: "Account locked pending verify", severity: "ok" },
    { time: "02:14:11", type: "Alert sent", detail: "Owner notified via SMS", severity: "ok" },
    { time: "02:14:13", type: "Threat neutralized", detail: "No data accessed", severity: "ok" },
  ];

  if (scene === 0) return (
    <div className="text-center space-y-5">
      <div className="text-xs text-gray-500 font-mono">System monitor · 02:14 AM</div>
      <Ring color={color} emoji="🛡️" />
      <div className="text-white font-semibold">Anomaly detected while you sleep</div>
      <Tag text="Responded in 1.2 seconds" color={color} pulse />
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 font-mono mb-3">Incident response log · automated</div>
      {events.slice(0, Math.min(tick + 1, events.length)).map((e, i) => (
        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-500`}
          style={{ background: e.severity === "high" ? "rgba(239,68,68,0.08)" : `${color}0e`, border: `1px solid ${e.severity === "high" ? "rgba(239,68,68,0.2)" : color + "25"}` }}>
          <span className="text-[10px] font-mono text-gray-600 flex-shrink-0">{e.time}</span>
          <span className="text-xs font-semibold" style={{ color: e.severity === "high" ? "#ef4444" : color }}>{e.type}</span>
          <span className="text-xs text-gray-400">{e.detail}</span>
        </div>
      ))}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 font-mono">30-day threat report</div>
      {[["Threats blocked","1,847"],["Auto-responses","100%"],["Data breaches","0"],["Downtime","0 minutes"],["Compliance alerts","0"]].map(([k,v]) => (
        <div key={k} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <span className="text-xs text-gray-400 flex-1">{k}</span>
          <span className="font-bold text-sm" style={{ color: v === "0" || v === "0 minutes" ? "#22c55e" : color }}>{v}</span>
        </div>
      ))}
    </div>
  );
  if (scene === 3) return (
    <div className="space-y-4 text-center">
      <div className="text-xs text-gray-500 font-mono">What Aegis protects</div>
      <div className="grid grid-cols-2 gap-3">
        {[["Customer data","Always encrypted"],["Login attempts","Auto-blocked"],["API endpoints","Rate limited"],["Compliance","Auto-reported"]].map(([k,v]) => (
          <div key={k} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-xs text-gray-400 mb-1">{k}</div>
            <div className="text-xs font-semibold" style={{ color }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── service registry ─────────────────────────────────────────── */
const DEMOS: Record<string, ServiceDemo> = {
  Ava: {
    color: "#00d4ff", emoji: "🤖",
    scenes: [
      { id: "call",     label: "Incoming call",        duration: 6000 },
      { id: "convo",    label: "Live conversation",     duration: 9000 },
      { id: "calendar", label: "Appointment booked",    duration: 6000 },
      { id: "results",  label: "30-day results",        duration: 6000 },
    ],
    render: SceneAva,
  },
  Nova: {
    color: "#7c3aed", emoji: "🎧",
    scenes: [
      { id: "queue",    label: "Support queue",         duration: 7000 },
      { id: "chat",     label: "Live resolution",       duration: 9000 },
      { id: "metrics",  label: "CSAT improvement",      duration: 6000 },
      { id: "cost",     label: "Cost comparison",       duration: 6000 },
    ],
    render: SceneNova,
  },
  Atlas: {
    color: "#a855f7", emoji: "💼",
    scenes: [
      { id: "call",     label: "Lead responds fast",    duration: 6000 },
      { id: "convo",    label: "Qualification call",    duration: 9000 },
      { id: "crm",      label: "CRM auto-updated",      duration: 6000 },
      { id: "pipeline", label: "Pipeline impact",       duration: 6000 },
    ],
    render: SceneAtlas,
  },
  Echo: {
    color: "#00d4ff", emoji: "💬",
    scenes: [
      { id: "engage",   label: "Visitor engages",       duration: 6000 },
      { id: "chat",     label: "Live chat",             duration: 9000 },
      { id: "lead",     label: "Lead captured",         duration: 6000 },
      { id: "lift",     label: "Conversion lift",       duration: 6000 },
    ],
    render: SceneEcho,
  },
  Pulse: {
    color: "#10b981", emoji: "⚙️",
    scenes: [
      { id: "before",   label: "Before Pulse",          duration: 7000 },
      { id: "auto",     label: "Automation fires",      duration: 8000 },
      { id: "workflows",label: "Sample workflows",      duration: 6000 },
      { id: "savings",  label: "Time & cost saved",     duration: 6000 },
    ],
    render: ScenePulse,
  },
  Orion: {
    color: "#f59e0b", emoji: "📈",
    scenes: [
      { id: "brief",    label: "Brief → content",       duration: 7000 },
      { id: "posts",    label: "Social posts",          duration: 8000 },
      { id: "email",    label: "Email campaign",        duration: 6000 },
      { id: "output",   label: "Monthly output",        duration: 6000 },
    ],
    render: SceneOrion,
  },
  Amy: {
    color: "#e64dff", emoji: "🎙️",
    scenes: [
      { id: "call",     label: "Amy calls the lead",    duration: 6000 },
      { id: "convo",    label: "Sales conversation",    duration: 9000 },
      { id: "dashboard",label: "Live dashboard",        duration: 6000 },
      { id: "email",    label: "Booking email sent",    duration: 6000 },
    ],
    render: SceneAmy,
  },
  Aegis: {
    color: "#ef4444", emoji: "🛡️",
    scenes: [
      { id: "detect",   label: "Threat detected",       duration: 6000 },
      { id: "respond",  label: "Auto-response",         duration: 8000 },
      { id: "report",   label: "Threat report",         duration: 6000 },
      { id: "coverage", label: "What's protected",      duration: 6000 },
    ],
    render: SceneAegis,
  },
};

const SERVICE_ORDER = ["Ava","Nova","Atlas","Echo","Pulse","Orion","Amy","Aegis"];

/* ─── main modal ───────────────────────────────────────────────── */
export default function HowItWorksModal({ open, onClose, service }: Props) {
  const [activeService, setActiveService] = useState(service || "Amy");
  const [scene, setScene] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const demo = DEMOS[activeService] ?? DEMOS["Amy"];
  const tick = useTick(playing && open);

  function resetScene(s = 0) {
    setScene(s); setProgress(0); setPlaying(true);
  }

  function switchService(name: string) {
    setActiveService(name); resetScene(0);
  }

  useEffect(() => {
    if (open) { setActiveService(service || "Amy"); resetScene(0); }
  }, [open, service]);

  useEffect(() => {
    if (!open || !playing) return;
    const dur = demo.scenes[scene]?.duration ?? 6000;
    const tick = 60;
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + (tick / dur) * 100, 100));
    }, tick);
    timerRef.current = setTimeout(() => {
      if (sceneRef.current < demo.scenes.length - 1) {
        setScene(s => s + 1); setProgress(0);
      } else {
        setPlaying(false);
      }
    }, dur);
    return () => { clearInterval(progressRef.current!); clearTimeout(timerRef.current!); };
  }, [scene, playing, open, activeService]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#0d0e13", border: `1px solid ${demo.color}44`, maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5" style={{ color: demo.color }}>
              CyberCraft360 · Live Demo
            </div>
            <div className="text-white font-semibold text-sm">
              {demo.emoji} {activeService} — See it in action
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        {/* Service selector */}
        <div className="flex gap-1.5 px-4 py-3 border-b overflow-x-auto flex-shrink-0 scrollbar-hide"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a0b10" }}>
          {SERVICE_ORDER.map(name => {
            const d = DEMOS[name];
            const active = name === activeService;
            return (
              <button key={name} onClick={() => switchService(name)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: active ? `${d.color}22` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? d.color + "55" : "rgba(255,255,255,0.07)"}`,
                  color: active ? "#fff" : "#4b5263",
                }}>
                <span>{d.emoji}</span> {name}
              </button>
            );
          })}
        </div>

        {/* Scene tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0b10" }}>
          {demo.scenes.map((s, i) => (
            <button key={s.id} onClick={() => { resetScene(i); }}
              className="flex-1 px-2 py-2.5 text-[10px] font-semibold transition-all relative truncate"
              style={{
                color: i === scene ? "#fff" : i < scene ? demo.color : "#333a4d",
                borderBottom: i === scene ? `2px solid ${demo.color}` : "2px solid transparent",
              }}>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
              {i === scene && (
                <div className="absolute bottom-0 left-0 h-[2px] transition-all"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${demo.color}, #fff)` }} />
              )}
            </button>
          ))}
        </div>

        {/* Scene content */}
        <div className="p-6 overflow-y-auto flex-1" style={{ minHeight: 300 }}>
          {demo.render(scene, tick, demo.color)}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a0b10" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setPlaying(p => !p)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ background: `${demo.color}22`, border: `1px solid ${demo.color}44`, color: demo.color }}>
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <span className="text-xs text-gray-500">
              {scene + 1}/{demo.scenes.length} · <span style={{ color: demo.color }}>{demo.scenes[scene]?.label}</span>
            </span>
          </div>
          <div className="flex gap-2">
            {scene === demo.scenes.length - 1 && !playing && (
              <button onClick={() => resetScene(0)}
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{ background: `${demo.color}22`, border: `1px solid ${demo.color}44`, color: demo.color }}>
                Replay
              </button>
            )}
            {scene < demo.scenes.length - 1 && (
              <button onClick={() => { resetScene(scene + 1); }}
                className="text-xs font-semibold px-4 py-2 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${demo.color}, ${demo.color}88)`, color: "#fff" }}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
