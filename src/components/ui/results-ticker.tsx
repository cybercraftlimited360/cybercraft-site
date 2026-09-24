"use client";
import { motion } from "framer-motion";

const ITEMS = [
  "100% Custom Built",
  "0 Templates Used",
  "24/7 AI Always On",
  "Voice · Chat · Automation",
  "Real Estate · Healthcare · Legal · Trades",
  "4–6 Week Average Deploy Time",
  "Trained on Your Business",
  "Monitored & Improved Monthly",
  "US Service Businesses",
  "Free Discovery Call — 45 Minutes",
];

export default function ResultsTicker() {
  const repeated = [...ITEMS, ...ITEMS]; // duplicate for seamless loop

  return (
    <div
      className="relative overflow-hidden border-y border-border/40 bg-background"
      style={{ padding: "14px 0" }}
    >
      {/* Left/right fade masks */}
      <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(90deg, var(--background), transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(-90deg, var(--background), transparent)" }} />

      <motion.div
        className="flex gap-0 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center gap-0">
            <span className="text-[0.7rem] font-semibold tracking-[0.2em] uppercase text-muted-foreground px-8">{item}</span>
            <span className="text-primary opacity-40 text-xs">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
