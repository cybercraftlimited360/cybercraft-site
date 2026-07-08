"use client";
import { useState, useEffect } from "react";

const SERVICES = [
  "AI Chatbot", "Voice AI Agent", "AI Phone Agent", "AI Sales Agent",
  "Workflow Automation", "AI Content Engine", "Document Intelligence",
  "Lead Intelligence", "Premium Website", "AI Ads & Marketing",
  "AI Analytics Dashboard", "AI Cybersecurity",
];

const PRESETS: Record<string, { setup: number; monthly: number }> = {
  "AI Chatbot":             { setup: 500,  monthly: 500  },
  "Voice AI Agent":         { setup: 800,  monthly: 700  },
  "AI Phone Agent":         { setup: 1000, monthly: 700  },
  "AI Sales Agent":         { setup: 1200, monthly: 900  },
  "Workflow Automation":    { setup: 800,  monthly: 600  },
  "AI Content Engine":      { setup: 500,  monthly: 600  },
  "Document Intelligence":  { setup: 1200, monthly: 700  },
  "Lead Intelligence":      { setup: 600,  monthly: 600  },
  "Premium Website":        { setup: 1500, monthly: 300  },
  "AI Ads & Marketing":     { setup: 500,  monthly: 600  },
  "AI Analytics Dashboard": { setup: 1200, monthly: 800  },
  "AI Cybersecurity":       { setup: 1500, monthly: 1000 },
};

const TOKEN_KEY = "cc360_admin_token";

export default function InvoicePage() {
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      fetch("/api/admin/auth", { headers: { "x-admin-token": stored } })
        .then(r => r.json())
        .then(d => { if (d.ok) setToken(stored); else { localStorage.removeItem(TOKEN_KEY); window.location.href = "/admin"; } })
        .catch(() => { window.location.href = "/admin"; })
        .finally(() => setAuthChecked(true));
    } else {
      window.location.href = "/admin";
    }
  }, []);

  if (!authChecked || !token) {
    return (
      <div style={{ minHeight: "100dvh", background: "#0a0c12", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(0,212,255,0.3)", borderTopColor: "#00d4ff", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <InvoiceForm token={token} />;
}

function InvoiceForm({ token }: { token: string }) {
  const [form, setForm] = useState({
    customerName: "", customerEmail: "",
    serviceName: SERVICES[0],
    setupFee: PRESETS[SERVICES[0]].setup,
    monthlyFee: PRESETS[SERVICES[0]].monthly,
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [result, setResult] = useState<{ invoiceId?: string; subscriptionApprovalUrl?: string; error?: string } | null>(null);

  function handleServiceChange(service: string) {
    const preset = PRESETS[service] || { setup: 0, monthly: 0 };
    setForm(f => ({ ...f, serviceName: service, setupFee: preset.setup, monthlyFee: preset.monthly }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setResult(null);
    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setResult({ error: data.error || "Something went wrong" }); }
      else { setStatus("success"); setResult(data); setForm(f => ({ ...f, customerName: "", customerEmail: "", notes: "" })); }
    } catch (err) { setStatus("error"); setResult({ error: String(err) }); }
  }

  const total = form.setupFee + form.monthlyFee;

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0c12", padding: "28px 16px 60px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <a href="/admin" style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none" }}>← Back</a>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: 0 }}>Send Invoice</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>Setup fee + auto-recurring billing</p>
          </div>
        </div>

        {status === "success" && result && (
          <div style={{ padding: "20px", borderRadius: 14, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#22c55e", margin: "0 0 6px" }}>✓ Invoice sent!</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>Invoice ID: <code style={{ color: "rgba(255,255,255,0.6)" }}>{result.invoiceId}</code></p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              {result.subscriptionApprovalUrl ? "✓ Subscription email sent to client" : "No monthly fee — no subscription link sent"}
            </p>
          </div>
        )}

        {status === "error" && result?.error && (
          <div style={{ padding: "16px 20px", borderRadius: 14, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 24 }}>
            <p style={{ fontSize: 14, color: "#ef4444", margin: 0 }}>✕ {result.error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Field label="Client Full Name">
            <input required type="text" placeholder="John Smith" value={form.customerName}
              onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Client Email">
            <input required type="email" placeholder="john@company.com" value={form.customerEmail}
              onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} style={inputStyle} />
          </Field>
          <Field label="Service">
            <select value={form.serviceName} onChange={e => handleServiceChange(e.target.value)} style={inputStyle}>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Setup Fee">
              <div style={{ position: "relative" }}>
                <span style={dollarStyle}>$</span>
                <input required type="number" min={0} value={form.setupFee}
                  onChange={e => setForm(f => ({ ...f, setupFee: Number(e.target.value) }))}
                  style={{ ...inputStyle, paddingLeft: 28 }} />
              </div>
            </Field>
            <Field label="Monthly Fee">
              <div style={{ position: "relative" }}>
                <span style={dollarStyle}>$</span>
                <input required type="number" min={0} value={form.monthlyFee}
                  onChange={e => setForm(f => ({ ...f, monthlyFee: Number(e.target.value) }))}
                  style={{ ...inputStyle, paddingLeft: 28 }} />
              </div>
            </Field>
          </div>
          <div style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", margin: "0 0 2px" }}>First Invoice</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>Setup + Month 1</p>
            </div>
            <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "#00d4ff" }}>${total.toLocaleString()}</span>
          </div>
          {form.monthlyFee > 0 && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              ↻ Client gets a separate email to authorize <strong style={{ color: "rgba(255,255,255,0.6)" }}>${form.monthlyFee}/mo</strong> auto-billing from Month 2 onwards.
            </div>
          )}
          <Field label="Note for Client (optional)">
            <textarea rows={3} placeholder="e.g. Your AI system will be live within 6 weeks."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} />
          </Field>
          <button type="submit" disabled={status === "sending"} style={{
            padding: "17px", borderRadius: 14, border: "none",
            background: status === "sending" ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#00d4ff,#7c3aed)",
            color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "0.06em",
            cursor: status === "sending" ? "not-allowed" : "pointer",
          }}>
            {status === "sending" ? "Sending…" : "Send Invoice →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", borderRadius: 12,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box", WebkitAppearance: "none",
};
const dollarStyle: React.CSSProperties = {
  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
  color: "rgba(255,255,255,0.3)", fontSize: 14, pointerEvents: "none",
};
