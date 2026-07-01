"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Calendar, Clock } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

export default function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [booking, setBooking] = useState<{ name: string; date: string; time: string; email: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots]     = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep]       = useState<"calendar" | "time" | "confirm" | "done">("calendar");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  // Load existing booking
  useEffect(() => {
    if (!id) return;
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(d => { if (d.booking) setBooking(d.booking); else setNotFound(true); })
      .catch(() => setNotFound(true));
  }, [id]);

  const fetchSlots = useCallback(async (dateStr: string) => {
    setLoadingSlots(true);
    setSlots([]);
    try {
      const res = await fetch(`/api/bookings/slots?date=${dateStr}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1);
  }

  async function confirmReschedule() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, time: selectedTime }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to reschedule."); return; }
      setStep("done");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const dateObj   = selectedDate ? new Date(`${selectedDate}T12:00:00`) : null;
  const dateLabel = dateObj ? dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "";

  const wrap = { minHeight:"100vh", background:"#0a0c12", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", fontFamily:"system-ui" } as React.CSSProperties;

  if (notFound) return (
    <div style={wrap}>
      <div style={{ textAlign:"center", color:"rgba(255,255,255,0.5)" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🔍</div>
        <p>Booking not found or already cancelled.</p>
        <a href="/book" style={{ color:"#00d4ff", fontSize:13 }}>Book a new session →</a>
      </div>
    </div>
  );

  if (!booking) return (
    <div style={wrap}><Loader2 size={24} className="animate-spin" style={{ color:"#00d4ff" }} /></div>
  );

  return (
    <div style={wrap}>
      <div style={{ width:"100%", maxWidth:440 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", margin:"0 0 10px" }}>CyberCraft360</p>
          <h1 style={{ fontSize:26, fontWeight:300, color:"#fff", margin:"0 0 8px", fontFamily:"Georgia,serif" }}>Reschedule Your Session</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", margin:0 }}>Hi {booking.name} — pick a new date and time below.</p>
        </div>

        {/* Current booking pill */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", marginBottom:16, fontSize:13, color:"rgba(255,255,255,0.4)" }}>
          <Clock size={13} style={{ color:"rgba(255,255,255,0.25)", flexShrink:0 }} />
          <span>Currently: <strong style={{ color:"rgba(255,255,255,0.65)" }}>{new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"})} at {fmt12(booking.time)} CT</strong></span>
        </div>

        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:16, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,0.4)" }}>
          <div style={{ height:3, background:"linear-gradient(90deg,#00d4ff,#7c3aed)" }} />

          <div style={{ padding:"16px 18px 4px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,212,255,0.1)", border:"1px solid rgba(0,212,255,0.2)", flexShrink:0 }}>
              <Calendar size={14} style={{ color:"#00d4ff" }} />
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:13, color:"#fff" }}>Choose a New Time</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>24/7 availability · Central Time</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* CALENDAR */}
            {step === "calendar" && (
              <motion.div key="cal" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }} style={{ padding:18 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <button onClick={prevMonth} style={{ width:30, height:30, borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <ChevronLeft size={14} style={{ color:"rgba(255,255,255,0.4)" }} />
                  </button>
                  <span style={{ fontWeight:600, fontSize:13, color:"#fff" }}>{MONTHS[viewMonth]} {viewYear}</span>
                  <button onClick={nextMonth} style={{ width:30, height:30, borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <ChevronRight size={14} style={{ color:"rgba(255,255,255,0.4)" }} />
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
                  {DAYS.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(255,255,255,0.2)", padding:"4px 0" }}>{d}</div>)}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px 0" }}>
                  {Array.from({ length: firstDay }).map((_,i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_,i) => {
                    const day = i + 1;
                    const key = dateKey(viewYear, viewMonth, day);
                    const isPast = key < todayKey;
                    const isToday = key === todayKey;
                    return (
                      <button key={key} disabled={isPast} onClick={() => { setSelectedDate(key); setSelectedTime(null); setStep("time"); }}
                        style={{ width:34, height:34, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border: isToday?"1px solid rgba(0,212,255,0.3)":"1px solid transparent", background: isToday?"rgba(0,212,255,0.1)":"transparent", color: isPast?"rgba(255,255,255,0.12)": isToday?"#00d4ff":"rgba(255,255,255,0.7)", fontSize:13, fontWeight:500, cursor: isPast?"not-allowed":"pointer" }}>
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:14, marginBottom:0 }}>Select a date to see available times</p>
              </motion.div>
            )}

            {/* TIME SLOTS */}
            {step === "time" && (
              <motion.div key="time" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }} style={{ padding:18 }}>
                <button onClick={() => setStep("calendar")} style={{ display:"flex", alignItems:"center", gap:4, marginBottom:14, fontSize:12, color:"rgba(255,255,255,0.35)", background:"none", border:"none", cursor:"pointer" }}>
                  <ChevronLeft size={13} /> Back
                </button>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <Clock size={13} style={{ color:"#00d4ff" }} />
                  <span style={{ fontWeight:600, fontSize:13, color:"#fff" }}>{dateLabel}</span>
                </div>
                {loadingSlots ? (
                  <div style={{ display:"flex", justifyContent:"center", padding:"32px 0" }}><Loader2 size={20} className="animate-spin" style={{ color:"#00d4ff" }} /></div>
                ) : slots.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"32px 0" }}>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13 }}>No available slots on this day.</p>
                    <button onClick={() => setStep("calendar")} style={{ color:"#00d4ff", fontSize:12, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>Choose another date</button>
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {slots.map(slot => (
                      <button key={slot} onClick={() => { setSelectedTime(slot); setStep("confirm"); }}
                        style={{ padding:"10px 12px", borderRadius:10, border:"1px solid rgba(0,212,255,0.2)", background:"rgba(0,212,255,0.06)", color:"#00d4ff", fontSize:13, fontWeight:500, cursor:"pointer" }}>
                        {fmt12(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* CONFIRM */}
            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }} style={{ padding:18 }}>
                <button onClick={() => setStep("time")} style={{ display:"flex", alignItems:"center", gap:4, marginBottom:14, fontSize:12, color:"rgba(255,255,255,0.35)", background:"none", border:"none", cursor:"pointer" }}>
                  <ChevronLeft size={13} /> Back
                </button>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:14 }}>Confirm your new session time:</p>
                <div style={{ background:"rgba(0,212,255,0.05)", border:"1px solid rgba(0,212,255,0.15)", borderRadius:12, padding:"16px 20px", marginBottom:18 }}>
                  <div style={{ fontWeight:700, color:"#fff", marginBottom:4 }}>{dateLabel}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{selectedTime && fmt12(selectedTime)} · Central Time</div>
                </div>
                {error && <p style={{ color:"#f87171", fontSize:12, marginBottom:12 }}>{error}</p>}
                <button onClick={confirmReschedule} disabled={submitting}
                  style={{ width:"100%", padding:"12px", borderRadius:10, background:"linear-gradient(135deg,#00d4ff,#7c3aed)", color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Confirm New Time →"}
                </button>
              </motion.div>
            )}

            {/* DONE */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.25 }} style={{ padding:24, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center" }}>
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:300, damping:18, delay:0.1 }}
                  style={{ width:52, height:52, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,212,255,0.12)", border:"2px solid rgba(0,212,255,0.4)", marginBottom:14 }}>
                  <Check size={20} style={{ color:"#00d4ff" }} />
                </motion.div>
                <h3 style={{ color:"#fff", margin:"0 0 6px", fontSize:17, fontWeight:600 }}>All rescheduled.</h3>
                <p style={{ color:"rgba(255,255,255,0.45)", fontSize:13, margin:"0 0 4px" }}>{dateLabel} · {selectedTime && fmt12(selectedTime)} CT</p>
                <p style={{ color:"rgba(255,255,255,0.25)", fontSize:12, margin:0 }}>A confirmation has been sent to {booking.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
