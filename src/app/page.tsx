"use client";

import React from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { DotGlobeHero } from "@/components/ui/globe-hero";
import { ArrowRight, Zap, Shield, Bot, Mic, Workflow, Brain, Lock, Phone, TrendingUp, FileSearch, Globe, BarChart3, MessageSquare } from "lucide-react";
import Image from "next/image";
import StarWarp from "@/components/ui/star-warp";
import TypewriterLines from "@/components/ui/typewriter-lines";
import NavTypewriter from "@/components/ui/nav-typewriter";
import ScrollProgress from "@/components/ui/scroll-progress";
import CountUp from "@/components/ui/count-up";
import ResultsTicker from "@/components/ui/results-ticker";
import TiltCard from "@/components/ui/tilt-card";
import Scheduler from "@/components/ui/scheduler";
import NoiseTexture from "@/components/ui/noise-texture";
import ChatWidget from "@/components/ui/chat-widget";
import IrisAgent from "@/components/ui/iris-agent";
import LoadingScreen from "@/components/ui/loading-screen";
import ROICalculator from "@/components/ui/roi-calculator";
import ProductivityCalculator from "@/components/ui/productivity-calculator";
import AIBackground from "@/components/ui/ai-background";
import ProposalForm from "@/components/ui/proposal-form";
import EbookForm from "@/components/ui/ebook-form";
import Magnetic from "@/components/ui/magnetic";
import ExitIntent from "@/components/ui/exit-intent";
import ScrollTransition from "@/components/ui/scroll-transition";
import BeforeAfter from "@/components/demo/BeforeAfter";
import DemoIrisChat from "@/components/demo/DemoIrisChat";
import LaurenCallDemo from "@/components/demo/LaurenCallDemo";
import HowItWorksModal from "@/components/demo/HowItWorksModal";

type SiteTab = "about" | "demo" | "services" | "pricing" | "results" | "faq" | "book";

const TAB_MAP: Record<string, SiteTab> = {
  about: "about", demo: "demo", services: "services",
  pricing: "pricing", clients: "results", faq: "faq",
};

function NavBar({ tab, setTab }: { tab: SiteTab; setTab: (t: SiteTab) => void }) {
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const { scrollY } = useScroll();
  const height = useTransform(scrollY, [0, 80], [80, 64]);
  const bg = useTransform(scrollY, [0, 80], ["rgba(15,17,23,0.7)", "rgba(15,17,23,0.97)"]);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Lock body scroll when menu is open
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinks = ["About", "Demo", "Services", "Pricing", "Clients", "FAQ"];

  return (
    <>
      <motion.nav
        style={isTouch
          ? { height: 64, backgroundColor: "rgba(15,17,23,0.97)" }
          : { height, backgroundColor: bg, backdropFilter: "blur(20px)" }
        }
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5vw] md:px-[6vw] border-b border-border/50"
      >
        <motion.a href="/" className="flex items-center gap-2 text-foreground font-bold text-3xl tracking-tight no-underline" style={{}}>
          <motion.img
            src="/logo-icon.svg"
            alt="CyberCraft360"
            width={72}
            height={72}
            className="object-contain"
            whileHover={{ rotate: 15, scale: 1.12, filter: "drop-shadow(0 0 12px rgba(0,212,255,0.6))" }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          />
          <span className="hidden sm:block"><NavTypewriter /></span>
        </motion.a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {navLinks.map((item) => {
            const id = item.toLowerCase();
            const mapped = TAB_MAP[id] ?? "about";
            const isActive = tab === mapped;
            return (
              <li key={item}>
                <button onClick={() => { setTab(mapped); const tb = document.querySelector("[data-tabbar]"); if (tb) tb.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="relative text-sm font-semibold tracking-widest uppercase transition-colors duration-200 bg-transparent border-0 p-0">
                  <span className={isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}>
                    {item}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-px bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </button>
              </li>
            );
          })}
          <li>
              <a href="/intake" className="border border-primary/40 text-primary text-sm font-bold tracking-widest uppercase px-5 py-2.5 rounded-md no-underline hover:bg-primary/10 transition-all mr-2">
                Get a Quote
              </a>
              <button onClick={() => { setTab("book"); const tb = document.querySelector("[data-tabbar]"); if (tb) tb.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase px-5 py-2.5 rounded-md border-0 hover:opacity-90 transition-opacity">
                Book a Call
              </button>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-[5px]"
          aria-label="Toggle menu"
        >
          <motion.span
            animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 7 : 0 }}
            transition={{ duration: 0.25 }}
            className="block w-6 h-[1.5px] bg-foreground origin-center"
          />
          <motion.span
            animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="block w-6 h-[1.5px] bg-foreground"
          />
          <motion.span
            animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -7 : 0 }}
            transition={{ duration: 0.25 }}
            className="block w-6 h-[1.5px] bg-foreground origin-center"
          />
        </button>
      </motion.nav>

      {/* Mobile menu overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? "auto" : "none" }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-40 md:hidden"
        style={{ background: "rgba(10,12,18,0.97)", backdropFilter: "blur(24px)" }}
        onClick={() => setMenuOpen(false)}
      >
        <motion.div
          initial={false}
          animate={{ y: menuOpen ? 0 : -20, opacity: menuOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center justify-center h-full gap-10"
          onClick={e => e.stopPropagation()}
        >
          {navLinks.map((item, i) => {
            const mapped = TAB_MAP[item.toLowerCase()] ?? "about";
            return (
              <motion.button
                key={item}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: menuOpen ? 1 : 0, y: menuOpen ? 0 : 20 }}
                transition={{ duration: 0.3, delay: menuOpen ? i * 0.06 : 0 }}
                onClick={() => { setTab(mapped); setMenuOpen(false); setTimeout(() => { const tb = document.querySelector("[data-tabbar]"); if (tb) tb.scrollIntoView({ behavior: "smooth", block: "start" }); }, 300); }}
                className="font-serif font-light bg-transparent border-0"
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: "clamp(2rem, 8vw, 3.5rem)",
                  color: tab === mapped ? "#00d4ff" : "rgba(255,255,255,0.85)",
                  cursor: "pointer",
                }}
              >
                {item}
              </motion.button>
            );
          })}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: menuOpen ? 1 : 0, y: menuOpen ? 0 : 20 }}
            transition={{ duration: 0.3, delay: menuOpen ? navLinks.length * 0.06 : 0 }}
            className="mt-4 flex flex-col items-center gap-3 w-full px-8"
          >
            <button
              onClick={() => { setTab("book"); setMenuOpen(false); setTimeout(() => { const tb = document.querySelector("[data-tabbar]"); if (tb) tb.scrollIntoView({ behavior: "smooth", block: "start" }); }, 300); }}
              className="w-full text-center bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase px-8 py-4 rounded-md border-0"
            >
              📅 Book a Call
            </button>
            <a
              href="/intake"
              onClick={() => setMenuOpen(false)}
              className="w-full text-center border border-primary/40 text-primary text-sm font-bold tracking-widest uppercase px-8 py-4 rounded-md no-underline"
            >
              💬 Get a Quote
            </a>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}

function TabBar({ tab, setTab }: { tab: SiteTab; setTab: (t: SiteTab) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const tabs: { id: SiteTab; label: string; emoji: string }[] = [
    { id: "about",    label: "How It Works", emoji: "⚡" },
    { id: "demo",     label: "Live Demo",    emoji: "🤖" },
    { id: "services", label: "Services",     emoji: "🧠" },
    { id: "pricing",  label: "Pricing",      emoji: "💼" },
    { id: "results",  label: "Results",      emoji: "📈" },
    { id: "faq",      label: "FAQ",          emoji: "❓" },
    { id: "book",     label: "Book a Call",  emoji: "📅" },
  ];

  function handleTab(id: SiteTab) {
    setTab(id);
    if (ref.current) {
      const top = ref.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - 64, behavior: "smooth" });
    }
  }

  return (
    <div ref={ref} data-tabbar style={{
      position: "sticky", top: 63, zIndex: 40,
      background: "rgba(10,12,18,0.97)", backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      overflowX: "auto", scrollbarWidth: "none",
    }}>
      <div style={{ display: "flex", gap: 0, minWidth: "max-content", padding: "0 4vw" }}>
        {tabs.map(({ id, label, emoji }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => handleTab(id)}
              style={{
                padding: "14px 18px",
                background: "none", border: "none",
                borderBottom: active ? "2px solid #00d4ff" : "2px solid transparent",
                color: active ? "#00d4ff" : "rgba(255,255,255,0.4)",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", whiteSpace: "nowrap",
                cursor: "pointer", transition: "color 0.2s, border-color 0.2s",
              }}
            >
              <span style={{ marginRight: 6 }}>{emoji}</span>{label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = React.useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="border-b border-border/60"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-6 py-6 text-left group"
      >
        <span className="font-semibold text-base text-foreground group-hover:text-primary transition-colors duration-200">{question}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 w-6 h-6 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors duration-200"
          style={{ fontSize: "1.1rem", lineHeight: 1 }}
        >+</motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ overflow: "hidden" }}
      >
        <p className="text-muted-foreground text-sm leading-relaxed pb-6 max-w-2xl">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const [tab, setTab] = React.useState<SiteTab>("about");
  const [showEbook, setShowEbook] = React.useState(false);
  const [showHowItWorks, setShowHowItWorks] = React.useState(false);
  const [howItWorksService, setHowItWorksService] = React.useState("Amy");

  React.useEffect(() => {
    const HASH_TAB: Record<string, SiteTab> = {
      "#about": "about", "#demo": "demo", "#services": "services",
      "#pricing": "pricing", "#clients": "results", "#faq": "faq",
      "#contact": "book", "#proposal": "pricing", "#roi": "pricing",
    };
    function handleClick(e: MouseEvent) {
      const a = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const target = HASH_TAB[href];
      if (target) {
        e.preventDefault();
        setTab(target);
        const tabBar = document.querySelector("[data-tabbar]") as HTMLElement | null;
        const top = tabBar ? tabBar.getBoundingClientRect().top + window.scrollY - 64 : 0;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <main className="min-h-screen bg-background font-sans">
      <LoadingScreen />
      <NoiseTexture />
      <ChatWidget />
      <ExitIntent />
      <ScrollTransition />
      <AnimatePresence>{showEbook && <EbookForm onClose={() => setShowEbook(false)} />}</AnimatePresence>
      <HowItWorksModal open={showHowItWorks} onClose={() => setShowHowItWorks(false)} service={howItWorksService} />

      <ScrollProgress />

      {/* NAV */}
      <NavBar tab={tab} setTab={setTab} />

      {/* HERO — layered: StarWarp → Sphere → Text */}
      <div className="relative w-full h-[100svh] min-h-[600px] overflow-hidden">
        {/* Layer 0: AI neural network canvas */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <AIBackground className="w-full h-full" />
        </div>
        {/* Layer 1: Star warp background */}
        <div className="absolute inset-0" style={{ zIndex: 1, opacity: 0.35 }}>
          <StarWarp className="w-full h-full" />
        </div>
        {/* Layer 2: vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)", zIndex: 2 }} />

      <DotGlobeHero
        rotationSpeed={0.004}
        globeRadius={typeof window !== "undefined" && window.innerWidth < 768 ? 0.85 : 1.4}
        className="absolute inset-0 bg-transparent"
      >

        {/* All hero content in a single vertical flow */}
        <div className="relative w-full h-full flex flex-col items-center justify-between py-16 md:py-32 px-6" style={{ zIndex: 20 }}>

          {/* MIDDLE — both texts stacked in center + floating badges */}
          <div className="flex-1 relative w-full flex items-center justify-center">

            {/* Floating stat badges — hidden on mobile */}
            {[
              { stat: "60+",    label: "AI Deployments",       top: "4%",  left: "2%",  delay: 0 },
              { stat: "4,200",  label: "Calls Handled / Mo",  top: "20%", left: "2%",  delay: 0.5 },
              { stat: "6 wk",   label: "Avg Deploy Time",     top: "36%", left: "2%",  delay: 1.0 },
              { stat: "45 min", label: "Strategy Session",    top: "52%", left: "2%",  delay: 1.5 },
              { stat: "$2.1M+", label: "Saved for Clients",   top: "68%", left: "2%",  delay: 0.8 },
              { stat: "340%",   label: "Avg Client ROI*",     top: "84%", left: "2%",  delay: 1.3 },
              { stat: "12×",    label: "Avg Efficiency Gain", top: "4%",  right: "2%", delay: 0.3 },
              { stat: "3×",     label: "Pipeline Growth",     top: "20%", right: "2%", delay: 0.7 },
              { stat: "24/7",   label: "AI Always On",        top: "36%", right: "2%", delay: 0.2 },
              { stat: "100%",   label: "Custom Built",        top: "52%", right: "2%", delay: 1.1 },
              { stat: "98%",    label: "Uptime Guarantee",    top: "68%", right: "2%", delay: 0.6 },
              { stat: "0",      label: "Templates Used",      top: "84%", right: "2%", delay: 0.9 },
            ].map(({ stat, label, delay, ...pos }, i) => (
              <motion.div
                key={stat}
                className="hidden lg:block"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 4,
                  delay: delay * 1.2,
                  repeat: Infinity,
                  repeatDelay: i * 0.6,
                  times: [0, 0.15, 0.75, 1],
                  ease: "easeInOut",
                }}
                style={{ position: "absolute", zIndex: 30, ...pos }}
              >
                <motion.div
                  animate={{ y: [0, i % 2 === 0 ? -6 : -4, 0] }}
                  transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(24px) saturate(160%)",
                    WebkitBackdropFilter: "blur(24px) saturate(160%)",
                    borderRadius: "14px",
                    padding: "10px 16px",
                    minWidth: "110px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 0.5px rgba(0,212,255,0.15)",
                  }}
                >
                  <div style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "#00d4ff",
                    lineHeight: 1,
                    textShadow: "0 0 20px rgba(0,212,255,0.6)",
                  }}>{stat}</div>
                  <div style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: "0.06em",
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                  }}>{label}</div>
                </motion.div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="text-center select-none space-y-2"
            >
              {/* Brand name with hover effect */}
              <motion.div
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "clamp(1.6rem, 3.5vw, 3rem)",
                  fontWeight: 800,
                  letterSpacing: "0.18em",
                  color: "#ffffff",
                  lineHeight: 1,
                  marginBottom: "10px",
                  cursor: "default",
                }}
                whileHover={{ letterSpacing: "0.24em", textShadow: "0 0 24px rgba(255,255,255,0.25)" }}
                transition={{ duration: 0.3 }}
              >
                CYBER<span style={{ color: "#00d4ff" }}>CRAFT</span>
                <span style={{ fontWeight: 300, fontSize: "0.65em", letterSpacing: "0.3em", color: "rgba(255,255,255,0.55)", marginLeft: "0.3em" }}>360</span>
              </motion.div>

              {/* Typewriter taglines */}
              <TypewriterLines />

              {/* Strong single promise */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 2.8 }}
                style={{ marginTop: "20px" }}
              >
                <p style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: "clamp(1.5rem, 3.2vw, 2.6rem)",
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.88)",
                  lineHeight: 1.25,
                  cursor: "default",
                  letterSpacing: "0.01em",
                }}>
                  Your business can hire AI employees<br />
                  <em style={{ color: "#00d4ff", fontStyle: "italic" }}>that never clock out.</em>
                </p>
                <p style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "clamp(0.75rem, 1.1vw, 0.92rem)",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.38)",
                  marginTop: "10px",
                  letterSpacing: "0.04em",
                  lineHeight: 1.6,
                }}>
                  Custom AI receptionists, sales agents, support teams & automation — built for your business.
                </p>
              </motion.div>

            </motion.div>
          </div>

          {/* BOTTOM — CTAs only, pushed lower */}
          <div className="text-center max-w-4xl mx-auto pb-6">

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-16 lg:mt-48"
          >
            <Magnetic strength={0} radius={0}>
              <motion.a
                href="#services"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2.5 px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold text-sm tracking-widest uppercase no-underline shadow-lg hover:shadow-primary/25 transition-shadow duration-300 overflow-hidden relative"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.7 }}
                />
                <span className="relative z-10">Explore Our AI Solutions</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.a>
            </Magnetic>

            <Magnetic strength={0} radius={0}>
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2.5 px-8 py-4 border border-border/60 rounded-md font-medium text-sm tracking-widest uppercase text-foreground no-underline bg-background/60 backdrop-blur-sm hover:border-primary/40 hover:text-primary transition-colors duration-200"
              >
                <Zap className="w-4 h-4" />
                Book a Free Strategy Session
              </motion.a>
            </Magnetic>
          </motion.div>
          </div>{/* end bottom content */}
        </div>{/* end full-height flex column */}
      </DotGlobeHero>
      </div>{/* end hero wrapper */}

      {/* POWER MARQUEE */}
      <section className="overflow-hidden py-5 bg-[#060810] border-t border-b border-white/5 select-none" style={{ background: "linear-gradient(180deg, #060810 0%, #0a0d18 100%)" }}>
        {/* Row 1 — scrolls left */}
        <div className="relative flex mb-3" style={{ maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)" }}>
          <motion.div
            className="flex shrink-0 gap-6 pr-6"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            style={{ willChange: "transform", transform: "translateZ(0)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            {[...Array(2)].map((_, ri) => (
              <div key={ri} className="flex shrink-0 gap-6">
                {[
                  { text: "Your phone answers itself", accent: "#00d4ff" },
                  { text: "Leads called in 60 seconds", accent: "#7c3aed" },
                  { text: "Proposals sent while you sleep", accent: "#00d4ff" },
                  { text: "400 customer questions daily — zero staff", accent: "#e64dff" },
                  { text: "Close deals at 2am", accent: "#7c3aed" },
                  { text: "AI trained on your business", accent: "#00d4ff" },
                  { text: "Never miss another lead", accent: "#22c55e" },
                  { text: "Your competitors are already doing this", accent: "#e64dff" },
                ].map(({ text, accent }, i) => (
                  <div key={i} className="flex items-center gap-6 shrink-0">
                    <span
                      className="text-sm font-bold tracking-widest uppercase whitespace-nowrap"
                      style={{ color: "rgba(255,255,255,0.75)", letterSpacing: "0.18em" }}
                    >
                      {text}
                    </span>
                    <span style={{ color: accent, fontSize: "1.1rem", opacity: 0.9 }}>✦</span>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Row 2 — scrolls right */}
        <div className="relative flex" style={{ maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)" }}>
          <motion.div
            className="flex shrink-0 gap-6 pr-6"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            style={{ willChange: "transform", transform: "translateZ(0)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            {[...Array(2)].map((_, ri) => (
              <div key={ri} className="flex shrink-0 gap-6">
                {[
                  { text: "Workflows that run themselves", accent: "#7c3aed" },
                  { text: "Follow up with every lead automatically", accent: "#00d4ff" },
                  { text: "28 hours saved per week", accent: "#22c55e" },
                  { text: "Custom built — no templates", accent: "#e64dff" },
                  { text: "Live in 4–6 weeks", accent: "#00d4ff" },
                  { text: "AI that learns and gets smarter every month", accent: "#7c3aed" },
                  { text: "Scale without hiring", accent: "#22c55e" },
                  { text: "Your business runs 24 / 7 / 365", accent: "#e64dff" },
                ].map(({ text, accent }, i) => (
                  <div key={i} className="flex items-center gap-6 shrink-0">
                    <span
                      className="text-sm font-bold tracking-widest uppercase whitespace-nowrap"
                      style={{ color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em" }}
                    >
                      {text}
                    </span>
                    <span style={{ color: accent, fontSize: "1.1rem", opacity: 0.7 }}>◆</span>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* STICKY TAB BAR */}
      <TabBar tab={tab} setTab={setTab} />

      {/* TAB CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

      {(tab === "about") && <><ResultsTicker />
      {/* MISSION STRIP */}
      <section className="grid grid-cols-1 md:grid-cols-3 border-t border-b border-border bg-background overflow-hidden">
        {[
          { num: "01", title: "Built From Scratch", desc: "Every AI we deploy is engineered specifically for your workflows, voice, and goals — never a recycled template." },
          { num: "02", title: "Self-Learning Intelligence", desc: "Our models grow smarter with every interaction, continuously optimising to deliver compounding value over time." },
          { num: "03", title: "Secure by Design", desc: "Enterprise-grade security baked into every layer — your data, your clients, your reputation, protected end-to-end." },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className={`px-8 md:px-12 py-10 md:py-14 ${i < 2 ? "border-b md:border-b-0 md:border-r border-border" : ""}`}
          >
            <div className="font-serif text-5xl font-light text-primary/25 leading-none mb-4" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>{item.num}</div>
            <div className="font-semibold text-foreground text-lg mb-2">{item.title}</div>
            <div className="text-sm text-muted-foreground leading-relaxed">{item.desc}</div>
          </motion.div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section id="about" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-muted/30 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-5">
            <motion.div initial={{ width: 0 }} whileInView={{ width: 32 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="h-0.5 bg-primary rounded-full" />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ How It Works</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground max-w-xl" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
              From First Call to<br /><em>Live AI in 4 Steps</em>
            </h2>
            <p className="text-muted-foreground text-base max-w-sm leading-relaxed lg:text-right mb-1">No lengthy procurement. No bloated agencies. Just a clear, fast path from idea to working AI.</p>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute top-[52px] left-0 right-0 hidden lg:block" style={{ zIndex: 0 }}>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ transformOrigin: "left", height: "1px", background: "linear-gradient(90deg, rgba(0,212,255,0.6), rgba(124,58,237,0.6))", margin: "0 6%" }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative" style={{ zIndex: 1 }}>
            {[
              { step: "01", title: "Discovery Call", duration: "45 min", desc: "We map your business, your pain points, and exactly where AI will have the highest impact. You leave with a clear picture of what's possible — no obligation.", color: "#00d4ff", detail: "Free · No commitment" },
              { step: "02", title: "Custom Build", duration: "2–6 weeks", desc: "We engineer your AI from scratch — trained on your data, integrated with your tools, built to sound and behave like an expert member of your team.", color: "#4f8fff", detail: "Full transparency throughout" },
              { step: "03", title: "Deploy & Test", duration: "1 week", desc: "We go live in a controlled rollout, run real-world tests, fine-tune responses, and make sure everything works exactly as expected before full launch.", color: "#7c3aed", detail: "You approve before go-live" },
              { step: "04", title: "Ongoing Support", duration: "Monthly", desc: "Your AI keeps improving. We monitor performance, retrain the model as your business evolves, and push updates — all included in your monthly subscription.", color: "#e64dff", detail: "Included in subscription" },
            ].map(({ step, title, duration, desc, color, detail }, i) => (
              <motion.div key={step} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }} className="flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div whileInView={{ scale: [0.5, 1.15, 1] }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }} className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ background: `${color}18`, border: `2px solid ${color}`, color, boxShadow: `0 0 20px ${color}30` }}>
                    {step}
                  </motion.div>
                  <span className="text-[0.62rem] font-semibold tracking-widest uppercase text-muted-foreground">{duration}</span>
                </div>
                <motion.div whileHover={{ y: -4, borderColor: color }} transition={{ duration: 0.25 }} className="flex-1 rounded-xl p-7 border border-border/60" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="font-semibold text-foreground text-lg mb-3">{title}</div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5 line-clamp-2 md:line-clamp-none">{desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold tracking-wider uppercase" style={{ color }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    {detail}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} className="mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <Magnetic strength={0.35} radius={120}>
            <motion.a href="#contact" whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-2.5 px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold text-sm tracking-widest uppercase no-underline">
              Start With a Free Discovery Call <ArrowRight className="w-4 h-4" />
            </motion.a>
          </Magnetic>
          <span className="text-muted-foreground text-sm">45 minutes · No obligation · Clear answers guaranteed</span>
        </motion.div>
      </section>

      {/* FOUNDER SECTION */}
      <section className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-background border-t border-border/30 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7 }} className="mb-16">
            <div className="flex items-center gap-3 mb-5">
              <motion.div initial={{ width: 0 }} whileInView={{ width: 32 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="h-0.5 bg-primary rounded-full" />
              <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ The Founder</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight text-foreground" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
              Built by Someone Who <em>Knows Your Problem</em>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Photo / Video */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7 }} className="relative">
              {/* VIDEO — replace src with your HeyGen/YouTube embed URL */}
              {/* To use a video: uncomment the iframe below and remove the photo div */}
              {/*
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "16/9", border: "1px solid rgba(255,255,255,0.08)" }}>
                <iframe
                  src="YOUR_VIDEO_EMBED_URL_HERE"
                  className="absolute inset-0 w-full h-full"
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
              */}

              {/* PHOTO — replace /founder.jpg with your actual image path */}
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "4/5", border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.08))" }}>
                {/* Swap this img src for your real photo. Recommended: 800×1000px, professional headshot */}
                <img
                  src="/founder.png"
                  alt="Saad Imran — Founder, CyberCraft360"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(10,12,18,0.7), transparent)" }} />
              </div>

              {/* Floating trust badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-5 -right-4 md:-right-8"
                style={{ background: "rgba(10,12,18,0.95)", border: "1px solid rgba(0,212,255,0.25)", borderRadius: 14, padding: "14px 18px", backdropFilter: "blur(20px)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: "#00d4ff", lineHeight: 1 }}>60+</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3 }}>AI Systems Built</div>
              </motion.div>
            </motion.div>

            {/* Right — Bio */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay: 0.1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#00d4ff", marginBottom: 10 }}>Houston, Texas</div>
              <h3 className="font-serif text-3xl md:text-4xl font-light text-white mb-1" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>Saad Imran</h3>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 28 }}>Founder & AI Systems Architect</p>

              <div className="flex flex-col gap-5 mb-10">
                <p className="text-muted-foreground leading-relaxed text-base">
                  I started CyberCraft360 after watching businesses lose thousands of dollars every month to missed calls, slow follow-ups, and repetitive tasks that should have been automated years ago.
                </p>
                <p className="text-muted-foreground leading-relaxed text-base">
                  I've built AI systems for businesses across industries — from local service companies to growing agencies — and the transformation is always the same: more leads captured, faster responses, and hours of admin work wiped out every single week.
                </p>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Everything we build is custom. No templates. No off-the-shelf tools. Just AI engineered specifically for your business, trained on your data, and built to get smarter every month.
                </p>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { stat: "60+", label: "AI Deployments" },
                  { stat: "$2.1M+", label: "Saved for Clients" },
                  { stat: "4–6 wk", label: "Average Live Time" },
                ].map(({ stat, label }) => (
                  <div key={label} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#00d4ff", lineHeight: 1 }}>{stat}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.a href="#contact" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase no-underline hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff" }}>
                  Book a Call with Saad <ArrowRight size={15} />
                </motion.a>
                <motion.a href="/intake" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold tracking-widest uppercase no-underline transition-colors duration-200"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                  Get a Quote
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ABOUT TAB END */}</>}

      {tab === "demo" && <>
      {/* IRIS VOICE AGENT DEMO */}
      <section id="demo" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-background border-t border-border/40">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Live Demo</span>
            <div className="w-8 h-0.5 bg-primary rounded-full" />
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground mb-4" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            Meet <em>IRIS</em> — Your<br />Future AI Receptionist
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            IRIS is a live AI receptionist running right here on this page. She answers calls, books appointments, qualifies leads, and follows up automatically — this is exactly what we build for your business.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4 mb-2">
            {["Answers every call", "Books appointments", "Qualifies leads", "Follows up automatically", "Learns your business"].map(cap => (
              <span key={cap} className="text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full" style={{ background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}>✓ {cap}</span>
            ))}
          </div>
          <p className="text-muted-foreground/40 text-xs mt-3 tracking-widest uppercase">Best experienced on Chrome or Edge · Allow microphone access</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay: 0.2 }} className="flex justify-center">
          <IrisAgent />
        </motion.div>
      </section>

      {/* Before / After */}
      <BeforeAfter />

      {/* Interactive IRIS Chat Demo */}
      <DemoIrisChat />

      {/* Lauren Live Call Demo */}
      <LaurenCallDemo />

      {/* DEMO TAB END */}</>}

      {tab === "services" && <>
      {/* AI EMPLOYEES */}
      <section id="services" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-[hsl(var(--muted))]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }}>
          <div className="flex items-center gap-3 mb-5">
            <motion.div initial={{ width: 0 }} whileInView={{ width: 32 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="h-0.5 bg-primary rounded-full" />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Your AI Workforce</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground mb-3 max-w-2xl" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            You&apos;re Not Buying Software.<br /><em>You&apos;re Hiring an AI Team.</em>
          </h2>
          <p className="text-muted-foreground text-lg mb-16 max-w-lg leading-relaxed">Every AI employee is custom-built for your business, trained on your data, and gets smarter every month through real interactions.</p>
        </motion.div>

        {(() => {
          const employees = [
            {
              emoji: "🤖", name: "Ava", role: "AI Receptionist", accent: "#00d4ff",
              headline: "Never Miss Another Customer Call",
              problem: "Every missed call is a missed opportunity.",
              desc: "Ava answers every call 24/7 with natural, human-like conversation. She answers questions, books appointments, qualifies leads, routes urgent calls, and integrates directly into your existing systems.",
              features: ["Answers every incoming call instantly", "Books appointments automatically", "Transfers urgent calls when needed", "Captures every lead", "Learns your business over time", "Works nights, weekends & holidays"],
              impact: "Never lose another customer because you missed a phone call.",
              tag: "24/7 Always On",
              icon: Phone,
            },
            {
              emoji: "🎧", name: "Nova", role: "AI Customer Support", accent: "#7c3aed",
              headline: "Support That Never Takes a Break",
              problem: "Deliver instant, personalized service around the clock — without increasing payroll.",
              desc: "Nova answers questions, resolves common issues, provides order updates, and escalates complex cases only when necessary.",
              features: ["Instant responses", "24/7 availability", "Lower support costs", "Faster customer satisfaction", "Self-learning knowledge base", "Continuous monthly improvements"],
              impact: "Your customers get help immediately — day or night.",
              tag: "Self-Learning",
              icon: MessageSquare,
            },
            {
              emoji: "💼", name: "Atlas", role: "AI Sales Agent", accent: "#a855f7",
              headline: "Turn Every Lead Into a Conversation",
              problem: "Speed matters. Most leads go cold within 5 minutes of submitting a form.",
              desc: "Atlas contacts new leads within seconds, qualifies prospects, answers questions, follows up automatically, and books meetings directly into your calendar.",
              features: ["Immediate lead response", "Automatic follow-up", "Appointment scheduling", "CRM updates", "Personalized conversations", "Learns from every interaction"],
              impact: "Your pipeline keeps growing while you focus on delivery.",
              tag: "Fully Autonomous",
              icon: TrendingUp,
            },
            {
              emoji: "💬", name: "Echo", role: "AI Chatbot", accent: "#00d4ff",
              headline: "Your Best Employee Lives on Your Website",
              problem: "Most visitors leave without ever contacting you.",
              desc: "Echo engages visitors instantly, answers questions, recommends services, collects contact information, and converts more website traffic into qualified opportunities. Every chatbot is custom-built for your business.",
              features: ["Personalized conversations", "Lead qualification", "Appointment booking", "CRM integration", "Self-learning responses", "Monthly optimization"],
              impact: "Turn passive website visitors into active leads — automatically.",
              tag: "Always Converting",
              icon: Bot,
            },
            {
              emoji: "⚙️", name: "Pulse", role: "Workflow Automation", accent: "#10b981",
              headline: "Eliminate Busy Work Forever",
              problem: "Imagine eliminating hours of repetitive work every single week.",
              desc: "Pulse builds intelligent workflows that automate repetitive business processes so your team can focus on growth instead of administration.",
              features: ["CRM updates", "Email sequences", "Invoice processing", "Data entry", "Document generation", "Internal approvals"],
              impact: "Save dozens of hours every month and scale without hiring.",
              tag: "Zero Manual Work",
              icon: Workflow,
            },
            {
              emoji: "📈", name: "Orion", role: "AI Marketing", accent: "#f59e0b",
              headline: "Marketing That Never Stops Working",
              problem: "Generate more content, more campaigns, and more leads — without a larger team.",
              desc: "Orion handles social media content, email campaigns, SEO content, AI ad copy, and personalized marketing at scale — consistently, on-brand, every day.",
              features: ["Social media content", "AI video creation", "Email campaigns", "SEO content", "Personalized marketing", "AI ad copy"],
              impact: "More campaigns. Better engagement. Zero extra headcount.",
              tag: "Always Publishing",
              icon: Zap,
            },
            {
              emoji: "🎙️", name: "Amy", role: "AI Voice Agent", accent: "#e64dff",
              headline: "Conversations That Feel Human",
              problem: "Your customers deserve real conversations — not robotic menus.",
              desc: "Amy sounds natural, understands context, and delivers professional interactions from the very first call. The more conversations she has, the better she becomes. Perfect for sales, support, scheduling, and follow-up.",
              features: ["Natural human-like voice", "Context-aware responses", "Sales & qualification", "Appointment scheduling", "24/7 availability", "Self-improving with every call"],
              impact: "Professional conversations at scale — without hiring a team.",
              tag: "Sounds Human",
              icon: Mic,
            },
            {
              emoji: "🛡️", name: "Aegis", role: "AI Cybersecurity", accent: "#ef4444",
              headline: "Protection That Never Clocks Out",
              problem: "Cyber threats don't wait for business hours.",
              desc: "Aegis monitors your systems 24/7, detects anomalies before they become incidents, and responds automatically — protecting your data, your clients, and your reputation around the clock.",
              features: ["Continuous threat monitoring", "Anomaly detection", "Automated incident response", "Compliance reporting", "Real-time alerts", "Zero human intervention needed"],
              impact: "Sleep soundly knowing your business is protected around the clock.",
              tag: "Always Watching",
              icon: Shield,
            },
            {
              emoji: "📖", name: "Sage", role: "AI eBook Generator", accent: "#f97316",
              headline: "Turn Your Expertise Into a Lead Magnet",
              problem: "Your knowledge is your best marketing tool — but writing takes time you don't have.",
              desc: "Sage transforms your ideas into a professionally written, fully designed eBook in under 60 seconds. Use it as a lead magnet, authority builder, or client onboarding asset. Every eBook is unique to your business.",
              features: ["AI-written in 60 seconds", "Professionally designed PDF", "Delivered straight to inbox", "Custom to your industry & tone", "5 full chapters + conclusion", "Free — no credit card needed"],
              impact: "Build authority, capture leads, and grow your email list — automatically.",
              tag: "Instant PDF",
              icon: FileSearch,
              cta: true,
            },
          ];

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {employees.map(({ emoji, name, role, accent, headline, problem, desc, features, impact, tag, icon: Icon, cta }: any, i: number) => {
                const hasDemo = ["Ava","Nova","Atlas","Echo","Pulse","Orion","Amy","Aegis"].includes(name);
                const openDemo = () => { if (hasDemo) { setHowItWorksService(name); setShowHowItWorks(true); } };
                return (
                <TiltCard key={name}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.55, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                    onClick={openDemo}
                    className={`relative overflow-hidden rounded-xl group h-full flex flex-col${hasDemo ? " cursor-pointer" : ""}`}
                    style={{ background: `linear-gradient(135deg, ${accent}07 0%, rgba(255,255,255,0.015) 100%)`, border: "1px solid rgba(255,255,255,0.07)", padding: "1.75rem" }}
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(135deg, ${accent}0e, rgba(255,255,255,0.02))` }} />
                    {/* Bottom sweep */}
                    <motion.div className="absolute bottom-0 left-0 h-[2px] rounded-b-xl"
                      style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                      initial={{ width: 0 }} whileHover={{ width: "100%" }} transition={{ duration: 0.4 }} />
                    {/* Left accent */}
                    <div className="absolute left-0 top-6 bottom-6 w-[2px] rounded-full opacity-30" style={{ background: accent }} />

                    <div className="relative z-10 pl-3 flex flex-col flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg" style={{ background: `${accent}15`, border: `1px solid ${accent}28` }}>
                            {emoji}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base leading-none">{name}</div>
                            <div className="text-[0.65rem] font-semibold tracking-widest uppercase mt-0.5" style={{ color: accent }}>{role}</div>
                          </div>
                        </div>
                        <span className="text-[0.55rem] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-sm shrink-0"
                          style={{ color: accent, background: `${accent}12`, border: `1px solid ${accent}25` }}>{tag}</span>
                      </div>

                      {/* Headline */}
                      <div className="font-semibold text-white text-[1rem] leading-snug mb-1">{headline}</div>
                      <p className="text-[0.72rem] italic mb-3" style={{ color: `${accent}cc` }}>{problem}</p>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{desc}</p>

                      {/* Features */}
                      <div className="flex flex-col gap-1.5 mb-4 flex-1">
                        {features.map(f => (
                          <div key={f} className="flex items-center gap-2">
                            <span className="text-xs shrink-0" style={{ color: accent }}>✓</span>
                            <span className="text-xs text-muted-foreground">{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Impact */}
                      <div className="mt-auto pt-3 border-t border-white/5">
                        <p className="text-[0.72rem] font-semibold" style={{ color: accent }}>→ {impact}</p>
                        {cta && (
                          <button onClick={() => setShowEbook(true)}
                            style={{ marginTop: 12, width: "100%", padding: "10px 16px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, #f97316, #ec4899)`, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em" }}>
                            📖 Generate Free eBook →
                          </button>
                        )}
                        {hasDemo && (
                          <button onClick={e => { e.stopPropagation(); openDemo(); }}
                            style={{ marginTop: 10, width: "100%", padding: "9px 16px", borderRadius: 8, background: `${accent}14`, border: `1px solid ${accent}33`, color: accent, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em" }}>
                            ▶ See {name} in Action
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </TiltCard>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* GETS SMARTER EVERY MONTH */}
      <section className="px-[5vw] md:px-[6vw] py-16 md:py-28 bg-background border-t border-border/30 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7 }} className="text-center mb-14">
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Ongoing Value</span>
            <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground mt-3 mb-5" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
              Your AI Gets <em>Smarter</em><br />Every Month
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Unlike one-time software purchases, CyberCraft360 continuously improves your AI systems. Every conversation, customer interaction, and business update makes your AI more accurate, efficient, and valuable.
            </p>
            <p className="text-muted-foreground/50 text-sm mt-4 max-w-md mx-auto italic">
              Think of it as hiring an employee who never stops learning.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {[
              { icon: "🧠", title: "Learns From Every Interaction", desc: "Every customer conversation trains your AI to respond better, handle edge cases, and improve accuracy over time — automatically.", accent: "#00d4ff" },
              { icon: "📈", title: "Monthly Optimization", desc: "We review performance data, update knowledge bases, fine-tune responses, and push improvements every single month included in your subscription.", accent: "#7c3aed" },
              { icon: "🔄", title: "Evolves With Your Business", desc: "New products, new services, new policies — your AI is updated to reflect your business as it grows. It never becomes obsolete.", accent: "#22c55e" },
            ].map(({ icon, title, desc, accent }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.1 }}
                className="rounded-xl p-7 border border-border/50" style={{ background: `linear-gradient(135deg, ${accent}06, rgba(255,255,255,0.015))` }}>
                <div className="text-3xl mb-4">{icon}</div>
                <div className="font-semibold text-white text-base mb-2">{title}</div>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-2xl border border-white/08 p-8 md:p-10" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.04), rgba(124,58,237,0.04))", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="font-semibold text-white text-lg mb-1">Every month includes:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 mt-4">
                  {["Performance monitoring", "AI optimization", "Knowledge updates", "New features", "Workflow improvements", "Security updates", "CRM enhancements", "Strategy consultations", "Continuous learning"].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="text-primary text-xs">✓</span>
                      <span className="text-muted-foreground text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="shrink-0">
                <button onClick={() => setShowHowItWorks(true)} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold tracking-widest uppercase transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff" }}>
                  See How It Works <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="px-[5vw] md:px-[6vw] py-16 md:py-28 bg-muted/30 border-t border-border/30">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7 }} className="text-center mb-14">
          <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ The Difference</span>
          <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight text-foreground mt-3" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            One Glance <em>Tells the Story</em>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-10">
          {/* Traditional Business */}
          <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.18)", background: "rgba(239,68,68,0.03)" }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(239,68,68,0.12)", background: "rgba(239,68,68,0.06)" }}>
              <div className="text-[0.65rem] font-bold tracking-[0.22em] uppercase" style={{ color: "rgba(239,68,68,0.7)" }}>Without AI</div>
              <div className="text-base font-bold text-white/70 mt-0.5">Traditional Business</div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {[
                { icon: "📵", text: "Missed calls" },
                { icon: "🐢", text: "Manual follow-up" },
                { icon: "🌙", text: "Unavailable after hours" },
                { icon: "❌", text: "Human error" },
                { icon: "💸", text: "High payroll overhead" },
              ].map(({ icon, text }, i) => (
                <motion.div key={text} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                  className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {icon}
                  </div>
                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CyberCraft360 */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl overflow-hidden relative" style={{ border: "1px solid rgba(0,212,255,0.25)", background: "rgba(0,212,255,0.03)", boxShadow: "0 0 40px rgba(0,212,255,0.07)" }}>
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #00d4ff, #7c3aed)" }} />
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(0,212,255,0.12)", background: "rgba(0,212,255,0.06)" }}>
              <div className="text-[0.65rem] font-bold tracking-[0.22em] uppercase" style={{ color: "#00d4ff" }}>With AI Employees</div>
              <div className="text-base font-bold text-white mt-0.5">CyberCraft360</div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              {[
                { icon: "⚡", text: "AI answers instantly", color: "#00d4ff" },
                { icon: "🔄", text: "AI follows up automatically", color: "#7c3aed" },
                { icon: "🌐", text: "24/7 availability", color: "#00d4ff" },
                { icon: "🧠", text: "Continuous learning", color: "#a855f7" },
                { icon: "📉", text: "Lower operational overhead", color: "#22c55e" },
              ].map(({ icon, text, color }, i) => (
                <motion.div key={text} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.15 + i * 0.07 }}
                  className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    {icon}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }} className="text-center">
          <a href="#contact" className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase px-7 py-3.5 rounded-xl no-underline hover:opacity-90 transition-opacity">
            See What We Build for Your Business <ArrowRight size={15} />
          </a>
        </motion.div>
      </section>

      {/* AI WORKFLOW ANIMATION */}
      {(() => {
        function WorkflowAnimation() {
          const [activeStep, setActiveStep] = React.useState(0);
          const steps = [
            { icon: "📞", label: "Incoming Call", sublabel: "Customer dials your number", color: "#00d4ff" },
            { icon: "🤖", label: "AI Answers Instantly", sublabel: "IRIS picks up in under 1 second", color: "#7c3aed" },
            { icon: "📅", label: "Appointment Booked", sublabel: "Slot confirmed, calendar updated", color: "#a855f7" },
            { icon: "📊", label: "CRM Updated", sublabel: "Lead data synced automatically", color: "#00d4ff" },
            { icon: "✉️", label: "Confirmation Sent", sublabel: "Email + SMS in under 30 seconds", color: "#22c55e" },
          ];
          React.useEffect(() => {
            const t = setInterval(() => setActiveStep(s => (s + 1) % steps.length), 1800);
            return () => clearInterval(t);
          }, []);
          return (
            <div className="flex flex-col md:flex-row items-center justify-center gap-0 max-w-4xl mx-auto">
              {steps.map((step, i) => (
                <React.Fragment key={step.label}>
                  <motion.div
                    animate={{ scale: activeStep === i ? 1.06 : 1, opacity: activeStep === i ? 1 : activeStep > i ? 0.55 : 0.3 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col items-center gap-2 text-center"
                    style={{ minWidth: "100px" }}
                  >
                    <motion.div
                      animate={{
                        background: activeStep === i
                          ? [`${step.color}20`, `${step.color}35`, `${step.color}20`]
                          : activeStep > i ? `${step.color}12` : "rgba(255,255,255,0.04)",
                        borderColor: activeStep === i ? step.color : activeStep > i ? `${step.color}50` : "rgba(255,255,255,0.1)",
                        boxShadow: activeStep === i ? [`0 0 0px ${step.color}00`, `0 0 24px ${step.color}50`, `0 0 0px ${step.color}00`] : "none",
                      }}
                      transition={{ duration: 0.5, repeat: activeStep === i ? Infinity : 0 }}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      {step.icon}
                    </motion.div>
                    <div className="text-xs font-bold leading-tight" style={{ color: activeStep >= i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}>
                      {step.label}
                    </div>
                    <div className="text-[0.62rem] leading-snug max-w-[100px]" style={{ color: activeStep === i ? step.color : "rgba(255,255,255,0.25)" }}>
                      {step.sublabel}
                    </div>
                  </motion.div>
                  {i < steps.length - 1 && (
                    <div className="flex items-center justify-center" style={{ width: "48px", flexShrink: 0, paddingBottom: "30px" }}>
                      <motion.div
                        animate={{ opacity: activeStep > i ? 1 : 0.15, scaleX: activeStep > i ? 1 : 0.4 }}
                        transition={{ duration: 0.4 }}
                        className="hidden md:block h-px w-full"
                        style={{ background: `linear-gradient(90deg, ${steps[i].color}, ${steps[i + 1].color})`, transformOrigin: "left" }}
                      />
                      <motion.div animate={{ opacity: activeStep > i ? 1 : 0.15 }} className="md:hidden text-lg" style={{ color: "rgba(255,255,255,0.3)" }}>↓</motion.div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          );
        }
        return (
          <section className="px-[5vw] md:px-[6vw] py-16 md:py-28 bg-background border-t border-border/30 overflow-hidden">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7 }} className="text-center mb-14">
              <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Watch It Work</span>
              <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight text-foreground mt-3 mb-4" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
                30 Seconds. <em>Every Step Automated.</em>
              </h2>
              <p className="text-muted-foreground text-base max-w-md mx-auto">This is what happens every time a customer calls your business — from first ring to confirmed appointment — without you lifting a finger.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="rounded-2xl p-8 md:p-12 border border-white/07 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.03), rgba(124,58,237,0.03))" }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)" }} />
                <WorkflowAnimation />
                <div className="text-center mt-10">
                  <p className="text-[0.65rem] font-bold tracking-[0.22em] uppercase text-muted-foreground/40 mb-5">The entire process takes under 30 seconds · Repeats for every single call · Zero human involvement required</p>
                  <a href="#contact" className="inline-flex items-center gap-2 text-sm font-bold tracking-widest uppercase px-7 py-3.5 rounded-xl no-underline hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff" }}>
                    Build This for My Business <ArrowRight size={15} />
                  </a>
                </div>
              </div>
            </motion.div>
          </section>
        );
      })()}

      {/* TECH STACK / BUILT WITH */}
      <section className="hidden md:block px-[5vw] md:px-[6vw] py-12 md:py-16 border-b border-border/40">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col items-center gap-8">
          <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-muted-foreground/50">Built with & integrated into</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {["OpenAI", "Anthropic", "HubSpot", "Salesforce", "Twilio", "WhatsApp", "GoHighLevel", "Zapier", "Stripe", "Zoho"].map((name, i) => (
              <motion.span key={name} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }} className="text-sm font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.18)", letterSpacing: "0.15em" }} whileHover={{ color: "rgba(255,255,255,0.55)" }}>
                {name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* INDUSTRY SELECTOR */}
      <section className="px-[5vw] md:px-[6vw] py-16 md:py-24 bg-background border-t border-border/30">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7 }} className="text-center mb-12">
          <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Industries We Serve</span>
          <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight text-foreground mt-3 mb-3" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            We Build AI For <em>Your Industry</em>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">Every AI employee is built around the specific workflows, terminology, and customer expectations of your sector.</p>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
          {[
            { name: "Healthcare", emoji: "🏥", color: "#00d4ff" },
            { name: "Legal", emoji: "⚖️", color: "#7c3aed" },
            { name: "Real Estate", emoji: "🏠", color: "#10b981" },
            { name: "Insurance", emoji: "🛡️", color: "#f59e0b" },
            { name: "Construction", emoji: "🏗️", color: "#e64dff" },
            { name: "HVAC", emoji: "❄️", color: "#00d4ff" },
            { name: "Roofing", emoji: "🔨", color: "#7c3aed" },
            { name: "Accounting", emoji: "📊", color: "#10b981" },
            { name: "Automotive", emoji: "🚗", color: "#f59e0b" },
            { name: "E-Commerce", emoji: "🛒", color: "#e64dff" },
          ].map(({ name, emoji, color }, i) => (
            <motion.a key={name} href="#contact" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.05 }}
              className="flex flex-col items-center gap-2 py-5 px-3 rounded-xl no-underline group transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}0d`; (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground group-hover:text-white transition-colors duration-200 text-center">{name}</span>
            </motion.a>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }} className="text-center text-muted-foreground/50 text-xs mt-8 tracking-widest uppercase">
          Don&apos;t see your industry? We work with any service-based business. <a href="#contact" className="text-primary hover:underline">Let&apos;s talk.</a>
        </motion.p>
      </section>

      {/* SERVICES TAB END */}</>}

      {tab === "pricing" && <>
      {/* ROI CALCULATORS */}
      {(() => {
        function ROISection() {
          const [activeCalc, setActiveCalc] = React.useState<"revenue" | "productivity">("revenue");
          const calcs = [
            { id: "revenue" as const, label: "Revenue & Calls", icon: "📞", desc: "Calculate revenue recovered from missed calls & opportunities" },
            { id: "productivity" as const, label: "Team Productivity", icon: "⏱️", desc: "Calculate payroll savings from automating repetitive tasks" },
          ];
          return (
            <section id="roi" className="px-[5vw] md:px-[6vw] py-16 md:py-24 bg-muted/30 border-b border-border/40">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} className="text-center mb-10">
                <div className="flex items-center justify-center gap-3 mb-5">
                  <div className="w-8 h-0.5 bg-primary rounded-full" />
                  <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ ROI Calculator</span>
                  <div className="w-8 h-0.5 bg-primary rounded-full" />
                </div>
                <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground mb-4" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
                  How Much Could AI Save<br /><em>Your Business?</em>
                </h2>
                <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                  Discover how much time, payroll, and revenue your business could recover every month. Pick the calculator that fits your question.
                </p>
              </motion.div>

              {/* Calculator switcher */}
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center mb-12">
                <div className="inline-flex gap-2 p-1.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {calcs.map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveCalc(id)}
                      className="relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200"
                      style={{
                        background: activeCalc === id ? "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.12))" : "transparent",
                        border: activeCalc === id ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
                        color: activeCalc === id ? "#00d4ff" : "rgba(255,255,255,0.4)",
                        cursor: "pointer",
                        boxShadow: activeCalc === id ? "0 0 20px rgba(0,212,255,0.1)" : "none",
                      }}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                      {activeCalc === id && (
                        <motion.span layoutId="calc-indicator-pricing" className="absolute inset-0 rounded-xl" style={{ border: "1px solid rgba(0,212,255,0.3)" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Active calculator */}
              <AnimatePresence mode="wait">
                <motion.div key={activeCalc} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <p className="text-center text-muted-foreground/50 text-sm mb-10 tracking-wide">
                    {calcs.find(c => c.id === activeCalc)?.desc}
                  </p>
                  {activeCalc === "revenue" ? <ROICalculator /> : <ProductivityCalculator />}
                </motion.div>
              </AnimatePresence>
            </section>
          );
        }
        return <ROISection />;
      })()}

      {/* BUILD YOUR AI WORKFORCE / PRICING */}
      <section id="pricing" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-muted/20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} className="mb-16">
          <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Investment</span>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mt-3 mb-4">
            Build Your<br />AI Workforce.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl">
            You&apos;re not buying software. You&apos;re hiring AI that works 24/7, never misses a lead, and gets smarter every month. Final pricing is scoped to your exact setup — book a call for a tailored quote.
          </p>
        </motion.div>

        {/* Three tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {[
            {
              name: "Starter",
              tagline: "Never Miss Another Lead",
              outcome: "Save 20+ hours/month · Capture leads 24/7",
              desc: "One AI employee handling your most urgent gap — a chatbot that converts, a receptionist that never sleeps, or a booking assistant that fills your calendar.",
              implementation: "Starting at $1,500",
              implementationSub: "one-time · strategy, build & launch",
              perDay: "From $16/day",
              monthly: "$499/mo",
              monthlySub: "Managed AI partnership",
              accent: "#00d4ff",
              cta: "Book a Free Strategy Call",
              ctaHref: "#contact",
              industries: ["Plumbers", "Electricians", "Med Spas", "Restaurants", "Contractors"],
              solutions: ["AI Website Chatbot", "WhatsApp AI Assistant", "AI Appointment Booking", "AI Lead Capture"],
              highlight: false,
            },
            {
              name: "Growth",
              tagline: "Replace 1–2 Admin Roles with AI",
              outcome: "Automate customer support, leads & sales",
              desc: "Multiple AI employees working together — handling calls, qualifying leads, managing follow-ups, and running your CRM while your team focuses on billable work.",
              implementation: "Starting at $3,000",
              implementationSub: "one-time · strategy, build & launch",
              perDay: "From $33/day",
              monthly: "$999/mo",
              monthlySub: "Managed AI partnership",
              accent: "#7c3aed",
              cta: "Schedule a Demo",
              ctaHref: "#contact",
              industries: ["Law Firms", "Real Estate Teams", "Dental Practices", "Insurance Agencies", "HVAC Companies"],
              solutions: ["AI Voice Receptionist", "AI Customer Support", "AI Sales Agent", "CRM & Workflow Automation"],
              highlight: true,
            },
            {
              name: "Enterprise",
              tagline: "Scale Without Hiring More Staff",
              outcome: "Full AI ecosystem · Custom integrations",
              desc: "A complete AI infrastructure built for organizations handling high volume across multiple channels — calls, chat, email, CRM — with a dedicated strategy team.",
              implementation: "Starting at $7,500",
              implementationSub: "one-time · strategy, build & launch",
              perDay: "From $83/day",
              monthly: "$2,500/mo",
              monthlySub: "Managed AI partnership",
              accent: "#e64dff",
              cta: "Talk to an AI Consultant",
              ctaHref: "#contact",
              industries: ["Multi-location Businesses", "Franchises", "Healthcare Groups", "Large Service Companies"],
              solutions: ["AI Call Center", "Custom AI Integrations", "Enterprise AI Ecosystem", "Dedicated Strategy Team"],
              highlight: false,
            },
          ].map(({ name, tagline, outcome, desc, implementation, implementationSub, perDay, monthly, monthlySub, accent, cta, ctaHref, industries, solutions, highlight }, i) => (
            <motion.div key={name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative rounded-2xl flex flex-col overflow-hidden"
              style={{
                border: highlight ? `1px solid ${accent}50` : "1px solid rgba(255,255,255,0.08)",
                background: highlight ? `linear-gradient(160deg, ${accent}0f, rgba(255,255,255,0.02))` : "rgba(255,255,255,0.02)",
                boxShadow: highlight ? `0 0 60px ${accent}12` : "none",
              }}>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: highlight ? `linear-gradient(90deg, ${accent}, #00d4ff)` : `linear-gradient(90deg, ${accent}40, transparent)` }} />

              {highlight && (
                <div className="absolute top-4 right-4">
                  <span className="text-[0.6rem] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>Most Popular</span>
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                {/* Header */}
                <div className="mb-6">
                  <div className="text-[0.6rem] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: accent }}>{name}</div>
                  <div className="text-xl font-bold text-white leading-snug mb-1">{tagline}</div>
                  <div className="text-[0.65rem] font-semibold tracking-wide mb-3" style={{ color: `${accent}cc` }}>{outcome}</div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>

                {/* Pricing */}
                <div className="rounded-xl p-4 mb-5" style={{ background: `${accent}08`, border: `1px solid ${accent}18` }}>
                  <div className="flex items-end justify-between mb-1">
                    <div>
                      <div className="text-3xl font-bold text-white leading-none">{monthly}</div>
                      <div className="text-[0.65rem] text-muted-foreground mt-1">{monthlySub}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: accent }}>{perDay}</div>
                      <div className="text-[0.6rem] text-muted-foreground">works 24/7</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: `${accent}20` }}>
                    <div className="text-[0.6rem] font-bold tracking-widest uppercase text-muted-foreground mb-0.5">Implementation</div>
                    <div className="text-sm font-bold text-white">{implementation}</div>
                    <div className="text-[0.6rem] text-muted-foreground">{implementationSub}</div>
                  </div>
                </div>

                {/* Who this is for */}
                <div className="mb-5">
                  <div className="text-[0.6rem] font-bold tracking-widest uppercase text-muted-foreground mb-2">Perfect for</div>
                  <div className="flex flex-wrap gap-1.5">
                    {industries.map(ind => (
                      <span key={ind} className="text-[0.65rem] font-medium px-2 py-0.5 rounded" style={{ background: `${accent}10`, color: `${accent}cc`, border: `1px solid ${accent}20` }}>{ind}</span>
                    ))}
                  </div>
                </div>

                {/* What's included */}
                <div className="mb-6 flex-1">
                  <div className="text-[0.6rem] font-bold tracking-widest uppercase text-muted-foreground mb-3">AI Employees Included</div>
                  <div className="flex flex-col gap-2">
                    {solutions.map(s => (
                      <div key={s} className="flex items-center gap-2">
                        <span className="text-xs shrink-0" style={{ color: accent }}>✓</span>
                        <span className="text-sm text-muted-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <a href={ctaHref}
                  className="text-center py-3.5 rounded-xl text-sm font-bold tracking-wide uppercase no-underline transition-all hover:opacity-90 block"
                  style={highlight
                    ? { background: `linear-gradient(135deg, ${accent}, #00d4ff)`, color: "#fff" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {cta}
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature comparison table */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6 }} className="mb-16 overflow-x-auto">
          <div className="text-[0.65rem] font-bold tracking-[0.25em] uppercase text-muted-foreground mb-6">Compare Plans</div>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", width: "40%" }}>Feature</th>
                {[{ label: "Starter", color: "#00d4ff" }, { label: "Growth", color: "#7c3aed" }, { label: "Enterprise", color: "#e64dff" }].map(({ label, color }) => (
                  <th key={label} style={{ textAlign: "center", padding: "10px 12px", fontSize: "0.75rem", fontWeight: 700, color, letterSpacing: "0.1em" }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["AI Website Chatbot",          true,  true,  true ],
                ["AI Appointment Booking",       true,  true,  true ],
                ["AI Voice Receptionist",        false, true,  true ],
                ["WhatsApp AI",                  true,  true,  true ],
                ["CRM Integration",              false, true,  true ],
                ["Workflow Automation",          false, true,  true ],
                ["AI Lead Qualification",        false, true,  true ],
                ["Custom AI Integrations",       false, false, true ],
                ["Dedicated Success Manager",    false, false, true ],
                ["Monthly Strategy Call",        false, true,  true ],
                ["Monthly Performance Report",   true,  true,  true ],
                ["Priority Support",             false, true,  true ],
              ].map(([feature, starter, growth, enterprise], i) => (
                <tr key={String(feature)} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td style={{ padding: "11px 12px", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>{feature as string}</td>
                  {[
                    { val: starter, color: "#00d4ff" },
                    { val: growth, color: "#7c3aed" },
                    { val: enterprise, color: "#e64dff" },
                  ].map(({ val, color }, j) => (
                    <td key={j} style={{ textAlign: "center", padding: "11px 12px" }}>
                      {val
                        ? <span style={{ color, fontSize: "1rem" }}>✓</span>
                        : <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.75rem" }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* What implementation + monthly covers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="rounded-2xl p-7 border border-white/07" style={{ background: "rgba(0,212,255,0.03)" }}>
            <div className="text-[0.65rem] font-bold tracking-[0.25em] uppercase text-primary mb-2">Implementation Includes</div>
            <p className="text-muted-foreground text-sm mb-5">You&apos;re not paying for setup. You&apos;re paying for 60+ deployments worth of expertise applied to your specific business.</p>
            <div className="grid grid-cols-2 gap-2">
              {["Business workflow analysis", "AI strategy session", "Solution architecture", "Prompt engineering", "Knowledge base creation", "CRM & software integrations", "AI training on your data", "Quality assurance testing", "Live deployment", "Team onboarding"].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <span className="text-primary text-xs shrink-0">✓</span>
                  <span className="text-muted-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl p-7 border border-white/07" style={{ background: "rgba(124,58,237,0.03)" }}>
            <div className="text-[0.65rem] font-bold tracking-[0.25em] uppercase mb-2" style={{ color: "#a78bfa" }}>Monthly Partnership Includes</div>
            <p className="text-muted-foreground text-sm mb-5">Your AI gets measurably better every month. This is what keeps it that way.</p>
            <div className="grid grid-cols-2 gap-2">
              {["AI performance monitoring", "Continuous learning updates", "Prompt refinement", "Knowledge base updates", "Security & uptime monitoring", "CRM integration maintenance", "Workflow improvements", "New feature enhancements", "Monthly performance review", "Priority support response"].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <span className="text-xs shrink-0" style={{ color: "#a78bfa" }}>✓</span>
                  <span className="text-muted-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Guarantee + Why not DIY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="rounded-2xl p-7 border" style={{ background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.2)" }}>
            <div className="text-2xl mb-3">🛡️</div>
            <div className="text-[0.65rem] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: "#10b981" }}>30-Day Deployment Guarantee</div>
            <p className="text-white font-semibold text-base mb-2">We work with you until your AI is live and performing.</p>
            <p className="text-muted-foreground text-sm leading-relaxed">If your AI system isn&apos;t successfully deployed and working within 30 days of kickoff, we keep working at no extra cost until it is. No abandonment, no excuses.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl p-7 border border-white/07" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="text-2xl mb-3">🤔</div>
            <div className="text-[0.65rem] font-bold tracking-[0.22em] uppercase text-muted-foreground mb-2">Why Not Use a Cheaper Tool?</div>
            <p className="text-white font-semibold text-base mb-2">DIY tools cost less. Done-for-you costs more. The difference is results.</p>
            <p className="text-muted-foreground text-sm leading-relaxed">Tools like Chatbase or Voiceflow are software. CyberCraft360 is a fully built, trained, and managed AI system — integrated into your CRM, customized to your business, optimized every month. You&apos;re not paying for a subscription. You&apos;re hiring AI talent.</p>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <p className="text-muted-foreground text-sm flex-1">All prices in USD. Final quote depends on complexity, integrations, and scope. Book a free strategy call — we&apos;ll scope your project and give you an exact number.</p>
          <a href="#contact" className="shrink-0 inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase px-7 py-3.5 rounded-xl no-underline hover:opacity-90 transition-opacity">
            Book a Free Strategy Call <ArrowRight size={15} />
          </a>
        </div>
      </section>

      {/* WHAT HAPPENS AFTER YOU BUY */}
      <section className="px-[5vw] md:px-[6vw] py-16 md:py-28 bg-background border-t border-border/30">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7 }} className="text-center mb-14">
          <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ The Process</span>
          <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight text-foreground mt-3 mb-3" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            What Happens After <em>You Sign?</em>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">Most clients wonder what they&apos;re walking into. Here&apos;s exactly what the first 5 weeks look like — and what continues every month after.</p>
        </motion.div>
        <div className="max-w-4xl mx-auto">
          {/* Timeline items */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[28px] top-8 bottom-8 w-px hidden md:block" style={{ background: "linear-gradient(180deg, #00d4ff, #7c3aed, #e64dff, #10b981)" }} />
            <div className="flex flex-col gap-6">
              {[
                { week: "Week 1", title: "Discovery & Strategy", color: "#00d4ff", desc: "We map your business workflows, pain points, and goals. You receive a written AI strategy document outlining exactly what we'll build, why, and what results you can expect." },
                { week: "Week 2", title: "Architecture & Design", color: "#4f8fff", desc: "We design the AI's logic, personality, knowledge base, and integrations. You review and approve everything before a single line of code is written." },
                { week: "Week 3–4", title: "Build & Train", color: "#7c3aed", desc: "We build, train, and integrate your AI employee using your data, your brand voice, and your systems. You get progress updates throughout." },
                { week: "Week 5", title: "Testing & Deployment", color: "#e64dff", desc: "We run real-world tests, make refinements, and deploy in a controlled rollout. You sign off before anything goes fully live." },
                { week: "Every Month", title: "Optimization & Growth", color: "#10b981", desc: "We monitor performance, update the AI's knowledge, push improvements, and send you a monthly report. Your AI gets measurably better every single month.", ongoing: true },
              ].map(({ week, title, color, desc, ongoing }, i) => (
                <motion.div key={week} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-6 items-start">
                  <div className="flex flex-col items-center shrink-0" style={{ width: "56px" }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold text-center leading-tight shrink-0 z-10"
                      style={{ background: `${color}15`, border: `2px solid ${color}`, color, boxShadow: `0 0 20px ${color}25` }}>
                      {ongoing ? "∞" : `W${i + 1}`}
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl p-6 border border-white/07 mb-1" style={{ background: `${color}05` }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[0.6rem] font-bold tracking-widest uppercase px-2 py-0.5 rounded" style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>{week}</span>
                      {ongoing && <span className="text-[0.6rem] font-bold tracking-widest uppercase px-2 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>Included in subscription</span>}
                    </div>
                    <div className="font-semibold text-white text-base mb-1">{title}</div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }} className="mt-10 text-center">
            <a href="#contact" className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase px-7 py-3.5 rounded-xl no-underline hover:opacity-90 transition-opacity">
              Start Your Free Strategy Session <ArrowRight size={15} />
            </a>
            <p className="text-muted-foreground/40 text-xs mt-3 tracking-widest uppercase">45 minutes · No obligation · You keep the strategy doc</p>
          </motion.div>
        </div>
      </section>

      {/* STATEMENT INTERSTITIAL */}
      <section className="hidden md:block px-[5vw] md:px-[6vw] py-16 md:py-28 bg-background border-t border-border/30 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center text-center gap-8"
        >
          <motion.h2
            className="font-serif font-light leading-[1.05] text-foreground select-none"
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: "clamp(2.8rem, 6.5vw, 6rem)",
              maxWidth: "900px",
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.1 }}
          >
            We don't sell software.<br />
            <em style={{ color: "#00d4ff" }}>We build intelligence</em> that works<br />
            while you sleep.
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4, ease: [0.76, 0, 0.24, 1] }}
            style={{
              height: "1px", width: "120px",
              background: "linear-gradient(90deg, #00d4ff, #7c3aed)",
              transformOrigin: "left",
            }}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-muted-foreground text-base max-w-lg leading-relaxed"
          >
            Every system we build is trained on your business, integrated into your stack, and engineered to compound in value — not plateau on delivery.
          </motion.p>
        </motion.div>
      </section>

      {/* DARK BANNER */}
      <section className="px-[6vw] py-16 md:py-24 bg-[hsl(var(--foreground))] grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-0.5 bg-primary/80 rounded-full" />
            <span className="text-primary/80 text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ The CyberCraft360 Difference</span>
          </div>
          <h3 className="font-serif text-3xl md:text-5xl font-light leading-tight text-white" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            AI that learns, adapts,<br />and <em className="text-primary">gets smarter</em><br />with every interaction.
          </h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="hidden md:block text-white/45 text-sm leading-relaxed mb-8">Unlike off-the-shelf solutions that plateau on deployment, every CyberCraft360 system is built with continuous learning at its core — so your AI investment compounds rather than depreciates.</p>
          <div className="grid grid-cols-2 gap-px bg-white/8 border border-white/8 rounded-sm overflow-hidden mt-4">
            {[["12×", "Avg. efficiency gain"], ["98%", "Uptime guarantee"], ["6 wk", "Avg. deployment time"], ["0", "Off-the-shelf templates"]].map(([num, label], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="bg-white/3 px-7 py-6"
              >
                <CountUp value={num} className="font-serif text-4xl font-light text-primary leading-none mb-1.5 block" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }} />
                <div className="text-white/35 text-xs">{label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* AI PROPOSAL */}
      <section id="proposal" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-background border-t border-border/40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Free AI Proposal</span>
            <div className="w-8 h-0.5 bg-primary rounded-full" />
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground mb-4" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            Get Your Bespoke<br /><em>AI Strategy Document</em>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Tell us your company and challenge — we'll generate a custom AI proposal with tailored service recommendations, ROI estimates, and a clear deployment timeline. In your inbox in under 30 seconds.
          </p>
        </motion.div>
        <ProposalForm />
      </section>

      {/* PRICING TAB END (early) */}</>}


      {tab === "results" && <>
      {/* CASE STUDIES */}
      <section id="clients" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Case Studies</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground max-w-xl" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
              What Happens When AI<br />is <em>Truly</em> Built for You
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed lg:text-right mb-1">Real results from real client engagements. *ROI figures reflect individual client outcomes — results vary by industry, scope, and implementation.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              initials: "SM", name: "Sarah Mitchell", role: "COO", company: "NovaPeak Insurance",
              industry: "Insurance", service: "Voice AI Agent",
              metric: "340%", metricLabel: "ROI in 90 days",
              secondaryMetric: "4,200", secondaryLabel: "calls/month handled",
              quote: "CyberCraft360 built us a voice agent that handles 4,200 inbound calls a month — with a CSAT score higher than our human team. Our support costs dropped by half.",
              accent: "#00d4ff",
            },
            {
              initials: "DK", name: "David Kaur", role: "VP Sales", company: "Orbis Group",
              industry: "B2B Sales", service: "Lead Intelligence",
              metric: "3×", metricLabel: "Pipeline growth",
              secondaryMetric: "68%", secondaryLabel: "lead conversion lift",
              quote: "CyberCraft360 built us a custom lead intelligence system. It qualifies, scores, and sequences outreach across 12,000 prospects automatically. Our pipeline tripled in four months.",
              accent: "#7c3aed",
            },
            {
              initials: "LF", name: "Laura Flynn", role: "CMO", company: "Stratford Media",
              industry: "Media & Content", service: "AI Content Engine",
              metric: "$263K", metricLabel: "Saved in year one",
              secondaryMetric: "6 → 1", secondaryLabel: "editors needed",
              quote: "We went from a six-person content team to one editor who reviews and approves. The AI writes in our voice — not a generic tone. We couldn't tell the difference after the first week.",
              accent: "#22c55e",
            },
            {
              initials: "MO", name: "Marcus Osei", role: "Founder", company: "Vantage PropTech",
              industry: "PropTech", service: "AI Chatbot",
              metric: "74%", metricLabel: "Support queries resolved by AI",
              secondaryMetric: "18 hrs", secondaryLabel: "saved per week by team",
              quote: "Our team was drowning in the same 20 questions every day. Now the AI handles them instantly, 24/7. My team finally has time to work on things that actually move the business.",
              accent: "#e64dff",
            },
          ].map(({ initials, name, role, company, industry, service, metric, metricLabel, secondaryMetric, secondaryLabel, quote, accent }, i) => (
            <motion.div
              key={name}
              className={i >= 2 ? "hidden md:flex" : ""}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.65, delay: (i % 2) * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={{ y: -5 }}
              className="group relative flex flex-col rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                transition: "box-shadow 0.3s, border-color 0.3s",
              }}
              onHoverStart={e => {
                (e.target as HTMLElement).closest?.(".group")?.setAttribute("style",
                  `background:rgba(255,255,255,0.02);border:1px solid ${accent}30;box-shadow:0 12px 48px ${accent}12;transition:box-shadow 0.3s,border-color 0.3s;border-radius:16px;overflow:hidden;`
                );
              }}
            >
              {/* Colour accent top bar */}
              <div style={{ height: "3px", background: `linear-gradient(90deg, ${accent}, transparent)` }} />

              {/* Header: metric + service tag */}
              <div className="px-8 pt-7 pb-5 flex items-start justify-between gap-4">
                <div>
                  <div
                    className="font-serif leading-none mb-1"
                    style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: "clamp(2.2rem,4vw,3rem)", fontWeight: 300, color: accent }}
                  >{metric}</div>
                  <div className="text-[0.62rem] font-semibold tracking-[0.18em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>{metricLabel}</div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0 mt-1">
                  <span
                    className="text-[0.6rem] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-sm"
                    style={{ color: accent, background: `${accent}12`, border: `1px solid ${accent}25` }}
                  >{service}</span>
                  <span className="text-[0.6rem] font-medium tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>{industry}</span>
                </div>
              </div>

              {/* Secondary metric strip */}
              <div className="mx-8 mb-5 px-4 py-2.5 rounded-lg flex items-center gap-3" style={{ background: `${accent}08`, border: `1px solid ${accent}15` }}>
                <span className="font-bold text-base" style={{ color: accent }}>{secondaryMetric}</span>
                <span className="text-[0.67rem] text-muted-foreground">{secondaryLabel}</span>
              </div>

              {/* Divider */}
              <div className="mx-8 mb-5" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

              {/* Quote */}
              <div className="flex-1 px-8 pb-6">
                <div className="font-serif text-2xl leading-none mb-3 select-none" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: `${accent}20` }}>"</div>
                <p className="font-serif italic text-base leading-relaxed" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "rgba(255,255,255,0.65)" }}>
                  {quote}
                </p>
              </div>

              {/* Author footer */}
              <div className="px-8 pb-7 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}
                >{initials}</div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{name}</div>
                  <div className="text-[0.68rem]" style={{ color: "rgba(255,255,255,0.3)" }}>{role}, {company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RESULTS TAB END */}</>}

      {tab === "faq" && <>
      {/* FAQ */}
      <section id="faq" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-5">
            <motion.div initial={{ width: 0 }} whileInView={{ width: 32 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="h-0.5 bg-primary rounded-full" />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ FAQ</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground max-w-xl" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            Questions We Get<br /><em>Every Single Day</em>
          </h2>
        </motion.div>

        <div className="max-w-3xl">
          {[
            {
              q: "How long does it take to build and deploy an AI solution?",
              a: "Most projects go live within 4–6 weeks. Simple chatbots and automations can be ready in as little as 2 weeks. Complex voice agents or multi-system integrations may take up to 8 weeks. You'll receive a precise timeline after your free strategy session."
            },
            {
              q: "How much does it cost? Do you charge monthly?",
              a: "Yes — we work on a flat monthly subscription. The cost depends on the complexity of your solution, but it's structured to be significantly less than what you'd spend on the human roles it replaces. We'll give you a clear number on the strategy call, no vague quotes."
            },
            {
              q: "Do I need to have a technical team in place?",
              a: "Not at all. We handle everything end-to-end — discovery, build, integration, testing, and ongoing maintenance. You don't need developers, IT staff, or any technical knowledge. If you can describe the problem, we can build the solution."
            },
            {
              q: "How is this different from using ChatGPT or an off-the-shelf tool?",
              a: "Generic AI tools give you a general-purpose assistant. We build something trained on your specific business — your products, your tone of voice, your processes, your CRM data. It behaves like a staff member who has worked for your company for years, not a chatbot that guesses."
            },
            {
              q: "Will the AI integrate with my existing software (CRM, email, etc.)?",
              a: "Yes. We integrate with most major CRMs (HubSpot, Salesforce, GoHighLevel, Zoho), email platforms, phone systems, WhatsApp, and more. If you're using it, there's a very high chance we can connect to it. We'll confirm during the discovery phase."
            },
            {
              q: "Is my business data secure?",
              a: "Absolutely. All data is encrypted in transit and at rest. We never use your business data to train models for other clients. Your AI is built exclusively for you and access is fully restricted to your organisation. We follow enterprise-grade security practices by default."
            },
            {
              q: "What happens after the AI goes live?",
              a: "We don't disappear after launch. Your monthly subscription includes ongoing monitoring, retraining as your business evolves, performance reports, and direct access to us for changes. The AI gets smarter over time — we make sure it does."
            },
            {
              q: "Can AI really replace human customer service?",
              a: "For the majority of interactions — yes. Most customer service queries are repetitive: order status, FAQs, booking, complaints routing. AI handles these 24/7 with zero wait time. For complex or sensitive situations, we build seamless handoff to you or your team. The goal isn't to remove the human touch — it's to make sure humans are only needed where they truly add value."
            },
            {
              q: "What if I'm not happy with the result?",
              a: "We build iteratively and share progress throughout — you're never presented with a finished product you've never seen. If something isn't right, we fix it. Our goal is a solution you'd recommend to others, so we stay with it until we get there."
            },
            {
              q: "I'm a small business — is this for me?",
              a: "Yes. In fact, small businesses see the biggest return. When you're a team of one or a small team wearing multiple hats, AI doesn't just save money — it gives you leverage that was previously only available to large enterprises. You compete like a company ten times your size."
            },
          ].map(({ q, a }, i) => (
            <div key={i} className={i >= 5 ? "hidden md:block" : ""}>
              <FAQItem question={q} answer={a} index={i} />
            </div>
          ))}
        </div>
      </section>

      {/* FAQ TAB END */}</>}

      {tab === "book" && <>
      {/* CONTACT */}
      <section id="contact" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-muted/40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Get Started</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground mb-3 max-w-xl" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            Book Your Free<br /><em>AI Strategy Session</em>
          </h2>
          <p className="text-muted-foreground text-lg mb-16 max-w-lg leading-relaxed">In 45 minutes, we'll map out exactly what a bespoke AI system could do for your business — no obligation, no pitch deck, just clear answers.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="hidden lg:block"
          >
            <ul className="border border-border rounded-md overflow-hidden bg-background">
              {[
                { title: "Replaces Human Overhead", desc: "A flat monthly subscription that costs a fraction of the salaries, training, and management it replaces." },
                { title: "Compounding Returns", desc: "Every interaction trains your model — value in month 12 dwarfs month one." },
                { title: "Scale Without Headcount", desc: "Handle 10× the volume with the same team. AI absorbs the growth, you capture the profit." },
                { title: "Dedicated Build Team", desc: "A named engineer and AI architect own your project from discovery to deployment and beyond." },
              ].map(({ title, desc }, i, arr) => (
                <motion.li
                  key={title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                  className={`flex gap-5 px-8 py-6 ${i < arr.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-base text-foreground mb-1">{title}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Scheduler />
          </motion.div>
        </div>
      </section>

      {/* BOOK TAB END */}</>}

        </motion.div>
      </AnimatePresence>

      {/* FOOTER */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        style={{
          background: "oklch(0.10 0.004 240)",
          borderTop: "1px solid transparent",
          borderImage: "linear-gradient(90deg, transparent 0%, #00d4ff 30%, #7c3aed 70%, transparent 100%) 1",
        }}
      >
        {/* Main footer grid */}
        <div className="px-[6vw] pt-12 pb-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">

          {/* Col 1 — Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="CyberCraft360" width={80} height={80} className="object-contain" />
            <motion.p
              className="font-serif italic"
              initial={{ filter: "blur(8px)", opacity: 0 }}
              whileInView={{ filter: "blur(0px)", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4 }}
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: "1rem", fontWeight: 300,
                color: "rgba(255,255,255,0.2)", lineHeight: 1.4,
              }}
            >
              The future runs<br />on intelligence.
            </motion.p>
            {/* Social links */}
            <div className="flex gap-3 mt-1">
              {[
                { label: "LinkedIn", href: "https://linkedin.com/company/cybercraft360", icon: <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z M2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" /> },
                { label: "X / Twitter", href: "https://x.com/cybercraft360", icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.766l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /> },
                { label: "Instagram", href: "https://instagram.com/cybercraft360", icon: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></> },
              ].map(({ label, href, icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  whileHover={{ y: -2, color: "#00d4ff" }}
                  style={{
                    width: "34px", height: "34px", borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.02)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.3)", transition: "color 0.2s, border-color 0.2s",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Col 2 — Services */}
          <div className="flex flex-col gap-4">
            <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: "4px" }}>Services</p>
            {["AI Chatbots", "Voice AI Agents", "AI eBook Generator", "Workflow Automation", "Lead Intelligence", "AI Cybersecurity", "Premium Websites", "AI Ads & Marketing"].map(s => (
              <a key={s} href="#services" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >{s}</a>
            ))}
          </div>

          {/* Col 3 — Company */}
          <div className="flex flex-col gap-4">
            <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", marginBottom: "4px" }}>Company</p>
            {[["About", "#about"], ["How It Works", "#about"], ["Case Studies", "#clients"], ["FAQ", "#faq"], ["Book a Call", "#contact"]].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >{label}</a>
            ))}
          </div>

          {/* Col 4 — CTA + Location */}
          <div className="flex flex-col gap-5">
            <div style={{
              padding: "20px", borderRadius: "14px",
              background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)",
            }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(0,212,255,0.6)", marginBottom: "6px" }}>
                Ready to automate?
              </p>
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5, marginBottom: "14px" }}>
                Book a free 45-min strategy call. No pitch. Just clarity.
              </p>
              <Magnetic strength={0.25} radius={80}>
                <a href="#contact" style={{
                  display: "inline-block", padding: "10px 18px",
                  borderRadius: "8px", fontSize: "0.7rem", fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none",
                  background: "linear-gradient(135deg, #00d4ff, #7c3aed)", color: "#fff",
                }}>
                  Book a Free Call →
                </a>
              </Magnetic>
            </div>

            {/* Location */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "2px", flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.3)", margin: 0 }}>Houston, Texas</p>
                <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.15)", margin: "2px 0 0" }}>Serving clients globally</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-[5vw] md:mx-[6vw]" style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

        {/* Bottom row */}
        <div className="px-[5vw] md:px-[6vw] py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-white/20">© 2025 CyberCraft360. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ background: "#22c55e" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22c55e" }} />
            </span>
            <span className="text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-white/30">Accepting New Clients</span>
          </div>
          <span className="text-xs text-white/10">Houston, TX · Global</span>
        </div>
      </motion.footer>

    </main>
  );
}
