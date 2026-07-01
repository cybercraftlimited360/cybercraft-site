"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };
type Lead = { name: string; company: string; challenge: string };

const OPENING_MESSAGE: Message = {
  role: "assistant",
  content: "Hey there 👋 I'm Cipher — what brought you here today?",
};

function LeadCapturedCard({ lead }: { lead: Lead }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        margin: "4px 0",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid rgba(34,197,94,0.2)",
        background: "rgba(34,197,94,0.05)",
      }}
    >
      {/* Green top bar */}
      <div style={{ height: "2px", background: "linear-gradient(90deg, #22c55e, transparent)" }} />

      <div style={{ padding: "16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div style={{
            width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
            background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#22c55e", letterSpacing: "0.04em" }}>
            You're on our radar
          </span>
        </div>

        {/* Lead details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
          {[
            { label: "Name", value: lead.name },
            { label: "Company", value: lead.company },
            { label: "Challenge", value: lead.challenge },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <span style={{
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)", flexShrink: 0, paddingTop: "2px", minWidth: "56px",
              }}>{label}</span>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{value}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginBottom: "12px", lineHeight: 1.5 }}>
          Our founder will personally review your details and follow up within 24 hours.
        </p>

        {/* CTA */}
        <a
          href="https://calendly.com/cybercraftlimited/30min"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block", textAlign: "center", padding: "9px 12px",
            borderRadius: "10px", fontSize: "0.68rem", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff", cursor: "pointer",
          }}
        >
          Book your strategy call now →
        </a>
      </div>
    </motion.div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([OPENING_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [capturedLead, setCapturedLead] = useState<Lead | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setShowLabel(true), 2500);
    const t2 = setTimeout(() => setShowLabel(false), 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, capturedLead]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const updated: Message[] = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated
            .filter((m, i) => !(m.role === "assistant" && i === 0))
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (data.error) console.error("Chat error:", data.error);

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply || data.error || "Something went wrong." },
      ]);

      // Show lead card once — only the first time all 3 fields are captured
      if (data.lead && !capturedLead) {
        setCapturedLead(data.lead);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Network error — please check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating label */}
      <AnimatePresence>
        {showLabel && !open && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed", bottom: "36px", right: "96px", zIndex: 9999,
              padding: "8px 14px", borderRadius: "999px",
              background: "rgba(10,12,18,0.92)", border: "1px solid rgba(0,212,255,0.2)",
              backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap", pointerEvents: "none",
            }}
          >
            Ask CIPHER ✦
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.div
        style={{ position: "fixed", bottom: "28px", right: "28px", zIndex: 9999 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.4 }}
      >
        {!open && (
          <>
            <motion.span
              style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(0,212,255,0.4)" }}
              animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(124,58,237,0.35)" }}
              animate={{ scale: [1, 1.9], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            />
          </>
        )}

        <motion.button
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Open CyberCraft AI chat"
          style={{
            position: "relative", width: "56px", height: "56px", borderRadius: "50%",
            border: "1px solid rgba(0,212,255,0.35)",
            background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 24px rgba(0,212,255,0.2), 0 8px 32px rgba(0,0,0,0.5)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </motion.svg>
            ) : (
              <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Green dot when lead captured */}
          {capturedLead && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: "absolute", top: "2px", right: "2px",
                width: "12px", height: "12px", borderRadius: "50%",
                background: "#22c55e", border: "2px solid rgba(10,12,18,0.9)",
              }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed", bottom: "96px", right: "28px", zIndex: 9999,
              width: "360px", height: "540px", borderRadius: "20px",
              border: capturedLead ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(255,255,255,0.08)",
              background: "rgba(10,12,18,0.96)", backdropFilter: "blur(32px) saturate(160%)",
              boxShadow: capturedLead
                ? "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(34,197,94,0.08)"
                : "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.06)",
              display: "flex", flexDirection: "column", overflow: "hidden",
              transition: "border-color 0.4s, box-shadow 0.4s",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: capturedLead
                ? "linear-gradient(135deg, rgba(34,197,94,0.07), rgba(0,212,255,0.04))"
                : "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(124,58,237,0.06))",
              display: "flex", alignItems: "center", gap: "12px", flexShrink: 0,
              transition: "background 0.4s",
            }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: capturedLead
                  ? "linear-gradient(135deg, #22c55e, #00d4ff)"
                  : "linear-gradient(135deg, #00d4ff, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "background 0.4s",
              }}>
                {capturedLead ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.01em" }}>
                  CIPHER
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: capturedLead ? "#22c55e" : "#22c55e", display: "inline-block",
                  }} />
                  <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
                    {capturedLead ? "Lead captured — you're in the queue" : "Online now"}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
                >
                  <div style={{
                    maxWidth: "82%", padding: "10px 14px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.role === "user"
                      ? "linear-gradient(135deg, #00d4ff, #7c3aed)"
                      : "rgba(255,255,255,0.06)",
                    border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.07)" : "none",
                    fontSize: "0.82rem", lineHeight: 1.55,
                    color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.85)",
                    whiteSpace: "pre-wrap",
                  }}>
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {/* Lead captured card — injected inline in message stream */}
              {capturedLead && <LeadCapturedCard lead={capturedLead} />}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{
                    padding: "10px 16px", borderRadius: "16px 16px 16px 4px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", gap: "5px", alignItems: "center",
                  }}>
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00d4ff", display: "block" }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex", gap: "8px", flexShrink: 0, background: "rgba(0,0,0,0.2)",
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder={capturedLead ? "Continue the conversation..." : "Ask anything..."}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)", borderRadius: "12px",
                  padding: "10px 14px", fontSize: "0.82rem", color: "rgba(255,255,255,0.9)",
                  outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{
                  width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
                  background: input.trim() && !loading ? "linear-gradient(135deg, #00d4ff, #7c3aed)" : "rgba(255,255,255,0.06)",
                  border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
