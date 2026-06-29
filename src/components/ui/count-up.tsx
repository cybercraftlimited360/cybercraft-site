"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

function parseNumber(val: string): { prefix: string; number: number; suffix: string } {
  const match = val.match(/^([^0-9]*)([0-9,.]+)([^0-9]*)$/);
  if (!match) return { prefix: "", number: 0, suffix: val };
  return {
    prefix: match[1],
    number: parseFloat(match[2].replace(/,/g, "")),
    suffix: match[3],
  };
}

export default function CountUp({ value, className = "", style = {} }: { value: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState("0");
  const { prefix, number, suffix } = parseNumber(value);

  useEffect(() => {
    if (!isInView) return;
    if (number === 0) { setDisplay("0"); return; }
    const duration = 1600;
    const steps = 60;
    const increment = number / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, number);
      const formatted = Number.isInteger(number)
        ? Math.round(current).toLocaleString()
        : current.toFixed(1);
      setDisplay(formatted);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, number]);

  // Non-numeric values just show as-is
  if (number === 0 && suffix === value) return <span ref={ref} className={className} style={style}>{value}</span>;

  return (
    <span ref={ref} className={className} style={style}>
      {isInView ? `${prefix}${display}${suffix}` : `${prefix}0${suffix}`}
    </span>
  );
}
