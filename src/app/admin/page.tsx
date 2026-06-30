"use client";
import { useState } from "react";

const SERVICES = [
  "AI Chatbot",
  "Voice AI Agent",
  "AI Phone Agent",
  "AI Sales Agent",
  "Workflow Automation",
  "AI Content Engine",
  "Document Intelligence",
  "Lead Intelligence",
  "Premium Website",
  "AI Ads & Marketing",
  "AI Analytics Dashboard",
  "AI Cybersecurity",
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

export default function AdminPage() {
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setResult({ error: data.error || "Something went wrong" });
      } else {
        setStatus("success");
        setResult(data);
      }
    } catch (err) {
      setStatus("error");
      setResult({ error: String(err) });
    }
  }

  const total = form.setupFee + form.monthlyFee;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0c12", padding: "48px 20px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>CyberCraft360</span>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", margin: "8px 0 6px" }}>Send Invoice</h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
            Sends a first invoice (setup + month 1) and a recurring subscription link automatically.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Client Name */}
            <Field label="Client Full Name">
              <input
                required
                type="text"
                placeholder="John Smith"
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                style={inputStyle}
              />
            </Field>

            {/* Client Email */}
            <Field label="Client Email">
              <input
                required
                type="email"
                placeholder="john@company.com"
                value={form.customerEmail}
                onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                style={inputStyle}
              />
            </Field>

            {/* Service */}
            <Field label="Service">
              <select
                value={form.serviceName}
                onChange={e => handleServiceChange(e.target.value)}
                style={inputStyle}
              >
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            {/* Fees */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Field label="Setup Fee (one-time)">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>$</span>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.setupFee}
                    onChange={e => setForm(f => ({ ...f, setupFee: Number(e.target.value) }))}
                    style={{ ...inputStyle, paddingLeft: "28px" }}
                  />
                </div>
              </Field>
              <Field label="Monthly Fee (recurring)">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>$</span>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.monthlyFee}
                    onChange={e => setForm(f => ({ ...f, monthlyFee: Number(e.target.value) }))}
                    style={{ ...inputStyle, paddingLeft: "28px" }}
                  />
                </div>
              </Field>
            </div>

            {/* Total preview */}
            <div style={{ padding: "16px 20px", borderRadius: "12px", background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>First Invoice Total</span>
              <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#00d4ff" }}>${total.toLocaleString()}</span>
            </div>

            {/* Recurring reminder */}
            <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              ↻ After payment, client will receive a separate email to authorize <strong style={{ color: "rgba(255,255,255,0.65)" }}>${form.monthlyFee}/month</strong> recurring billing starting Month 2.
            </div>

            {/* Notes */}
            <Field label="Custom Note (optional)">
              <textarea
                rows={3}
                placeholder="Any custom message for this client..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                style={{ ...inputStyle, resize: "vertical", height: "80px" }}
              />
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "sending"}
              style={{
                padding: "15px",
                borderRadius: "12px",
                background: status === "sending" ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#00d4ff,#7c3aed)",
                border: "none",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: status === "sending" ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
              }}
            >
              {status === "sending" ? "Sending…" : "Send Invoice & Set Up Recurring →"}
            </button>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div style={{
            marginTop: "24px",
            padding: "24px",
            borderRadius: "14px",
            background: status === "success" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${status === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}>
            {status === "success" ? (
              <>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#22c55e", margin: "0 0 10px" }}>✓ Invoice sent successfully</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>Invoice ID: <code style={{ color: "rgba(255,255,255,0.6)" }}>{result.invoiceId}</code></p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  {result.subscriptionApprovalUrl
                    ? "✓ Recurring subscription email sent to client"
                    : "No monthly fee — no subscription link sent"}
                </p>
              </>
            ) : (
              <p style={{ fontSize: "14px", color: "#ef4444", margin: 0 }}>✕ {result.error}</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};
