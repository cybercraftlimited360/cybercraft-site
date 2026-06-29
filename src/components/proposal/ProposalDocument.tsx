import {
  Document, Page, Text, View, StyleSheet, Font,
} from "@react-pdf/renderer";

interface ProposalData {
  company: string;
  industry: string;
  challenge: string;
  email: string;
  headline: string;
  executiveSummary: string;
  services: { name: string; why: string; price: string }[];
  roiEstimate: string;
  timeline: string;
  nextStep: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0a0c12",
    padding: 0,
    fontFamily: "Helvetica",
  },
  // Top accent bar
  accentBar: {
    height: 4,
    backgroundColor: "#00d4ff",
  },
  // Main content area
  body: {
    padding: "36 48 48 48",
  },
  // Header section
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  brandLabel: {
    fontSize: 8,
    letterSpacing: 3,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00d4ff",
    letterSpacing: 1,
  },
  proposalTag: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#00d4ff",
    backgroundColor: "rgba(0,212,255,0.1)",
    padding: "5 10",
    borderRadius: 4,
    textTransform: "uppercase",
  },
  // Hero headline
  headline: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    lineHeight: 1.3,
    marginBottom: 8,
  },
  subHeadline: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1,
    marginBottom: 28,
  },
  // Executive summary box
  summaryBox: {
    backgroundColor: "rgba(0,212,255,0.05)",
    borderLeftWidth: 3,
    borderLeftColor: "#00d4ff",
    padding: "14 18",
    marginBottom: 28,
    borderRadius: 2,
  },
  summaryLabel: {
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.6,
  },
  // Section header
  sectionLabel: {
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  // Service cards
  servicesGrid: {
    gap: 8,
    marginBottom: 28,
  },
  serviceCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 6,
    padding: "12 16",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  serviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00d4ff",
    marginTop: 4,
    flexShrink: 0,
  },
  serviceContent: {
    flex: 1,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  servicePrice: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#00d4ff",
  },
  serviceWhy: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.5,
  },
  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    borderRadius: 6,
    padding: "12 14",
  },
  statLabel: {
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.25)",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#7c3aed",
  },
  // CTA box
  ctaBox: {
    backgroundColor: "rgba(0,212,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.2)",
    borderRadius: 8,
    padding: "16 20",
    marginBottom: 24,
  },
  ctaLabel: {
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "rgba(0,212,255,0.6)",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  ctaText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.6,
    marginBottom: 10,
  },
  ctaUrl: {
    fontSize: 9,
    color: "#00d4ff",
    letterSpacing: 0.5,
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 8,
    color: "rgba(255,255,255,0.2)",
  },
  footerRight: {
    fontSize: 8,
    color: "rgba(255,255,255,0.15)",
  },
  // Prepared for strip
  preparedFor: {
    backgroundColor: "rgba(124,58,237,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.15)",
    borderRadius: 6,
    padding: "8 14",
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  preparedLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  preparedValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#a855f7",
  },
});

export function ProposalDocument({ data }: { data: ProposalData }) {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Document title={`CyberCraft360 Proposal — ${data.company}`} author="CyberCraft360">
      <Page size="A4" style={styles.page}>
        {/* Accent bar */}
        <View style={styles.accentBar} />

        <View style={styles.body}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brandLabel}>Prepared by</Text>
              <Text style={styles.brandName}>CyberCraft360</Text>
            </View>
            <Text style={styles.proposalTag}>Bespoke AI Proposal</Text>
          </View>

          {/* Prepared for */}
          <View style={styles.preparedFor}>
            <Text style={styles.preparedLabel}>Prepared for  ·</Text>
            <Text style={styles.preparedValue}>{data.company}</Text>
            <Text style={[styles.preparedLabel, { marginLeft: "auto" }]}>{date}</Text>
          </View>

          {/* Headline */}
          <Text style={styles.headline}>{data.headline}</Text>
          <Text style={styles.subHeadline}>{data.industry.toUpperCase()} · BESPOKE AI STRATEGY</Text>

          {/* Executive Summary */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Executive Summary</Text>
            <Text style={styles.summaryText}>{data.executiveSummary}</Text>
          </View>

          {/* Recommended Services */}
          <Text style={styles.sectionLabel}>Recommended Services</Text>
          <View style={styles.servicesGrid}>
            {data.services.map((s, i) => (
              <View key={i} style={styles.serviceCard}>
                <View style={[styles.serviceDot, { backgroundColor: i === 0 ? "#00d4ff" : i === 1 ? "#7c3aed" : "#e64dff" }]} />
                <View style={styles.serviceContent}>
                  <View style={styles.serviceRow}>
                    <Text style={styles.serviceName}>{s.name}</Text>
                    <Text style={styles.servicePrice}>{s.price}</Text>
                  </View>
                  <Text style={styles.serviceWhy}>{s.why}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Stats */}
          <Text style={styles.sectionLabel}>What to Expect</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ROI Estimate</Text>
              <Text style={styles.statValue}>{data.roiEstimate}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Go-Live Timeline</Text>
              <Text style={[styles.statValue, { color: "#00d4ff" }]}>{data.timeline}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Build Type</Text>
              <Text style={[styles.statValue, { color: "#22c55e" }]}>100% Bespoke</Text>
            </View>
          </View>

          {/* CTA */}
          <View style={styles.ctaBox}>
            <Text style={styles.ctaLabel}>Your Next Step</Text>
            <Text style={styles.ctaText}>{data.nextStep}</Text>
            <Text style={styles.ctaUrl}>calendly.com/cybercraftlimited/30min</Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerLeft}>© 2025 CyberCraft360 · Confidential · For {data.company} only</Text>
            <Text style={styles.footerRight}>cybercraftlimited.com</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
