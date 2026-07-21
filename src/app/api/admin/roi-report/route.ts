import { NextRequest, NextResponse } from "next/server";

function auth(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:v2`).toString("base64");
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    clientName, businessName, period,
    callsAnswered, leadsCaptures, hoursSaved,
    appointmentsBooked, avgOrderValue,
    missedCallsBefore, followUpTimeBefore,
  } = await req.json();

  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: React } = await import("react");
    const { Document, Page, Text, View, StyleSheet, Font } = await import("@react-pdf/renderer");

    const styles = StyleSheet.create({
      page: { fontFamily: "Helvetica", background: "#ffffff", padding: 48 },
      accent: { height: 4, background: "linear-gradient(90deg,#00d4ff,#7c3aed)", marginBottom: 32, borderRadius: 2 },
      header: { marginBottom: 32 },
      brand: { fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 2, color: "#9ca3af", textTransform: "uppercase", marginBottom: 6 },
      title: { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#0f1117", marginBottom: 4 },
      subtitle: { fontSize: 13, color: "#6b7280" },
      divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 24 },
      sectionLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 2, color: "#9ca3af", textTransform: "uppercase", marginBottom: 12 },
      statsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
      statBox: { flex: 1, padding: 16, backgroundColor: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" },
      statValue: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#0f1117", marginBottom: 2 },
      statLabel: { fontSize: 9, color: "#6b7280", letterSpacing: 1, textTransform: "uppercase" },
      highlight: { color: "#0077cc" },
      section: { marginBottom: 20 },
      rowLabel: { fontSize: 11, color: "#374151", flex: 1 },
      rowValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f1117" },
      row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottom: "1px solid #f3f4f6" },
      callout: { backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 16, marginBottom: 24 },
      calloutTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1d4ed8", marginBottom: 4 },
      calloutText: { fontSize: 11, color: "#374151", lineHeight: 1.6 },
      footer: { position: "absolute", bottom: 32, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" },
      footerText: { fontSize: 9, color: "#9ca3af" },
    });

    const revenueRecovered = Math.round((missedCallsBefore || 0) * (avgOrderValue || 0) * 4); // monthly
    const timeSavedValue = Math.round((hoursSaved || 0) * 45 * 4); // $45/hr * 4 weeks
    const totalValue = revenueRecovered + timeSavedValue;

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4", style: styles.page },

        // Top accent bar
        React.createElement(View, { style: { height: 4, backgroundColor: "#0077cc", marginBottom: 32, borderRadius: 2 } }),

        // Header
        React.createElement(View, { style: styles.header },
          React.createElement(Text, { style: styles.brand }, "CyberCraft360 · AI Performance Report"),
          React.createElement(Text, { style: styles.title }, `${clientName || "Client"} — ROI Report`),
          React.createElement(Text, { style: styles.subtitle }, `${businessName || ""} · ${period || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`),
        ),

        React.createElement(View, { style: styles.divider }),

        // Key stats
        React.createElement(Text, { style: styles.sectionLabel }, "AI Performance This Period"),
        React.createElement(View, { style: styles.statsGrid },
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: { ...styles.statValue, color: "#0077cc" } }, String(callsAnswered || 0)),
            React.createElement(Text, { style: styles.statLabel }, "Calls Answered"),
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: { ...styles.statValue, color: "#7c3aed" } }, String(leadsCaptures || 0)),
            React.createElement(Text, { style: styles.statLabel }, "Leads Captured"),
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: { ...styles.statValue, color: "#16a34a" } }, String(hoursSaved || 0)),
            React.createElement(Text, { style: styles.statLabel }, "Hours Saved"),
          ),
          React.createElement(View, { style: styles.statBox },
            React.createElement(Text, { style: { ...styles.statValue, color: "#d97706" } }, String(appointmentsBooked || 0)),
            React.createElement(Text, { style: styles.statLabel }, "Appts Booked"),
          ),
        ),

        // Before vs After
        React.createElement(Text, { style: { ...styles.sectionLabel, marginTop: 8 } }, "Before vs. After"),
        React.createElement(View, { style: { marginBottom: 24 } },
          React.createElement(View, { style: styles.row },
            React.createElement(Text, { style: styles.rowLabel }, "Missed calls per week (before AI)"),
            React.createElement(Text, { style: { ...styles.rowValue, color: "#ef4444" } }, String(missedCallsBefore || 0)),
          ),
          React.createElement(View, { style: styles.row },
            React.createElement(Text, { style: styles.rowLabel }, "Missed calls per week (after AI)"),
            React.createElement(Text, { style: { ...styles.rowValue, color: "#16a34a" } }, "0"),
          ),
          React.createElement(View, { style: styles.row },
            React.createElement(Text, { style: styles.rowLabel }, "Avg lead follow-up time (before)"),
            React.createElement(Text, { style: { ...styles.rowValue, color: "#ef4444" } }, `${followUpTimeBefore || 42} hours`),
          ),
          React.createElement(View, { style: styles.row },
            React.createElement(Text, { style: styles.rowLabel }, "Avg lead follow-up time (after AI)"),
            React.createElement(Text, { style: { ...styles.rowValue, color: "#16a34a" } }, "< 60 seconds"),
          ),
        ),

        // ROI Estimate
        React.createElement(Text, { style: { ...styles.sectionLabel, marginTop: 8 } }, "Estimated Value Delivered"),
        React.createElement(View, { style: { marginBottom: 16 } },
          React.createElement(View, { style: styles.row },
            React.createElement(Text, { style: styles.rowLabel }, `Revenue recovered (${missedCallsBefore || 0} calls/wk × $${avgOrderValue || 0} avg × 4 wks)`),
            React.createElement(Text, { style: styles.rowValue }, `$${revenueRecovered.toLocaleString()}`),
          ),
          React.createElement(View, { style: styles.row },
            React.createElement(Text, { style: styles.rowLabel }, `Staff time saved (${hoursSaved || 0} hrs/wk × $45/hr × 4 wks)`),
            React.createElement(Text, { style: styles.rowValue }, `$${timeSavedValue.toLocaleString()}`),
          ),
          React.createElement(View, { style: { ...styles.row, borderBottom: "none" } },
            React.createElement(Text, { style: { ...styles.rowLabel, fontFamily: "Helvetica-Bold", color: "#0f1117" } }, "Total estimated value this month"),
            React.createElement(Text, { style: { ...styles.rowValue, fontSize: 15, color: "#0077cc" } }, `$${totalValue.toLocaleString()}`),
          ),
        ),

        // Callout
        React.createElement(View, { style: styles.callout },
          React.createElement(Text, { style: styles.calloutTitle }, "🤖 Your AI keeps getting smarter"),
          React.createElement(Text, { style: styles.calloutText }, `Every conversation trains your AI to respond better, handle more situations, and capture more revenue. Next month's numbers will be higher than this month's — that's the compounding value of the CyberCraft360 subscription.`),
        ),

        // Footer
        React.createElement(View, { style: styles.footer },
          React.createElement(Text, { style: styles.footerText }, "CyberCraft360 · cybercraft360.com · Houston, TX"),
          React.createElement(Text, { style: styles.footerText }, `Generated ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`),
        ),
      ),
    );

    const buffer = await renderToBuffer(doc);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CyberCraft360-ROI-${(clientName || "client").replace(/\s/g, "-")}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[roi-report]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
