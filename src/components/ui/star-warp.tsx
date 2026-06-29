"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
  hue: number;
}

export default function StarWarp({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const NUM_STARS = 500;
    const SPEED = 16;
    const stars: Star[] = [];
    let animId: number;
    let tick = 0;
    let visible = true;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const init = () => {
      stars.length = 0;
      for (let i = 0; i < NUM_STARS; i++) {
        const roll = Math.random();
        const hue = roll < 0.6 ? 200 : roll < 0.85 ? 190 : 28;
        stars.push({
          x: (Math.random() - 0.5) * canvas.width,
          y: (Math.random() - 0.5) * canvas.height,
          z: Math.random() * canvas.width,
          pz: 0,
          hue,
        });
      }
    };
    init();

    const draw = () => {
      if (!visible) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      tick++;

      ctx.fillStyle = "rgba(2, 4, 18, 0.22)";
      ctx.fillRect(0, 0, w, h);

      const pulse = 0.5 + 0.5 * Math.sin(tick * 0.012);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.52);
      grad.addColorStop(0, `rgba(20, 40, 140, ${0.06 + pulse * 0.04})`);
      grad.addColorStop(0.4, `rgba(10, 20, 80, ${0.04 + pulse * 0.02})`);
      grad.addColorStop(0.75, `rgba(40, 5, 80, 0.03)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const scanY = (tick * 1.2) % h;
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scanGrad.addColorStop(0, "rgba(0,180,255,0)");
      scanGrad.addColorStop(0.5, "rgba(0,180,255,0.018)");
      scanGrad.addColorStop(1, "rgba(0,180,255,0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 40, w, 80);

      for (const star of stars) {
        star.pz = star.z;
        star.z -= SPEED;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * w;
          star.y = (Math.random() - 0.5) * h;
          star.z = w;
          star.pz = w;
          const roll = Math.random();
          star.hue = roll < 0.6 ? 200 : roll < 0.85 ? 190 : 28;
        }

        const sx = (star.x / star.z) * w + cx;
        const sy = (star.y / star.z) * h + cy;
        const px = (star.x / star.pz) * w + cx;
        const py = (star.y / star.pz) * h + cy;

        const depth = 1 - star.z / w;
        const size = Math.max(0.3, depth * 2.8);
        const alpha = depth * 0.92 + 0.08;

        let strokeColor: string;
        if (star.hue === 28) {
          strokeColor = `rgba(${Math.floor(depth * 80)}, ${Math.floor(180 + depth * 75)}, 255, ${alpha})`;
        } else {
          const whiteness = Math.floor(depth * 255);
          strokeColor = `rgba(${whiteness}, ${Math.floor(180 + depth * 75)}, 255, ${alpha})`;
        }

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = size;
        ctx.stroke();

        if (depth > 0.7) {
          ctx.beginPath();
          ctx.arc(sx, sy, size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = strokeColor;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    // Pause animation when canvas is off-screen
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        animId = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(animId);
      }
    }, { threshold: 0 });
    observer.observe(canvas);

    animId = requestAnimationFrame(draw);

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
      style={{ display: "block", width: "100%", height: "100%", background: "#02040e", willChange: "transform" }}
    />
  );
}
