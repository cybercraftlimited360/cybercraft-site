import { NextRequest, NextResponse } from "next/server";

function auth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

async function groqProposal(apiKey: string, input: any): Promise<any> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are Saad Imran, founder of CyberCraft360 — a premium AI agency in Houston TX. You write proposals that are sharp, confident, and specific. No filler. No corporate speak. You write like someone who has solved this exact problem 60+ times and knows exactly what the client needs. You never say "game-changer", "streamline", or "take your business to the next level".`,
        },
        {
          role: "user",
          content: `Write a business proposal for this prospect:

Client name: ${input.clientName}
Business: ${input.businessName}
Industry: ${input.industry}
Their main challenge: ${input.challenge}
Budget range: ${input.budget || "Not specified"}
Services they need: ${input.services || "AI phone agent, chatbot, automation"}
Timeline: ${input.timeline || "ASAP"}
Notes: ${input.notes || "None"}

Return a JSON object with:
{
  "executive_summary": "2–3 paragraphs. Open with their specific pain, not a generic intro. Make them feel understood.",
  "problem_statement": "1–2 paragraphs describing exactly what's costing them money right now.",
  "proposed_solution": "2–3 paragraphs describing what we'll build for them specifically. Name the tools (AI phone agent, IRIS chatbot, etc.).",
  "deliverables": ["list", "of", "5-7", "specific", "deliverables"],
  "timeline": [{"week": "Week 1–2", "milestone": "..."}, {"week": "Week 3–4", "milestone": "..."}, {"week": "Week 5–6", "milestone": "..."}],
  "investment": "Pricing paragraph — monthly retainer, what's included, framed as ROI not cost.",
  "why_cybercraft": "2 paragraphs. Specific reasons we're the right choice. Reference Houston presence, custom builds, Saad's background.",
  "next_steps": "Short closing paragraph with a clear call to action."
}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.75,
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return JSON.parse(data.choices[0].message.content);
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const input = await req.json();
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No GROQ_API_KEY" }, { status: 500 });

  try {
    const content = await groqProposal(apiKey, input);

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: React } = await import("react");
    const { Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");

    const styles = StyleSheet.create({
      page: { fontFamily: "Helvetica", padding: "48 48 60 48", fontSize: 11, color: "#1a1a2e" },
      accentBar: { height: 4, backgroundColor: "#0077cc", marginBottom: 36, borderRadius: 2 },
      brand: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 2, color: "#9ca3af", textTransform: "uppercase", marginBottom: 6 },
      title: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#0f1117", marginBottom: 4 },
      subtitle: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
      date: { fontSize: 10, color: "#9ca3af", marginBottom: 32 },
      divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 20 },
      sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 2, color: "#0077cc", textTransform: "uppercase", marginBottom: 8 },
      sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0f1117", marginBottom: 10 },
      body: { fontSize: 11, color: "#374151", lineHeight: 1.7, marginBottom: 14 },
      bullet: { fontSize: 11, color: "#374151", lineHeight: 1.6, marginBottom: 4, paddingLeft: 12 },
      timelineRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
      timelineWeek: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0077cc", width: 70, flexShrink: 0, paddingTop: 1 },
      timelineText: { fontSize: 11, color: "#374151", flex: 1, lineHeight: 1.5 },
      callout: { backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12 14", marginBottom: 20 },
      calloutText: { fontSize: 11, color: "#1d4ed8", lineHeight: 1.6 },
      footer: { position: "absolute", bottom: 28, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" },
      footerText: { fontSize: 8, color: "#9ca3af" },
    });

    const para = (text: string) =>
      React.createElement(Text, { style: styles.body }, text);

    const section = (label: string, title: string, children: any) =>
      React.createElement(View, { style: { marginBottom: 24 } },
        React.createElement(Text, { style: styles.sectionLabel }, label),
        React.createElement(Text, { style: styles.sectionTitle }, title),
        children,
      );

    const doc = React.createElement(Document, null,
      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.accentBar }),

        // Header
        React.createElement(Text, { style: styles.brand }, "CyberCraft360 · Proposal"),
        React.createElement(Text, { style: styles.title }, `AI Solution Proposal`),
        React.createElement(Text, { style: styles.subtitle }, `Prepared for ${input.clientName} · ${input.businessName}`),
        React.createElement(Text, { style: styles.date }, `${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`),
        React.createElement(View, { style: styles.divider }),

        // Executive Summary
        section("01 · Overview", "Executive Summary",
          para(content.executive_summary),
        ),

        // Problem
        section("02 · The Problem", "What's Costing You Right Now",
          para(content.problem_statement),
        ),

        // Solution
        section("03 · The Solution", "What We'll Build",
          para(content.proposed_solution),
        ),

        // Deliverables
        section("04 · Scope", "What's Included",
          React.createElement(View, null,
            ...(content.deliverables || []).map((d: string, i: number) =>
              React.createElement(Text, { key: i, style: styles.bullet }, `✓  ${d}`)
            )
          ),
        ),
      ),

      React.createElement(Page, { size: "A4", style: styles.page },
        React.createElement(View, { style: styles.accentBar }),

        // Timeline
        section("05 · Timeline", `Deployment: ${input.timeline || "4–6 Weeks"}`,
          React.createElement(View, null,
            ...(content.timeline || []).map((t: any, i: number) =>
              React.createElement(View, { key: i, style: styles.timelineRow },
                React.createElement(Text, { style: styles.timelineWeek }, t.week),
                React.createElement(Text, { style: styles.timelineText }, t.milestone),
              )
            )
          ),
        ),

        // Investment
        section("06 · Investment", "Pricing & ROI",
          para(content.investment),
        ),

        // Why CyberCraft
        section("07 · Why CyberCraft360", "Why We're the Right Partner",
          para(content.why_cybercraft),
        ),

        // Next Steps
        React.createElement(View, { style: styles.callout },
          React.createElement(Text, { style: { ...styles.sectionLabel, color: "#1d4ed8", marginBottom: 6 } }, "Next Steps"),
          React.createElement(Text, { style: styles.calloutText }, content.next_steps),
        ),

        // Footer
        React.createElement(View, { style: styles.footer },
          React.createElement(Text, { style: styles.footerText }, "CyberCraft360 · cybercraft360.com · Houston, TX · cybercraftlimited@gmail.com"),
          React.createElement(Text, { style: styles.footerText }, `Prepared by Saad Imran, Founder`),
        ),
      ),
    );

    const buffer = await renderToBuffer(doc);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CyberCraft360-Proposal-${(input.clientName || "client").replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[generate-proposal]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
