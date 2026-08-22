import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { createTransport } from "nodemailer";
import { Enrollment } from "@/lib/email-sequences";

export const maxDuration = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";

function authOk(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_SECRET;
  const auth = req.headers.get("authorization");
  const qs = req.nextUrl?.searchParams?.get("secret");
  const adminToken = req.headers.get("x-admin-token");
  if (cronSecret && (auth === `Bearer ${cronSecret}` || qs === cronSecret)) return true;
  if (adminSecret && adminToken === Buffer.from(`cc360:${adminSecret}:v2`).toString("base64")) return true;
  return false;
}

function buildTransport() {
  const host = process.env.OUTREACH_SMTP_HOST ?? "smtp.hostinger.com";
  const port = parseInt(process.env.OUTREACH_SMTP_PORT ?? "465");
  const user = process.env.OUTREACH_EMAIL;
  const pass = process.env.OUTREACH_EMAIL_PASSWORD;
  if (!user || !pass) return null;
  return createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

// Classify the reply intent
function classifyReply(text: string): "interested" | "pricing" | "call_me" | "not_interested" | "out_of_office" | "question" {
  const t = text.toLowerCase();
  if (/out of office|on vacation|i('m| am) away|auto.?reply/i.test(t)) return "out_of_office";
  if (/not interested|no thanks|don't contact|remove me|unsubscribe|stop emailing/i.test(t)) return "not_interested";
  if (/call me|give me a call|phone me|reach me at|my number/i.test(t)) return "call_me";
  if (/how much|pricing|cost|price|rates?|what do you charge/i.test(t)) return "pricing";
  if (/tell me more|sounds interesting|interested|want to learn|curious|let's chat|schedule|book/i.test(t)) return "interested";
  return "question";
}

// Generate a smart reply using Groq
async function generateReply(params: {
  replyText: string;
  intent: string;
  leadName: string;
  ownerName: string;
  industry: string;
  city: string;
  flags: string[];
}): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return "";

  const { replyText, intent, leadName, ownerName, industry, city, flags } = params;
  const firstName = ownerName?.split(" ")[0] || "there";
  const flagContext = flags.length > 0 ? `Known about their business: ${flags.join(", ")}.` : "";

  const systemPrompt = `You are Saad Imran, Founder of CyberCraft360, responding to a cold email reply from a ${industry} business owner named ${firstName} at ${leadName} in ${city}. ${flagContext}

CyberCraft360 builds AI automation systems for service businesses — AI call handling, lead qualification, appointment booking. Website: ${SITE}. Schedule a call: +1 (346) 600-9210.

Write a reply that:
- Feels personal and human, not like a template
- Is SHORT — 3 to 5 sentences maximum
- Matches the tone of their message
- Ends with a clear next step (schedule a call, or a direct question)
- Does NOT use hollow phrases like "Great to hear from you!" or "I hope this finds you well"
- Signs off as: Saad`;

  const userPrompt = `Their reply: "${replyText.slice(0, 500)}"
Intent detected: ${intent}

Write the response now. No preamble, just the email body starting with "Hi ${firstName}," and ending with the signature.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}

// Render the reply as styled HTML
function renderHtml(text: string): string {
  const lines = text.split("\n");
  const sigIdx = lines.findIndex(l => /^(best|regards|saad|cheers),?\s*$/i.test(l.trim()));
  const bodyLines = sigIdx >= 0 ? lines.slice(0, sigIdx) : lines;
  const sigLines = sigIdx >= 0 ? lines.slice(sigIdx) : [];

  const renderLines = (arr: string[], isSig = false) => arr.map((line, i) => {
    if (line.trim() === "") return `<tr><td style="padding:5px 0"></td></tr>`;
    const content = line.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" style="color:#1a1a1a;text-decoration:underline">${url}</a>`);
    if (isSig && i === 0) return `<tr><td style="padding-top:18px;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;color:#1a1a1a">${content}</td></tr>`;
    if (isSig && i === 1) return `<tr><td style="font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;font-weight:bold;color:#1a1a1a">${content}</td></tr>`;
    if (isSig) return `<tr><td style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#555;letter-spacing:0.02em">${content}</td></tr>`;
    return `<tr><td style="padding:1px 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;line-height:1.75;color:#1a1a1a">${content}</td></tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#fff">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px;margin:0 auto;padding:40px 24px">
  <tbody>
    ${renderLines(bodyLines)}
    ${renderLines(sigLines, true)}
    <tr><td style="padding-top:24px;border-top:1px solid #e8e8e8;font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#aaa;letter-spacing:0.04em">CYBERCRAFT360 &nbsp;·&nbsp; <a href="${SITE}" style="color:#aaa;text-decoration:none">${SITE.replace("https://","")}</a></td></tr>
  </tbody>
</table>
</body></html>`;
}

export async function GET(req: NextRequest) {
  if (!authOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const imapUser = process.env.OUTREACH_EMAIL;
  const imapPass = process.env.OUTREACH_EMAIL_PASSWORD;
  const imapHost = process.env.OUTREACH_IMAP_HOST ?? process.env.OUTREACH_SMTP_HOST?.replace("smtp.", "imap.") ?? "imap.hostinger.com";

  if (!imapUser || !imapPass) {
    return NextResponse.json({ error: "OUTREACH_EMAIL / OUTREACH_EMAIL_PASSWORD not configured" });
  }

  // Dynamically import imapflow (ESM)
  const { ImapFlow } = await import("imapflow");

  const client = new ImapFlow({
    host: imapHost,
    port: 993,
    secure: true,
    auth: { user: imapUser, pass: imapPass },
    logger: false,
  });

  const enrollments: Enrollment[] = await redis.get("outreach:enrollments") ?? [];
  const repliedIds: Set<string> = new Set(await redis.get<string[]>("outreach:auto_replied") ?? []);

  const transport = buildTransport();
  const fromName = process.env.OUTREACH_NAME ?? "Saad Imran";
  const results: any[] = [];

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");

    // Fetch unseen messages from the last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);

    for await (const msg of client.fetch({ since, seen: false }, { envelope: true, bodyStructure: true, source: true })) {
      const subject = msg.envelope.subject ?? "";
      const from = msg.envelope.from?.[0];
      const fromEmail = from ? `${from.mailbox}@${from.host}` : "";
      const msgId = msg.envelope.messageId ?? String(msg.uid);

      if (!fromEmail || fromEmail === imapUser) continue;
      if (repliedIds.has(msgId)) continue;

      // Check if this is a reply to one of our outreach emails
      const sourceText = msg.source?.toString("utf8") ?? "";
      const bodyMatch = sourceText.match(/\r?\n\r?\n([\s\S]{10,2000})/);
      const replyText = bodyMatch?.[1]?.replace(/<[^>]+>/g, "").trim() ?? subject;

      // Find the matching enrollment by email
      const enrollment = enrollments.find(e =>
        e.leadEmail.toLowerCase() === fromEmail.toLowerCase() && e.status === "active"
      );

      if (!enrollment) continue;

      const intent = classifyReply(replyText);

      // Skip out-of-office, don't reply to not_interested automatically (mark as replied only)
      if (intent === "out_of_office") continue;

      if (intent === "not_interested") {
        // Mark enrollment as completed, don't reply
        const idx = enrollments.findIndex(e => e.id === enrollment.id);
        if (idx !== -1) enrollments[idx] = { ...enrollments[idx], status: "unsubscribed" };
        repliedIds.add(msgId);
        results.push({ email: fromEmail, intent, action: "unsubscribed" });
        continue;
      }

      // Generate smart AI reply
      const replyBody = await generateReply({
        replyText,
        intent,
        leadName: enrollment.leadName,
        ownerName: enrollment.ownerName ?? enrollment.leadName,
        industry: enrollment.leadIndustry,
        city: enrollment.leadCity,
        flags: enrollment.leadFlags ?? [],
      });

      if (!replyBody || !transport) continue;

      // Send the reply
      try {
        await transport.sendMail({
          from: `${fromName} <${imapUser}>`,
          to: fromEmail,
          subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
          text: replyBody,
          html: renderHtml(replyBody),
          headers: {
            "In-Reply-To": msgId,
            "References": msgId,
          },
        });

        // Mark enrollment as replied
        const idx = enrollments.findIndex(e => e.id === enrollment.id);
        if (idx !== -1) enrollments[idx] = { ...enrollments[idx], status: "replied" };
        repliedIds.add(msgId);

        results.push({ email: fromEmail, intent, action: "replied" });
        console.log(`[auto-reply] Replied to ${fromEmail} (intent: ${intent})`);
      } catch (e) {
        console.error(`[auto-reply] Failed to reply to ${fromEmail}:`, String(e).slice(0, 200));
      }
    }

    await client.logout();
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 300) });
  }

  // Save updates
  await Promise.all([
    redis.set("outreach:enrollments", enrollments),
    redis.set("outreach:auto_replied", [...repliedIds]),
  ]);

  return NextResponse.json({ ok: true, processed: results.length, results });
}
