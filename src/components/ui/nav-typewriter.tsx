"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";

const FULL = "CyberCraft 360";
const CHAR_MS = 45;

export default function NavTypewriter() {
  const [displayed, setDisplayed] = useState(FULL);
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleEnter = () => {
    clear();
    setIsTyping(true);
    setDisplayed("");
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayed(FULL.slice(0, i));
      if (i >= FULL.length) {
        clearInterval(intervalRef.current!);
        setIsTyping(false);
      }
    }, CHAR_MS);
  };

  const handleLeave = () => {
    clear();
    setIsTyping(false);
    setDisplayed(FULL);
  };

  // Split for coloring: "Cyber" white, "Craft 360" cyan
  const white = displayed.slice(0, Math.min(displayed.length, 5));       // "Cyber"
  const cyan  = displayed.slice(5);                                        // "Craft 360"

  return (
    <motion.span
      onHoverStart={handleEnter}
      onHoverEnd={handleLeave}
      style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", minWidth: "10ch" }}
    >
      <span style={{ color: "#ffffff" }}>{white}</span>
      <span style={{ color: "#00d4ff" }}>{cyan}</span>
      {isTyping && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.45, repeat: Infinity, repeatType: "reverse" }}
          style={{ display: "inline-block", width: "2px", height: "1em", background: "#00d4ff", marginLeft: "2px", verticalAlign: "middle" }}
        />
      )}
    </motion.span>
  );
}
