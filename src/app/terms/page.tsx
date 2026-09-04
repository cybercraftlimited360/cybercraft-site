export const metadata = {
  title: "Terms of Service | CyberCraft360",
  description: "Terms of Service for CyberCraft360 AI automation services.",
};

export default function TermsPage() {
  return (
    <main style={{ background: "#080c14", minHeight: "100vh", color: "#e4e6f0", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(167,139,250,0.7)" }}>CyberCraft360</p>
          <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 800, color: "#fff" }}>Terms of Service</h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Effective date: September 1, 2026 &nbsp;·&nbsp; Last updated: September 4, 2026</p>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 40 }} />

        <Section>
          <p>These Terms of Service ("Terms") govern your use of CyberCraft360's website at <strong>cybercraft360.com</strong> and any services provided by CyberCraft360 ("we," "us," or "our"), including AI automation systems, outreach services, and communications via phone, email, or SMS. By engaging with our services, you agree to these Terms.</p>
        </Section>

        <H2>1. Services</H2>
        <Section>
          <p>CyberCraft360 provides custom AI automation services to US-based service businesses, including but not limited to:</p>
          <ul>
            <li>AI-powered call handling and lead qualification via our assistant Amy</li>
            <li>Automated outreach via email and SMS to prospective clients</li>
            <li>Lead generation, follow-up automation, and CRM workflows</li>
            <li>AI content generation including emails, social posts, and proposals</li>
            <li>Strategy consulting and implementation of AI systems for client businesses</li>
          </ul>
          <p>Services are provided under a monthly subscription or project-based agreement as outlined in a separate service agreement or proposal.</p>
        </Section>

        <H2>2. SMS Communications</H2>
        <Section>
          <p>By providing your phone number via our intake form or engaging in a phone call with CyberCraft360 or our AI assistant Amy, you consent to receive automated SMS messages from CyberCraft360. These messages may include:</p>
          <ul>
            <li>Follow-up messages after a phone interaction</li>
            <li>Business insights and service information</li>
            <li>Booking confirmations and appointment reminders</li>
          </ul>
          <p><strong>Message frequency:</strong> 1–3 messages per contact event. We do not send bulk promotional blasts.</p>
          <p><strong>Message and data rates may apply.</strong></p>
          <p><strong>To opt out:</strong> Reply <strong>STOP</strong> to any SMS at any time. To get help, reply <strong>HELP</strong> or email <a href="mailto:info@cybercraft360.com" style={{ color: "#a78bfa" }}>info@cybercraft360.com</a>.</p>
          <p>We do not share your mobile number with third parties for their marketing purposes.</p>
        </Section>

        <H2>3. Use of the Website</H2>
        <Section>
          <p>You agree not to:</p>
          <ul>
            <li>Use our website or services for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Scrape, copy, or reproduce our website content without written permission</li>
            <li>Impersonate CyberCraft360 or its representatives</li>
            <li>Interfere with the operation of our website or AI systems</li>
          </ul>
        </Section>

        <H2>4. Intellectual Property</H2>
        <Section>
          <p>All content on cybercraft360.com — including text, design, logos, AI system architecture, prompts, and workflows — is the property of CyberCraft360 and protected by applicable intellectual property laws. Custom AI systems built for client businesses remain the property of CyberCraft360 until full payment is received, at which point ownership transfers as specified in the client agreement.</p>
        </Section>

        <H2>5. Payment and Subscriptions</H2>
        <Section>
          <p>Service fees are outlined in individual client proposals or service agreements. Monthly subscriptions are billed in advance. Failure to pay within 14 days of the due date may result in service suspension. Refunds are not provided for partial months of service. All fees are in USD.</p>
        </Section>

        <H2>6. Confidentiality</H2>
        <Section>
          <p>Both parties agree to keep confidential any proprietary business information, system details, or client data shared during the engagement. CyberCraft360 will not disclose client business information to third parties without explicit consent, except as required by law.</p>
        </Section>

        <H2>7. Limitation of Liability</H2>
        <Section>
          <p>CyberCraft360's services are provided "as is." We make no guarantees regarding specific business outcomes, revenue increases, or lead conversion rates. Our total liability for any claim arising from use of our services shall not exceed the total fees paid by you in the three months preceding the claim. We are not liable for indirect, incidental, or consequential damages.</p>
        </Section>

        <H2>8. Indemnification</H2>
        <Section>
          <p>You agree to indemnify and hold CyberCraft360 harmless from any claims, losses, or damages arising from your misuse of our services, your violation of these Terms, or your violation of any applicable law or third-party right.</p>
        </Section>

        <H2>9. Termination</H2>
        <Section>
          <p>Either party may terminate a service engagement with 30 days written notice. CyberCraft360 reserves the right to terminate services immediately if a client violates these Terms, engages in fraudulent activity, or fails to make payment. Upon termination, all outstanding fees remain due.</p>
        </Section>

        <H2>10. Governing Law</H2>
        <Section>
          <p>These Terms are governed by the laws of the State of Texas, United States. Any disputes shall be resolved in the courts of Fort Bend County, Texas, or through binding arbitration as mutually agreed.</p>
        </Section>

        <H2>11. Changes to These Terms</H2>
        <Section>
          <p>We may update these Terms periodically. The updated version will be posted at cybercraft360.com/terms with a revised effective date. Continued use of our services after changes constitutes acceptance of the updated Terms.</p>
        </Section>

        <H2>12. Contact</H2>
        <Section>
          <p>
            CyberCraft360<br />
            4902 Russett Lane, Sugar Land, TX<br />
            Email: <a href="mailto:info@cybercraft360.com" style={{ color: "#a78bfa" }}>info@cybercraft360.com</a><br />
            Website: <a href="https://cybercraft360.com" style={{ color: "#a78bfa" }}>cybercraft360.com</a>
          </p>
        </Section>

      </div>
    </main>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: "40px 0 16px", fontSize: 20, fontWeight: 700, color: "#fff", borderLeft: "3px solid #a78bfa", paddingLeft: 14 }}>{children}</h2>;
}

function Section({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>{children}</div>;
}
