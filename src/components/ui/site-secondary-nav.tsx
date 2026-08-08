"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  /** Active path — highlights the matching nav item */
  active?: "blog" | "book" | "intake";
}

export default function SiteSecondaryNav({ active }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(20px)",
        backgroundColor: scrolled ? "rgba(10,12,18,0.97)" : "rgba(10,12,18,0.85)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        transition: "background-color 0.3s",
        fontFamily: "var(--font-jakarta), system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo / back home */}
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            textDecoration: "none", color: "inherit",
          }}
        >
          <img src="/logo-icon.svg" alt="CyberCraft360" width={36} height={36} style={{ objectFit: "contain" }} />
          <span style={{
            fontSize: 13, fontWeight: 700, letterSpacing: "0.16em",
            textTransform: "uppercase",
            background: "linear-gradient(90deg, #00d4ff, #7c3aed)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            CyberCraft360
          </span>
        </Link>

        {/* Right side links */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link
            href="/blog"
            style={{
              fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase",
              textDecoration: "none",
              color: active === "blog" ? "#00d4ff" : "rgba(255,255,255,0.45)",
              transition: "color 0.2s",
            }}
          >
            Blog
          </Link>

          <Link
            href="/intake"
            style={{
              fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase",
              textDecoration: "none",
              color: active === "intake" ? "#00d4ff" : "rgba(255,255,255,0.45)",
              transition: "color 0.2s",
            }}
          >
            Get a Quote
          </Link>

          <Link
            href="/book"
            style={{
              fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              textDecoration: "none",
              padding: "8px 18px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #00d4ff22, #7c3aed22)",
              border: "1px solid rgba(0,212,255,0.3)",
              color: "#00d4ff",
              transition: "opacity 0.2s",
            }}
          >
            Book a Call
          </Link>
        </div>
      </div>
    </nav>
  );
}
