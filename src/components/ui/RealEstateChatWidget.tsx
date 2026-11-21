"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BLUEPRINT =
  "Visitor is viewing CyberCraft360's Amy for Real Estate landing page. " +
  "Amy is CyberCraft360's AI voice receptionist built for real estate teams. Amy can respond to incoming calls and inquiries, ask qualifying questions, collect buyer or seller details, and help move prospects toward a showing or callback — available 24/7 including evenings and weekends. " +
  "CyberCraft360 configures Amy around the team's existing phone, calendar, and CRM workflows. " +
  "If asked about pricing, explain that pricing depends on the business's requirements and offer a free consultation — do not quote specific prices. " +
  "IRIS does not autonomously self-learn from past conversations in real time; conversations may be reviewed by the CyberCraft360 team to improve the system over time. " +
  "When a visitor expresses interest in getting started or contacting the team, politely ask for their name, business email, type of business, and reason for reaching out — one question at a time. Do not demand contact info before answering general questions. " +
  "Offer to book a free consultation at any point a visitor expresses interest. Never invent integrations, results, or guarantees.";

const GREETING =
  "Hi! 👋 Welcome to CyberCraft360. I'm IRIS, your AI assistant. Interested in learning how Amy can help your real estate business? I can answer questions, help you request information, or guide you toward booking a free consultation.";

type QuickAction =
  | { label: string; kind: "chat"; text: string }
  | { label: string; kind: "navigate"; href: string };

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Learn About Amy", kind: "chat", text: "Tell me about Amy and what she does for real estate agents and brokerages." },
  { label: "Book a Free Consultation", kind: "navigate", href: "/book" },
  { label: "Request More Information", kind: "chat", text: "I'd like to request more information about CyberCraft360 and Amy for real estate." },
];

type Msg = { role: "user" | "assistant"; content: string };

const ACCENT = "oklch(0.78 0.13 207)";
const ACCENT_DIM = "oklch(0.78 0.13 207 / 0.15)";
const BG_PANEL = "oklch(0.14 0.007 240)";
const BG_INPUT = "oklch(0.17 0.008 240)";
const BORDER = "rgba(255,255,255,0.08)";

export default function RealEstateChatWidget() {
  const [phase, setPhase] = useState<"hidden" | "greeting" | "open" | "fab">("hidden");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuick, setShowQuick] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 5-second auto-open — only once per session; stays minimized after visitor closes
  useEffect(() => {
    try {
      if (sessionStorage.getItem("iris_re_greeted")) {
        setPhase("fab");
        return;
      }
    } catch { /* blocked storage — proceed */ }

    const t = setTimeout(() => {
      setPhase("open");
      try { sessionStorage.setItem("iris_re_greeted", "1"); } catch { /* ignore */ }
    }, 5_000);
    return () => clearTimeout(t);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Focus input when chat opens
  useEffect(() => {
    if (phase === "open") {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [phase]);

  // Escape closes
  useEffect(() => {
    if (phase !== "open") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPhase("fab");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setShowQuick(false);
    setError(null);
    setSending(true);

    const updated: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(updated);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, blueprintContext: BLUEPRINT }),
      });
      const data = await res.json();
      if (!res.ok || !data.reply) {
        setError("Something went wrong. Please try again.");
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setSending(false);
    }
  }, [messages, sending]);

  function openChat() {
    setPhase("open");
  }

  function dismissGreeting() {
    setPhase("fab");
  }

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {(phase === "greeting" || phase === "fab" || phase === "open") && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 22 }}
            onClick={() => phase === "open" ? setPhase("fab") : openChat()}
            aria-label={phase === "open" ? "Close IRIS chat" : "Chat with IRIS"}
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 9999,
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: phase === "open"
                ? "oklch(0.22 0.01 240)"
                : "linear-gradient(135deg, oklch(0.78 0.13 207), #7c3aed)",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 24px rgba(0,212,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              outline: "none",
              flexShrink: 0,
            }}
            onFocus={e => { e.currentTarget.style.outline = `2px solid ${ACCENT}`; e.currentTarget.style.outlineOffset = "3px"; }}
            onBlur={e => { e.currentTarget.style.outline = "none"; }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {phase === "open" ? (
                <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
                </motion.svg>
              ) : (
                <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }} width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Greeting bubble */}
      <AnimatePresence>
        {phase === "greeting" && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed",
              bottom: 92,
              right: 24,
              zIndex: 9998,
              maxWidth: 300,
              background: BG_PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 14,
              padding: "14px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            }}
          >
            {/* tail */}
            <div style={{
              position: "absolute",
              bottom: -7,
              right: 20,
              width: 14,
              height: 7,
              overflow: "hidden",
            }}>
              <div style={{
                width: 14,
                height: 14,
                background: BG_PANEL,
                border: `1px solid ${BORDER}`,
                transform: "rotate(45deg)",
                transformOrigin: "top left",
                marginTop: -1,
              }} />
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              {/* avatar */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${ACCENT_DIM}, rgba(124,58,237,0.2))`,
                border: `1.5px solid oklch(0.78 0.13 207 / 0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: ACCENT,
                flexShrink: 0,
              }}>I</div>

              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  {GREETING}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={openChat}
                    style={{
                      flex: 1,
                      background: ACCENT,
                      color: "#000",
                      border: "none",
                      borderRadius: 8,
                      padding: "7px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Chat with IRIS
                  </button>
                  <button
                    onClick={dismissGreeting}
                    aria-label="Dismiss"
                    style={{
                      background: "transparent",
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      padding: "7px 10px",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {phase === "open" && (
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-label="IRIS AI Assistant"
            aria-modal="true"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            style={{
              position: "fixed",
              bottom: 92,
              right: 24,
              zIndex: 9998,
              width: "min(380px, calc(100vw - 32px))",
              height: "min(540px, calc(100dvh - 120px))",
              background: BG_PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: 18,
              boxShadow: "0 16px 56px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
            }}
          >
            {/* gradient top bar */}
            <div style={{ height: 3, background: "linear-gradient(90deg, oklch(0.78 0.13 207), #7c3aed)", flexShrink: 0 }} />

            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${ACCENT_DIM}, rgba(124,58,237,0.2))`,
                border: `1.5px solid oklch(0.78 0.13 207 / 0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                color: ACCENT,
                flexShrink: 0,
              }}>I</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>IRIS</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  CyberCraft360 · AI Assistant
                </div>
              </div>
              <button
                onClick={() => setPhase("fab")}
                aria-label="Close chat"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.35)",
                  padding: 6,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.1) transparent",
              }}
            >
              {/* Quick actions — shown before any user message */}
              {showQuick && messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* IRIS intro */}
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: ACCENT_DIM, border: `1px solid oklch(0.78 0.13 207 / 0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: ACCENT, flexShrink: 0 }}>I</div>
                    <div style={{ background: "oklch(0.18 0.008 240)", border: `1px solid ${BORDER}`, borderRadius: "4px 14px 14px 14px", padding: "10px 13px", fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, maxWidth: "85%" }}>
                      Hi! 👋 Welcome to CyberCraft360. I'm IRIS, your AI assistant. Interested in learning how Amy can help your real estate business? I can answer questions, help you request information, or guide you toward booking a free consultation.
                    </div>
                  </div>

                  <div style={{ paddingLeft: 36 }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 8px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Quick options</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            if (action.kind === "navigate") {
                              window.location.href = action.href;
                            } else {
                              sendMessage(action.text);
                            }
                          }}
                          disabled={sending && action.kind === "chat"}
                          style={{
                            background: ACCENT_DIM,
                            border: `1px solid oklch(0.78 0.13 207 / 0.25)`,
                            borderRadius: 10,
                            padding: "9px 13px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: ACCENT,
                            cursor: (sending && action.kind === "chat") ? "not-allowed" : "pointer",
                            textAlign: "left",
                            fontFamily: "inherit",
                            transition: "background 0.15s, border-color 0.15s",
                            opacity: (sending && action.kind === "chat") ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { if (!(sending && action.kind === "chat")) { (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.78 0.13 207 / 0.22)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.78 0.13 207 / 0.5)"; } }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ACCENT_DIM; (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.78 0.13 207 / 0.25)"; }}
                        >
                          {action.label}
                          {action.kind === "navigate" && (
                            <span style={{ marginLeft: 6, opacity: 0.5, fontSize: 11 }}>→</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Conversation messages */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    gap: 8,
                    alignItems: "flex-end",
                  }}
                >
                  {msg.role === "assistant" && (
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: ACCENT_DIM, border: `1px solid oklch(0.78 0.13 207 / 0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: ACCENT, flexShrink: 0, marginBottom: 2 }}>I</div>
                  )}
                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "10px 13px",
                      borderRadius: msg.role === "user"
                        ? "14px 4px 14px 14px"
                        : "4px 14px 14px 14px",
                      background: msg.role === "user"
                        ? "linear-gradient(135deg, oklch(0.78 0.13 207), #7c3aed)"
                        : "oklch(0.18 0.008 240)",
                      border: msg.role === "assistant" ? `1px solid ${BORDER}` : "none",
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: msg.role === "user" ? "#000" : "rgba(255,255,255,0.82)",
                      fontWeight: msg.role === "user" ? 500 : 400,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: ACCENT_DIM, border: `1px solid oklch(0.78 0.13 207 / 0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: ACCENT, flexShrink: 0 }}>I</div>
                  <div style={{ background: "oklch(0.18 0.008 240)", border: `1px solid ${BORDER}`, borderRadius: "4px 14px 14px 14px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map(d => (
                      <motion.span
                        key={d}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.9, delay: d * 0.18, ease: "easeInOut" }}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "block" }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && !sending && (
                <p style={{ fontSize: 12, color: "rgba(255,100,100,0.85)", textAlign: "center", margin: 0 }}>{error}</p>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              borderTop: `1px solid ${BORDER}`,
              padding: "10px 12px",
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
              background: BG_PANEL,
            }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                placeholder="Ask anything about Amy…"
                disabled={sending}
                style={{
                  flex: 1,
                  background: BG_INPUT,
                  border: `1px solid rgba(255,255,255,0.1)`,
                  borderRadius: 10,
                  padding: "10px 13px",
                  fontSize: 13,
                  color: "#fff",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => { e.target.style.borderColor = "oklch(0.78 0.13 207 / 0.5)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || sending}
                aria-label="Send message"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: !input.trim() || sending
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(135deg, oklch(0.78 0.13 207), #7c3aed)",
                  border: "none",
                  cursor: !input.trim() || sending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.2s, opacity 0.2s",
                  opacity: !input.trim() || sending ? 0.4 : 1,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 2L7 9M14 2L9.5 14 7 9 2 6.5 14 2Z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Footer */}
            <div style={{ padding: "5px 14px 9px", textAlign: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: "0.06em" }}>
                IRIS · CyberCraft360 AI · Conversations may be reviewed
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
