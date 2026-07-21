"use client";

import { useEffect, useRef, useState } from "react";
import { X, Play, Pause, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  service?: string;
}

/* ─── CSS injected once ─────────────────────────────────────────── */
const CSS = `
@keyframes slideUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
@keyframes slideIn   { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
@keyframes popIn     { from { opacity:0; transform:scale(0.82); } to { opacity:1; transform:scale(1); } }
@keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
@keyframes fillBar   { from { width:0%; } to { width:var(--w); } }
@keyframes countUp   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes scanLine  { 0%,100% { top:0%; } 50% { top:94%; } }
@keyframes ripple    { 0% { transform:scale(0.6); opacity:0.6; } 100% { transform:scale(2.4); opacity:0; } }
@keyframes flow      { 0% { stroke-dashoffset:200; } 100% { stroke-dashoffset:0; } }
@keyframes glowPulse { 0%,100% { box-shadow:0 0 0px currentColor; } 50% { box-shadow:0 0 16px currentColor; } }
@keyframes typeCaret { 0%,100% { opacity:1; } 50% { opacity:0; } }
@keyframes drawCheck { from { stroke-dashoffset:40; } to { stroke-dashoffset:0; } }
@keyframes floatUp   { 0% { opacity:0; transform:translateY(12px) scale(0.95); } 60% { opacity:1; transform:translateY(-2px) scale(1.02); } 100% { opacity:1; transform:translateY(0) scale(1); } }
@keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }
@keyframes barGrow   { from { transform:scaleY(0); } to { transform:scaleY(1); } }
.anim-slideUp   { animation: slideUp   0.45s cubic-bezier(.22,.68,0,1.2) both; }
.anim-slideIn   { animation: slideIn   0.4s cubic-bezier(.22,.68,0,1.2) both; }
.anim-popIn     { animation: popIn     0.5s cubic-bezier(.34,1.4,.64,1) both; }
.anim-fadeIn    { animation: fadeIn    0.5s ease both; }
.anim-floatUp   { animation: floatUp   0.55s cubic-bezier(.22,.68,0,1.2) both; }
`;

function injectCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("hiw-css")) return;
  const s = document.createElement("style");
  s.id = "hiw-css"; s.textContent = CSS;
  document.head.appendChild(s);
}

/* ─── primitives ─────────────────────────────────────────────────── */
function Typed({ value, speed = 28, delay = 0 }: { value: string; speed?: number; delay?: number }) {
  const [typed, setTyped] = useState("");
  useEffect(() => {
    setTyped("");
    let i = 0;
    const t0 = setTimeout(() => {
      const iv = setInterval(() => { i++; setTyped(value.slice(0, i)); if (i >= value.length) clearInterval(iv); }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t0);
  }, [value, speed, delay]);
  return <>{typed}<span style={{ animation: "typeCaret 0.9s step-end infinite", opacity: 1 }}>|</span></>;
}

function CountUp({ to, suffix = "", duration = 1400, delay = 0, color }: { to: number; suffix?: string; duration?: number; delay?: number; color: string }) {
  const [val, setVal] = useState(0);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    setVal(0); setVis(false);
    const t0 = setTimeout(() => {
      setVis(true);
      const steps = 40; const step = duration / steps;
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setVal(Math.round(to * (i / steps)));
        if (i >= steps) { setVal(to); clearInterval(iv); }
      }, step);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t0);
  }, [to, duration, delay]);
  return <span className={vis ? "anim-countUp" : ""} style={{ color, fontVariantNumeric: "tabular-nums" }}>{val}{suffix}</span>;
}

function Bar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), delay + 100); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
      <div className="h-full rounded-full transition-all ease-out" style={{ width: `${w}%`, background: color, transitionDuration: "1.2s" }} />
    </div>
  );
}

function BarChart({ bars, color }: { bars: { label: string; value: number; max: number }[]; color: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 200); return () => clearTimeout(t); }, []);
  return (
    <div className="flex items-end gap-3 h-32 pt-4">
      {bars.map((b, i) => (
        <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-[10px] font-bold" style={{ color }}>{b.value}%</div>
          <div className="w-full rounded-t-md origin-bottom transition-all ease-out"
            style={{ height: `${(b.value / b.max) * 100}%`, background: `linear-gradient(180deg, ${color}, ${color}66)`, transform: ready ? "scaleY(1)" : "scaleY(0)", transitionDuration: `${0.7 + i * 0.15}s`, transitionDelay: `${i * 0.1}s` }} />
          <div className="text-[9px] text-gray-500 text-center">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

function Ring({ color, emoji, size = 80 }: { color: string; emoji: string; size?: number }) {
  return (
    <div className="relative inline-flex items-center justify-center mx-auto anim-popIn">
      <div className="rounded-full flex items-center justify-center text-3xl relative z-10"
        style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}dd, ${color}66)`, boxShadow: `0 0 30px ${color}44` }}>
        {emoji}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="absolute inset-0 rounded-full"
          style={{ animation: `ripple 2.2s ease-out ${i * 0.55}s infinite`, border: `1px solid ${color}55` }} />
      ))}
    </div>
  );
}

function Tag({ text, color, pulse, delay = 0 }: { text: string; color: string; pulse?: boolean; delay?: number }) {
  return (
    <span className="anim-slideUp inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: `${color}18`, border: `1px solid ${color}44`, color, animationDelay: `${delay}ms` }}>
      {pulse && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color, animation: "glowPulse 1.5s ease-in-out infinite", color }} />}
      {text}
    </span>
  );
}

function Bubble({ role, text, color, delay = 0 }: { role: string; text: string; color: string; delay?: number }) {
  const isLeft = role !== "customer" && role !== "visitor" && role !== "lead";
  return (
    <div className={`flex gap-2 items-end anim-floatUp ${isLeft ? "" : "flex-row-reverse"}`}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mb-0.5"
        style={{ background: isLeft ? color : "rgba(255,255,255,0.1)", color: "#fff", boxShadow: isLeft ? `0 0 10px ${color}55` : "none" }}>
        {role[0].toUpperCase()}
      </div>
      <div className="rounded-2xl px-3 py-2 text-[13px] max-w-[75%] leading-snug"
        style={{ background: isLeft ? `${color}1e` : "rgba(255,255,255,0.07)", border: `1px solid ${isLeft ? color + "44" : "rgba(255,255,255,0.1)"}`, color: "#e4e6f0" }}>
        {text}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, delay = 0, bar }: { label: string; value: string; color: string; delay?: number; bar?: number }) {
  return (
    <div className="anim-slideUp rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", animationDelay: `${delay}ms` }}>
      <div className="font-bold text-base mb-0.5" style={{ color }}>{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
      {bar !== undefined && <div className="mt-2"><Bar pct={bar} color={color} delay={delay} /></div>}
    </div>
  );
}

function CheckItem({ text, color, delay = 0, done = true }: { text: string; color: string; delay?: number; done?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  if (!show) return <div className="h-9 opacity-0" />;
  return (
    <div className="anim-slideIn flex items-center gap-3 px-4 py-2.5 rounded-xl"
      style={{ background: done ? `${color}12` : "rgba(255,255,255,0.03)", border: `1px solid ${done ? color + "30" : "rgba(255,255,255,0.06)"}` }}>
      {done
        ? <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill={`${color}22`} stroke={color} strokeWidth="1.5"/><polyline points="4.5,8 7,10.5 11.5,5.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" strokeDashoffset="0" style={{ animation: "drawCheck 0.4s ease forwards" }}/></svg>
        : <div className="w-4 h-4 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.15)" }} />}
      <span className="text-sm" style={{ color: done ? "#e4e6f0" : "#4b5263" }}>{text}</span>
    </div>
  );
}

/* ─── scene renderers ────────────────────────────────────────────── */
function SceneAva(scene: number, tick: number, color: string) {
  const lines = [
    { role: "ava",      text: "Thank you for calling Houston Dental! This is Ava — how can I help you?" },
    { role: "customer", text: "Hi, I need to book a cleaning." },
    { role: "ava",      text: "Of course! Mornings or afternoons?" },
    { role: "customer", text: "Mornings. Tuesday or Wednesday?" },
    { role: "ava",      text: "Tuesday at 9am is open — can I get your name?" },
    { role: "customer", text: "Sarah Collins." },
    { role: "ava",      text: "Done, Sarah! You're set for Tuesday 9am. Sending a confirmation text now! 😊" },
  ];
  if (scene === 0) return (
    <div className="text-center space-y-5">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">Incoming call · 2:14 AM · office is closed</div>
      <Ring color={color} emoji="📞" />
      <div className="anim-slideUp text-white font-semibold" style={{ animationDelay: "200ms" }}>Ava answers in 0 seconds</div>
      <div className="flex justify-center gap-3 flex-wrap">
        <Tag text="0s wait time" color={color} pulse delay={300} />
        <Tag text="24 / 7 / 365" color="#22c55e" delay={450} />
        <Tag text="No voicemail" color="#f59e0b" delay={600} />
      </div>
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">Live transcript · Houston Dental</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} delay={0} />)}
      {tick < lines.length && <div className="flex gap-1 pl-9"><span className="text-xs text-gray-600 animate-pulse">Ava is typing…</span></div>}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-2">Calendar · auto-updated</div>
      {[["Mon","Full",false],["Tue 9am","Sarah Collins ✓",true],["Tue 11am","James R.",false],["Wed 10am","Available",false]].map(([day, label, active], i) => (
        <div key={i} className="anim-slideUp flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
          style={{ background: active ? `${color}1a` : "rgba(255,255,255,0.04)", border: `1px solid ${active ? color + "44" : "rgba(255,255,255,0.07)"}`, transform: active ? "scale(1.02)" : "scale(1)", animationDelay: `${i * 80}ms` }}>
          <span className="text-xs w-16 text-gray-500">{day}</span>
          <span className="text-sm" style={{ color: active ? "#fff" : "#6b7280" }}>{label}</span>
          {active && <span className="ml-auto anim-popIn text-xs font-bold" style={{ color }}>Just booked</span>}
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">Results after 30 days</div>
      <BarChart bars={[{ label: "Calls answered", value: 100, max: 100 }, { label: "After-hours", value: 47, max: 100 }, { label: "Bookings", value: 94, max: 100 }]} color={color} />
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Appts booked" value="312" color={color} delay={200} />
        <StatCard label="Missed calls" value="0" color="#22c55e" delay={350} />
        <StatCard label="Revenue added" value="$18k" color="#f59e0b" delay={500} />
      </div>
    </div>
  );
}

function SceneNova(scene: number, tick: number, color: string) {
  const lines = [
    { role: "customer", text: "My order hasn't arrived and it's been 8 days!" },
    { role: "nova",     text: "I'm really sorry — let me pull up your order right now. Can I get your order number?" },
    { role: "customer", text: "CC-48821." },
    { role: "nova",     text: "Found it! Carrier delay — arriving tomorrow by 6pm. And I'm adding a 15% discount to your next order right now." },
    { role: "customer", text: "Oh wow, thanks. That's actually pretty helpful." },
    { role: "nova",     text: "Of course! Is there anything else I can do for you today?" },
  ];
  const issues = ["Order status inquiry", "Password reset", "Refund request", "Appointment change", "Product question"];
  if (scene === 0) return (
    <div className="space-y-2">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">Support queue · Monday 7:42 AM · 47 tickets</div>
      {issues.map((item, i) => (
        <CheckItem key={item} text={item} color={color} delay={i * 300} done={tick > i} />
      ))}
      {tick >= issues.length && <div className="anim-popIn text-center mt-2"><Tag text="All resolved in under 2 seconds each" color={color} pulse /></div>}
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">Live support chat</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-2">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">Before vs After Nova</div>
      {[["Response time","4 hours","< 2 seconds",100],["Resolution rate","71%","94%",94],["CSAT score","3.6 / 5","4.9 / 5",98],["Escalations","45%","6%",6]].map(([label, before, after, bar], i) => (
        <div key={label as string} className="anim-slideUp px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animationDelay: `${i * 100}ms` }}>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-400">{label as string}</span>
            <div className="flex gap-2"><span className="text-gray-600 line-through">{before as string}</span><span className="font-bold" style={{ color }}>{after as string}</span></div>
          </div>
          <Bar pct={bar as number} color={color} delay={i * 120} />
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-4 text-center">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">Monthly cost comparison</div>
      <div className="grid grid-cols-2 gap-4">
        {[["❌","Human team (3 agents)","$14,400 / mo","rgba(239,68,68,0.08)","rgba(239,68,68,0.2)"],
          ["✅","Nova AI","~$800 / mo",`${color}12`,`${color}33`]].map(([icon,label,cost,bg,border]) => (
          <div key={label as string} className="anim-popIn rounded-xl p-5" style={{ background: bg as string, border: `1px solid ${border}` }}>
            <div className="text-3xl mb-2">{icon as string}</div>
            <div className="text-xs text-gray-400 mb-1">{label as string}</div>
            <div className="font-bold text-white">{cost as string}</div>
          </div>
        ))}
      </div>
      <Tag text="94% lower support cost" color={color} pulse />
    </div>
  );
}

function SceneAtlas(scene: number, tick: number, color: string) {
  const lines = [
    { role: "atlas", text: "Hey Marcus! Atlas here from Houston Roofing — you just requested an estimate, right?" },
    { role: "lead",  text: "Yeah, filled out the form like 2 minutes ago." },
    { role: "atlas", text: "Perfect timing! Is this storm damage or a planned replacement?" },
    { role: "lead",  text: "Storm damage — bad hail last week." },
    { role: "atlas", text: "We do those a lot. Insurance claim situation — want me to get our estimator out to you tomorrow morning?" },
    { role: "lead",  text: "Yeah, 9am works." },
    { role: "atlas", text: "9am is yours. Confirmation going to your phone now. See you tomorrow!" },
  ];
  if (scene === 0) return (
    <div className="text-center space-y-5">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">Lead submitted · 11:47 PM</div>
      <Ring color={color} emoji="⚡" />
      <div className="anim-slideUp space-y-1" style={{ animationDelay: "200ms" }}>
        <div className="text-white font-semibold text-lg">Atlas calls in 52 seconds</div>
        <div className="text-xs text-gray-500">Industry average response: 42 hours</div>
      </div>
      <div className="anim-slideUp mx-auto max-w-xs rounded-xl overflow-hidden" style={{ animationDelay: "400ms", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-4 py-2 text-xs text-gray-400" style={{ background: "#0a0b10" }}>Response time comparison</div>
        {[["Competitors (avg)","42 hrs",4],["Email follow-up","6 hrs",1.5],["Atlas AI","52 sec",0.05]].map(([label, time, pct], i) => (
          <div key={label as string} className="px-4 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{label as string}</span><span style={{ color: i === 2 ? color : "#6b7280" }}>{time as string}</span></div>
            <Bar pct={(pct as number) * 25} color={i === 2 ? color : "#374151"} delay={i * 200} />
          </div>
        ))}
      </div>
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">Qualification call · live</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-2">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-2">CRM · auto-updated in real time</div>
      {[["Name","Marcus Johnson"],["Status","Qualified → Appt Set"],["Meeting","Tomorrow 9:00 AM"],["Type","Insurance Claim"],["Lead Score","91 / 100"],["Source","Atlas AI Call"]].map(([k,v], i) => (
        <div key={k} className="anim-slideIn flex items-center gap-3 px-4 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animationDelay: `${i * 80}ms` }}>
          <span className="text-xs text-gray-500 w-20 flex-shrink-0">{k}</span>
          <span className="text-sm text-white font-medium">{v}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">90-day pipeline impact</div>
      <BarChart bars={[{ label: "Leads reached", value: 100, max: 100 }, { label: "Meetings set", value: 78, max: 100 }, { label: "Close rate", value: 62, max: 100 }]} color={color} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Revenue added" value="$84k" color={color} delay={200} />
        <StatCard label="Response time" value="< 90s" color="#22c55e" delay={350} />
      </div>
    </div>
  );
}

function SceneEcho(scene: number, tick: number, color: string) {
  const lines = [
    { role: "echo",    text: "Hey there! 👋 Looking for anything specific or just browsing?" },
    { role: "visitor", text: "Need a website for my restaurant — how much?" },
    { role: "echo",    text: "Depends on the features! Do you need online ordering, reservations, or just an info site?" },
    { role: "visitor", text: "Reservations and a menu." },
    { role: "echo",    text: "We've done a bunch of those — typically $1,200–2,000. Want a free custom quote?" },
    { role: "visitor", text: "Yeah, how do I get one?" },
    { role: "echo",    text: "Drop your email and I'll have someone send a breakdown within the hour. No obligation at all!" },
  ];
  if (scene === 0) return (
    <div className="text-center space-y-4">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">Visitor arrives via Google · page loaded</div>
      <div className="anim-slideUp mx-auto max-w-xs rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex gap-1.5 px-3 py-2" style={{ background: "#1a1b24" }}>
          {["#ef4444","#f59e0b","#22c55e"].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
          <div className="flex-1 mx-2 h-2.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
        <div className="p-4 space-y-2" style={{ background: "#13141b" }}>
          <div className="h-2 rounded w-3/4" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="h-2 rounded w-1/2" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="h-2 rounded w-2/3" style={{ background: "rgba(255,255,255,0.04)" }} />
          {tick > 0 && (
            <div className="anim-floatUp flex items-end gap-2 pt-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: color, boxShadow: `0 0 12px ${color}66` }}>E</div>
              <div className="rounded-2xl px-3 py-2 text-xs" style={{ background: `${color}22`, border: `1px solid ${color}44`, color: "#e4e6f0" }}>
                Hey! 👋 Can I help you find anything?
              </div>
            </div>
          )}
        </div>
      </div>
      <Tag text="Engages in 1.2 seconds" color={color} pulse delay={600} />
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">Live website chat</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-2">Lead captured automatically</div>
      <div className="anim-popIn rounded-xl p-4" style={{ background: "#13141b", border: `1px solid ${color}44`, boxShadow: `0 0 20px ${color}22` }}>
        {[["Intent","Restaurant site — reservations + menu"],["Budget","$1,200–2,000"],["Source","Google → Echo"],["Status","Quote requested"],["Time","12 seconds to capture"]].map(([k,v], i) => (
          <div key={k} className="anim-slideIn flex gap-3 py-1.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.06)", animationDelay: `${i * 80}ms` }}>
            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{k}</span>
            <span className="text-xs text-white">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center"><Tag text="Added to CRM instantly" color={color} pulse /></div>
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">60-day conversion lift</div>
      <BarChart bars={[{ label: "Engaged", value: 68, max: 100 }, { label: "Qualified", value: 54, max: 100 }, { label: "Converted", value: 38, max: 100 }]} color={color} />
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Leads captured" value="+220%" color={color} delay={200} />
        <StatCard label="Bounce rate" value="-41%" color="#22c55e" delay={350} />
        <StatCard label="Revenue" value="+$31k" color="#f59e0b" delay={500} />
      </div>
    </div>
  );
}

function ScenePulse(scene: number, tick: number, color: string) {
  const beforeTasks = ["Check email & update CRM (45 min)","Send follow-up emails (20 min)","Generate weekly reports (40 min)","Data entry (60 min)","Invoice processing (30 min)"];
  const autoSteps = ["New inquiry email received","Contact added to CRM","Follow-up task created","Welcome email sent","Slack notification fired","Invoice queued in QuickBooks"];
  const workflows = [
    "New lead → CRM entry → Follow-up email → Slack alert",
    "Contract signed → Project created → Kickoff scheduled",
    "Support ticket → Routed → SLA timer started → Team notified",
  ];
  if (scene === 0) return (
    <div className="space-y-2">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">Without Pulse · every single morning</div>
      {beforeTasks.map((task, i) => (
        <div key={i} className="anim-slideIn flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", animationDelay: `${i * 100}ms` }}>
          <span className="text-red-400 text-xs flex-shrink-0">✗</span>
          <span className="text-sm text-gray-300">{task}</span>
        </div>
      ))}
      <div className="anim-popIn text-center text-xs text-gray-500 pt-1" style={{ animationDelay: "600ms" }}>3+ hours of manual work · every day · forever</div>
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">With Pulse · triggered automatically</div>
      {autoSteps.map((step, i) => <CheckItem key={step} text={step} color={color} delay={i * 500} done={tick > i} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-2">Sample workflows running 24/7</div>
      {workflows.map((wf, i) => (
        <div key={i} className="anim-slideUp rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animationDelay: `${i * 120}ms` }}>
          <div className="flex gap-1 items-center flex-wrap">
            {wf.split("→").map((step, j, arr) => (
              <span key={j} className="flex items-center gap-1">
                <span className="text-xs text-gray-300">{step.trim()}</span>
                {j < arr.length - 1 && <ChevronRight size={10} className="text-gray-600 flex-shrink-0" />}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">Time & cost saved · per month</div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Hours automated" value="87 hrs" color={color} delay={100} bar={87} />
        <StatCard label="Tasks completed" value="1,240" color={color} delay={200} bar={94} />
        <StatCard label="Error rate" value="~0%" color="#22c55e" delay={300} bar={99} />
        <StatCard label="Cost saved" value="$4,350" color="#f59e0b" delay={400} bar={72} />
      </div>
    </div>
  );
}

function SceneOrion(scene: number, tick: number, color: string) {
  const posts = [
    { platform: "LinkedIn", text: "Most homeowners don't realize their HVAC loses 15% efficiency every 5 years. Here's what to watch for before summer hits..." },
    { platform: "Instagram", text: "We saved a Houston restaurant $2,400/month using AI inventory tracking. No new staff. Just smarter systems. 🤖" },
    { platform: "Facebook", text: "❓ Quick poll: What's slowing your business down most right now?" },
  ];
  if (scene === 0) return (
    <div className="space-y-4 text-center">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">Content brief → Orion generates</div>
      <div className="anim-slideUp mx-auto max-w-xs rounded-xl p-4 text-left" style={{ background: "#13141b", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="text-xs text-gray-500 mb-2">Brief</div>
        <div className="text-sm text-gray-300 font-mono text-xs leading-relaxed">
          <Typed value="HVAC company · Houston · Target: homeowners · Tone: helpful expert · Goal: book service calls" delay={200} />
        </div>
      </div>
      {tick > 1 && (
        <div className="anim-slideUp flex justify-center gap-2 flex-wrap" style={{ animationDelay: "100ms" }}>
          {["LinkedIn","Instagram","Facebook","Email","Blog","Google Ad"].map((p, i) => <Tag key={p} text={p} color={color} delay={i * 80} />)}
        </div>
      )}
      {tick > 3 && <Tag text="6 assets generated in 11 seconds" color={color} pulse />}
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-3">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-2">Generated posts · ready to publish</div>
      {posts.slice(0, Math.min(tick + 1, posts.length)).map((p, i) => (
        <div key={i} className="anim-floatUp rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Tag text={p.platform} color={color} />
            <span className="text-[10px] text-green-500 ml-auto">Ready</span>
          </div>
          <div className="text-xs text-gray-300 leading-relaxed">{p.text}</div>
        </div>
      ))}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-2">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-2">Email campaign · auto-built</div>
      {[["Subject","Is your AC ready for Houston summer?"],["Segment","Customers 2+ yrs no service"],["Send time","Tue 9am · peak open rate"],["Predicted open","34% (avg: 19%)"],["CTA","Book summer tune-up — $49 special"]].map(([k,v], i) => (
        <div key={k} className="anim-slideIn flex gap-3 px-4 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animationDelay: `${i * 100}ms` }}>
          <span className="text-xs text-gray-500 w-24 flex-shrink-0">{k}</span>
          <span className="text-xs text-white">{v}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">Monthly marketing output</div>
      <BarChart bars={[{ label: "Posts", value: 62, max: 80 }, { label: "Emails", value: 75, max: 80 }, { label: "Ads", value: 45, max: 80 }]} color={color} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Team hours saved" value="54 hrs" color={color} delay={200} />
        <StatCard label="Engagement up" value="+280%" color="#22c55e" delay={350} />
      </div>
    </div>
  );
}

function SceneAmy(scene: number, tick: number, color: string) {
  const lines = [
    { role: "amy",  text: "Hey, it's Amy from CyberCraft360 — good time?" },
    { role: "lead", text: "Yeah, what's this about?" },
    { role: "amy",  text: "Quick one — I saw Marcus Auto and wanted to ask what's eating the most time in your day?" },
    { role: "lead", text: "Probably missing calls when we're heads-down on a car." },
    { role: "amy",  text: "That's exactly what we fix — AI that answers every call 24/7. Want 30 minutes with Saad?" },
    { role: "lead", text: "Sure, yeah." },
    { role: "amy",  text: "Perfect! What's the best email for the calendar invite?" },
  ];
  if (scene === 0) return (
    <div className="text-center space-y-5">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">Lead submitted form · 47 seconds ago</div>
      <Ring color={color} emoji="🎙️" />
      <div className="anim-slideUp space-y-1" style={{ animationDelay: "250ms" }}>
        <div className="text-white font-semibold">Amy is calling Marcus</div>
        <div className="text-xs text-gray-500">+1 (713) 555-0182</div>
      </div>
      <div className="flex justify-center gap-3 flex-wrap">
        <Tag text="47s response time" color={color} pulse delay={400} />
        <Tag text="Sounds human" color="#22c55e" delay={550} />
      </div>
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">Live call transcript · Marcus Auto Repair</div>
      {lines.slice(0, Math.min(tick + 1, lines.length)).map((l, i) => <Bubble key={i} {...l} color={color} />)}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-3">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-2">Admin dashboard · live</div>
      <div className="anim-popIn rounded-xl p-4" style={{ background: "#13141b", border: `1px solid ${color}44`, boxShadow: `0 0 24px ${color}22` }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-white font-semibold">Marcus Johnson</div>
            <div className="text-gray-400 text-xs">Marcus Auto Repair</div>
          </div>
          <div className="anim-popIn" style={{ animationDelay: "300ms" }}><Tag text="Booked ✓" color="#22c55e" pulse /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Duration" value="2m 14s" color={color} delay={200} />
          <StatCard label="Turns" value="7" color={color} delay={300} />
          <StatCard label="Response" value="47s" color="#22c55e" delay={400} />
        </div>
      </div>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">You receive this the moment Amy hangs up</div>
      <div className="anim-floatUp rounded-xl p-4" style={{ background: "#13141b", border: "1px solid rgba(34,197,94,0.4)", boxShadow: "0 0 20px rgba(34,197,94,0.15)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>📞</div>
          <div>
            <div className="text-white text-sm font-semibold">Amy Booked: Marcus — Marcus Auto Repair</div>
            <div className="text-green-500 text-xs">just now · cybercraftlimited@gmail.com</div>
          </div>
        </div>
        {[["Email","marcus@marcusauto.com"],["Availability","Weekday mornings"],["Pain point","Missing calls during busy hours"]].map(([k,v], i) => (
          <div key={k} className="anim-slideIn flex gap-2 text-xs py-1.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.06)", animationDelay: `${i * 100 + 200}ms` }}>
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
    { time: "02:14:07", type: "Anomaly", detail: "Unusual login — Singapore IP", sev: "high" },
    { time: "02:14:08", type: "Auto-blocked", detail: "IP range blacklisted instantly", sev: "ok" },
    { time: "02:14:09", type: "MFA triggered", detail: "Account locked pending verify", sev: "ok" },
    { time: "02:14:11", type: "Alert sent", detail: "Owner notified via SMS", sev: "ok" },
    { time: "02:14:13", type: "Neutralized", detail: "Zero data accessed", sev: "ok" },
  ];
  if (scene === 0) return (
    <div className="text-center space-y-5">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">System monitor · 02:14 AM · you're asleep</div>
      <Ring color={color} emoji="🛡️" />
      <div className="anim-slideUp space-y-1" style={{ animationDelay: "250ms" }}>
        <div className="text-white font-semibold">Threat detected · responded in 1.2s</div>
        <div className="text-xs" style={{ color }}>Neutralized before you woke up</div>
      </div>
      <Tag text="Always watching · Zero downtime" color={color} pulse delay={400} />
    </div>
  );
  if (scene === 1) return (
    <div className="space-y-2">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-3">Incident response log · automated</div>
      {events.slice(0, Math.min(tick + 1, events.length)).map((e, i) => (
        <div key={i} className="anim-slideIn flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: e.sev === "high" ? "rgba(239,68,68,0.1)" : `${color}0e`, border: `1px solid ${e.sev === "high" ? "rgba(239,68,68,0.25)" : color + "30"}`, animationDelay: "0ms" }}>
          <span className="text-[10px] font-mono text-gray-600 flex-shrink-0 w-16">{e.time}</span>
          <span className="text-xs font-bold flex-shrink-0" style={{ color: e.sev === "high" ? "#ef4444" : color }}>{e.type}</span>
          <span className="text-xs text-gray-400">{e.detail}</span>
        </div>
      ))}
    </div>
  );
  if (scene === 2) return (
    <div className="space-y-2">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono mb-2">30-day threat report</div>
      {[["Threats blocked","1,847",100],["Auto-responses","100%",100],["Data breaches","0",0],["Downtime","0 min",0],["Compliance alerts","0",0]].map(([k,v,bar], i) => (
        <div key={k as string} className="anim-slideUp px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", animationDelay: `${i * 80}ms` }}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">{k as string}</span>
            <span className="font-bold" style={{ color: (v === "0" || v === "0 min") ? "#22c55e" : color }}>{v as string}</span>
          </div>
          <Bar pct={bar as number} color={(v === "0" || v === "0 min") ? "#22c55e" : color} delay={i * 100} />
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="anim-fadeIn text-xs text-gray-500 font-mono">What Aegis protects</div>
      <div className="grid grid-cols-2 gap-3">
        {[["🔐","Customer data","Always encrypted"],["🚫","Login attempts","Auto-blocked"],["⚡","API endpoints","Rate limited"],["📋","Compliance","Auto-reported"]].map(([icon,label,desc], i) => (
          <div key={label as string} className="anim-popIn rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", animationDelay: `${i * 100}ms` }}>
            <div className="text-2xl mb-2">{icon as string}</div>
            <div className="text-xs text-gray-400 mb-1">{label as string}</div>
            <div className="text-xs font-bold" style={{ color }}>{desc as string}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── service registry ─────────────────────────────────────────── */
interface ServiceDemo { color: string; emoji: string; scenes: { id: string; label: string; duration: number }[]; render: (s: number, t: number, c: string) => React.ReactNode }

const DEMOS: Record<string, ServiceDemo> = {
  Ava:   { color: "#00d4ff", emoji: "🤖", scenes: [{ id:"call",label:"Incoming call",duration:6000 },{ id:"convo",label:"Live conversation",duration:9000 },{ id:"cal",label:"Appointment booked",duration:6500 },{ id:"res",label:"30-day results",duration:6500 }], render: SceneAva },
  Nova:  { color: "#7c3aed", emoji: "🎧", scenes: [{ id:"q",label:"Support queue",duration:7000 },{ id:"chat",label:"Live resolution",duration:9000 },{ id:"m",label:"CSAT improvement",duration:6500 },{ id:"cost",label:"Cost comparison",duration:6000 }], render: SceneNova },
  Atlas: { color: "#a855f7", emoji: "💼", scenes: [{ id:"call",label:"52s response",duration:7000 },{ id:"convo",label:"Qualification call",duration:9000 },{ id:"crm",label:"CRM updated",duration:6500 },{ id:"pip",label:"Pipeline impact",duration:6000 }], render: SceneAtlas },
  Echo:  { color: "#00d4ff", emoji: "💬", scenes: [{ id:"eng",label:"Visitor engages",duration:6500 },{ id:"chat",label:"Live chat",duration:9000 },{ id:"lead",label:"Lead captured",duration:6000 },{ id:"lift",label:"Conversion lift",duration:6000 }], render: SceneEcho },
  Pulse: { color: "#10b981", emoji: "⚙️", scenes: [{ id:"bef",label:"Before Pulse",duration:6500 },{ id:"auto",label:"Automation fires",duration:9000 },{ id:"wf",label:"Sample workflows",duration:6000 },{ id:"sav",label:"Time saved",duration:6000 }], render: ScenePulse },
  Orion: { color: "#f59e0b", emoji: "📈", scenes: [{ id:"brief",label:"Brief → content",duration:7000 },{ id:"posts",label:"Social posts",duration:8000 },{ id:"email",label:"Email campaign",duration:6500 },{ id:"out",label:"Monthly output",duration:6000 }], render: SceneOrion },
  Amy:   { color: "#e64dff", emoji: "🎙️", scenes: [{ id:"call",label:"Amy calls lead",duration:6000 },{ id:"convo",label:"Sales conversation",duration:9000 },{ id:"dash",label:"Live dashboard",duration:6500 },{ id:"email",label:"Booking email",duration:6000 }], render: SceneAmy },
  Aegis: { color: "#ef4444", emoji: "🛡️", scenes: [{ id:"det",label:"Threat detected",duration:6000 },{ id:"res",label:"Auto-response",duration:8500 },{ id:"rep",label:"Threat report",duration:6500 },{ id:"cov",label:"What's protected",duration:6000 }], render: SceneAegis },
};

const SERVICE_ORDER = ["Ava","Nova","Atlas","Echo","Pulse","Orion","Amy","Aegis"];

function useTick(active: boolean) {
  const [tick, setTick] = useState(0);
  useEffect(() => { setTick(0); if (!active) return; const iv = setInterval(() => setTick(n => n + 1), 700); return () => clearInterval(iv); }, [active]);
  return tick;
}

/* ─── modal ─────────────────────────────────────────────────────── */
export default function HowItWorksModal({ open, onClose, service }: Props) {
  const [activeSvc, setActiveSvc] = useState(service || "Amy");
  const [scene, setScene] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const demo = DEMOS[activeSvc] ?? DEMOS["Amy"];
  const tick = useTick(playing && open);

  useEffect(() => { injectCSS(); }, []);

  function goScene(s: number) { setScene(s); setProgress(0); setPlaying(true); }
  function switchSvc(name: string) { setActiveSvc(name); goScene(0); }

  useEffect(() => { if (open) { setActiveSvc(service || "Amy"); goScene(0); } }, [open, service]);

  useEffect(() => {
    if (!open || !playing) return;
    const dur = demo.scenes[scene]?.duration ?? 7000;
    progressRef.current = setInterval(() => setProgress(p => Math.min(p + (60 / dur) * 100, 100)), 60);
    timerRef.current = setTimeout(() => {
      if (sceneRef.current < demo.scenes.length - 1) { setScene(s => s + 1); setProgress(0); }
      else setPlaying(false);
    }, dur);
    return () => { clearInterval(progressRef.current!); clearTimeout(timerRef.current!); };
  }, [scene, playing, open, activeSvc]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#0d0e13", border: `1px solid ${demo.color}55`, boxShadow: `0 0 60px ${demo.color}22`, maxHeight: "92vh" }}>

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <div className="text-[10px] font-bold tracking-[0.22em] uppercase mb-0.5" style={{ color: demo.color }}>CyberCraft360 · Live Demo</div>
            <div className="text-white font-semibold text-sm">{demo.emoji} {activeSvc} — See it in action</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"><X size={18} /></button>
        </div>

        {/* service picker */}
        <div className="flex gap-1.5 px-4 py-3 border-b overflow-x-auto flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a0b10" }}>
          {SERVICE_ORDER.map(name => {
            const d = DEMOS[name]; const active = name === activeSvc;
            return (
              <button key={name} onClick={() => switchSvc(name)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={{ background: active ? `${d.color}22` : "rgba(255,255,255,0.04)", border: `1px solid ${active ? d.color + "66" : "rgba(255,255,255,0.07)"}`, color: active ? "#fff" : "#4b5263", boxShadow: active ? `0 0 12px ${d.color}33` : "none" }}>
                <span>{d.emoji}</span><span className="hidden sm:inline">{name}</span>
              </button>
            );
          })}
        </div>

        {/* scene tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0b10" }}>
          {demo.scenes.map((s, i) => (
            <button key={s.id} onClick={() => goScene(i)}
              className="flex-1 px-2 py-2.5 text-[10px] font-semibold transition-all relative truncate"
              style={{ color: i === scene ? "#fff" : i < scene ? demo.color : "#2d3344", borderBottom: i === scene ? `2px solid ${demo.color}` : "2px solid transparent" }}>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
              {i === scene && (
                <div className="absolute bottom-0 left-0 h-[2px] rounded-r-full transition-all duration-75"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${demo.color}, #fff)` }} />
              )}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="p-6 overflow-y-auto flex-1" style={{ minHeight: 300 }}>
          <div key={`${activeSvc}-${scene}`}>
            {demo.render(scene, tick, demo.color)}
          </div>
        </div>

        {/* controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a0b10" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setPlaying(p => !p)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: `${demo.color}22`, border: `1px solid ${demo.color}55`, color: demo.color, boxShadow: `0 0 8px ${demo.color}33` }}>
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <span className="text-xs text-gray-500">{scene + 1}/{demo.scenes.length} · <span style={{ color: demo.color }}>{demo.scenes[scene]?.label}</span></span>
          </div>
          <div className="flex gap-2">
            {scene === demo.scenes.length - 1 && !playing && (
              <button onClick={() => goScene(0)} className="text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: `${demo.color}22`, border: `1px solid ${demo.color}55`, color: demo.color }}>Replay</button>
            )}
            {scene < demo.scenes.length - 1 && (
              <button onClick={() => goScene(scene + 1)} className="text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: `linear-gradient(135deg, ${demo.color}cc, ${demo.color}88)`, color: "#fff" }}>Next →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
