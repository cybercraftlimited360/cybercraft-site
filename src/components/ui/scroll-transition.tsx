"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimate } from "framer-motion";
import { useState } from "react";

export default function ScrollTransition() {
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a[href^='#']");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      const id = href.replace("#", "");
      if (!id) return;

      // Resolve the section display name
      const names: Record<string, string> = {
        about: "How It Works",
        demo: "Live Demo",
        services: "Services",
        clients: "Case Studies",
        faq: "FAQ",
        contact: "Book a Call",
        roi: "ROI Calculator",
        proposal: "AI Proposal",
      };
      const sectionName = names[id] || id;

      clearTimeout(timerRef.current);
      setLabel(sectionName);
      setActive(true);
      timerRef.current = setTimeout(() => setActive(false), 700);
    }

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed", inset: 0, zIndex: 88888,
            pointerEvents: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Scan line sweep */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0.6 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(90deg, transparent, #00d4ff, #7c3aed, transparent)",
              transformOrigin: "left",
              boxShadow: "0 0 12px rgba(0,212,255,0.6)",
            }}
          />

          {/* Horizontal vignette flash */}
          <motion.div
            initial={{ opacity: 0.08 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(0,212,255,0.04) 0%, transparent 40%, transparent 60%, rgba(124,58,237,0.04) 100%)",
            }}
          />

          {/* Section label */}
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.5em", scale: 0.94 }}
            animate={{ opacity: [0, 0.18, 0] }}
            transition={{ duration: 0.6, times: [0, 0.3, 1] }}
            style={{
              position: "absolute",
              fontSize: "clamp(2rem, 6vw, 5rem)",
              fontWeight: 700,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#ffffff",
              fontFamily: "var(--font-jakarta), system-ui, sans-serif",
              userSelect: "none",
              textAlign: "center",
            }}
          >
            {label}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
