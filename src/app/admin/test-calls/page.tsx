"use client";
import { useState, useRef, useEffect } from "react";

interface Turn {
  caller: string;
  amy: string;
}

interface CallData {
  index: number;
  label: string;
  name: string;
  company: string;
  challenge: string;
  turns: Turn[];
  done: boolean;
}

export default function TestCallsPage() {
  const [calls, setCalls] = useState<CallData[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activeCall, setActiveCall] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentCallRef = useRef<CallData | null>(null);

  function startTests() {
    setCalls([]);
    setFinished(false);
    setRunning(true);
    setActiveCall(null);

    const es = new EventSource("/api/admin/test-calls");

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "call_start") {
        const newCall: CallData = {
          index: msg.index,
          label: msg.label,
          name: msg.name,
          company: msg.company,
          challenge: msg.challenge,
          turns: [],
          done: false,
        };
        currentCallRef.current = newCall;
        setActiveCall(msg.index);
        setCalls(prev => [...prev, newCall]);
      } else if (msg.type === "turn") {
        setCalls(prev =>
          prev.map((c, i) =>
            i === prev.length - 1
              ? { ...c, turns: [...c.turns, { caller: msg.caller, amy: msg.amy }] }
              : c
          )
        );
      } else if (msg.type === "call_end") {
        setCalls(prev =>
          prev.map((c, i) => (i === prev.length - 1 ? { ...c, done: true } : c))
        );
      } else if (msg.type === "done") {
        setRunning(false);
        setFinished(true);
        setActiveCall(null);
        es.close();
      }
    };

    es.onerror = () => {
      setRunning(false);
      es.close();
    };
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [calls]);

  const statusColor = (done: boolean, index: number) => {
    if (!done && activeCall === index) return "#22c55e";
    if (done) return "#6366f1";
    return "#374151";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e5e7eb", fontFamily: "monospace", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#6366f1", textTransform: "uppercase", marginBottom: 6 }}>
              CyberCraft360 · Admin
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Amy Test Calls</h1>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6, fontFamily: "sans-serif" }}>
              Simulates 3 realistic callers end-to-end against the live Amy endpoint.
            </p>
          </div>

          <button
            onClick={startTests}
            disabled={running}
            style={{
              background: running ? "#1f2937" : "#6366f1",
              color: running ? "#6b7280" : "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: running ? "not-allowed" : "pointer",
              fontFamily: "sans-serif",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {running ? (
              <>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.2s infinite" }} />
                Running…
              </>
            ) : finished ? "Run Again" : "Run Test Calls"}
          </button>
        </div>

        {/* Progress bar */}
        {(running || finished) && (
          <div style={{ background: "#111827", borderRadius: 4, height: 4, marginBottom: 32, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, #6366f1, #a78bfa)",
              width: `${(calls.filter(c => c.done).length / 3) * 100}%`,
              transition: "width 0.4s ease",
              borderRadius: 4,
            }} />
          </div>
        )}

        {/* Calls */}
        {calls.map((call, ci) => (
          <div key={ci} style={{
            background: "#111827",
            border: `1px solid ${call.done ? "#1e1b4b" : activeCall === ci ? "#14532d" : "#1f2937"}`,
            borderRadius: 12,
            marginBottom: 20,
            overflow: "hidden",
            transition: "border-color 0.3s",
          }}>
            {/* Call header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              borderBottom: "1px solid #1f2937",
              background: "#0d1117",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: statusColor(call.done, call.index),
                flexShrink: 0,
                boxShadow: !call.done && activeCall === call.index ? "0 0 8px #22c55e" : "none",
              }} />
              <span style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {String(ci + 1).padStart(2, "0")}
              </span>
              <span style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 600, fontFamily: "sans-serif" }}>
                {call.label}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280", fontFamily: "sans-serif" }}>
                {call.company}{call.name ? ` · ${call.name}` : ""}
              </span>
            </div>

            {/* Turns */}
            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {call.turns.map((turn, ti) => (
                <div key={ti} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Caller */}
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase", paddingTop: 2, minWidth: 44 }}>
                      Caller
                    </span>
                    <span style={{ fontSize: 13, color: "#9ca3af", fontFamily: "sans-serif", lineHeight: 1.5, fontStyle: "italic" }}>
                      "{turn.caller}"
                    </span>
                  </div>
                  {/* Amy */}
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, color: "#a78bfa", letterSpacing: "0.08em", textTransform: "uppercase", paddingTop: 2, minWidth: 44 }}>
                      Amy
                    </span>
                    <span style={{ fontSize: 13, color: "#e5e7eb", fontFamily: "sans-serif", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {turn.amy}
                    </span>
                  </div>
                  {ti < call.turns.length - 1 && (
                    <div style={{ height: 1, background: "#1f2937", marginTop: 4 }} />
                  )}
                </div>
              ))}

              {/* Live indicator */}
              {!call.done && activeCall === call.index && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#22c55e", fontSize: 12, fontFamily: "sans-serif" }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 1s infinite" }} />
                  Amy is responding…
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!running && !finished && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#374151", fontFamily: "sans-serif" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📞</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No test calls yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Hit "Run Test Calls" to simulate 3 conversations live.</div>
          </div>
        )}

        {finished && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#6b7280", fontFamily: "sans-serif", fontSize: 13 }}>
            ✓ All 3 calls complete — {calls.filter(c => c.done).length} / 3 successful
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
