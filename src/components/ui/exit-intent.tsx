"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExitIntent() {
  const [visible, setVisible] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    function getScrollDepth() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      return scrolled / total;
    }

    function onMouseLeave(e: MouseEvent) {
      // Only trigger when cursor exits through the top of the viewport
      if (e.clientY > 20) return;
      if (firedRef.current) return;
      if (getScrollDepth() < 0.7) return;

      firedRef.current = true;
      setVisible(true);

      // Auto-speak after modal appears
      setTimeout(() => {
        setSpeaking(true);
        speak("Before you leave — I can put together a custom ROI breakdown for your business, or you can book a free strategy call right now. Which would you prefer?");
      }, 600);
    }

    document.addEventListener("mouseleave", onMouseLeave);
    return () => document.removeEventListener("mouseleave", onMouseLeave);
  }, []);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    utt.rate = 0.95;
    utt.pitch = 1.05;

    // Try to use a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      "Microsoft Aria Online (Natural)", "Microsoft Jenny Online (Natural)",
      "Google US English", "Samantha", "Karen",
    ];
    for (const name of preferred) {
      const v = voices.find(v => v.name.includes(name.split(" ")[1]));
      if (v) { utt.voice = v; break; }
    }

    utt.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }

  function handleBook() {
    window.speechSynthesis?.cancel();
    setVisible(false);
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }

  function handleROI() {
    window.speechSynthesis?.cancel();
    setVisible(false);
    setTimeout(() => {
      document.getElementById("roi")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }

  function handleDismiss() {
    window.speechSynthesis?.cancel();
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleDismiss}
            style={{
              position: "fixed", inset: 0, zIndex: 99990,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed",
              bottom: "48px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 99991,
              width: "min(520px, calc(100vw - 40px))",
              borderRadius: "24px",
              background: "rgba(10,12,20,0.97)",
              border: "1px solid rgba(0,212,255,0.15)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,212,255,0.06), 0 0 60px rgba(0,212,255,0.04)",
              overflow: "hidden",
            }}
          >
            {/* Cyan top accent */}
            <div style={{ height: "2px", background: "linear-gradient(90deg, #00d4ff, #7c3aed, transparent)" }} />

            <div style={{ padding: "32px 36px" }}>
              {/* IRIS row */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                {/* Animated orb */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <motion.div
                    animate={{ scale: speaking ? [1, 1.15, 1] : 1, opacity: speaking ? [0.6, 1, 0.6] : 0.5 }}
                    transition={{ duration: 1.2, repeat: speaking ? Infinity : 0 }}
                    style={{
                      width: "52px", height: "52px", borderRadius: "50%",
                      background: "radial-gradient(circle at 35% 35%, rgba(0,212,255,0.7), rgba(124,58,237,0.5))",
                      boxShadow: speaking ? "0 0 24px rgba(0,212,255,0.5)" : "0 0 12px rgba(0,212,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {/* Sound wave dots */}
                    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={speaking
                            ? { height: ["4px", "12px", "4px"] }
                            : { height: "4px" }
                          }
                          transition={{ duration: 0.5, repeat: speaking ? Infinity : 0, delay: i * 0.12 }}
                          style={{ width: "2px", background: "rgba(255,255,255,0.9)", borderRadius: "2px" }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>

                <div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(0,212,255,0.6)", marginBottom: "4px" }}>
                    IRIS · AI Strategy Consultant
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                    Live on this page
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={handleDismiss}
                  style={{
                    marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.2)", padding: "4px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Message bubble */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                style={{
                  padding: "16px 20px",
                  borderRadius: "16px 16px 16px 4px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: "24px",
                }}
              >
                <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.82)", lineHeight: 1.55, margin: 0 }}>
                  Before you leave — I can put together a custom ROI breakdown, or you can{" "}
                  <strong style={{ color: "#00d4ff" }}>book a free strategy call</strong>{" "}
                  right now. Which works for you?
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ display: "flex", gap: "10px" }}
              >
                <button
                  onClick={handleBook}
                  style={{
                    flex: 1, padding: "13px",
                    borderRadius: "12px", border: "none",
                    background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                    color: "#fff", fontWeight: 700,
                    fontSize: "0.75rem", letterSpacing: "0.1em",
                    textTransform: "uppercase", cursor: "pointer",
                  }}
                >
                  Book a Free Call →
                </button>
                <button
                  onClick={handleROI}
                  style={{
                    flex: 1, padding: "13px",
                    borderRadius: "12px",
                    border: "1px solid rgba(0,212,255,0.2)",
                    background: "rgba(0,212,255,0.05)",
                    color: "rgba(0,212,255,0.7)",
                    fontWeight: 600, fontSize: "0.75rem",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Show My ROI
                </button>
                <button
                  onClick={handleDismiss}
                  style={{
                    padding: "13px 14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.2)",
                    fontWeight: 500, fontSize: "0.72rem",
                    cursor: "pointer",
                  }}
                >
                  Later
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
