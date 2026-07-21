"use client";

import { useEffect, useRef, useState } from "react";
import { X, Play, Pause } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SCENES = [
  { id: "form",      label: "Lead submits form",          duration: 4000 },
  { id: "calling",   label: "Amy calls in 60 seconds",    duration: 3500 },
  { id: "transcript",label: "Live call transcript",        duration: 7000 },
  { id: "dashboard", label: "Lead appears in dashboard",  duration: 4000 },
  { id: "booked",    label: "Booking notification sent",  duration: 3500 },
];

const TRANSCRIPT = [
  { role: "amy",    text: "Hey, it's Amy from CyberCraft360 — good time?" },
  { role: "caller", text: "Yeah, what's this about?" },
  { role: "amy",    text: "Honestly just a quick one — I saw Marcus Auto and wanted to ask, what's eating the most time in your day right now?" },
  { role: "caller", text: "Probably missing calls when we're with customers." },
  { role: "amy",    text: "That's actually exactly what we fix. We build an AI that answers every call 24/7 so you never lose a lead while you're heads-down on a car. Want me to get you 30 minutes with Saad?" },
  { role: "caller", text: "Yeah, sure — what's the calendar link?" },
  { role: "amy",    text: "I'll book it right now. What's the best email for the invite?" },
];

export default function HowItWorksModal({ open, onClose }: Props) {
  const [scene, setScene] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visibleLines, setVisibleLines] = useState(0);
  const [formStage, setFormStage] = useState(0);
  const [dashboardIn, setDashboardIn] = useState(false);
  const [bookedIn, setBookedIn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  function reset() {
    setScene(0); setProgress(0); setPlaying(true);
    setVisibleLines(0); setFormStage(0); setDashboardIn(false); setBookedIn(false);
  }

  useEffect(() => { if (open) reset(); }, [open]);

  useEffect(() => {
    if (!open || !playing) return;
    const dur = SCENES[scene]?.duration ?? 4000;

    // progress bar
    const tick = 50;
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + (tick / dur) * 100, 100));
    }, tick);

    // scene-specific animations
    if (scene === 0) {
      const stages = [300, 900, 1600, 2400];
      stages.forEach((t, i) => setTimeout(() => setFormStage(i + 1), t));
    }
    if (scene === 2) {
      TRANSCRIPT.forEach((_, i) => {
        setTimeout(() => setVisibleLines(i + 1), i * 850 + 300);
      });
    }
    if (scene === 3) {
      setTimeout(() => setDashboardIn(true), 600);
    }
    if (scene === 4) {
      setTimeout(() => setBookedIn(true), 700);
    }

    timerRef.current = setTimeout(() => {
      if (sceneRef.current < SCENES.length - 1) {
        setScene(s => s + 1);
        setProgress(0);
        setVisibleLines(0);
        setFormStage(0);
        setDashboardIn(false);
        setBookedIn(false);
      } else {
        setPlaying(false);
      }
    }, dur);

    return () => {
      clearInterval(progressRef.current!);
      clearTimeout(timerRef.current!);
    };
  }, [scene, playing, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0d0e13", border: "1px solid rgba(124,58,237,0.3)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: "#7c3aed" }}>CyberCraft360 · Live Demo</div>
            <div className="text-white font-semibold text-sm">See the full AI workflow in action</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Scene tabs */}
        <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a0b10" }}>
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setScene(i); setProgress(0); setVisibleLines(0); setFormStage(0); setDashboardIn(false); setBookedIn(false); setPlaying(true); }}
              className="flex-1 px-2 py-3 text-[10px] font-semibold transition-all relative"
              style={{
                color: i === scene ? "#fff" : i < scene ? "#7c3aed" : "#4b5263",
                borderBottom: i === scene ? "2px solid #7c3aed" : "2px solid transparent",
              }}
            >
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
              {i === scene && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
                  style={{ width: `${progress}%` }} />
              )}
            </button>
          ))}
        </div>

        {/* Scene content */}
        <div className="p-6 min-h-[340px] flex flex-col justify-center" style={{ background: "#0d0e13" }}>

          {/* SCENE 0: Form fill */}
          {scene === 0 && (
            <div className="max-w-sm mx-auto w-full">
              <div className="text-xs text-gray-500 mb-4 font-mono">cybercraft360.com · Contact Form</div>
              <div className="rounded-xl p-5 space-y-3" style={{ background: "#13141b", border: "1px solid rgba(255,255,255,0.07)" }}>
                <FormField label="Your Name" value="Marcus Johnson" visible={formStage >= 1} />
                <FormField label="Phone Number" value="+1 (713) 555-0182" visible={formStage >= 2} />
                <FormField label="Business Name" value="Marcus Auto Repair" visible={formStage >= 3} />
                <FormField label="What can we help with?" value="Missing customer calls during busy hours" visible={formStage >= 4} textarea />
                {formStage >= 4 && (
                  <div className="pt-1">
                    <div className="w-full py-2.5 rounded-lg text-center text-sm font-bold text-white animate-pulse"
                      style={{ background: "linear-gradient(135deg,#00d4ff,#7c3aed)" }}>
                      Submit →
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCENE 1: Amy calling */}
          {scene === 1 && (
            <div className="text-center space-y-6">
              <div className="text-xs text-gray-500 font-mono">T+47 seconds after form submission</div>
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto relative z-10"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#00d4ff)" }}>
                  📞
                </div>
                {[1,2,3].map(i => (
                  <div key={i} className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: "rgba(124,58,237,0.15)", animationDelay: `${i * 0.3}s`, animationDuration: "1.5s" }} />
                ))}
              </div>
              <div>
                <div className="text-white font-semibold text-lg">Amy is calling Marcus</div>
                <div className="text-gray-400 text-sm mt-1">+1 (713) 555-0182</div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                AI call initiated · 47s response time
              </div>
            </div>
          )}

          {/* SCENE 2: Transcript */}
          {scene === 2 && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              <div className="text-xs text-gray-500 font-mono mb-2">Live call transcript · Marcus Auto Repair</div>
              {TRANSCRIPT.slice(0, visibleLines).map((line, i) => (
                <div key={i} className={`flex gap-3 items-start transition-all duration-300 ${line.role === "amy" ? "flex-row" : "flex-row-reverse"}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: line.role === "amy" ? "linear-gradient(135deg,#7c3aed,#00d4ff)" : "rgba(255,255,255,0.08)", color: "#fff" }}>
                    {line.role === "amy" ? "A" : "M"}
                  </div>
                  <div className="rounded-2xl px-3 py-2 text-sm max-w-[75%]"
                    style={{
                      background: line.role === "amy" ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.06)",
                      border: line.role === "amy" ? "1px solid rgba(124,58,237,0.25)" : "1px solid rgba(255,255,255,0.08)",
                      color: "#e4e6f0",
                    }}>
                    {line.text}
                  </div>
                </div>
              ))}
              {visibleLines < TRANSCRIPT.length && playing && (
                <div className="flex gap-1 pl-10">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCENE 3: Dashboard */}
          {scene === 3 && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 font-mono mb-2">Admin Dashboard · cybercraft360.com/admin</div>
              <div className={`rounded-xl p-4 transition-all duration-700 ${dashboardIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ background: "#13141b", border: "1px solid rgba(124,58,237,0.3)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-semibold">Marcus Johnson</div>
                    <div className="text-gray-400 text-xs">Marcus Auto Repair · Houston, TX</div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>Booked</span>
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>Score: 87</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-3 italic">"Missing customer calls during busy hours"</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[["Call Duration","2m 14s"],["Turns","7"],["Response","47s"]].map(([l,v]) => (
                    <div key={l} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="text-white font-semibold text-sm">{v}</div>
                      <div className="text-gray-500 text-[10px]">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCENE 4: Booking email */}
          {scene === 4 && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 font-mono mb-2">cybercraftlimited@gmail.com · Inbox</div>
              <div className={`rounded-xl p-4 transition-all duration-700 ${bookedIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ background: "#13141b", border: "1px solid rgba(34,197,94,0.3)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>📞</div>
                  <div>
                    <div className="text-white text-sm font-semibold">Amy Booked: Marcus — Marcus Auto Repair</div>
                    <div className="text-gray-500 text-xs">just now · from Amy via CyberCraft360</div>
                  </div>
                </div>
                <div className="space-y-2 text-xs" style={{ color: "#8b8fa8" }}>
                  {[["Email","marcus@marcusauto.com"],["Availability","Weekday mornings, any day"],["Company","Marcus Auto Repair"],["Pain","Missing calls during busy hours"]].map(([k,v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="w-20 flex-shrink-0">{k}</span>
                      <span style={{ color: "#e4e6f0" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {bookedIn && (
                <div className="text-center text-xs text-gray-500 animate-pulse">
                  Saad receives this the moment Amy hangs up ↑
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a0b10" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPlaying(p => !p)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa" }}>
              {playing ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <div className="text-xs text-gray-500">
              Step {scene + 1} of {SCENES.length} · <span style={{ color: "#a78bfa" }}>{SCENES[scene]?.label}</span>
            </div>
          </div>
          {scene === SCENES.length - 1 && !playing && (
            <button
              onClick={reset}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: "linear-gradient(135deg,#00d4ff,#7c3aed)", color: "#fff" }}>
              Watch Again
            </button>
          )}
          {scene < SCENES.length - 1 && (
            <button
              onClick={() => { setScene(s => s + 1); setProgress(0); setVisibleLines(0); setFormStage(0); setDashboardIn(false); setBookedIn(false); setPlaying(true); }}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, visible, textarea }: { label: string; value: string; visible: boolean; textarea?: boolean }) {
  const [typed, setTyped] = useState("");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!visible || hasStarted.current) return;
    hasStarted.current = true;
    let i = 0;
    const interval = setInterval(() => {
      setTyped(value.slice(0, i + 1));
      i++;
      if (i >= value.length) clearInterval(interval);
    }, 35);
    return () => clearInterval(interval);
  }, [visible, value]);

  if (!visible) return null;

  return (
    <div>
      <div className="text-[10px] text-gray-500 mb-1 font-medium">{label}</div>
      <div className={`w-full px-3 py-2 rounded-lg text-sm text-gray-200 ${textarea ? "min-h-[52px]" : ""}`}
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "monospace" }}>
        {typed}<span className="animate-pulse">|</span>
      </div>
    </div>
  );
}
