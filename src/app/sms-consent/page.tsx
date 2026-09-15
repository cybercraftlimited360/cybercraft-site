export const metadata = {
  title: "CyberCraft360 SMS Marketing",
  description: "Learn how CyberCraft360 handles SMS marketing consent and how to opt in or out.",
  alternates: {
    canonical: "https://cybercraft360.com/sms-consent",
  },
};

export default function SmsConsentPage() {
  return (
    <main style={{ background: "#080c14", minHeight: "100vh", color: "#e4e6f0", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(167,139,250,0.7)" }}>CyberCraft360</p>
          <h1 style={{ margin: "0 0 12px", fontSize: 36, fontWeight: 800, color: "#fff" }}>SMS Marketing</h1>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.35)" }}>How CyberCraft360 handles SMS marketing consent</p>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 40 }} />

        {/* Intro */}
        <Section>
          <p>CyberCraft360 offers optional SMS/text marketing communications for individuals who choose to receive them.</p>
          <p>Users voluntarily opt in by checking the separate SMS marketing consent checkbox on our intake form at <a href="https://cybercraft360.com/intake" style={{ color: "#a78bfa" }}>cybercraft360.com/intake</a>. The checkbox is unchecked by default and is not required to submit the form.</p>
        </Section>

        <H2>How Opt-In Works</H2>
        <Section>
          <p>SMS marketing consent is obtained only through the explicit opt-in checkbox on our intake form. The following actions do <strong>not</strong> constitute SMS consent:</p>
          <ul>
            <li>Providing a phone number</li>
            <li>Submitting an inquiry or form</li>
            <li>Receiving a phone call from CyberCraft360</li>
            <li>Speaking with our AI assistant Amy by phone</li>
            <li>Booking an appointment</li>
          </ul>
          <p>Only individuals who have actively checked the SMS marketing consent checkbox will receive SMS marketing messages from CyberCraft360.</p>
        </Section>

        <H2>Consent Language</H2>
        <Section>
          <p>The exact text of the opt-in checkbox on our intake form is:</p>
          <blockquote style={{
            margin: "16px 0",
            padding: "16px 20px",
            borderLeft: "3px solid rgba(167,139,250,0.4)",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0 8px 8px 0",
            fontSize: 14,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.6)",
          }}>
            By checking this box, I agree to receive recurring SMS/text marketing messages from CyberCraft360, including promotions, offers, service information, and marketing updates. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.
          </blockquote>
          <p>The opt-in checkbox is <strong>unchecked by default</strong> and is <strong>not required</strong> to submit the form or use CyberCraft360 services.</p>
        </Section>

        <H2>What Messages You May Receive</H2>
        <Section>
          <p>If you opt in, CyberCraft360 may send the following types of SMS marketing messages:</p>
          <ul>
            <li>Promotions and offers related to CyberCraft360 services</li>
            <li>AI automation service information and business automation updates</li>
            <li>Marketing updates about CyberCraft360 products and services</li>
          </ul>
          <p><strong>Message frequency:</strong> Varies. SMS marketing messages are sent only through intentional marketing campaigns and are not automatically triggered by phone calls, form submissions, or appointments.</p>
          <p><strong>Message and data rates may apply</strong> depending on your mobile carrier and plan.</p>
        </Section>

        <H2>How to Opt Out</H2>
        <Section>
          <p>You may opt out of SMS marketing at any time by:</p>
          <ul>
            <li>Replying <strong>STOP</strong> to any SMS message from CyberCraft360. You will be immediately removed from all SMS marketing.</li>
            <li>Replying <strong>HELP</strong> for assistance.</li>
            <li>Contacting us at <a href="mailto:info@cybercraft360.com" style={{ color: "#a78bfa" }}>info@cybercraft360.com</a>.</li>
          </ul>
          <p><strong>Consent is not a condition of purchase.</strong> You may use CyberCraft360 services without opting into SMS marketing.</p>
        </Section>

        <H2>How We Protect Your Information</H2>
        <Section>
          <p>CyberCraft360 does not sell, rent, share, or provide mobile phone numbers, SMS opt-in information, or messaging consent data to third parties or affiliates for their own marketing or promotional purposes.</p>
          <p>Any use of third-party service providers for SMS delivery does not authorize those providers to use, share, sell, or disclose your mobile phone number or messaging consent data for their own marketing or promotional purposes.</p>
        </Section>

        <H2>Opt In to SMS Marketing</H2>
        <Section>
          <p>To opt in to CyberCraft360 SMS marketing, complete our intake form and check the SMS marketing consent checkbox:</p>
          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <a
              href="/intake"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              Go to Intake Form →
            </a>
          </div>
          <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            On the intake form, scroll to the contact section and look for the optional SMS marketing consent checkbox. The checkbox is unchecked by default.
          </p>
        </Section>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "40px 0" }} />

        <Section>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            For full details on how CyberCraft360 collects, uses, and protects your information, see our{" "}
            <a href="/privacy" style={{ color: "#a78bfa" }}>Privacy Policy</a> and{" "}
            <a href="/terms" style={{ color: "#a78bfa" }}>Terms of Service</a>.
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            Questions? Contact us at <a href="mailto:info@cybercraft360.com" style={{ color: "#a78bfa" }}>info@cybercraft360.com</a>
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
