import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", backgroundColor: "#ffffff", padding: 48, fontSize: 10, color: "#1a1a2e" },
  gradientBar: { height: 4, backgroundColor: "#00d4ff", marginBottom: 28 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  companyBlock: {},
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#0f0f23", marginBottom: 4 },
  companyTagline: { fontSize: 8, color: "#888", letterSpacing: 1 },
  invoiceBlock: { alignItems: "flex-end" },
  invoiceTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#00d4ff", marginBottom: 6 },
  invoiceMeta: { fontSize: 9, color: "#666", marginBottom: 2, textAlign: "right" },
  divider: { height: 1, backgroundColor: "#e8e8f0", marginBottom: 24 },
  billSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  billBlock: { flex: 1 },
  billLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase", color: "#888", marginBottom: 6 },
  billName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f0f23", marginBottom: 3 },
  billDetail: { fontSize: 9, color: "#666", marginBottom: 2 },
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0f0f23", padding: "10 14", borderRadius: 4 },
  tableHeaderText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#ffffff", letterSpacing: 0.5, textTransform: "uppercase" },
  tableRow: { flexDirection: "row", padding: "12 14", borderBottomWidth: 1, borderBottomColor: "#f0f0f8", borderBottomStyle: "solid" },
  tableRowAlt: { flexDirection: "row", padding: "12 14", backgroundColor: "#f8f8ff", borderBottomWidth: 1, borderBottomColor: "#f0f0f8", borderBottomStyle: "solid" },
  col60: { flex: 6 },
  col20: { flex: 2, textAlign: "right" },
  colText: { fontSize: 10, color: "#333" },
  colTextBold: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f0f23" },
  colSub: { fontSize: 8, color: "#888", marginTop: 2 },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8, marginBottom: 28 },
  totalBox: { backgroundColor: "#0f0f23", padding: "14 20", borderRadius: 6, alignItems: "flex-end", minWidth: 200 },
  totalLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  totalAmount: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#00d4ff" },
  paySection: { backgroundColor: "#f0f9ff", borderRadius: 6, padding: "16 20", marginBottom: 24, borderLeftWidth: 3, borderLeftColor: "#00d4ff", borderLeftStyle: "solid" },
  payLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase", color: "#00a8cc", marginBottom: 6 },
  payText: { fontSize: 9, color: "#444", lineHeight: 1.5 },
  disclaimerSection: { marginTop: 8 },
  disclaimerTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase", color: "#888", marginBottom: 8 },
  disclaimerText: { fontSize: 7.5, color: "#999", lineHeight: 1.55, marginBottom: 5 },
  disclaimerBold: { fontFamily: "Helvetica-Bold", color: "#666" },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, borderTopWidth: 1, borderTopColor: "#e8e8f0", borderTopStyle: "solid", paddingTop: 12, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#bbb" },
});

interface InvoicePDFProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  setupFee: number;
  monthlyFee: number;
  notes?: string;
  payLink: string;
}

function InvoiceDocument({
  invoiceNumber, invoiceDate, dueDate, customerName, customerEmail,
  serviceName, setupFee, monthlyFee, notes, payLink,
}: InvoicePDFProps) {
  const total = setupFee + monthlyFee;
  const items = [
    setupFee > 0 && { name: `${serviceName} — One-Time Setup Fee`, desc: "Initial configuration, onboarding & deployment", amount: setupFee },
    monthlyFee > 0 && { name: `${serviceName} — Month 1 Subscription`, desc: "AI system management, monitoring, retraining & support", amount: monthlyFee },
  ].filter(Boolean) as { name: string; desc: string; amount: number }[];

  return (
    <Document title={`Invoice ${invoiceNumber} — CyberCraft360`} author="CyberCraft360">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.gradientBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>CyberCraft360</Text>
            <Text style={styles.companyTagline}>AUTOMATE EVERYTHING. SECURE ANYTHING.</Text>
            <Text style={[styles.billDetail, { marginTop: 8 }]}>cybercraft360.com</Text>
            <Text style={styles.billDetail}>cybercraftlimited@gmail.com</Text>
            <Text style={styles.billDetail}>Houston, TX</Text>
          </View>
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>#{invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>Date: {invoiceDate}</Text>
            <Text style={styles.invoiceMeta}>Due: {dueDate}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill To */}
        <View style={styles.billSection}>
          <View style={styles.billBlock}>
            <Text style={styles.billLabel}>Bill To</Text>
            <Text style={styles.billName}>{customerName}</Text>
            <Text style={styles.billDetail}>{customerEmail}</Text>
          </View>
          <View style={[styles.billBlock, { alignItems: "flex-end" }]}>
            <Text style={styles.billLabel}>Payment Due</Text>
            <Text style={[styles.billName, { color: "#00a8cc" }]}>{dueDate}</Text>
            <Text style={styles.billDetail}>Net 7 Days</Text>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col60]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.col20]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.col20]}>Amount</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <View style={styles.col60}>
                <Text style={styles.colTextBold}>{item.name}</Text>
                <Text style={styles.colSub}>{item.desc}</Text>
              </View>
              <Text style={[styles.colText, styles.col20]}>1</Text>
              <Text style={[styles.colTextBold, styles.col20]}>${item.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total Due Now</Text>
            <Text style={styles.totalAmount}>${total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Pay instructions */}
        <View style={styles.paySection}>
          <Text style={styles.payLabel}>How to Pay</Text>
          <Text style={styles.payText}>
            Visit the payment link in your invoice email or go to:{"\n"}
            {payLink.length > 80 ? payLink.slice(0, 77) + "..." : payLink}
          </Text>
          {notes ? <Text style={[styles.payText, { marginTop: 8, fontStyle: "italic" }]}>Note: {notes}</Text> : null}
        </View>

        {/* Legal Disclaimers */}
        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerTitle}>Terms & Conditions — Please Read Carefully</Text>

          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>1. PAYMENT TERMS. </Text>
            Payment is due within 7 days of the invoice date. Invoices unpaid after 30 days are subject to a 1.5% monthly late fee. CyberCraft360 reserves the right to suspend services on accounts with outstanding balances.
          </Text>

          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>2. NO REFUND POLICY. </Text>
            All services rendered by CyberCraft360 are non-refundable. Once work has commenced — including discovery, design, development, or deployment — no refunds will be issued. By making payment, Client acknowledges and agrees to this policy.
          </Text>

          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>3. CHARGEBACK PROHIBITION. </Text>
            Client agrees not to initiate a chargeback or payment dispute without first contacting CyberCraft360 in writing and allowing 10 business days for resolution. Unauthorized chargebacks constitute breach of contract. CyberCraft360 reserves the right to recover all associated fees, costs, and legal expenses from Client, and to report the matter to relevant credit agencies.
          </Text>

          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>4. SCOPE OF WORK. </Text>
            This invoice covers only the services explicitly itemized above. Any additional features, integrations, or scope changes require a separate written agreement and may be subject to additional fees.
          </Text>

          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>5. NO GUARANTEE OF RESULTS. </Text>
            CyberCraft360 does not guarantee specific business outcomes, revenue increases, or ROI. All performance projections are estimates based on industry averages and are provided for illustrative purposes only.
          </Text>

          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>6. INTELLECTUAL PROPERTY. </Text>
            All deliverables become Client's property upon receipt of full payment. Prior to full payment, all work remains the intellectual property of CyberCraft360. CyberCraft360 retains the right to reference the project in its portfolio unless otherwise agreed in writing.
          </Text>

          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>7. LIMITATION OF LIABILITY. </Text>
            CyberCraft360's total liability to Client shall not exceed the total amount paid under this invoice. CyberCraft360 shall not be liable for indirect, incidental, consequential, or punitive damages of any kind.
          </Text>

          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>8. GOVERNING LAW & DISPUTES. </Text>
            This agreement is governed by the laws of the State of Texas. Any disputes shall be resolved through binding arbitration in Harris County, Texas before any legal action may be filed.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>CyberCraft360 · cybercraft360.com · Houston, TX</Text>
          <Text style={styles.footerText}>Invoice #{invoiceNumber} · Confidential</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePDF(props: InvoicePDFProps): Promise<Buffer> {
  const element = React.createElement(InvoiceDocument, props);
  return renderToBuffer(element) as Promise<Buffer>;
}
