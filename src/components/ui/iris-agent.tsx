"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };

const PERSONAS = {
  IRIS: {
    name: "IRIS",
    title: "AI Strategy Consultant",
    color: "#00d4ff",
    gradient: "linear-gradient(135deg, rgba(0,212,255,0.25), rgba(124,58,237,0.2))",
    border: "rgba(0,212,255,0.3)",
    glow: "rgba(0,212,255,0.4)",
    greeting: "Hello, I'm IRIS — CyberCraft360's AI strategy consultant. I'm a live example of what we build for our clients. Tell me, what does your business do?",
    voices: ["Microsoft Aria Online (Natural)", "Microsoft Aria", "Microsoft Jenny Online (Natural)", "Google UK English Female", "Samantha"],
    defaultLang: "en-US",
  },
  RYAN: {
    name: "RYAN",
    title: "Cybersecurity Specialist",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(59,130,246,0.2))",
    border: "rgba(168,85,247,0.3)",
    glow: "rgba(168,85,247,0.4)",
    greeting: "Hey, I'm Ryan — CyberCraft360's cybersecurity specialist. Most businesses don't realise they've been compromised until it's too late. What does your current security setup look like?",
    voices: ["Microsoft Ryan Online (Natural)", "Microsoft Ryan", "Microsoft Guy Online (Natural)", "Microsoft Eric Online (Natural)", "Google UK English Male"],
    defaultLang: "en-GB",
  },
  MARCUS: {
    name: "MARCUS",
    title: "Automation & ROI Expert",
    color: "#10b981",
    gradient: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.2))",
    border: "rgba(16,185,129,0.3)",
    glow: "rgba(16,185,129,0.4)",
    greeting: "What's up, I'm Marcus — I help businesses cut costs and scale revenue through AI automation. What's the most repetitive thing your team deals with every single day?",
    voices: ["Microsoft Andrew Online (Natural)", "Microsoft Andrew", "Microsoft Guy Online (Natural)", "Microsoft Roger Online (Natural)", "Google US English Male"],
    defaultLang: "en-US",
  },
  ZARA: {
    name: "ZARA",
    title: "Voice AI Engineer",
    color: "#f43f5e",
    gradient: "linear-gradient(135deg, rgba(244,63,94,0.25), rgba(251,146,60,0.2))",
    border: "rgba(244,63,94,0.3)",
    glow: "rgba(244,63,94,0.4)",
    greeting: "I'm ZARA — I build voice AI agents and chatbots like the one you're speaking to right now. What systems does your business currently run on?",
    voices: ["Microsoft Sonia Online (Natural)", "Microsoft Hazel Online (Natural)", "Microsoft Libby Online (Natural)", "Google UK English Female", "Karen"],
    defaultLang: "en-GB",
  },
} as const;

type PersonaKey = "IRIS" | "RYAN" | "MARCUS" | "ZARA";

// Language-to-voice priority map for multilingual support
const LANG_VOICES: Record<string, string[]> = {
  "en-US": ["Microsoft Aria Online (Natural)", "Microsoft Jenny Online (Natural)", "Microsoft Aria", "Google US English", "Samantha"],
  "en-GB": ["Microsoft Libby Online (Natural)", "Microsoft Sonia Online (Natural)", "Microsoft Hazel Online (Natural)", "Google UK English Female", "Victoria"],
  "ur-PK": ["Microsoft Uzma Online (Natural)", "Microsoft Asad Online (Natural)", "Microsoft Uzma"],
  "hi-IN": ["Microsoft Swara Online (Natural)", "Microsoft Swara", "Google हिन्दी"],
  "ar-SA": ["Microsoft Zariyah Online (Natural)", "Microsoft Zariyah", "Microsoft Hoda"],
  "fr-FR": ["Microsoft Denise Online (Natural)", "Microsoft Julie Online (Natural)", "Google français"],
  "es-ES": ["Microsoft Elvira Online (Natural)", "Microsoft Laura Online (Natural)", "Google español"],
  "es-MX": ["Microsoft Dalia Online (Natural)", "Microsoft Dalia"],
  "de-DE": ["Microsoft Katja Online (Natural)", "Microsoft Katja", "Google Deutsch"],
  "it-IT": ["Microsoft Isabella Online (Natural)", "Microsoft Isabella", "Google italiano"],
  "pt-BR": ["Microsoft Francisca Online (Natural)", "Microsoft Francisca", "Google português do Brasil"],
  "pt-PT": ["Microsoft Raquel Online (Natural)", "Microsoft Raquel"],
  "zh-CN": ["Microsoft Xiaoxiao Online (Natural)", "Microsoft Xiaoxiao", "Google 普通话（中国大陆）"],
  "zh-TW": ["Microsoft HsiaoChen Online (Natural)", "Microsoft HsiaoChen"],
  "ja-JP": ["Microsoft Nanami Online (Natural)", "Microsoft Nanami", "Google 日本語"],
  "ko-KR": ["Microsoft SunHi Online (Natural)", "Microsoft SunHi", "Google 한국의"],
  "tr-TR": ["Microsoft Emel Online (Natural)", "Microsoft Emel"],
  "nl-NL": ["Microsoft Colette Online (Natural)", "Microsoft Colette"],
  "pl-PL": ["Microsoft Zofia Online (Natural)", "Microsoft Zofia"],
  "ru-RU": ["Microsoft Svetlana Online (Natural)", "Microsoft Svetlana", "Google русский"],
};

type CapturedLead = { name: string | null; company: string | null; challenge: string | null };

export default function IrisAgent() {
  const [activePersona, setActivePersona] = useState<PersonaKey>("IRIS");
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [agentText, setAgentText] = useState("");
  const [started, setStarted] = useState(false);
  const [bookedCall, setBookedCall] = useState(false);
  const [supported, setSupported] = useState(true);
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [currentLang, setCurrentLang] = useState("en-US");
  const [capturedLead, setCapturedLead] = useState<CapturedLead | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const bookedRef = useRef(false);
  const currentLangRef = useRef("en-US");
  const leadSavedRef = useRef(false);

  const persona = PERSONAS[activePersona];

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { bookedRef.current = bookedCall; }, [bookedCall]);
  useEffect(() => { currentLangRef.current = currentLang; }, [currentLang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Auto-enable text mode on touch/mobile devices
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) { setTextMode(true); }
    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SR || !window.speechSynthesis) { setSupported(false); setTextMode(true); return; }
    synthRef.current = window.speechSynthesis;
  }, []);

  // Reset when persona switches
  useEffect(() => {
    if (started) {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
      setStarted(false);
      setMessages([]);
      setAgentText("");
      setTranscript("");
      setPhase("idle");
      setCapturedLead(null);
      leadSavedRef.current = false;
      setCurrentLang(PERSONAS[activePersona].defaultLang);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersona]);

  const saveConversation = useCallback(async () => {
    if (messagesRef.current.length === 0) return;
    await fetch("/api/iris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        save: true,
        messages: messagesRef.current,
        bookedCall: bookedRef.current,
        leadCaptured: leadSavedRef.current,
        persona: activePersona,
      }),
    });
  }, [activePersona]);

  useEffect(() => { return () => { saveConversation(); }; }, [saveConversation]);

  const getBestVoice = useCallback((lang: string, personaVoices: readonly string[]): SpeechSynthesisVoice | undefined => {
    if (!synthRef.current) return undefined;
    const voices = synthRef.current.getVoices();
    const langBase = lang.split("-")[0];

    // 1. Try persona-preferred voices first (only if language matches)
    if (lang === "en-US" || lang === "en-GB" || lang.startsWith("en")) {
      for (const name of personaVoices) {
        const v = voices.find(v => v.name === name);
        if (v) return v;
      }
    }

    // 2. Try language-specific priority voices
    const langPriority = LANG_VOICES[lang] || [];
    for (const name of langPriority) {
      const v = voices.find(v => v.name === name);
      if (v) return v;
    }

    // 3. Any voice matching lang code with female preference
    const byLang = voices.filter(v => v.lang.startsWith(langBase));
    return byLang.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("natural")) || byLang[0];
  }, []);

  const speakText = useCallback((text: string, lang: string, onEnd?: () => void) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    // Voices may not be loaded yet — wait briefly
    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      utt.volume = 1;
      utt.rate = 0.9;
      utt.pitch = 1.0;

      const voice = getBestVoice(lang, persona.voices);
      if (voice) utt.voice = voice;

      utt.onend = () => onEnd?.();
      utt.onerror = () => onEnd?.();
      synthRef.current!.speak(utt);
    };

    if (synthRef.current.getVoices().length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", doSpeak, { once: true });
    } else {
      doSpeak();
    }
  }, [getBestVoice, persona.voices]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    // Use the current language for recognition so Urdu/Arabic etc. are recognised correctly
    recognition.lang = currentLangRef.current;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setPhase("listening");
    setTranscript("");

    recognition.onresult = async (e) => {
      const spoken = e.results[0][0].transcript;
      setTranscript(spoken);
      setPhase("thinking");

      const userMsg: Message = { role: "user", content: spoken };
      const updated = [...messagesRef.current, userMsg];
      setMessages(updated);

      if (spoken.toLowerCase().includes("book") || spoken.toLowerCase().includes("calendly") || spoken.toLowerCase().includes("schedule")) {
        setBookedCall(true);
      }

      try {
        const res = await fetch("/api/iris", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: updated, persona: activePersona }),
        });
        const data = await res.json();
        const reply = data.reply || "I didn't quite catch that. Could you say that again?";
        const lang = data.lang || currentLangRef.current;

        setCurrentLang(lang);
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
        setAgentText(reply);

        if (reply.toLowerCase().includes("calendly") || reply.toLowerCase().includes("book") || reply.toLowerCase().includes("strategy session")) {
          setBookedCall(true);
        }

        // Capture lead if extracted and not yet saved
        if (data.lead && (data.lead.name || data.lead.company) && !leadSavedRef.current) {
          leadSavedRef.current = true;
          setCapturedLead(data.lead);
        }

        setPhase("speaking");
        speakText(reply, lang, () => setPhase("idle"));
      } catch {
        setPhase("idle");
      }
    };

    recognition.onerror = () => setPhase("idle");
    recognition.onend = () => { if (phase === "listening") setPhase("idle"); };
    recognition.start();
  }, [activePersona, phase, speakText]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (!text.trim() || phase === "thinking") return;
    setTextInput("");
    setPhase("thinking");

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messagesRef.current, userMsg];
    setMessages(updated);

    if (text.toLowerCase().includes("book") || text.toLowerCase().includes("calendly") || text.toLowerCase().includes("schedule")) {
      setBookedCall(true);
    }

    try {
      const res = await fetch("/api/iris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, persona: activePersona }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, something went wrong. Please try again.";
      const lang = data.lang || currentLangRef.current;

      setCurrentLang(lang);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setAgentText(reply);

      if (reply.toLowerCase().includes("calendly") || reply.toLowerCase().includes("book") || reply.toLowerCase().includes("strategy session")) {
        setBookedCall(true);
      }
      if (data.lead && (data.lead.name || data.lead.company) && !leadSavedRef.current) {
        leadSavedRef.current = true;
        setCapturedLead(data.lead);
      }

      setPhase("speaking");
      speakText(reply, lang, () => setPhase("idle"));
    } catch {
      setPhase("idle");
    }
  }, [activePersona, phase, speakText]);

  const handleStart = () => {
    setStarted(true);
    setMessages([]);
    setAgentText(persona.greeting);
    setCurrentLang(persona.defaultLang);
    setPhase("speaking");
    speakText(persona.greeting, persona.defaultLang, () => setPhase("idle"));
  };

  const handleEnd = async () => {
    recognitionRef.current?.abort();
    synthRef.current?.cancel();
    await saveConversation();
    setPhase("idle");
    setStarted(false);
    setMessages([]);
    setAgentText("");
    setTranscript("");
    setCapturedLead(null);
    leadSavedRef.current = false;
  };

  if (!supported && !textMode) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Voice not supported in this browser. <button onClick={() => setTextMode(true)} className="text-[#00d4ff] underline">Switch to text mode</button></p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">

      {/* Persona selector */}
      <div className="grid grid-cols-4 gap-3 w-full">
        {(Object.keys(PERSONAS) as PersonaKey[]).map(key => {
          const p = PERSONAS[key];
          const isActive = activePersona === key;
          return (
            <motion.button
              key={key}
              onClick={() => setActivePersona(key)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "12px 8px",
                borderRadius: "12px",
                border: `1px solid ${isActive ? p.border : "rgba(255,255,255,0.07)"}`,
                background: isActive ? p.gradient : "rgba(255,255,255,0.02)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.25s",
                boxShadow: isActive ? `0 0 20px ${p.glow}30` : "none",
              }}
            >
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: isActive ? p.color : "rgba(255,255,255,0.4)", letterSpacing: "0.05em", marginBottom: "3px" }}>{p.name}</div>
              <div style={{ fontSize: "0.55rem", color: isActive ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{p.title}</div>
            </motion.button>
          );
        })}
      </div>

      {/* Orb */}
      <div className="relative flex items-center justify-center" style={{ width: "180px", height: "180px" }}>
        {phase !== "idle" && (
          <>
            <motion.div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${persona.color}33` }}
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
            <motion.div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${persona.color}22` }}
              animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }} />
          </>
        )}

        <motion.div
          animate={{
            boxShadow: phase === "speaking"
              ? [`0 0 30px ${persona.glow}, 0 0 60px ${persona.glow}66`, `0 0 50px ${persona.glow}, 0 0 90px ${persona.glow}88`, `0 0 30px ${persona.glow}, 0 0 60px ${persona.glow}66`]
              : phase === "listening"
              ? ["0 0 30px rgba(34,197,94,0.4)", "0 0 50px rgba(34,197,94,0.6)", "0 0 30px rgba(34,197,94,0.4)"]
              : phase === "thinking"
              ? ["0 0 25px rgba(251,191,36,0.3)", "0 0 40px rgba(251,191,36,0.5)", "0 0 25px rgba(251,191,36,0.3)"]
              : `0 0 20px ${persona.glow}33`,
            scale: phase === "speaking" ? [1, 1.04, 1] : 1,
          }}
          transition={{ duration: 1.2, repeat: phase !== "idle" ? Infinity : 0 }}
          style={{
            width: "140px", height: "140px", borderRadius: "50%",
            background: persona.gradient,
            border: `1px solid ${persona.border}`,
            backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: !started || phase === "idle" ? "pointer" : "default",
            position: "relative",
          }}
          onClick={!started ? handleStart : (phase === "idle" && !textMode) ? startListening : undefined}
        >
          <AnimatePresence mode="wait">
            {phase === "listening" && (
              <motion.div key="mic" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </motion.div>
            )}
            {phase === "thinking" && (
              <motion.div key="think" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: "flex", gap: "5px" }}>
                {[0,1,2].map(i => (
                  <motion.span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fbbf24", display: "block" }}
                    animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </motion.div>
            )}
            {phase === "speaking" && (
              <motion.div key="speak" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                {[4,7,10,7,4].map((h, i) => (
                  <motion.span key={i} style={{ width: "3px", borderRadius: "2px", background: persona.color, display: "block" }}
                    animate={{ height: [`${h}px`, `${h * 2.5}px`, `${h}px`] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} />
                ))}
              </motion.div>
            )}
            {phase === "idle" && (
              <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={`${persona.color}bb`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.p key={phase + started.toString() + activePersona}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
          style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
          {!started ? `Tap to speak with ${persona.name}` :
           phase === "listening" ? `Listening... (${currentLang})` :
           phase === "thinking" ? `${persona.name} is thinking...` :
           phase === "speaking" ? `${persona.name} is speaking...` :
           textMode ? "Type your message below" : "Tap orb to respond"}
        </motion.p>
      </AnimatePresence>

      {/* Agent text */}
      <AnimatePresence>
        {agentText && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ maxWidth: "520px", width: "100%", padding: "16px 20px", borderRadius: "16px",
              background: `${persona.color}08`, border: `1px solid ${persona.border}`, backdropFilter: "blur(12px)" }}>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.65, color: "rgba(255,255,255,0.8)", margin: 0 }}>
              <span style={{ color: persona.color, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", marginRight: "10px" }}>{persona.name}</span>
              {agentText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead captured card */}
      <AnimatePresence>
        {capturedLead && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              maxWidth: "520px", width: "100%",
              borderRadius: "16px", overflow: "hidden",
              border: "1px solid rgba(34,197,94,0.25)",
              background: "rgba(34,197,94,0.04)",
            }}
          >
            {/* Green top bar */}
            <div style={{ height: "2px", background: "linear-gradient(90deg, #22c55e, #10b981, transparent)" }} />
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#22c55e" }}>
                  You&apos;re on our radar
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: "14px" }}>
                {capturedLead.name && <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{capturedLead.name}</span>}
                {capturedLead.name && capturedLead.company && " · "}
                {capturedLead.company && <span>{capturedLead.company}</span>}
                {capturedLead.challenge && (
                  <span style={{ display: "block", marginTop: "4px", fontSize: "0.72rem" }}>
                    Challenge: {capturedLead.challenge}
                  </span>
                )}
              </div>
              <a
                href="https://calendly.com/cybercraftlimited/30min"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  padding: "9px 18px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #22c55e, #10b981)",
                  color: "#fff",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Book Your Free Strategy Call →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User transcript */}
      <AnimatePresence>
        {transcript && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            style={{ maxWidth: "520px", width: "100%", padding: "12px 20px", borderRadius: "16px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: "0.8rem", lineHeight: 1.5, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", marginRight: "10px" }}>You</span>
              {transcript}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text input — shown on mobile / when voice unsupported */}
      {started && textMode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: "520px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendTextMessage(textInput); }}
              placeholder={`Message ${persona.name}...`}
              disabled={phase === "thinking" || phase === "speaking"}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${persona.border}`,
                borderRadius: "12px", padding: "12px 16px", fontSize: "0.9rem", color: "#fff",
                outline: "none", opacity: phase === "thinking" ? 0.5 : 1,
              }}
            />
            <button
              onClick={() => sendTextMessage(textInput)}
              disabled={!textInput.trim() || phase === "thinking" || phase === "speaking"}
              style={{
                background: `linear-gradient(135deg, ${persona.color}, #7c3aed)`,
                border: "none", borderRadius: "12px", padding: "12px 18px",
                color: "#fff", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                opacity: !textInput.trim() || phase === "thinking" ? 0.4 : 1,
              }}
            >
              Send
            </button>
          </div>
          {!supported && (
            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", marginTop: "8px", textAlign: "center" }}>
              Voice not supported in this browser — text mode active
            </p>
          )}
        </motion.div>
      )}

      {/* Voice/Text toggle — desktop only */}
      {started && supported && (
        <button onClick={() => setTextMode(t => !t)}
          style={{ background: "transparent", border: "none", fontSize: "0.65rem", letterSpacing: "0.15em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.2)", cursor: "pointer", textDecoration: "underline" }}>
          Switch to {textMode ? "voice" : "text"} mode
        </button>
      )}

      {/* End session */}
      {started && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleEnd}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "999px",
            padding: "7px 20px", fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)", cursor: "pointer" }}>
          End Session
        </motion.button>
      )}
    </div>
  );
}
