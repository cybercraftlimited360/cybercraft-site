import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { sendEmail } from "@/lib/mailer";

const CHECKLIST_HTML = `
<div style="background:#0a0c12;padding:40px 20px;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
    <div style="height:3px;background:linear-gradient(90deg,#00d4ff,#7c3aed);"></div>
    <div style="padding:36px;">

      <p style="font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin:0 0 8px;">CyberCraft360</p>
      <h1 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 6px;">Your AI Readiness Checklist</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.45);margin:0 0 32px;">Answer these 5 questions honestly. Each "yes" is money being left on the table every day you wait.</p>

      ${[
        {
          q: "Are you missing calls when you're busy or after hours?",
          why: "Every missed call is a lead that calls your competitor next. An AI receptionist answers instantly, 24/7, books the appointment, and sends a confirmation — without you touching the phone.",
        },
        {
          q: "Are you or your staff spending more than 2 hours a day on repetitive tasks?",
          why: "Appointment reminders, data entry, follow-up emails, answering the same questions — these are the first things to automate. Most businesses reclaim 20–30 hours a week within the first month.",
        },
        {
          q: "Do your leads go more than 5 minutes without a response?",
          why: "Studies show 78% of customers buy from the business that responds first. If you're following up the next morning, you've already lost most of them. AI follows up in under 60 seconds.",
        },
        {
          q: "Are you relying on manual follow-up to close deals?",
          why: "Most sales happen on the 5th–8th touchpoint. Nobody has time to do that manually for every lead. An AI sales agent follows up automatically across SMS, email, and voicemail until they respond.",
        },
        {
          q: "Would adding 24/7 coverage meaningfully grow your revenue?",
          why: "If even 20% of your revenue comes from after-hours opportunities you're currently missing — calls, form submissions, chat inquiries — AI pays for itself in weeks, not months.",
        },
      ].map((item, i) => `
        <div style="margin-bottom:24px;padding:20px 22px;border-radius:12px;background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.12);">
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
            <div style="width:26px;height:26px;border-radius:50%;background:rgba(0,212,255,0.12);border:1px solid rgba(0,212,255,0.3);color:#00d4ff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i + 1}</div>
            <div style="font-size:15px;font-weight:600;color:#fff;line-height:1.4;">${item.q}</div>
          </div>
          <p style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;margin:0 0 0 38px;">${item.why}</p>
        </div>
      `).join("")}

      <div style="margin-top:32px;padding:22px 24px;border-radius:12px;background:linear-gradient(135deg,rgba(0,212,255,0.08),rgba(124,58,237,0.08));border:1px solid rgba(0,212,255,0.2);">
        <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:6px;">What's your score?</div>
        <p style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 16px;line-height:1.6;">
          <strong style="color:#00d4ff;">1–2 yes:</strong> You have one urgent gap — let's fix that first.<br/>
          <strong style="color:#7c3aed;">3–4 yes:</strong> AI would make a meaningful difference in your business today.<br/>
          <strong style="color:#e64dff;">5 yes:</strong> You're leaving significant revenue on the table every single week.
        </p>
        <a href="https://cybercraft360.com/book" style="display:inline-block;padding:13px 24px;border-radius:10px;background:linear-gradient(135deg,#00d4ff,#7c3aed);color:#fff;font-weight:700;font-size:13px;text-decoration:none;letter-spacing:0.04em;">
          Book a Free AI Audit →
        </a>
      </div>

      <p style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:28px;text-align:center;">
        CyberCraft360 · cybercraft360.com · Houston, Texas
      </p>
    </div>
  </div>
</div>
`;

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const entry = { email: email.trim().toLowerCase(), source: source ?? "blog", createdAt: new Date().toISOString() };

    // Save to Redis (deduplicated)
    const existing = await redis.get<any[]>("leads:checklist") ?? [];
    const alreadyExists = existing.some((e: any) => e.email === entry.email);
    if (!alreadyExists) {
      existing.unshift(entry);
      await redis.set("leads:checklist", existing.slice(0, 500));
    }

    // Send checklist to user
    await sendEmail({
      to: email.trim(),
      subject: "Your AI Readiness Checklist — CyberCraft360",
      html: CHECKLIST_HTML,
    });

    // Notify owner
    await sendEmail({
      to: "cybercraftlimited@gmail.com",
      subject: `New checklist lead: ${entry.email}`,
      html: `<p style="font-family:sans-serif;">New AI Readiness Checklist download from <strong>${entry.email}</strong><br/>Source blog post: ${entry.source}<br/>${entry.createdAt}</p>`,
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[checklist] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
