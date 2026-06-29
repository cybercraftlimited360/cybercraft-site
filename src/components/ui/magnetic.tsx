"use client";
import { useRef, useEffect, ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticProps {
  children: ReactNode;
  strength?: number;   // how strongly it pulls (0–1), default 0.35
  radius?: number;     // px radius at which magnetism activates, default 120
  className?: string;
  style?: React.CSSProperties;
}

export default function Magnetic({
  children,
  strength = 0.35,
  radius = 120,
  className,
  style,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 180, damping: 18, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 180, damping: 18, mass: 0.5 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onMouseMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        x.set(dx * strength);
        y.set(dy * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    }

    function onMouseLeave() {
      x.set(0);
      y.set(0);
    }

    window.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [x, y, strength, radius]);

  return (
    <motion.div
      ref={ref}
      style={{ ...style, x: springX, y: springY, display: "inline-block" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
