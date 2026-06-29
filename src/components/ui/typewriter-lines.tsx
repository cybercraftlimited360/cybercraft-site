"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LINE1 = "AUTOMATE EVERYTHING.";
const LINE2 = "SECURE ANYTHING.";
const CHAR_DELAY = 55; // ms per character
const PAUSE_BETWEEN = 400; // pause after line 1 finishes
const START_DELAY = 900; // wait before typing begins

export default function TypewriterLines() {
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [phase, setPhase] = useState<"idle" | "line1" | "pause" | "line2" | "done">("idle");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    timeout = setTimeout(() => {
      setPhase("line1");
      let i = 0;
      interval = setInterval(() => {
        i++;
        setLine1(LINE1.slice(0, i));
        if (i >= LINE1.length) {
          clearInterval(interval);
          setPhase("pause");
          timeout = setTimeout(() => {
            setPhase("line2");
            let j = 0;
            interval = setInterval(() => {
              j++;
              setLine2(LINE2.slice(0, j));
              if (j >= LINE2.length) {
                clearInterval(interval);
                setPhase("done");
              }
            }, CHAR_DELAY);
          }, PAUSE_BETWEEN);
        }
      }, CHAR_DELAY);
    }, START_DELAY);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const cursor = (visible: boolean) =>
    visible ? (
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        style={{ display: "inline-block", width: "2px", height: "0.85em", background: "currentColor", marginLeft: "2px", verticalAlign: "middle" }}
      />
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      style={{
        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
        fontSize: "clamp(0.65rem, 1.1vw, 0.9rem)",
        fontWeight: 600,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}
    >
      <motion.span
        style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.28em", cursor: "default", minHeight: "1.4em" }}
        whileHover={{ letterSpacing: "0.38em", color: "rgba(255,255,255,1)", textShadow: "0 0 18px rgba(255,255,255,0.35)" }}
        transition={{ duration: 0.3 }}
      >
        {line1}
        {(phase === "line1") && cursor(true)}
      </motion.span>

      <motion.span
        style={{ color: "#00d4ff", letterSpacing: "0.28em", cursor: "default", minHeight: "1.4em" }}
        whileHover={{ letterSpacing: "0.38em", color: "#7aeeff", textShadow: "0 0 18px rgba(0,212,255,0.55)" }}
        transition={{ duration: 0.3 }}
      >
        {line2}
        {(phase === "line2") && cursor(true)}
      </motion.span>
    </motion.div>
  );
}
