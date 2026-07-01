"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2, Calendar, Clock, User, Building2, Mail, Phone, Globe } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const US_TIMEZONES = [
  { label: "Eastern Time (ET)",  value: "America/New_York" },
  { label: "Central Time (CT)",  value: "America/Chicago" },
  { label: "Mountain Time (MT)", value: "America/Denver" },
  { label: "Pacific Time (PT)",  value: "America/Los_Angeles" },
  { label: "Alaska Time (AKT)",  value: "America/Anchorage" },
  { label: "Hawaii Time (HT)",   value: "Pacific/Honolulu" },
];

function detectTimezone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return US_TIMEZONES.find(t => t.value === tz)?.value ?? "America/Chicago";
}

// Convert a slot time (HH:MM in CT) + date to the client's chosen timezone, return "H:MM AM/PM"
function convertSlot(date: string, slotCT: string, clientTz: string): string {
  const [h, m] = slotCT.split(":").map(Number);
  // Build a Date object treating the slot as CT
  const ctDate = new Date(`${date}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`);
  // Interpret as CT by getting the UTC offset
  const ctOffsetMs = getTimezoneOffsetMs("America/Chicago", ctDate);
  const clientOffsetMs = getTimezoneOffsetMs(clientTz, ctDate);
  const clientDate = new Date(ctDate.getTime() + ctOffsetMs - clientOffsetMs);

  const ch = clientDate.getHours();
  const cm = clientDate.getMinutes();
  const ampm = ch >= 12 ? "PM" : "AM";
  return `${ch % 12 || 12}:${cm.toString().padStart(2,"0")} ${ampm}`;
}

// Returns UTC offset in ms for a timezone at a given Date
function getTimezoneOffsetMs(tz: string, date: Date): number {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr  = date.toLocaleString("en-US", { timeZone: tz });
  return new Date(tzStr).getTime() - new Date(utcStr).getTime();
}

// Does this slot, when converted to client tz, land on a different date?
function slotDateInTz(date: string, slotCT: string, clientTz: string): string {
  const [h, m] = slotCT.split(":").map(Number);
  const ctDate = new Date(`${date}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`);
  const ctOffsetMs = getTimezoneOffsetMs("America/Chicago", ctDate);
  const clientOffsetMs = getTimezoneOffsetMs(clientTz, ctDate);
  const clientDate = new Date(ctDate.getTime() + ctOffsetMs - clientOffsetMs);
  return clientDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

type Step = "calendar" | "time" | "details" | "done";

interface Form {
  name: string; email: string; company: string; phone: string; message: string;
}

export default function Scheduler() {
  const today = new Date();
  const [step, setStep]         = useState<Step>("calendar");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots]       = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientTz, setClientTz] = useState<string>("America/Chicago");
  const [form, setForm]         = useState<Form>({ name: "", email: "", company: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Auto-detect timezone on mount
  useEffect(() => { setClientTz(detectTimezone()); }, []);

  const fetchSlots = useCallback(async (dateStr: string) => {
    setLoadingSlots(true);
    setSlots([]);
    try {
      const res = await fetch(`/api/bookings/slots?date=${dateStr}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
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
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  async function submitBooking() {
    setError(null);
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required."); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: selectedDate, time: selectedTime, timezone: clientTz }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Booking failed."); return; }
      setBookingId(data.bookingId);
      setStep("done");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const dateObj = selectedDate ? new Date(`${selectedDate}T12:00:00`) : null;
  const dateLabel = dateObj
    ? dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";
  const tzLabel = US_TIMEZONES.find(t => t.value === clientTz)?.label ?? clientTz;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        minHeight: 440,
      }}
    >
      {/* Gradient top bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg,#00d4ff,#7c3aed)" }} />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-3 border-b border-white/5 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>
            <Calendar size={15} style={{ color: "#00d4ff" }} />
          </div>
          <div>
            <div className="font-semibold text-sm text-white">Book a Free Strategy Session</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>30 minutes · Video or Phone</div>
          </div>
        </div>

        {/* Timezone selector */}
        <div className="flex items-center gap-2">
          <Globe size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          <select
            value={clientTz}
            onChange={e => setClientTz(e.target.value)}
            className="scheduler-input text-xs rounded-lg px-2 py-1.5"
            style={{ border: "1px solid rgba(255,255,255,0.12)", outline: "none", fontSize: 11 }}
          >
            {US_TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP: CALENDAR */}
        {step === "calendar" && (
          <motion.div key="cal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)" }}>
                <ChevronLeft size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
              <span className="font-semibold text-sm text-white">{MONTHS[viewMonth]} {viewYear}</span>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)" }}>
                <ChevronRight size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold tracking-widest uppercase py-1" style={{ color: "rgba(255,255,255,0.25)" }}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = dateKey(viewYear, viewMonth, day);
                const isPast = key < todayKey;
                const isSelected = key === selectedDate;
                const isToday = key === todayKey;
                return (
                  <button
                    key={key}
                    disabled={isPast}
                    onClick={() => { setSelectedDate(key); setSelectedTime(null); setStep("time"); }}
                    className="relative mx-auto w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                    style={{
                      cursor: isPast ? "not-allowed" : "pointer",
                      color: isPast ? "rgba(255,255,255,0.15)" : isSelected ? "#000" : isToday ? "#00d4ff" : "rgba(255,255,255,0.7)",
                      background: isSelected ? "#00d4ff" : isToday ? "rgba(0,212,255,0.1)" : "transparent",
                      border: isToday && !isSelected ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
              Times shown in {tzLabel}
            </p>
          </motion.div>
        )}

        {/* STEP: TIME SLOTS */}
        {step === "time" && (
          <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="p-5">
            <button onClick={() => setStep("calendar")} className="flex items-center gap-1.5 mb-4 text-xs hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
              <ChevronLeft size={13} /> Back to calendar
            </button>

            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: "#00d4ff" }} />
                <span className="font-semibold text-sm text-white">{dateLabel}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-md" style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {tzLabel}
              </span>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin" style={{ color: "#00d4ff" }} />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>No available slots on this day.</p>
                <button onClick={() => setStep("calendar")} className="mt-3 text-xs underline" style={{ color: "#00d4ff", cursor: "pointer" }}>Choose another date</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {slots.map(slot => {
                  const displayTime = convertSlot(selectedDate!, slot, clientTz);
                  const displayDate = slotDateInTz(selectedDate!, slot, clientTz);
                  const sameDayLabel = dateObj?.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const crossDay = displayDate !== sameDayLabel;
                  return (
                    <button
                      key={slot}
                      onClick={() => { setSelectedTime(slot); setStep("details"); }}
                      className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center"
                      style={{ cursor: "pointer", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}
                      onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(0,212,255,0.15)"; el.style.borderColor = "rgba(0,212,255,0.5)"; }}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.background = "rgba(0,212,255,0.06)"; el.style.borderColor = "rgba(0,212,255,0.2)"; }}
                    >
                      <span>{displayTime}</span>
                      {crossDay && <span className="text-[10px] mt-0.5" style={{ color: "rgba(0,212,255,0.5)" }}>{displayDate}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* STEP: DETAILS FORM */}
        {step === "details" && (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="p-5">
            <button onClick={() => setStep("time")} className="flex items-center gap-1.5 mb-4 text-xs hover:text-white transition-colors" style={{ color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
              <ChevronLeft size={13} /> Back
            </button>

            {/* Booking summary */}
            <div className="rounded-xl px-4 py-3 mb-5 flex items-center gap-4" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}>
              <div className="text-center">
                <div className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {dateObj?.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                </div>
                <div className="text-2xl font-bold" style={{ color: "#00d4ff" }}>{dateObj?.getDate()}</div>
              </div>
              <div>
                <div className="font-semibold text-sm text-white">{dateLabel}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {selectedTime && convertSlot(selectedDate!, selectedTime, clientTz)} · {tzLabel}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { field: "name",    icon: User,      placeholder: "Full name *",    type: "text" },
                { field: "email",   icon: Mail,      placeholder: "Email address *", type: "email" },
                { field: "company", icon: Building2, placeholder: "Company name",   type: "text" },
                { field: "phone",   icon: Phone,     placeholder: "Phone number",   type: "tel" },
              ].map(({ field, icon: Icon, placeholder, type }) => (
                <div key={field} className="relative">
                  <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.25)", zIndex: 1 }} />
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[field as keyof Form]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm scheduler-input"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
                  />
                </div>
              ))}
              <textarea
                rows={2}
                placeholder="What would you like to discuss? (optional)"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none scheduler-input"
                style={{ border: "1px solid rgba(255,255,255,0.1)", outline: "none" }}
              />
            </div>

            {error && <p className="text-xs mt-3" style={{ color: "#f87171" }}>{error}</p>}

            <button
              onClick={submitBooking}
              disabled={submitting}
              className="w-full mt-4 py-3 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-opacity"
              style={{
                cursor: submitting ? "not-allowed" : "pointer",
                background: submitting ? "rgba(0,212,255,0.3)" : "linear-gradient(135deg,#00d4ff,#7c3aed)",
                color: "#fff",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? <><Loader2 size={15} className="animate-spin" /> Booking...</> : "Confirm Booking →"}
            </button>
          </motion.div>
        )}

        {/* STEP: DONE */}
        {step === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="p-5 flex flex-col items-center justify-center text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(0,212,255,0.12)", border: "2px solid rgba(0,212,255,0.4)" }}
            >
              <Check size={22} style={{ color: "#00d4ff" }} />
            </motion.div>
            <h3 className="font-semibold text-lg text-white mb-2">You&apos;re all set.</h3>
            <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              {dateLabel} · {selectedTime && convertSlot(selectedDate!, selectedTime, clientTz)} {tzLabel}
            </p>
            <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>A confirmation email is on its way to {form.email}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Ref: {bookingId}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
