"use client";
import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "cc360_admin_token";

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onAuth }: { onAuth: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError("Wrong password. Try again."); setPassword(""); }
      else { localStorage.setItem(TOKEN_KEY, data.token); onAuth(data.token); }
    } catch { setError("Connection error. Try again."); }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0c12", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px", background: "linear-gradient(135deg,#00d4ff22,#7c3aed22)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🔐</div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: "0 0 8px" }}>CyberCraft360</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", margin: 0 }}>Admin Access</h1>
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)}
            autoFocus autoComplete="current-password"
            style={{ width: "100%", padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, color: "#fff", fontSize: 16, outline: "none", boxSizing: "border-box", letterSpacing: "0.1em" }} />
          {error && <p style={{ fontSize: 13, color: "#ef4444", margin: 0, textAlign: "center" }}>{error}</p>}
          <button type="submit" disabled={loading || !password} style={{ padding: "16px", borderRadius: 14, background: loading || !password ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#00d4ff,#7c3aed)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading || !password ? "not-allowed" : "pointer" }}>
            {loading ? "Verifying…" : "Unlock →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      fetch("/api/admin/auth", { headers: { "x-admin-token": stored } })
        .then(r => r.json())
        .then(d => { if (d.ok) setToken(stored); else localStorage.removeItem(TOKEN_KEY); })
        .catch(() => {})
        .finally(() => setAuthChecked(true));
    } else { setAuthChecked(true); }
  }, []);

  const fetchDashboard = useCallback(async (tok: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/dashboard", { headers: { "x-admin-token": tok } });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Failed to load");
      else setData(d);
    } catch (e) { setError(String(e)); }
    setLoading(false);
  }, []);

  useEffect(() => { if (token) fetchDashboard(token); }, [token, fetchDashboard]);

  if (!authChecked) return <Spinner />;
  if (!token) return <LoginScreen onAuth={t => { setToken(t); }} />;

  function logout() { localStorage.removeItem(TOKEN_KEY); setToken(null); }

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0c12", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>

      {/* Top bar */}
      <div style={{ padding: "20px 16px 0", maxWidth: 640, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: "0 0 4px" }}>CyberCraft360</p>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: 0 }}>Dashboard</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => fetchDashboard(token)} style={ghostBtn}>↻ Refresh</button>
          <button onClick={logout} style={ghostBtn}>Log out</button>
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ padding: "16px 16px 0", maxWidth: 640, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "📄 Send Invoice", href: "/admin/invoice" },
          { label: "📅 Schedule",     href: "/admin/schedule" },
        ].map(n => (
          <a key={n.href} href={n.href} style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{n.label}</a>
        ))}
      </div>

      <div style={{ padding: "20px 16px 0", maxWidth: 640, margin: "0 auto" }}>

        {loading && !data && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Spinner inline />
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 16 }}>Loading stats…</p>
          </div>
        )}

        {error && (
          <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: "#ef4444", margin: 0 }}>✕ {error}</p>
          </div>
        )}

        {data && (
          <>
            {/* ── Revenue cards ── */}
            {data.paypal ? (
              <>
                <SectionLabel>Revenue</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <StatCard label="Total Collected" value={`$${data.paypal.totalRevenue.toLocaleString()}`} accent="#22c55e" sub={`${data.paypal.invoicesPaid} paid invoices`} />
                  <StatCard label="This Month" value={`$${data.paypal.monthRevenue.toLocaleString()}`} accent="#00d4ff" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                  <StatCard label="Outstanding" value={`$${data.paypal.outstanding.toLocaleString()}`} accent="#f59e0b" sub={`${data.paypal.invoicesUnpaid} unpaid`} />
                  <StatCard label="Cancelled Invoices" value={data.paypal.invoicesCancelled} accent="#ef4444" />
                </div>

                <SectionLabel>Recurring Subscriptions</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                  <StatCard label="Active" value={data.paypal.activeSubscriptions} accent="#22c55e" />
                  <StatCard label="MRR" value={`$${data.paypal.mrr.toLocaleString()}`} accent="#7c3aed" />
                  <StatCard label="Cancelled (mo)" value={data.paypal.cancelledThisMonth} accent="#ef4444" />
                </div>

                {data.paypal.recentInvoices?.length > 0 && (
                  <>
                    <SectionLabel>Recent Invoices</SectionLabel>
                    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                      {data.paypal.recentInvoices.map((inv: any, i: number) => (
                        <div key={inv.id} style={{ padding: "14px 18px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)" }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.client}</p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{inv.service} · {inv.date}</p>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#00d4ff", margin: "0 0 2px" }}>${inv.amount.toLocaleString()}</p>
                            <StatusBadge status={inv.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", marginBottom: 24 }}>
                <p style={{ fontSize: 13, color: "rgba(245,158,11,0.8)", margin: 0 }}>⚠️ PayPal credentials not set — revenue stats unavailable. Add <code>PAYPAL_CLIENT_ID</code>, <code>PAYPAL_CLIENT_SECRET</code>, and <code>PAYPAL_ENV=production</code> to Vercel.</p>
              </div>
            )}

            {/* ── Leads & Bookings ── */}
            <SectionLabel>Leads</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              <StatCard label="Total Leads" value={data.leads.total} accent="#00d4ff" />
              <StatCard label="This Month" value={data.leads.thisMonth} accent="#7c3aed" />
              <StatCard label="With Phone" value={data.leads.withPhone} accent="#22c55e" sub="Lauren called" />
            </div>

            <SectionLabel>Bookings</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: data.bookings.upcomingList?.length > 0 ? 12 : 24 }}>
              <StatCard label="Total" value={data.bookings.total} accent="#00d4ff" />
              <StatCard label="Upcoming" value={data.bookings.upcoming} accent="#22c55e" />
              <StatCard label="Cancelled" value={data.bookings.cancelled} accent="#ef4444" />
            </div>

            {data.bookings.upcomingList?.length > 0 && (
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                {data.bookings.upcomingList.map((b: any, i: number) => (
                  <div key={b.id} style={{ padding: "14px 18px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 2px" }}>{b.name}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{b.company}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 13, color: "#00d4ff", fontWeight: 600, margin: "0 0 2px" }}>{b.date}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{b.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Chat & Lauren ── */}
            <SectionLabel>AI Activity</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <StatCard label="Chat Conversations" value={data.chat.totalConversations} accent="#7c3aed" />
              <StatCard label="Chat Leads" value={data.chat.totalLeads} accent="#00d4ff" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <StatCard label="Lauren Calls" value={data.lauren.totalCalls} accent="#e64dff" />
              <StatCard label="Booking Clicks" value={data.chat.bookingClicks} accent="#22c55e" />
            </div>

            {/* ── Daily activity ── */}
            {Object.keys(data.chat.daily).length > 0 && (
              <>
                <SectionLabel>Chat Activity — Last 14 Days</SectionLabel>
                <MiniChart daily={data.chat.daily} />
              </>
            )}

            {/* ── Recent leads ── */}
            {data.leads.recent?.length > 0 && (
              <>
                <SectionLabel>Recent Leads</SectionLabel>
                <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                  {data.leads.recent.map((lead: any, i: number) => (
                    <div key={i} style={{ padding: "14px 18px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 2px" }}>{lead.name}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{lead.company}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {lead.phone && <p style={{ fontSize: 11, color: "#22c55e", margin: "0 0 2px" }}>📞 {lead.phone}</p>}
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>{lead.capturedAt ? new Date(lead.capturedAt).toLocaleDateString() : ""}</p>
                        </div>
                      </div>
                      {lead.challenge && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "6px 0 0", lineHeight: 1.5 }}>"{lead.challenge}"</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, accent, sub }: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div style={{ padding: "16px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontSize: "1.4rem", fontWeight: 800, color: accent, margin: sub ? "0 0 4px" : "0", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>{sub}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", margin: "0 0 10px" }}>{children}</p>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { PAID: "#22c55e", SENT: "#f59e0b", CANCELLED: "#ef4444", PARTIALLY_PAID: "#f59e0b" };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: colors[status] ?? "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{status}</span>
  );
}

function MiniChart({ daily }: { daily: Record<string, { conversations: number; leads: number }> }) {
  const days = Object.keys(daily).sort().slice(-14);
  const maxConv = Math.max(...days.map(d => daily[d].conversations), 1);
  return (
    <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", padding: "16px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 60 }}>
        {days.map(d => (
          <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, height: "100%" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%" }}>
              <div style={{ background: "#7c3aed", borderRadius: "3px 3px 0 0", height: `${(daily[d].conversations / maxConv) * 100}%`, minHeight: daily[d].conversations > 0 ? 3 : 0 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{days[0]?.slice(5)}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{days[days.length - 1]?.slice(5)}</span>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}><span style={{ color: "#7c3aed" }}>■</span> Conversations</span>
      </div>
    </div>
  );
}

function Spinner({ inline }: { inline?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: inline ? undefined : "100dvh", background: inline ? undefined : "#0a0c12" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(0,212,255,0.3)", borderTopColor: "#00d4ff", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
  fontSize: 12, cursor: "pointer",
};
