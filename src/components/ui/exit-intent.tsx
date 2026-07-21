"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExitIntent() {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"offer"|"calling"|"done">("offer");
  const [phone, setPhone] = useState("");
  const [calling, setCalling] = useState(false);
  const [callError, setCallError] = useState("");
  const firedRef = useRef(false);

  useEffect(() => {
    function getScrollDepth() {
      const scrolled = window.scrollY + window.innerHeight;
      return scrolled / document.documentElement.scrollHeight;
    }
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY > 20) return;
      if (firedRef.current) return;
      if (getScrollDepth() < 0.5) return;
      firedRef.current = true;
      setVisible(true);
    }
    // Mobile: show after 45s of inactivity
    let mobileTimer: ReturnType<typeof setTimeout>;
    function onTouch() {
      clearTimeout(mobileTimer);
      mobileTimer = setTimeout(() => {
        if (!firedRef.current && getScrollDepth() > 0.5) {
          firedRef.current = true;
          setVisible(true);
        }
      }, 45000);
    }
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("touchstart", onTouch);
      clearTimeout(mobileTimer);
    };
  }, []);

  async function handleLaurenCall() {
    if (!phone.trim()) { setCallError("Enter your phone number."); return; }
    setCalling(true); setCallError("");
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), name: "Website Visitor", company: "your business", challenge: "Came from exit intent — general inquiry about AI solutions" }),
      });
      const d = await res.json();
      if (d.ok) { setPhase("done"); }
      else { setCallError(d.error || "Couldn't place the call. Try again."); }
    } catch { setCallError("Something went wrong. Try again."); }
    finally { setCalling(false); }
  }

  function handleBook() {
    setVisible(false);
    setTimeout(() => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  }

  function handleDismiss() { setVisible(false); }

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleDismiss}
            style={{ position: "fixed", inset: 0, zIndex: 99990, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 48, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed", bottom: "48px", left: "50%", transform: "translateX(-50%)",
              zIndex: 99991, width: "min(520px, calc(100vw - 32px))",
              borderRadius: 24, background: "rgba(10,12,20,0.98)",
              border: "1px solid rgba(0,212,255,0.15)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 60px rgba(0,212,255,0.05)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: 3, background: "linear-gradient(90deg,#e64dff,#00d4ff,#7c3aed)" }} />

            <div style={{ padding: "28px 32px" }}>
              {/* Lauren header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
                <motion.div
                  animate={{ scale: [1, 1.08, 1], boxShadow: ["0 0 0px rgba(230,77,255,0.3)", "0 0 24px rgba(230,77,255,0.6)", "0 0 0px rgba(230,77,255,0.3)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 48, height: 48, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgba(230,77,255,0.8), rgba(124,58,237,0.5))", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}
                >
                  🎙️
                </motion.div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e64dff", marginBottom: 2 }}>Lauren · AI Sales Agent</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                    Available now · calls you in 60 seconds
                  </div>
                </div>
                <button onClick={handleDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: 4, flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {phase === "offer" && (
                  <motion.div key="offer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                    {/* Message */}
                    <div style={{ padding: "14px 18px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
                      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 }}>
                        Before you go — want me to <strong style={{ color: "#e64dff" }}>call you right now?</strong> I can walk you through exactly what AI would look like for your business. Takes 5 minutes, no pitch.
                      </p>
                    </div>

                    {/* Phone input */}
                    <div style={{ marginBottom: 12 }}>
                      <input
                        type="tel"
                        placeholder="+1 (832) 000-0000"
                        value={phone}
                        onChange={e => { setPhone(e.target.value); setCallError(""); }}
                        onKeyDown={e => e.key === "Enter" && handleLaurenCall()}
                        style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1px solid ${callError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 15, outline: "none", fontFamily: "system-ui,sans-serif", letterSpacing: "0.04em" }}
                        autoFocus
                      />
                      {callError && <p style={{ fontSize: 11, color: "#ef4444", margin: "5px 0 0", paddingLeft: 4 }}>{callError}</p>}
                    </div>

                    <button
                      onClick={handleLaurenCall}
                      disabled={calling}
                      style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: calling ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#e64dff,#7c3aed)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: calling ? "not-allowed" : "pointer", marginBottom: 10, letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      {calling
                        ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Calling…</>
                        : "📞 Have Lauren Call Me Now"}
                    </button>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleBook} style={{ flex: 1, padding: "11px", borderRadius: 11, border: "1px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.05)", color: "rgba(0,212,255,0.75)", fontWeight: 600, fontSize: 12, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Book a Free Call →
                      </button>
                      <button onClick={handleDismiss} style={{ padding: "11px 16px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.05)", background: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer" }}>
                        Later
                      </button>
                    </div>
                  </motion.div>
                )}

                {phase === "done" && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} style={{ textAlign: "center", padding: "16px 0 8px" }}>
                    <motion.div animate={{ scale: [0.8, 1.2, 1] }} transition={{ duration: 0.5 }} style={{ fontSize: 48, marginBottom: 14 }}>📞</motion.div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Lauren is calling you now</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 20 }}>Check your phone — she'll be calling {phone} in the next 60 seconds.</p>
                    <button onClick={handleDismiss} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}>
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
