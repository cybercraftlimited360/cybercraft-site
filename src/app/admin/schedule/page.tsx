"use client";

import React, { useState, useEffect } from "react";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "";

interface DayConfig { enabled: boolean; start: string; end: string; }
interface Availability {
  timezone: string;
  slotDuration: number;
  bufferMinutes: number;
  weekdays: Record<string, DayConfig>;
  blockedDates: string[];
}
interface Booking {
  id: string; name: string; email: string; company: string; phone: string;
  date: string; time: string; message: string; status: string; createdAt: string;
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2,"0")} ${ap}`;
}

export default function AdminSchedulePage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [avail, setAvail]   = useState<Availability | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<string | null>(null);
  const [newBlock, setNewBlock] = useState("");
  const [tab, setTab]       = useState<"availability" | "bookings">("bookings");

  async function login() {
    const res = await fetch(`/api/admin/availability?secret=${secret}`);
    if (!res.ok) { setMsg("Wrong password."); return; }
    const data = await res.json();
    setAvail(data);
    setAuthed(true);
    loadBookings(secret);
  }

  async function loadBookings(s: string) {
    const res = await fetch(`/api/bookings?secret=${s}`);
    if (res.ok) { const d = await res.json(); setBookings(d.bookings ?? []); }
  }

  async function saveAvail() {
    if (!avail) return;
    setSaving(true);
    const res = await fetch(`/api/admin/availability?secret=${secret}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(avail),
    });
    setSaving(false);
    setMsg(res.ok ? "Saved!" : "Save failed.");
    setTimeout(() => setMsg(null), 3000);
  }

  function updateDay(dow: string, field: keyof DayConfig, value: string | boolean) {
    if (!avail) return;
    setAvail({ ...avail, weekdays: { ...avail.weekdays, [dow]: { ...avail.weekdays[dow], [field]: value } } });
  }

  function addBlock() {
    if (!avail || !newBlock) return;
    if (!avail.blockedDates.includes(newBlock)) {
      setAvail({ ...avail, blockedDates: [...avail.blockedDates, newBlock].sort() });
    }
    setNewBlock("");
  }

  function removeBlock(date: string) {
    if (!avail) return;
    setAvail({ ...avail, blockedDates: avail.blockedDates.filter(d => d !== date) });
  }

  const upcoming = bookings.filter(b => b.date >= new Date().toISOString().slice(0,10) && b.status !== "cancelled")
    .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const past = bookings.filter(b => b.date < new Date().toISOString().slice(0,10))
    .sort((a,b) => b.date.localeCompare(a.date));

  const s = { card: { background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 24px" } };

  if (!authed) return (
    <div style={{ minHeight:"100vh", background:"#0a0c12", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui" }}>
      <div style={{ ...s.card, width: 360 }}>
        <h2 style={{ color:"#fff", margin:"0 0 20px", fontSize:20 }}>Admin — Schedule</h2>
        <input
          type="password"
          placeholder="Admin password"
          value={secret}
          onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", marginBottom:12, boxSizing:"border-box" }}
        />
        <button onClick={login} style={{ width:"100%", padding:"10px", borderRadius:8, background:"linear-gradient(135deg,#00d4ff,#7c3aed)", color:"#fff", fontWeight:700, border:"none", cursor:"pointer" }}>
          Log In
        </button>
        {msg && <p style={{ color:"#f87171", marginTop:12, fontSize:13 }}>{msg}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0a0c12", color:"#fff", fontFamily:"system-ui", padding:"32px 24px" }}>
      <div style={{ maxWidth:860, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:32 }}>
          <a href="/admin" style={{ color:"rgba(255,255,255,0.3)", textDecoration:"none", fontSize:13 }}>← Admin</a>
          <h1 style={{ margin:0, fontSize:24, fontWeight:700 }}>Schedule Manager</h1>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:28, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:4, width:"fit-content" }}>
          {(["bookings","availability"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:"8px 18px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:13, background: tab===t ? "rgba(0,212,255,0.15)" : "transparent", color: tab===t ? "#00d4ff" : "rgba(255,255,255,0.4)" }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* BOOKINGS TAB */}
        {tab === "bookings" && (
          <div>
            <h2 style={{ margin:"0 0 16px", fontSize:17, color:"rgba(255,255,255,0.7)" }}>Upcoming ({upcoming.length})</h2>
            {upcoming.length === 0 && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:14 }}>No upcoming bookings.</p>}
            {upcoming.map(b => (
              <div key={b.id} style={{ ...s.card, marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16 }}>{b.name}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginTop:2 }}>{b.company} · {b.email}{b.phone ? ` · ${b.phone}` : ""}</div>
                    {b.message && <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginTop:6, fontStyle:"italic" }}>"{b.message}"</div>}
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"#00d4ff" }}>
                      {new Date(`${b.date}T12:00:00`).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                    </div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{fmt12(b.time)} CT</div>
                  </div>
                </div>
              </div>
            ))}

            {past.length > 0 && (
              <>
                <h2 style={{ margin:"28px 0 16px", fontSize:17, color:"rgba(255,255,255,0.4)" }}>Past ({past.length})</h2>
                {past.slice(0,10).map(b => (
                  <div key={b.id} style={{ ...s.card, marginBottom:8, opacity:0.55 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                      <div>
                        <div style={{ fontWeight:600 }}>{b.name} <span style={{ fontWeight:400, color:"rgba(255,255,255,0.35)", fontSize:13 }}>— {b.company}</span></div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>{b.email}</div>
                      </div>
                      <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)" }}>
                        {new Date(`${b.date}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"})} · {fmt12(b.time)}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* AVAILABILITY TAB */}
        {tab === "availability" && avail && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16, marginBottom:24 }}>
              {/* Slot settings */}
              <div style={s.card}>
                <h3 style={{ margin:"0 0 16px", fontSize:15, color:"rgba(255,255,255,0.7)" }}>Session Settings</h3>
                <label style={{ display:"block", marginBottom:12 }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Session duration (min)</div>
                  <input type="number" value={avail.slotDuration} onChange={e=>setAvail({...avail,slotDuration:+e.target.value})} style={{ width:90, padding:"7px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff" }} />
                </label>
                <label style={{ display:"block", marginBottom:12 }}>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Buffer between sessions (min)</div>
                  <input type="number" value={avail.bufferMinutes} onChange={e=>setAvail({...avail,bufferMinutes:+e.target.value})} style={{ width:90, padding:"7px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff" }} />
                </label>
                <label>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>Timezone</div>
                  <select value={avail.timezone} onChange={e=>setAvail({...avail,timezone:e.target.value})} style={{ padding:"7px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff" }}>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </label>
              </div>

              {/* Blocked dates */}
              <div style={s.card}>
                <h3 style={{ margin:"0 0 16px", fontSize:15, color:"rgba(255,255,255,0.7)" }}>Blocked Dates</h3>
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  <input type="date" value={newBlock} onChange={e=>setNewBlock(e.target.value)} style={{ padding:"7px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff", flexGrow:1 }} />
                  <button onClick={addBlock} style={{ padding:"7px 14px", borderRadius:8, background:"rgba(0,212,255,0.15)", border:"1px solid rgba(0,212,255,0.3)", color:"#00d4ff", cursor:"pointer", fontWeight:600, fontSize:13 }}>Block</button>
                </div>
                {avail.blockedDates.length === 0 && <p style={{ color:"rgba(255,255,255,0.2)", fontSize:13 }}>No blocked dates.</p>}
                {avail.blockedDates.map(d => (
                  <div key={d} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", borderRadius:8, background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", marginBottom:6 }}>
                    <span style={{ fontSize:13 }}>{new Date(`${d}T12:00:00`).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"})}</span>
                    <button onClick={()=>removeBlock(d)} style={{ background:"none", border:"none", color:"rgba(248,113,113,0.7)", cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly hours */}
            <div style={s.card}>
              <h3 style={{ margin:"0 0 16px", fontSize:15, color:"rgba(255,255,255,0.7)" }}>Weekly Hours</h3>
              {DAYS.map((dayName, dow) => {
                const cfg = avail.weekdays[dow.toString()] ?? { enabled:false, start:"09:00", end:"17:00" };
                return (
                  <div key={dow} style={{ display:"flex", alignItems:"center", gap:16, padding:"10px 0", borderBottom: dow<6?"1px solid rgba(255,255,255,0.05)":"none", flexWrap:"wrap" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:8, width:120, cursor:"pointer" }}>
                      <div
                        onClick={() => updateDay(dow.toString(), "enabled", !cfg.enabled)}
                        style={{ width:36, height:20, borderRadius:10, background: cfg.enabled?"linear-gradient(90deg,#00d4ff,#7c3aed)":"rgba(255,255,255,0.1)", position:"relative", transition:"background 0.2s", cursor:"pointer", flexShrink:0 }}
                      >
                        <div style={{ position:"absolute", top:3, left: cfg.enabled?18:3, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
                      </div>
                      <span style={{ fontSize:13, color: cfg.enabled?"#fff":"rgba(255,255,255,0.3)", fontWeight: cfg.enabled?600:400 }}>{dayName}</span>
                    </label>
                    {cfg.enabled && (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <input type="time" value={cfg.start} onChange={e=>updateDay(dow.toString(),"start",e.target.value)} style={{ padding:"5px 8px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:13 }} />
                        <span style={{ color:"rgba(255,255,255,0.3)", fontSize:12 }}>to</span>
                        <input type="time" value={cfg.end} onChange={e=>updateDay(dow.toString(),"end",e.target.value)} style={{ padding:"5px 8px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:13 }} />
                      </div>
                    )}
                    {!cfg.enabled && <span style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>Unavailable</span>}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop:20, display:"flex", alignItems:"center", gap:12 }}>
              <button onClick={saveAvail} disabled={saving} style={{ padding:"11px 28px", borderRadius:10, background:"linear-gradient(135deg,#00d4ff,#7c3aed)", color:"#fff", fontWeight:700, border:"none", cursor:"pointer", fontSize:14 }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              {msg && <span style={{ fontSize:13, color: msg==="Saved!" ? "#4ade80" : "#f87171" }}>{msg}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
