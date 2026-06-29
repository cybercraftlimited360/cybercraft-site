"use client";
import { useEffect, useRef, useState } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Hide on touch devices — default cursor stays
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouch(true);
      return;
    }

    const glow = glowRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!glow || !dot || !ring) return;

    let raf: number;
    let mx = -200, my = -200;   // raw mouse
    let gx = -200, gy = -200;   // glow (lags)
    let rx = -200, ry = -200;   // ring (lags slightly)
    let isHovering = false;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      // Dot follows exactly
      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
    };

    const onEnter = () => {
      isHovering = true;
      ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px) scale(1.6)`;
      ring.style.borderColor = "rgba(0,212,255,0.6)";
      ring.style.background = "rgba(0,212,255,0.05)";
    };
    const onLeave = () => {
      isHovering = false;
      ring.style.borderColor = "rgba(0,212,255,0.3)";
      ring.style.background = "transparent";
    };

    const tick = () => {
      // Glow follows with heavy lag
      gx += (mx - gx) * 0.08;
      gy += (my - gy) * 0.08;
      glow.style.transform = `translate(${gx - 200}px, ${gy - 200}px)`;

      // Ring follows with light lag
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      const scale = isHovering ? 1.6 : 1;
      ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px) scale(${scale})`;

      raf = requestAnimationFrame(tick);
    };

    // Attach hover listeners to interactive elements
    const interactives = () =>
      document.querySelectorAll("a, button, [role='button'], input, textarea, select, label");

    const attachHover = () => {
      interactives().forEach(el => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };

    window.addEventListener("mousemove", onMove);
    attachHover();
    raf = requestAnimationFrame(tick);

    // Re-attach as DOM changes
    const obs = new MutationObserver(attachHover);
    obs.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      {/* Ambient glow blob — slow follow */}
      <div
        ref={glowRef}
        style={{
          position: "fixed", top: 0, left: 0, width: 400, height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,255,0.07) 0%, rgba(0,212,255,0.02) 40%, transparent 70%)",
          pointerEvents: "none", zIndex: 9990,
          willChange: "transform", mixBlendMode: "screen",
        }}
      />

      {/* Outer ring — medium lag, expands on hover */}
      <div
        ref={ringRef}
        style={{
          position: "fixed", top: 0, left: 0, width: 36, height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(0,212,255,0.3)",
          pointerEvents: "none", zIndex: 99998,
          willChange: "transform",
          transition: "border-color 0.2s, background 0.2s",
        }}
      />

      {/* Dot — exact position */}
      <div
        ref={dotRef}
        style={{
          position: "fixed", top: 0, left: 0, width: 8, height: 8,
          borderRadius: "50%",
          background: "#00d4ff",
          boxShadow: "0 0 8px rgba(0,212,255,0.8)",
          pointerEvents: "none", zIndex: 99999,
          willChange: "transform",
        }}
      />
    </>
  );
}
