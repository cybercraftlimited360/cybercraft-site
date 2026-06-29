"use client";
import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulseOffset: number;
  pulseSpeed: number;
}

export default function AIBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let nodes: Node[] = [];
    let visible = true;
    const NODE_COUNT = 45;
    const MAX_DIST = 150;
    const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

    function resize() {
      canvas!.width = canvas!.offsetWidth * window.devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
      init();
    }

    function init() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.5 + 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.012 + 0.006,
      }));
    }

    function draw(t: number) {
      if (!visible) return;

      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;

      ctx!.clearRect(0, 0, w, h);

      const bg = ctx!.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.8);
      bg.addColorStop(0, "rgba(0,10,20,0.85)");
      bg.addColorStop(1, "rgba(0,2,8,0.98)");
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) n.x += w;
        if (n.x > w) n.x -= w;
        if (n.y < 0) n.y += h;
        if (n.y > h) n.y -= h;

        const pulse = 0.4 + 0.6 * Math.sin(t * n.pulseSpeed + n.pulseOffset);

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > MAX_DIST_SQ) continue;

          const dist = Math.sqrt(distSq);
          const alpha = (1 - dist / MAX_DIST) * 0.18 * pulse;
          const tint = (i + j) % 3 === 0 ? `rgba(124,58,237,${alpha})` : `rgba(0,212,255,${alpha})`;
          ctx!.strokeStyle = tint;
          ctx!.lineWidth = 0.6;
          ctx!.beginPath();
          ctx!.moveTo(n.x, n.y);
          ctx!.lineTo(m.x, m.y);
          ctx!.stroke();

          const phase = ((t * 0.0008 + (i * 0.1 + j * 0.07)) % 1);
          const px = n.x + (m.x - n.x) * phase;
          const py = n.y + (m.y - n.y) * phase;
          ctx!.beginPath();
          ctx!.arc(px, py, 1, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(0,212,255,${alpha * 2.5})`;
          ctx!.fill();
        }

        const grd = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 6);
        grd.addColorStop(0, `rgba(0,212,255,${0.25 * pulse})`);
        grd.addColorStop(1, "rgba(0,212,255,0)");
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.radius * 6, 0, Math.PI * 2);
        ctx!.fillStyle = grd;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(0,212,255,${0.55 * pulse})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame((ts) => draw(ts));
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        animId = requestAnimationFrame((ts) => draw(ts));
      } else {
        cancelAnimationFrame(animId);
      }
    }, { threshold: 0 });
    observer.observe(canvas);

    resize();
    window.addEventListener("resize", resize);
    animId = requestAnimationFrame((ts) => draw(ts));

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", willChange: "transform" }}
    />
  );
}
