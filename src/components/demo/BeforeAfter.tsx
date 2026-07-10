"use client";
import { motion } from "framer-motion";

const comparisons = [
  {
    icon: "📞",
    label: "Missed Calls",
    before: { title: "Voicemail Again", desc: "Customer calls after hours. Gets voicemail. Calls your competitor instead. You never knew.", color: "#ef4444" },
    after:  { title: "Answered in 1 Ring", desc: "AI answers instantly, 24/7. Books the appointment, captures the lead, sends confirmation — while you sleep.", color: "#22c55e" },
  },
  {
    icon: "⏱️",
    label: "Lead Follow-Up",
    before: { title: "2–3 Days Later", desc: "Someone fills out your contact form. You follow up when you have time. They've already moved on.", color: "#ef4444" },
    after:  { title: "60 Seconds Flat", desc: "AI contacts the lead in under 60 seconds, qualifies them, and books a call before they've even closed the tab.", color: "#22c55e" },
  },
  {
    icon: "🤖",
    label: "Your Chatbot",
    before: { title: "\"I Don't Understand\"", desc: "Generic bot answers with canned responses. Customers get frustrated. Trust erodes. They leave.", color: "#ef4444" },
    after:  { title: "Trained On Your Business", desc: "AI knows your services, prices, FAQs, team, and process. Every answer sounds like your best employee.", color: "#22c55e" },
  },
  {
    icon: "📅",
    label: "Scheduling",
    before: { title: "Phone Tag Forever", desc: "Back-and-forth emails and texts. 3 days to confirm a meeting. Half the leads drop off.", color: "#ef4444" },
    after:  { title: "Booked Instantly", desc: "AI checks availability, offers slots, and books the appointment in the same conversation. No friction.", color: "#22c55e" },
  },
  {
    icon: "🌙",
    label: "After Hours",
    before: { title: "Closed Sign", desc: "Business closes at 6pm. Any lead that comes in after that is lost money.", color: "#ef4444" },
    after:  { title: "Open 24/7/365", desc: "AI handles inquiries at 2am on Sunday the same way it does at noon on Monday. Never closed.", color: "#22c55e" },
  },
  {
    icon: "💸",
    label: "Staff Cost",
    before: { title: "$4,000+/Month", desc: "One full-time receptionist. Benefits, payroll, sick days, training, turnover. And they still can't be everywhere.", color: "#ef4444" },
    after:  { title: "From $497/Month", desc: "AI handles unlimited calls, chats, and follow-ups simultaneously. No HR. No sick days. Gets smarter monthly.", color: "#22c55e" },
  },
];

export default function BeforeAfter() {
  return (
    <section className="px-[5vw] md:px-[6vw] py-20 md:py-28 border-t border-border/40">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="text-center mb-14"
      >
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="w-8 h-0.5 bg-primary rounded-full" />
          <span className="text-primary text-[0.68rem] font-bold tracking-[0.28em] uppercase">✦ The Difference</span>
          <div className="w-8 h-0.5 bg-primary rounded-full" />
        </div>
        <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground leading-tight mb-4"
          style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif" }}>
          Before AI vs. <em>After AI</em>
        </h2>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
          See exactly what changes when you hire an AI team.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {comparisons.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            style={{
              background: "rgba(255,255,255,0.015)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            {/* Label */}
            <div style={{ padding: "14px 18px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>{item.label}</span>
            </div>

            {/* Before */}
            <div style={{ padding: "12px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#ef4444" }}>Without AI</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: "0 0 4px" }}>{item.before.title}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.55 }}>{item.before.desc}</p>
            </div>

            {/* After */}
            <div style={{ padding: "12px 18px 16px", background: "rgba(34,197,94,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#22c55e" }}>With CyberCraft360</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{item.after.title}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.55 }}>{item.after.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
