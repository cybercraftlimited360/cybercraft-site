"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const TOKEN_KEY = "cc360_admin_token";
const TABS = ["overview", "clients", "pipeline", "finances", "tasks", "convos", "activity", "lauren"] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Record<Tab, string> = { overview: "📊", clients: "👥", pipeline: "📋", finances: "💰", tasks: "✅", convos: "💬", activity: "🔔", lauren: "📞" };
const TAB_LABELS: Record<Tab, string> = { overview: "Overview", clients: "Clients", pipeline: "Pipeline", finances: "Finances", tasks: "Tasks", convos: "Convos", activity: "Activity", lauren: "Lauren" };

// ── Auth ──────────────────────────────────────────────────────────────────────
function LoginScreen({ onAuth }: { onAuth: (t: string) => void }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr("");
    // Read directly from the DOM in case autofill didn't fire onChange
    const actual = inputRef.current?.value || pw;
    const res = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: actual }) }).catch(() => null);
    if (!res || !res.ok) { setErr("Wrong password."); setPw(""); setLoading(false); return; }
    const d = await res.json(); localStorage.setItem(TOKEN_KEY, d.token); onAuth(d.token); setLoading(false);
  }
  return (
    <div style={{ minHeight: "100dvh", background: "#080a10", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px", background: "linear-gradient(135deg,#00d4ff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🔐</div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: "0 0 8px" }}>CyberCraft360</p>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", margin: 0 }}>Admin Dashboard</h1>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input ref={inputRef} type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} autoFocus autoComplete="current-password"
            style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${err ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, color: "#fff", fontSize: 16, outline: "none", letterSpacing: "0.12em" }} />
          {err && <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", margin: 0 }}>{err}</p>}
          <button type="submit" disabled={loading} style={{ padding: 16, borderRadius: 14, border: "none", background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#00d4ff,#7c3aed)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Verifying…" : "Unlock →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AdminRoot() {
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) fetch("/api/admin/auth", { headers: { "x-admin-token": t } }).then(r => r.json()).then(d => { if (d.ok) setToken(t); else localStorage.removeItem(TOKEN_KEY); }).catch(() => {}).finally(() => setChecked(true));
    else setChecked(true);
  }, []);
  if (!checked) return <Spinner />;
  if (!token) return <LoginScreen onAuth={setToken} />;
  return <Dashboard token={token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null); }} />;
}

// ── Dashboard Shell ───────────────────────────────────────────────────────────
function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    const res = await fetch("/api/admin/dashboard", { headers: { "x-admin-token": token } }).catch(() => null);
    if (res?.ok) setData(await res.json());
    setLoading(false); setRefreshing(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: "100dvh", background: "#080a10", fontFamily: "system-ui,sans-serif", paddingBottom: 80 }}>
      {/* Top bar */}
      <div style={{ background: "rgba(15,17,23,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", margin: "0 0 2px" }}>CyberCraft360</p>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", margin: 0 }}>Admin Dashboard</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {refreshing && <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,212,255,0.3)", borderTopColor: "#00d4ff", animation: "spin 0.8s linear infinite" }} />}
          <Btn onClick={() => load(true)}>↻</Btn>
          <a href="/admin/invoice" style={{ padding: "7px 12px", borderRadius: 8, background: "linear-gradient(135deg,#00d4ff22,#7c3aed22)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>📄 Invoice</a>
          <Btn onClick={onLogout} style={{ color: "rgba(255,255,255,0.3)" }}>Out</Btn>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 14px 0" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}><Spinner inline /><p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 16 }}>Loading dashboard…</p></div>
        ) : data ? (
          <>
            {tab === "overview"  && <OverviewTab  data={data} />}
            {tab === "clients"   && <ClientsTab   data={data} token={token} />}
            {tab === "pipeline"  && <PipelineTab  data={data} token={token} onRefresh={() => load(true)} />}
            {tab === "finances"  && <FinancesTab  data={data} />}
            {tab === "tasks"     && <TasksTab     data={data} token={token} onRefresh={() => load(true)} />}
            {tab === "convos"    && <ConvosTab    data={data} />}
            {tab === "activity"  && <ActivityTab  data={data} />}
            {tab === "lauren"    && <LaurenTab    data={data} token={token} />}
          </>
        ) : (
          <p style={{ color: "#ef4444", textAlign: "center", marginTop: 60 }}>Failed to load dashboard.</p>
        )}
      </div>

      {/* Bottom tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,12,18,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", backdropFilter: "blur(12px)", zIndex: 50 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "10px 4px 12px", border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", opacity: tab === t ? 1 : 0.4, transition: "opacity 0.15s" }}>
            <span style={{ fontSize: 18 }}>{TAB_ICONS[t]}</span>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: tab === t ? "#00d4ff" : "#fff", textTransform: "uppercase" }}>{TAB_LABELS[t]}</span>
            {tab === t && <div style={{ position: "absolute", bottom: 0, width: 32, height: 2, background: "#00d4ff", borderRadius: 2 }} />}
          </button>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: any }) {
  const o = data.overview;
  return (
    <div>
      <SectionTitle>At a Glance</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <BigStatCard label="Total Revenue" value={`$${(o.totalRevenue || 0).toLocaleString()}`} accent="#22c55e" icon="💵" />
        <BigStatCard label="MRR" value={`$${(o.mrr || 0).toLocaleString()}`} accent="#00d4ff" icon="↻" sub="monthly recurring" />
        <BigStatCard label="Pipeline Value" value={`$${(o.pipelineValue || 0).toLocaleString()}`} accent="#7c3aed" icon="📋" />
        <BigStatCard label="Total Clients" value={o.totalClients || 0} accent="#e64dff" icon="👥" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
        <MiniStat label="Leads" value={o.totalLeads || 0} accent="#00d4ff" />
        <MiniStat label="Bookings" value={o.upcomingBookings || 0} accent="#22c55e" sub="upcoming" />
        <MiniStat label="Tasks" value={o.openTasks || 0} accent={o.overdueTasks > 0 ? "#ef4444" : "#f59e0b"} sub={o.overdueTasks > 0 ? `${o.overdueTasks} overdue` : "open"} />
      </div>

      {/* Visitors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <MiniStat label="Visitors Today" value={data.visitors?.today || 0} accent="#00d4ff" sub="page loads" />
        <MiniStat label="Total Visitors" value={data.visitors?.total || 0} accent="#a78bfa" sub="all time" />
      </div>

      <SectionTitle>Recent Visitors</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        {data.visitors?.recent?.length > 0 ? data.visitors.recent.slice(0, 8).map((v: any, i: number) => (
          <Row key={i} border={i > 0}>
            <div>
              <Name style={{ color: "#00d4ff" }}>{v.page || "/"}</Name>
              <Sub>{v.referrer ? `from ${v.referrer.replace(/^https?:\/\//, "").slice(0, 40)}` : "Direct / unknown"}</Sub>
            </div>
            <Sub style={{ flexShrink: 0, marginLeft: 8 }}>{timeAgo(v.time)}</Sub>
          </Row>
        )) : <EmptyState>No visitors tracked yet — will appear after next page load</EmptyState>}
      </Card>

      <SectionTitle>Upcoming Bookings</SectionTitle>
      <Card style={{ marginBottom: 20 }}>
        {data.bookings.upcomingList?.length > 0 ? data.bookings.upcomingList.slice(0, 5).map((b: any, i: number) => (
          <Row key={b.id} border={i > 0}>
            <div><Name>{b.name}</Name><Sub>{b.company}</Sub></div>
            <div style={{ textAlign: "right" }}><Name style={{ color: "#00d4ff" }}>{b.date}</Name><Sub>{b.time}</Sub></div>
          </Row>
        )) : <EmptyState>No upcoming bookings</EmptyState>}
      </Card>

      <SectionTitle>Recent Activity</SectionTitle>
      <Card>
        {data.activity?.slice(0, 6).map((e: any, i: number) => (
          <Row key={e.id} border={i > 0}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 18 }}>{activityIcon(e.type)}</span>
              <div><Name>{e.title}</Name><Sub>{e.detail}</Sub></div>
            </div>
            <Sub style={{ flexShrink: 0, marginLeft: 8 }}>{timeAgo(e.createdAt)}</Sub>
          </Row>
        ))}
        {(!data.activity || data.activity.length === 0) && <EmptyState>No activity yet</EmptyState>}
      </Card>
    </div>
  );
}

// ── Clients Tab ───────────────────────────────────────────────────────────────
function ClientsTab({ data, token }: { data: any; token: string }) {
  const [search, setSearch] = useState("");
  const [offboarding, setOffboarding] = useState<any>(null);
  const [offboardReason, setOffboardReason] = useState("");
  const [offboardDone, setOffboardDone] = useState(false);
  const clients: any[] = data.clients ?? [];
  const offboarded: any[] = data.offboarded ?? [];
  const offboardedEmails = new Set(offboarded.map((o: any) => o.email?.toLowerCase()));
  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  async function confirmOffboard() {
    if (!offboarding) return;
    await fetch("/api/admin/offboard", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ clientName: offboarding.name, clientEmail: offboarding.email, reason: offboardReason }) });
    setOffboardDone(true);
    setTimeout(() => { setOffboarding(null); setOffboardReason(""); setOffboardDone(false); }, 1500);
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <MiniStat label="Total Clients" value={clients.length} accent="#00d4ff" />
        <MiniStat label="Churned" value={offboarded.length} accent="#ef4444" sub="left your services" />
      </div>

      <SectionTitle>Active Clients</SectionTitle>
      <input placeholder="Search by name, email, company…" value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 14, outline: "none", marginBottom: 14 }} />

      {/* Offboard modal */}
      {offboarding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 360 }}>
            {offboardDone ? (
              <p style={{ textAlign: "center", color: "#22c55e", fontSize: 16, fontWeight: 700, margin: 0 }}>✓ Client offboarded</p>
            ) : (
              <>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Offboard {offboarding.name}?</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 16px" }}>This will log them as churned and notify you by email.</p>
                <input placeholder="Reason (optional)" value={offboardReason} onChange={e => setOffboardReason(e.target.value)} style={{ ...miniInputStyle, marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={confirmOffboard} style={{ flex: 1, padding: 11, borderRadius: 10, background: "#ef4444", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Confirm Offboard</button>
                  <button onClick={() => { setOffboarding(null); setOffboardReason(""); }} style={{ flex: 1, padding: 11, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Card style={{ marginBottom: 24 }}>
        {filtered.length > 0 ? filtered.map((c, i) => {
          const isChurned = offboardedEmails.has(c.email?.toLowerCase());
          return (
            <Row key={c.email || i} border={i > 0} style={{ opacity: isChurned ? 0.45 : 1 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: isChurned ? "rgba(239,68,68,0.1)" : "linear-gradient(135deg,#00d4ff22,#7c3aed22)", border: `1px solid ${isChurned ? "rgba(239,68,68,0.3)" : "rgba(0,212,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: isChurned ? "#ef4444" : "#00d4ff", flexShrink: 0 }}>
                  {c.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <Name>{c.name}{isChurned && <span style={{ fontSize: 10, color: "#ef4444", marginLeft: 6, fontWeight: 700 }}>CHURNED</span>}</Name>
                  <Sub>{c.company || c.email}</Sub>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {c.totalSpent > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginBottom: 4 }}>${c.totalSpent.toLocaleString()}</div>}
                <Sub style={{ marginBottom: 6 }}>{[c.bookings > 0 && `${c.bookings} booking${c.bookings > 1 ? "s" : ""}`, c.invoices > 0 && `${c.invoices} invoice${c.invoices > 1 ? "s" : ""}`].filter(Boolean).join(" · ") || "Lead"}</Sub>
                {!isChurned && <button onClick={() => setOffboarding(c)} style={{ fontSize: 10, color: "rgba(239,68,68,0.5)", background: "none", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>Offboard</button>}
              </div>
            </Row>
          );
        }) : <EmptyState>No clients found</EmptyState>}
      </Card>

      {offboarded.length > 0 && (
        <>
          <SectionTitle>Churned Clients ({offboarded.length})</SectionTitle>
          <Card>
            {offboarded.map((c: any, i: number) => (
              <Row key={i} border={i > 0} style={{ opacity: 0.5 }}>
                <div><Name>{c.name}</Name><Sub>{c.email}</Sub></div>
                <div style={{ textAlign: "right" }}>
                  <Sub style={{ color: "#ef4444" }}>{c.reason || "Cancelled"}</Sub>
                  <Sub>{c.date ? new Date(c.date).toLocaleDateString() : ""}</Sub>
                </div>
              </Row>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ── Pipeline Tab ──────────────────────────────────────────────────────────────
const STAGES = [
  { id: "new",       label: "New",       color: "#64748b" },
  { id: "contacted", label: "Contacted", color: "#3b82f6" },
  { id: "demo",      label: "Demo",      color: "#8b5cf6" },
  { id: "proposal",  label: "Proposal",  color: "#f59e0b" },
  { id: "won",       label: "Won ✓",     color: "#22c55e" },
  { id: "lost",      label: "Lost",      color: "#ef4444" },
];

function PipelineTab({ data, token, onRefresh }: { data: any; token: string; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", service: "", value: "", stage: "new" });
  const [moving, setMoving] = useState<string | null>(null);
  const pipeline: any[] = data.pipeline.leads ?? [];

  async function addLead() {
    if (!form.name) return;
    await fetch("/api/admin/pipeline", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ action: "add", ...form, value: form.value ? Number(form.value) : undefined }) });
    setForm({ name: "", company: "", email: "", phone: "", service: "", value: "", stage: "new" }); setAdding(false); onRefresh();
  }

  async function moveStage(id: string, stage: string) {
    setMoving(id);
    await fetch("/api/admin/pipeline", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ action: "update_stage", id, stage }) });
    setMoving(null); onRefresh();
  }

  async function deleteLead(id: string) {
    await fetch("/api/admin/pipeline", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ action: "delete", id }) });
    onRefresh();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <SectionTitle style={{ margin: 0 }}>Sales Pipeline</SectionTitle>
        <button onClick={() => setAdding(!adding)} style={{ padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Lead</button>
      </div>

      {/* Stage summary */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
        {STAGES.map(s => (
          <div key={s.id} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${s.color}33`, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{data.pipeline.byStage[s.id] || 0}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {adding && (
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>New Lead</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["Name *", "name", "text"], ["Company", "company", "text"], ["Email", "email", "email"], ["Phone", "phone", "tel"], ["Service", "service", "text"], ["Deal Value ($)", "value", "number"]].map(([label, key, type]) => (
              <input key={key} type={type} placeholder={label as string} value={(form as any)[key as string]} onChange={e => setForm(f => ({ ...f, [key as string]: e.target.value }))} style={miniInputStyle} />
            ))}
            <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} style={miniInputStyle}>
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addLead} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </Card>
      )}

      {STAGES.filter(s => pipeline.some(l => l.stage === s.id)).map(s => (
        <div key={s.id} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>({pipeline.filter(l => l.stage === s.id).length})</span>
          </div>
          <Card>
            {pipeline.filter(l => l.stage === s.id).map((lead, i) => (
              <div key={lead.id} style={{ padding: "14px 16px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <Name>{lead.name}</Name>
                    <Sub>{[lead.company, lead.service].filter(Boolean).join(" · ")}</Sub>
                    {lead.phone && <Sub style={{ color: "#22c55e" }}>📞 {lead.phone}</Sub>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {lead.value > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e", marginBottom: 4 }}>${lead.value.toLocaleString()}</div>}
                    <button onClick={() => deleteLead(lead.id)} style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕ Remove</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {STAGES.filter(st => st.id !== lead.stage).map(st => (
                    <button key={st.id} onClick={() => moveStage(lead.id, st.id)} disabled={moving === lead.id}
                      style={{ padding: "4px 10px", borderRadius: 6, background: `${st.color}18`, border: `1px solid ${st.color}44`, color: st.color, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                      → {st.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}

      {pipeline.length === 0 && <EmptyState>No leads in pipeline yet. Add one above.</EmptyState>}
    </div>
  );
}

// ── Finances Tab ──────────────────────────────────────────────────────────────
function FinancesTab({ data }: { data: any }) {
  const inv = data.invoices;
  const months = Object.entries(inv.revenueByMonth ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const maxRev = Math.max(...months.map(([, v]) => v as number), 1);
  const list: any[] = inv.list ?? [];

  return (
    <div>
      <SectionTitle>Financial Overview</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <BigStatCard label="Total Collected" value={`$${(inv.totalRevenue || 0).toLocaleString()}`} accent="#22c55e" icon="💵" />
        <BigStatCard label="MRR" value={`$${(inv.mrr || 0).toLocaleString()}`} accent="#00d4ff" icon="↻" sub="monthly recurring" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <BigStatCard label="Outstanding" value={`$${(inv.outstanding || 0).toLocaleString()}`} accent="#f59e0b" icon="⏳" />
        <BigStatCard label="This Month" value={`$${(inv.monthRevenue || 0).toLocaleString()}`} accent="#7c3aed" icon="📅" />
      </div>

      {months.length > 0 && (
        <>
          <SectionTitle>Revenue — Last 6 Months</SectionTitle>
          <Card style={{ padding: "20px 16px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
              {months.map(([month, value]) => (
                <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%" }}>
                    <div style={{ background: "linear-gradient(180deg,#00d4ff,#7c3aed)", borderRadius: "4px 4px 0 0", height: `${((value as number) / maxRev) * 100}%`, minHeight: (value as number) > 0 ? 4 : 0 }} />
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>{month.slice(5)}</span>
                  {(value as number) > 0 && <span style={{ fontSize: 9, color: "#00d4ff", fontWeight: 700 }}>${(value as number).toLocaleString()}</span>}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <SectionTitle>Invoice History ({list.length})</SectionTitle>
      <Card>
        {list.length > 0 ? list.map((inv: any, i: number) => (
          <Row key={inv.invoiceNumber} border={i > 0}>
            <div>
              <Name>{inv.customerName}</Name>
              <Sub>{inv.serviceName} · #{inv.invoiceNumber}</Sub>
              <Sub>{inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : ""}</Sub>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#00d4ff", marginBottom: 4 }}>${inv.total.toLocaleString()}</div>
              <InvoiceStatusBadge status={inv.status} />
            </div>
          </Row>
        )) : <EmptyState>No invoices sent yet</EmptyState>}
      </Card>
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({ data, token, onRefresh }: { data: any; token: string; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", clientName: "", dueDate: "", priority: "medium" });
  const tasks: any[] = data.tasks.all ?? [];
  const open = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  async function addTask() {
    if (!form.title) return;
    await fetch("/api/admin/tasks", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ action: "add", ...form }) });
    setForm({ title: "", clientName: "", dueDate: "", priority: "medium" }); setAdding(false); onRefresh();
  }
  async function toggle(id: string) {
    await fetch("/api/admin/tasks", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ action: "toggle", id }) });
    onRefresh();
  }
  async function del(id: string) {
    await fetch("/api/admin/tasks", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ action: "delete", id }) });
    onRefresh();
  }

  const today = new Date().toISOString().slice(0, 10);
  const PRIORITY_COLOR: Record<string, string> = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <SectionTitle style={{ margin: 0 }}>Tasks ({open.length} open)</SectionTitle>
        <button onClick={() => setAdding(!adding)} style={{ padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Task</button>
      </div>

      {adding && (
        <Card style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Task description *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={miniInputStyle} />
            <input placeholder="Client name (optional)" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} style={miniInputStyle} />
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={miniInputStyle} />
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={miniInputStyle}>
              <option value="high">🔴 High Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="low">🟢 Low Priority</option>
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addTask} style={{ flex: 1, padding: 10, borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add Task</button>
              <button onClick={() => setAdding(false)} style={{ flex: 1, padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 20 }}>
        {open.length > 0 ? open.map((task, i) => {
          const overdue = task.dueDate && task.dueDate < today;
          return (
            <Row key={task.id} border={i > 0}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1 }}>
                <button onClick={() => toggle(task.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${PRIORITY_COLOR[task.priority]}`, background: "none", cursor: "pointer", flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <Name>{task.title}</Name>
                  {task.clientName && <Sub>👤 {task.clientName}</Sub>}
                  {task.dueDate && <Sub style={{ color: overdue ? "#ef4444" : "rgba(255,255,255,0.3)" }}>{overdue ? "⚠️ Overdue · " : "Due "}{task.dueDate}</Sub>}
                </div>
              </div>
              <button onClick={() => del(task.id)} style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>✕</button>
            </Row>
          );
        }) : <EmptyState>No open tasks 🎉</EmptyState>}
      </Card>

      {done.length > 0 && (
        <>
          <SectionTitle>Completed ({done.length})</SectionTitle>
          <Card>
            {done.map((task, i) => (
              <Row key={task.id} border={i > 0} style={{ opacity: 0.45 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: "2px solid #22c55e", background: "#22c55e22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#22c55e", flexShrink: 0 }}>✓</div>
                  <Name style={{ textDecoration: "line-through" }}>{task.title}</Name>
                </div>
                <button onClick={() => del(task.id)} style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", background: "none", border: "none", cursor: "pointer" }}>✕</button>
              </Row>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

// ── Convos Tab ────────────────────────────────────────────────────────────────
function ConvosTab({ data }: { data: any }) {
  const [filter, setFilter] = useState<"all" | "iris" | "lauren">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const irisConvs: any[] = data.conversations?.iris ?? [];
  const laurenConvs: any[] = data.conversations?.lauren ?? [];

  const allConvs = [
    ...irisConvs.map((c: any) => ({ ...c, _source: "iris" })),
    ...laurenConvs.map((c: any) => ({ ...c, _source: "lauren" })),
  ].sort((a, b) => (b.date > a.date ? 1 : -1));

  const visible = allConvs.filter(c => filter === "all" || c._source === filter);

  const sourceColor = (s: string) => s === "iris" ? "#7c3aed" : "#e64dff";
  const sourceLabel = (s: string) => s === "iris" ? "IRIS" : "Lauren";

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <MiniStat label="IRIS Chats" value={irisConvs.length} accent="#7c3aed" />
        <MiniStat label="Lauren Calls" value={laurenConvs.length} accent="#e64dff" />
        <MiniStat label="Chat Leads" value={data.chat?.totalLeads ?? 0} accent="#00d4ff" />
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["all", "iris", "lauren"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", background: filter === f ? (f === "iris" ? "#7c3aed" : f === "lauren" ? "#e64dff" : "#00d4ff") : "rgba(255,255,255,0.06)", color: filter === f ? "#fff" : "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>{f === "all" ? `All (${allConvs.length})` : f === "iris" ? `IRIS (${irisConvs.length})` : `Lauren (${laurenConvs.length})`}</button>
        ))}
      </div>

      <Card>
        {visible.length === 0 ? <EmptyState>No conversations yet</EmptyState> : visible.map((c: any, i: number) => {
          const id = c.id || String(i);
          const isOpen = expanded === id;
          const msgs: any[] = c.messages ?? [];
          const preview = msgs.find((m: any) => m.role === "user")?.content ?? "";
          const hasLead = c.hasLead || !!c.lead;
          return (
            <div key={id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div onClick={() => setExpanded(isOpen ? null : id)} style={{ padding: "14px 16px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", padding: "2px 8px", borderRadius: 6, background: `${sourceColor(c._source)}22`, color: sourceColor(c._source) }}>{sourceLabel(c._source)}</span>
                      {hasLead && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>LEAD</span>}
                      {c.lead?.name && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{c.lead.name}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(preview).slice(0, 80)}{String(preview).length > 80 ? "…" : ""}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <Sub>{c.date ? new Date(c.date).toLocaleDateString() : ""}</Sub>
                    <Sub style={{ color: "rgba(255,255,255,0.2)" }}>{msgs.length} msg{msgs.length !== 1 ? "s" : ""}</Sub>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{isOpen ? "▲" : "▼"}</div>
                  </div>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {c.lead && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", marginBottom: 12 }}>
                      <p style={{ margin: 0, fontSize: 11, color: "#22c55e", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>LEAD CAPTURED</p>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{c.lead.name} · {c.lead.company}{c.lead.phone ? ` · ${c.lead.phone}` : ""}</p>
                      {c.lead.challenge && <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.lead.challenge}</p>}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {msgs.filter((m: any) => m.role !== "system").map((m: any, mi: number) => (
                      <div key={mi} style={{ display: "flex", justifyContent: m.role === "user" || m.role === "caller" ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "80%", padding: "9px 12px", borderRadius: 12, background: m.role === "user" || m.role === "caller" ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${m.role === "user" || m.role === "caller" ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 3, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }}>{m.role === "user" || m.role === "caller" ? (c._source === "lauren" ? "Caller" : "Visitor") : (c._source === "lauren" ? "Lauren" : "IRIS")}</p>
                          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{String(m.content).slice(0, 500)}{String(m.content).length > 500 ? "…" : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────────────────────
function ActivityTab({ data }: { data: any }) {
  const events: any[] = data.activity ?? [];
  return (
    <div>
      <SectionTitle>Activity Feed</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Conversations" value={data.chat.totalConversations} accent="#7c3aed" />
        <MiniStat label="Chat Leads" value={data.chat.totalLeads} accent="#00d4ff" />
        <MiniStat label="Lauren Calls" value={data.lauren.totalCalls} accent="#e64dff" />
      </div>
      <Card>
        {events.length > 0 ? events.map((e, i) => (
          <Row key={e.id} border={i > 0}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: activityBg(e.type), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{activityIcon(e.type)}</div>
              <div>
                <Name>{e.title}</Name>
                <Sub>{e.detail}</Sub>
                {e.amount > 0 && <Sub style={{ color: "#22c55e", fontWeight: 700 }}>${e.amount.toLocaleString()}</Sub>}
              </div>
            </div>
            <Sub style={{ flexShrink: 0, marginLeft: 8 }}>{timeAgo(e.createdAt)}</Sub>
          </Row>
        )) : <EmptyState>No activity recorded yet. Activity will appear here as leads come in, bookings are made, and invoices are sent.</EmptyState>}
      </Card>
    </div>
  );
}

// ── Shared UI Components ──────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", ...style }}>{children}</div>;
}
function Row({ children, border, style }: { children: React.ReactNode; border?: boolean; style?: React.CSSProperties }) {
  return <div style={{ padding: "14px 16px", borderTop: border ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, ...style }}>{children}</div>;
}
function BigStatCard({ label, value, accent, icon, sub }: { label: string; value: string | number; accent: string; icon: string; sub?: string }) {
  return (
    <div style={{ padding: "18px 16px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: 0 }}>{label}</p>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <p style={{ fontSize: "1.5rem", fontWeight: 800, color: accent, margin: sub ? "0 0 3px" : 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>{sub}</p>}
    </div>
  );
}
function MiniStat({ label, value, accent, sub }: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div style={{ padding: "14px 12px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: "1.3rem", fontWeight: 800, color: accent, margin: sub ? "0 0 3px" : 0, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", margin: 0 }}>{sub}</p>}
    </div>
  );
}
function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: "0 0 10px", ...style }}>{children}</p>;
}
function Name({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 2px", ...style }}>{children}</p>;
}
function Sub({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 2px", ...style }}>{children}</p>;
}
function EmptyState({ children }: { children: React.ReactNode }) {
  return <p style={{ padding: "28px 20px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.25)", margin: 0, lineHeight: 1.6 }}>{children}</p>;
}
function Btn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return <button onClick={onClick} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", ...style }}>{children}</button>;
}
function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = { sent: { color: "#f59e0b", label: "Sent" }, paid: { color: "#22c55e", label: "Paid" }, overdue: { color: "#ef4444", label: "Overdue" }, cancelled: { color: "#64748b", label: "Cancelled" } };
  const s = map[status] ?? { color: "#64748b", label: status };
  return <span style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>;
}
function Spinner({ inline }: { inline?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: inline ? undefined : "100dvh", background: inline ? undefined : "#080a10" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(0,212,255,0.3)", borderTopColor: "#00d4ff", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function activityIcon(type: string) {
  return ({ lead: "🎯", booking: "📅", invoice: "📄", call: "📞", cancellation: "❌", payment: "💵" } as any)[type] ?? "🔔";
}
function activityBg(type: string) {
  return ({ lead: "rgba(0,212,255,0.08)", booking: "rgba(34,197,94,0.08)", invoice: "rgba(124,58,237,0.08)", call: "rgba(230,77,255,0.08)", payment: "rgba(34,197,94,0.12)" } as any)[type] ?? "rgba(255,255,255,0.04)";
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const miniInputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, outline: "none" };

// ── Lauren Dialer Tab ─────────────────────────────────────────────────────────
function LaurenTab({ data, token }: { data: any; token: string }) {
  const leads: any[] = data.leads?.recent ?? [];
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [challenge, setChallenge] = useState("");
  const [calling, setCalling] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function fillFromLead(lead: any) {
    setPhone(lead.phone || "");
    setName(lead.name || "");
    setCompany(lead.company || "");
    setChallenge(lead.challenge || "");
    setResult(null);
  }

  async function dial() {
    if (!phone) return;
    setCalling(true); setResult(null);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ phone, name: name || "there", company: company || "your business", challenge }),
      });
      const d = await res.json();
      if (d.ok) setResult({ ok: true, message: `✅ Lauren is calling ${phone} now. Call SID: ${d.callSid}` });
      else setResult({ ok: false, message: `❌ ${d.error || "Call failed"}` });
    } catch (e: any) {
      setResult({ ok: false, message: `❌ ${e.message}` });
    } finally {
      setCalling(false);
    }
  }

  const accent = "#e64dff";
  const sectionStyle: React.CSSProperties = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20, marginBottom: 16 };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6, display: "block" };
  const inp: React.CSSProperties = { ...miniInputStyle, marginBottom: 0 };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}15`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎙️</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Lauren — AI Voice Agent</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Dial any lead or number. Lauren handles the conversation.</div>
          </div>
        </div>
      </div>

      {/* Dialer */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: accent, marginBottom: 16 }}>📞 Place a Call</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Phone Number *</label>
            <input style={inp} placeholder="e.g. 8321234567 or +18321234567" value={phone} onChange={e => { setPhone(e.target.value); setResult(null); }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Lead Name</label>
              <input style={inp} placeholder="Monty" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Company / Business</label>
              <input style={inp} placeholder="Beauty Salon" value={company} onChange={e => setCompany(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Challenge / Context for Lauren</label>
            <input style={inp} placeholder="e.g. Interested in AI chatbot and call agent" value={challenge} onChange={e => setChallenge(e.target.value)} />
          </div>
          <button
            onClick={dial}
            disabled={calling || !phone}
            style={{ padding: "13px 20px", borderRadius: 11, border: "none", fontWeight: 700, fontSize: 14, cursor: calling || !phone ? "not-allowed" : "pointer", background: calling || !phone ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${accent}, #7c3aed)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {calling ? "⏳ Dialing…" : "📞 Have Lauren Call Now"}
          </button>
          {result && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: result.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${result.ok ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, fontSize: 13, color: result.ok ? "#22c55e" : "#ef4444" }}>
              {result.message}
            </div>
          )}
        </div>
      </div>

      {/* Recent leads quick-dial */}
      {leads.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>⚡ Quick Dial from Recent Leads</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leads.filter((l: any) => l.phone).slice(0, 10).map((lead: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{lead.name || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{lead.company || ""} · {lead.phone}</div>
                </div>
                <button
                  onClick={() => fillFromLead(lead)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${accent}40`, background: `${accent}10`, color: accent, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Fill →
                </button>
              </div>
            ))}
            {leads.filter((l: any) => l.phone).length === 0 && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "20px 0" }}>No leads with phone numbers yet</div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>📈 Call Stats</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>{data.lauren?.totalCalls ?? 0}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Total calls placed by Lauren</div>
      </div>
    </div>
  );
}
