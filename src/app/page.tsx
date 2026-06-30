"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { DotGlobeHero } from "@/components/ui/globe-hero";
import { ArrowRight, Zap, Shield, Bot, Mic, Workflow, Brain, Lock, Phone, TrendingUp, FileSearch, Globe, BarChart3, MessageSquare } from "lucide-react";
import Image from "next/image";
import StarWarp from "@/components/ui/star-warp";
import CursorGlow from "@/components/ui/cursor-glow";
import TypewriterLines from "@/components/ui/typewriter-lines";
import NavTypewriter from "@/components/ui/nav-typewriter";
import ScrollProgress from "@/components/ui/scroll-progress";
import CountUp from "@/components/ui/count-up";
import ResultsTicker from "@/components/ui/results-ticker";
import TiltCard from "@/components/ui/tilt-card";
import CalendlyEmbed from "@/components/ui/calendly-embed";
import SmoothScroll from "@/components/ui/smooth-scroll";
import NoiseTexture from "@/components/ui/noise-texture";
import ChatWidget from "@/components/ui/chat-widget";
import IrisAgent from "@/components/ui/iris-agent";
import LoadingScreen from "@/components/ui/loading-screen";
import ROICalculator from "@/components/ui/roi-calculator";
import AIBackground from "@/components/ui/ai-background";
import ProposalForm from "@/components/ui/proposal-form";
import Magnetic from "@/components/ui/magnetic";
import ExitIntent from "@/components/ui/exit-intent";
import ScrollTransition from "@/components/ui/scroll-transition";

function NavBar() {
  const { scrollY } = useScroll();
  const height = useTransform(scrollY, [0, 80], [80, 64]);
  const bg = useTransform(scrollY, [0, 80], ["rgba(15,17,23,0.7)", "rgba(15,17,23,0.97)"]);
  const [activeSection, setActiveSection] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const sections = ["about", "demo", "services", "pricing", "clients", "faq"];
    const observers: IntersectionObserver[] = [];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  // Lock body scroll when menu is open
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinks = ["About", "Demo", "Services", "Pricing", "Clients", "FAQ"];

  return (
    <>
      <motion.nav
        style={{ height, backgroundColor: bg, backdropFilter: "blur(20px)" }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5vw] md:px-[6vw] border-b border-border/50"
      >
        <motion.a href="/" className="flex items-center gap-2 text-foreground font-bold text-3xl tracking-tight no-underline" style={{ cursor: "none" }}>
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
            const isActive = activeSection === id;
            return (
              <li key={item}>
                <a href={`#${id}`} className="relative text-sm font-semibold tracking-widest uppercase no-underline transition-colors duration-200">
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
                </a>
              </li>
            );
          })}
          <li>
            <Magnetic strength={0.3} radius={100}>
              <a href="/intake" className="border border-primary/40 text-primary text-sm font-bold tracking-widest uppercase px-5 py-2.5 rounded-md no-underline hover:bg-primary/10 transition-all mr-2">
                Get a Quote
              </a>
            </Magnetic>
            <Magnetic strength={0.3} radius={100}>
              <a href="#contact" className="bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase px-5 py-2.5 rounded-md no-underline hover:opacity-90 transition-opacity">
                Book a Call
              </a>
            </Magnetic>
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
          {navLinks.map((item, i) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: menuOpen ? 1 : 0, y: menuOpen ? 0 : 20 }}
              transition={{ duration: 0.3, delay: menuOpen ? i * 0.06 : 0 }}
              onClick={() => setMenuOpen(false)}
              className="font-serif font-light no-underline"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: "clamp(2rem, 8vw, 3.5rem)",
                color: activeSection === item.toLowerCase() ? "#00d4ff" : "rgba(255,255,255,0.85)",
              }}
            >
              {item}
            </motion.a>
          ))}
          <motion.a
            href="#contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: menuOpen ? 1 : 0, y: menuOpen ? 0 : 20 }}
            transition={{ duration: 0.3, delay: menuOpen ? navLinks.length * 0.06 : 0 }}
            onClick={() => setMenuOpen(false)}
            className="mt-4 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase px-8 py-4 rounded-md no-underline"
          >
            Book a Call
          </motion.a>
        </motion.div>
      </motion.div>
    </>
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
  return (
    <main className="min-h-screen bg-background font-sans">
      <LoadingScreen />
      <SmoothScroll />
      <NoiseTexture />
      <ChatWidget />
      <ExitIntent />
      <ScrollTransition />

      <ScrollProgress />
      <CursorGlow />

      {/* NAV */}
      <NavBar />

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
              { stat: "60+",    label: "AI Deployments",     top: "4%",  left: "2%",  delay: 0 },
              { stat: "4,200",  label: "Calls / Month",      top: "20%", left: "2%",  delay: 0.5 },
              { stat: "6 wk",   label: "Deploy Time",        top: "36%", left: "2%",  delay: 1.0 },
              { stat: "45 min", label: "Strategy Session",   top: "52%", left: "2%",  delay: 1.5 },
              { stat: "£2.1M",  label: "Saved for Clients",  top: "68%", left: "2%",  delay: 0.8 },
              { stat: "340%",   label: "Avg. Client ROI",    top: "84%", left: "2%",  delay: 1.3 },
              { stat: "12×",    label: "Avg. Efficiency",    top: "4%",  right: "2%", delay: 0.3 },
              { stat: "3×",     label: "Pipeline Growth",    top: "20%", right: "2%", delay: 0.7 },
              { stat: "24/7",   label: "AI Always On",       top: "36%", right: "2%", delay: 0.2 },
              { stat: "100%",   label: "Custom Built",       top: "52%", right: "2%", delay: 1.1 },
              { stat: "98%",    label: "Uptime Guarantee",   top: "68%", right: "2%", delay: 0.6 },
              { stat: "0",      label: "Templates Used",     top: "84%", right: "2%", delay: 0.9 },
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
            <Magnetic strength={0.4} radius={130}>
              <motion.a
                href="#services"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
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

            <Magnetic strength={0.35} radius={120}>
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
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

      <ResultsTicker />

      {/* TECH STACK / BUILT WITH */}
      <section className="hidden md:block px-[5vw] md:px-[6vw] py-12 md:py-16 border-b border-border/40">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase text-muted-foreground/50">Built with & integrated into</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              "OpenAI", "Anthropic", "HubSpot", "Salesforce", "Twilio",
              "WhatsApp", "GoHighLevel", "Zapier", "Stripe", "Zoho",
            ].map((name, i) => (
              <motion.span
                key={name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.18)", letterSpacing: "0.15em" }}
                whileHover={{ color: "rgba(255,255,255,0.55)" }}
              >
                {name}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SERVICES */}
      <section id="services" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-[hsl(var(--muted))]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="flex items-center gap-3 mb-5">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: 32 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="h-0.5 bg-primary rounded-full"
            />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Our Services</span>
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground mb-3 max-w-xl" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            Tailored AI for Every<br /><em>Dimension</em> of Your Business
          </h2>
          <p className="text-muted-foreground text-lg mb-16 max-w-lg leading-relaxed">Every system is engineered from first principles — no off-the-shelf templates, no monthly SaaS markups. Built on enterprise-grade infrastructure so you get enterprise-grade reliability at a fraction of the cost.</p>
        </motion.div>

        {/* Service Groups */}
        {(() => {
          const groups = [
            {
              label: "Conversational AI",
              accent: "#00d4ff",
              desc: "Agents that talk, listen, and convert — engineered from scratch, trained on your business.",
              services: [
                { icon: Bot, name: "Custom AI Chatbots", desc: "Self-learning agents trained on your brand voice, FAQs, and CRM data — handling thousands of simultaneous conversations with human-level nuance. The longer they run, the smarter they get.", tag: "Self-Learning" },
                { icon: Mic, name: "Voice AI Agents", desc: "Lifelike outbound and inbound voice agents built from scratch on our own telephony stack. Available 24/7, never sick, never off — at a fraction of human staffing cost.", tag: "24/7 Always On" },
                { icon: Phone, name: "AI Phone Agent", desc: "Answers every inbound call instantly — books appointments, qualifies leads, handles FAQs, and escalates to humans only when needed. Built on enterprise-grade infrastructure for 99.9% uptime.", tag: "Inbound Ready" },
              ],
            },
            {
              label: "Revenue & Growth",
              accent: "#a855f7",
              desc: "From first impression to closed deal — AI systems that drive pipeline while you focus on delivery.",
              services: [
                { icon: TrendingUp, name: "AI Sales Agent", desc: "Autonomous outbound agent that researches prospects, personalises outreach, follows up intelligently, and books qualified calls into your calendar — built from scratch, no third-party CRM dependency.", tag: "Fully Autonomous" },
                { icon: Zap, name: "AI Ads & Marketing", desc: "AI-generated ad creatives, copy, and targeting strategies that adapt in real time to maximise ROAS. From Google to Meta — campaigns that learn, optimise, and outperform human-managed spend.", tag: "Self-Optimising" },
                { icon: Brain, name: "AI Content Engine", desc: "On-brand blogs, emails, ads, and social posts at scale — tuned to your tone, audience, and conversion goals. Trained on your existing content so it sounds like you, not ChatGPT.", tag: "Brand-Tuned" },
              ],
            },
            {
              label: "Operations & Automation",
              accent: "#10b981",
              desc: "Eliminate manual work. Every process that touches data, documents, or decisions — automated.",
              services: [
                { icon: Workflow, name: "Workflow & CRM Automation", desc: "AI that plugs directly into your CRM, ERP, and email — auto-updating records, triggering follow-ups, routing tasks, and eliminating manual data entry entirely.", tag: "CRM Native" },
                { icon: FileSearch, name: "Document Intelligence", desc: "Extracts, classifies, and routes data from contracts, invoices, and PDFs automatically. Built on open-source OCR — no per-page SaaS fees, your data stays yours.", tag: "Zero SaaS Fees" },
                { icon: MessageSquare, name: "Lead Intelligence", desc: "Predictive scoring and automated outreach delivering qualified leads directly into your CRM — no manual prospecting, no missed follow-ups, no wasted ad spend.", tag: "Predictive AI" },
              ],
            },
            {
              label: "Digital & Security",
              accent: "#f59e0b",
              desc: "Your digital presence and infrastructure — built to the standard your AI deserves.",
              services: [
                { icon: Globe, name: "Premium Website Design", desc: "High-converting, visually arresting websites engineered to position your brand as a market leader. Bespoke design, buttery performance, and an experience that justifies your price point.", tag: "Bespoke & Fast" },
                { icon: BarChart3, name: "AI Analytics Dashboard", desc: "Natural language queries over your own business data — ask questions, get answers in seconds. No SQL, no analyst dependency. Built on your existing stack.", tag: "Natural Language" },
                { icon: Lock, name: "AI Cybersecurity", desc: "Continuous threat monitoring, anomaly detection, and automated incident response — protecting your data, systems, and clients around the clock with zero human intervention.", tag: "Always Watching" },
              ],
            },
          ];

          return (
            <div className="flex flex-col gap-16">
              {groups.map((group, gi) => (
                <div key={group.label}>
                  {/* Group header */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex items-center gap-4 mb-6"
                  >
                    <div className="h-px flex-1 max-w-[40px]" style={{ background: group.accent }} />
                    <span className="text-[0.65rem] font-bold tracking-[0.3em] uppercase" style={{ color: group.accent }}>{group.label}</span>
                    <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${group.accent}40, transparent)` }} />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-muted-foreground text-sm mb-6 max-w-xl"
                  >{group.desc}</motion.p>

                  {/* Service cards — 3 per group */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.services.map(({ icon: Icon, name, desc, tag }, si) => (
                      <TiltCard key={name}>
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-30px" }}
                          transition={{ duration: 0.55, delay: gi * 0.05 + si * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                          whileHover={{ y: -4 }}
                          className="relative overflow-hidden cursor-default rounded-xl group h-full"
                          style={{
                            background: `linear-gradient(135deg, ${group.accent}06 0%, rgba(255,255,255,0.02) 100%)`,
                            border: "1px solid rgba(255,255,255,0.07)",
                            padding: "2rem",
                          }}
                        >
                          <motion.div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                            style={{ background: `linear-gradient(135deg, ${group.accent}0d, rgba(255,255,255,0.02))`, transition: "opacity 0.3s" }}
                          />
                          <motion.div className="absolute bottom-0 left-0 h-[2px] rounded-b-xl"
                            style={{ background: `linear-gradient(90deg, ${group.accent}, transparent)` }}
                            initial={{ width: 0 }} whileHover={{ width: "100%" }} transition={{ duration: 0.4 }}
                          />
                          {/* Left accent bar */}
                          <div className="absolute left-0 top-6 bottom-6 w-[2px] rounded-full opacity-40" style={{ background: group.accent }} />
                          <div className="relative z-10 pl-3">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4" style={{ background: `${group.accent}12`, border: `1px solid ${group.accent}25` }}>
                              <Icon className="w-4.5 h-4.5 stroke-[1.5]" style={{ color: group.accent }} />
                            </div>
                            <div className="font-semibold text-foreground text-[1.05rem] mb-2 leading-snug">{name}</div>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2 md:line-clamp-none">{desc}</p>
                            <span className="inline-block text-[0.58rem] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-sm"
                              style={{ color: group.accent, background: `${group.accent}10`, border: `1px solid ${group.accent}22` }}>{tag}</span>
                          </div>
                        </motion.div>
                      </TiltCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
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
              {
                step: "01",
                title: "Discovery Call",
                duration: "45 min",
                desc: "We map your business, your pain points, and exactly where AI will have the highest impact. You leave with a clear picture of what's possible — no obligation.",
                color: "#00d4ff",
                detail: "Free · No commitment",
              },
              {
                step: "02",
                title: "Custom Build",
                duration: "2–6 weeks",
                desc: "We engineer your AI from scratch — trained on your data, integrated with your tools, built to sound and behave like an expert member of your team.",
                color: "#4f8fff",
                detail: "Full transparency throughout",
              },
              {
                step: "03",
                title: "Deploy & Test",
                duration: "1 week",
                desc: "We go live in a controlled rollout, run real-world tests, fine-tune responses, and make sure everything works exactly as expected before full launch.",
                color: "#7c3aed",
                detail: "You approve before go-live",
              },
              {
                step: "04",
                title: "Ongoing Support",
                duration: "Monthly",
                desc: "Your AI keeps improving. We monitor performance, retrain the model as your business evolves, and push updates — all included in your monthly subscription.",
                color: "#e64dff",
                detail: "Included in subscription",
              },
            ].map(({ step, title, duration, desc, color, detail }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-col"
              >
                {/* Step circle */}
                <div className="flex items-center gap-4 mb-6">
                  <motion.div
                    whileInView={{ scale: [0.5, 1.15, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{ background: `${color}18`, border: `2px solid ${color}`, color, boxShadow: `0 0 20px ${color}30` }}
                  >
                    {step}
                  </motion.div>
                  <span className="text-[0.62rem] font-semibold tracking-widest uppercase text-muted-foreground">{duration}</span>
                </div>

                {/* Card */}
                <motion.div
                  whileHover={{ y: -4, borderColor: color }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 rounded-xl p-7 border border-border/60"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
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

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
        >
          <Magnetic strength={0.35} radius={120}>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-primary text-primary-foreground rounded-md font-semibold text-sm tracking-widest uppercase no-underline"
            >
              Start With a Free Discovery Call <ArrowRight className="w-4 h-4" />
            </motion.a>
          </Magnetic>
          <span className="text-muted-foreground text-sm">45 minutes · No obligation · Clear answers guaranteed</span>
        </motion.div>
      </section>

      {/* IRIS VOICE AGENT DEMO */}
      <section id="demo" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-background border-t border-border/40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Live Demo</span>
            <div className="w-8 h-0.5 bg-primary rounded-full" />
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground mb-4" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            Meet <em>IRIS</em>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Our AI voice agent — live, on this page. This is exactly what we build for our clients. Speak with her and experience it for yourself.
          </p>
          <p className="text-muted-foreground/40 text-xs mt-3 tracking-widest uppercase">Best experienced on Chrome or Edge · Allow microphone access</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex justify-center"
        >
          <IrisAgent />
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

      {/* ROI CALCULATOR */}
      <section id="roi" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-muted/30 border-t border-border/40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ ROI Calculator</span>
            <div className="w-8 h-0.5 bg-primary rounded-full" />
          </div>
          <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight text-foreground mb-4" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>
            See What AI Saves <em>Your</em> Business
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Enter your team size and cost — we'll show you exactly how much manual work AI can eliminate, and what that's worth annually.
          </p>
        </motion.div>
        <ROICalculator />
      </section>

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
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed lg:text-right mb-1">Real results from real clients — no projections, no estimates.</p>
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

      {/* Pricing */}
      <section id="pricing" className="px-[5vw] md:px-[6vw] py-16 md:py-32 bg-muted/20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ Pricing</span>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mt-3 mb-6">
            Transparent.<br />No surprises.
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl">
            Every service includes a one-time setup fee and a monthly subscription. All pricing is quoted to your exact requirements — ranges below are starting points.
          </p>
        </motion.div>

        {[
          {
            category: "Conversational AI",
            color: "cyan",
            accent: "rgba(0,212,255,0.15)",
            border: "rgba(0,212,255,0.25)",
            services: [
              { name: "Custom AI Chatbot", setup: "$500–$1,500", monthly: "$500–$800/mo", note: "Web, WhatsApp & SMS" },
              { name: "Voice AI Agent", setup: "$800–$2,000", monthly: "$700–$1,200/mo", note: "Inbound & outbound" },
              { name: "AI Phone Agent", setup: "$1,000–$2,500", monthly: "$700–$1,200/mo", note: "Appointment booking" },
            ],
          },
          {
            category: "Revenue & Growth",
            color: "purple",
            accent: "rgba(124,58,237,0.15)",
            border: "rgba(124,58,237,0.3)",
            services: [
              { name: "AI Sales Agent", setup: "$1,200–$3,000", monthly: "$900–$1,400/mo", note: "Outbound prospecting" },
              { name: "AI Ads & Marketing", setup: "$500–$1,500", monthly: "$600–$950/mo", note: "Google & Meta" },
              { name: "AI Content Engine", setup: "$500–$1,500", monthly: "$600–$950/mo", note: "Multi-channel content" },
            ],
          },
          {
            category: "Operations & Automation",
            color: "green",
            accent: "rgba(34,197,94,0.12)",
            border: "rgba(34,197,94,0.25)",
            services: [
              { name: "Workflow & CRM Automation", setup: "$800–$2,500", monthly: "$600–$950/mo", note: "HubSpot, GHL & more" },
              { name: "Document Intelligence", setup: "$1,200–$3,000", monthly: "$700–$1,100/mo", note: "OCR + AI extraction" },
              { name: "Lead Intelligence", setup: "$600–$1,500", monthly: "$600–$900/mo", note: "Predictive scoring" },
            ],
          },
          {
            category: "Digital & Security",
            color: "amber",
            accent: "rgba(245,158,11,0.12)",
            border: "rgba(245,158,11,0.25)",
            services: [
              { name: "Premium Website Design", setup: "$1,500–$4,000", monthly: "$300–$600/mo", note: "Custom, no templates" },
              { name: "AI Analytics Dashboard", setup: "$1,200–$3,000", monthly: "$800–$1,200/mo", note: "Natural language queries" },
              { name: "AI Cybersecurity", setup: "$1,500–$4,000", monthly: "$1,000–$1,500/mo", note: "24/7 threat monitoring" },
            ],
          },
        ].map((group, gi) => (
          <motion.div
            key={group.category}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: gi * 0.1 }}
            className="mb-10 rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${group.border}`, background: group.accent }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: group.border }}>
              <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: group.color === "cyan" ? "#00d4ff" : group.color === "purple" ? "#a78bfa" : group.color === "green" ? "#22c55e" : "#f59e0b" }}>
                {group.category}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: group.border }}>
                    <th className="text-left px-6 py-3 text-xs font-bold tracking-widest uppercase text-muted-foreground">Service</th>
                    <th className="text-left px-6 py-3 text-xs font-bold tracking-widest uppercase text-muted-foreground">One-Time Setup</th>
                    <th className="text-left px-6 py-3 text-xs font-bold tracking-widest uppercase text-muted-foreground">Monthly</th>
                    <th className="text-left px-6 py-3 text-xs font-bold tracking-widest uppercase text-muted-foreground hidden sm:table-cell">Includes</th>
                  </tr>
                </thead>
                <tbody>
                  {group.services.map((svc, si) => (
                    <tr key={svc.name} className={si < group.services.length - 1 ? "border-b" : ""} style={{ borderColor: group.border }}>
                      <td className="px-6 py-4 font-semibold text-foreground">{svc.name}</td>
                      <td className="px-6 py-4 font-bold" style={{ color: group.color === "cyan" ? "#00d4ff" : group.color === "purple" ? "#a78bfa" : group.color === "green" ? "#22c55e" : "#f59e0b" }}>{svc.setup}</td>
                      <td className="px-6 py-4 text-foreground/80">{svc.monthly}</td>
                      <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">{svc.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}

        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm">All prices in USD. Final quote depends on complexity, integrations, and scope. Book a free strategy call — our founder will scope your project and give an exact figure.</p>
          </div>
          <a
            href="#contact"
            className="shrink-0 inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest uppercase px-7 py-3.5 rounded-xl no-underline hover:opacity-90 transition-opacity"
          >
            Get a Custom Quote <ArrowRight size={15} />
          </a>
        </div>
      </section>

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
            <CalendlyEmbed url="https://calendly.com/cybercraftlimited/30min" />
          </motion.div>
        </div>
      </section>

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
            {["AI Chatbots", "Voice AI Agents", "Workflow Automation", "Lead Intelligence", "AI Cybersecurity", "Premium Websites", "AI Ads & Marketing"].map(s => (
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
