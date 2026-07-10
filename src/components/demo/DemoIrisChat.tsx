"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };

const PERSONAS = [
  { key: "beauty",     emoji: "💅", label: "Beauty Salon",  name: "Glam Studio",         color: "#e64dff" },
  { key: "restaurant", emoji: "🍕", label: "Restaurant",    name: "Mario's Kitchen",      color: "#f97316" },
  { key: "dental",     emoji: "🦷", label: "Dental Office", name: "Bright Smile Dental",  color: "#00d4ff" },
  { key: "realestate", emoji: "🏡", label: "Real Estate",   name: "Pinnacle Realty",      color: "#22c55e" },
  { key: "auto",       emoji: "🔧", label: "Auto Repair",   name: "QuickFix Auto",        color: "#f59e0b" },
];

const STARTERS: Record<string, string[]> = {
  beauty:     ["What's your price for balayage?", "Do you have any openings this week?", "Do you do lash extensions?"],
  restaurant: ["Do you have gluten-free options?", "Can I book a private dinner?", "What are your hours on Saturday?"],
  dental:     ["I need an emergency appointment", "How much does whitening cost?", "Do you accept Delta Dental?"],
  realestate: ["I want to sell my home", "What's my house worth?", "Do you handle rentals too?"],
  auto:       ["How much is an oil change?", "My brakes are squeaking", "Do I need an appointment?"],
};

export default function DemoIrisChat() {
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function selectPersona(p: typeof PERSONAS[0]) {
    setPersona(p);
    setMessages([]);
    setStarted(false);
    setInput("");
  }

  function startChat() {
    setStarted(true);
    const greeting: Message = {
      role: "assistant",
      content: `Hi! Thanks for reaching out to ${persona.name}. I'm IRIS, your AI assistant. How can I help you today? 😊`,
    };
    setMessages([greeting]);
    setTimeout(() => inputRef.current?.focus(), 300);
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: persona.key, messages: newMessages }),
      });
      const data = await res.json();
      if (data.reply) setMessages(m => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const accent = persona.color;

  return (
    <section className="px-[5vw] md:px-[6vw] py-20 md:py-28 border-t border-border/40">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-8 h-0.5 bg-primary rounded-full" />
          <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Try It Live</span>
          <div className="w-8 h-0.5 bg-primary rounded-full" />
        </div>
        <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground leading-tight mb-4"
          style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif" }}>
          Chat With an AI Built For<br /><em>Your Industry</em>
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Pick a business type below and talk to IRIS as if you were a real customer. This is exactly what your clients experience.
        </p>
      </motion.div>

      {/* Persona selector */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {PERSONAS.map(p => (
          <button
            key={p.key}
            onClick={() => selectPersona(p)}
            style={{
              padding: "10px 18px",
              borderRadius: 50,
              border: `1px solid ${persona.key === p.key ? p.color : "rgba(255,255,255,0.1)"}`,
              background: persona.key === p.key ? `${p.color}18` : "rgba(255,255,255,0.03)",
              color: persona.key === p.key ? p.color : "rgba(255,255,255,0.45)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 16 }}>{p.emoji}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <motion.div
        key={persona.key}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ maxWidth: 680, margin: "0 auto" }}
      >
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          overflow: "hidden",
        }}>
          {/* Chat header */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${accent}18`, border: `1px solid ${accent}30`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>
              {persona.emoji}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{persona.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>IRIS — AI Receptionist · Online</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, background: `${accent}12`, border: `1px solid ${accent}25`, padding: "4px 10px", borderRadius: 20 }}>
              LIVE DEMO
            </div>
          </div>

          {/* Messages */}
          <div style={{ height: 380, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <AnimatePresence initial={false}>
              {!started ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
                >
                  <div style={{ fontSize: 48 }}>{persona.emoji}</div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Chat with IRIS at {persona.name}</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>Experience what your customers will see</p>
                  </div>
                  <button
                    onClick={startChat}
                    style={{
                      padding: "12px 28px", borderRadius: 12, border: "none",
                      background: `linear-gradient(135deg, ${accent}, #7c3aed)`,
                      color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Start Conversation →
                  </button>
                </motion.div>
              ) : (
                <>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
                    >
                      {m.role === "assistant" && (
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}18`, border: `1px solid ${accent}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>
                          {persona.emoji}
                        </div>
                      )}
                      <div style={{
                        maxWidth: "72%", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: m.role === "user" ? `${accent}20` : "rgba(255,255,255,0.05)",
                        border: `1px solid ${m.role === "user" ? `${accent}35` : "rgba(255,255,255,0.08)"}`,
                      }}>
                        <p style={{ margin: 0, fontSize: 13, color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>{m.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}18`, border: `1px solid ${accent}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{persona.emoji}</div>
                      <div style={{ display: "flex", gap: 4, padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {[0, 1, 2].map(j => (
                          <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: accent, animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Starter chips */}
          {started && messages.length <= 2 && (
            <div style={{ padding: "0 16px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(STARTERS[persona.key] ?? []).map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.55)", fontWeight: 500, transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {started && (
            <div style={{
              padding: "12px 14px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex", gap: 10, alignItems: "center",
              background: "rgba(255,255,255,0.015)",
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder={`Message ${persona.name}…`}
                style={{
                  flex: 1, padding: "11px 16px", borderRadius: 12,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 14, outline: "none",
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  width: 42, height: 42, borderRadius: 11, border: "none", flexShrink: 0,
                  background: !input.trim() || loading ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg,${accent},#7c3aed)`,
                  color: "#fff", fontSize: 17, cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ↑
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12 }}>
          This is a live AI demo — not a scripted bot. Your custom AI is trained on your actual business data.
        </p>
      </motion.div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </section>
  );
}
