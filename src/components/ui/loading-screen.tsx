"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"logo" | "tagline" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("tagline"), 700);
    const t2 = setTimeout(() => setPhase("exit"), 1900);
    const t3 = setTimeout(() => setVisible(false), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "oklch(0.10 0.004 240)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
          }}
        >
          {/* Logo icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-icon.svg"
              alt="CyberCraft360"
              width={90}
              height={90}
              style={{ display: "block" }}
            />
          </motion.div>

          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ display: "flex", alignItems: "baseline", gap: "2px" }}
          >
            <span style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.9)",
            }}>
              Cyber
            </span>
            <span style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#00d4ff",
            }}>
              Craft
            </span>
            <span style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.9)",
            }}>
              360
            </span>
          </motion.div>

          {/* Tagline */}
          <AnimatePresence>
            {(phase === "tagline" || phase === "exit") && (
              <motion.p
                initial={{ opacity: 0, filter: "blur(8px)", y: 6 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  fontSize: "0.62rem",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Automate Everything. Secure Anything.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <motion.div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: "2px",
              background: "linear-gradient(90deg, #00d4ff, #7c3aed, #e64dff)",
              originX: 0,
            }}
            initial={{ scaleX: 0, width: "100%" }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.9, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
