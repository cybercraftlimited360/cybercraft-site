"use client";
import { useState, useEffect } from "react";

const ADMIN_SECRET = "cybercraft360admin";

type Stats = {
  totalConversations: number;
  totalLeads: number;
  totalMessages: number;
  bookingClicks: number;
};

type DailyRecord = { conversations: number; leads: number };

export default function AnalyticsDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<Record<string, DailyRecord>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?secret=${ADMIN_SECRET}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setStats(data.stats ?? { totalConversations: 0, totalLeads: 0, totalMessages: 0, bookingClicks: 0 });
      setDaily(data.daily ?? {});
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authed) fetchData();
  }, [authed]);

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a0c12", fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{
          width: "360px", background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "20px", padding: "40px", textAlign: "center",
        }}>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Chat Analytics</div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", marginBottom: "28px" }}>CyberCraft360 Admin</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && password === ADMIN_SECRET && setAuthed(true)}
            placeholder="Admin password"
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px", padding: "12px 16px", color: "#fff", fontSize: "0.9rem",
              outline: "none", marginBottom: "12px", boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => password === ADMIN_SECRET && setAuthed(true)}
            style={{
              width: "100%", padding: "12px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff",
              fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
            }}
          >
            Access Dashboard
          </button>
        </div>
      </div>
    );
  }

  const conversionRate = stats && stats.totalConversations > 0
    ? ((stats.totalLeads / stats.totalConversations) * 100).toFixed(1)
    : "0.0";

  const avgMessages = stats && stats.totalConversations > 0
    ? (stats.totalMessages / stats.totalConversations).toFixed(1)
    : "0.0";

  const sortedDays = Object.entries(daily).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c12", color: "#fff", fontFamily: "system-ui, sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "36px" }}>
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: "0 0 6px" }}>CyberCraft360</p>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>Chat Analytics</h1>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={fetchData} style={{
              padding: "8px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", fontSize: "0.78rem",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
            <a href="/admin/schedule" style={{
              padding: "8px 18px", borderRadius: "10px", border: "1px solid rgba(0,212,255,0.2)",
              background: "rgba(0,212,255,0.05)", color: "#00d4ff", fontSize: "0.78rem",
              cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
            }}>
              View Bookings →
            </a>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "14px 18px", marginBottom: "24px", color: "#f87171", fontSize: "0.82rem" }}>
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total Conversations", value: stats?.totalConversations ?? 0, color: "#00d4ff", icon: "💬" },
            { label: "Leads Captured", value: stats?.totalLeads ?? 0, color: "#22c55e", icon: "🎯" },
            { label: "Conversion Rate", value: `${conversionRate}%`, color: "#f59e0b", icon: "📈" },
            { label: "Avg. Messages", value: avgMessages, color: "#a78bfa", icon: "✉️" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "22px 20px",
            }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "8px" }}>{icon}</div>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color, marginBottom: "4px" }}>{value}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Daily breakdown */}
        <div style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 20px" }}>
            Daily Activity — Last 14 Days
          </h2>
          {sortedDays.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.85rem", textAlign: "center", padding: "32px 0" }}>
              No conversation data yet. Data appears as visitors chat with CIPHER.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {sortedDays.map(([date, rec]) => {
                const dayConvRate = rec.conversations > 0 ? Math.round((rec.leads / rec.conversations) * 100) : 0;
                const barW = Math.min(100, (rec.conversations / Math.max(...sortedDays.map(([, r]) => r.conversations))) * 100);
                return (
                  <div key={date} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "90px", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", flexShrink: 0 }}>
                      {new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                    <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <div style={{ width: `${barW}%`, height: "100%", background: "linear-gradient(90deg, #00d4ff, #7c3aed)", borderRadius: "3px" }} />
                    </div>
                    <div style={{ width: "100px", display: "flex", gap: "12px", justifyContent: "flex-end", fontSize: "0.75rem" }}>
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>{rec.conversations} chats</span>
                      <span style={{ color: "#22c55e" }}>{rec.leads} leads</span>
                      <span style={{ color: "#f59e0b" }}>{dayConvRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "0.7rem", color: "rgba(255,255,255,0.15)", marginTop: "32px" }}>
          Analytics are tracked from the moment a visitor sends their first message to CIPHER.
        </p>
      </div>
    </div>
  );
}
