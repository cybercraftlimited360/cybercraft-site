import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
const DOMAIN = "cybercraft360.com";
const ACCENT = "#a78bfa";
const GRAD_START = "#00D5FF";
const GRAD_END = "#E64DFF";
const DARK = "#0A0A0A";

// Logo mark component — uses the SVG file served from /logo-mark.svg
function LogoMark({ size = 72 }: { size?: number }) {
  const logoUrl = `${SITE}/logo-mark.svg`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
      <img
        src={logoUrl}
        width={size}
        height={Math.round(size * 0.655)} // viewBox ratio: 1020/670 ≈ 1.52 → height = size/1.52
        style={{ objectFit: "contain" }}
      />
      <span style={{
        color: "#ffffff",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        lineHeight: 1,
        textShadow: "0 1px 4px rgba(0,0,0,0.5)",
      }}>
        CyberCraft360
      </span>
    </div>
  );
}

function LogoMarkDark({ size = 72 }: { size?: number }) {
  const logoUrl = `${SITE}/logo-mark.svg`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
      <img
        src={logoUrl}
        width={size}
        height={Math.round(size * 0.655)}
        style={{ objectFit: "contain" }}
      />
      <span style={{
        color: DARK,
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        lineHeight: 1,
      }}>
        CyberCraft360
      </span>
    </div>
  );
}

function CTAButton({ dark = false }: { dark?: boolean }) {
  return (
    <div style={{
      background: dark ? DARK : "#ffffff",
      color: dark ? "#ffffff" : DARK,
      fontSize: "12px",
      fontWeight: 800,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      padding: "13px 28px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    }}>
      BOOK A FREE CALL →
    </div>
  );
}

// ── Layout 1: Dark Immersive ──────────────────────────────────────────────────
// Full photo, heavy bottom gradient, text bottom-left, logo top-right
function Layout1({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const large = W === 1080;
  const headSize = headline.length > 28 ? (large ? 80 : 66) : (large ? 100 : 80);

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#000" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.82 }} />
      )}
      {/* Cinematic gradient */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.68) 62%, rgba(0,0,0,0.92) 100%)",
      }} />
      {/* Logo top-right */}
      <div style={{ position: "absolute", top: 36, right: 40, display: "flex" }}>
        <LogoMark size={68} />
      </div>
      {/* Content bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: large ? "0 56px 48px" : "0 44px 40px", display: "flex", flexDirection: "column", gap: "0" }}>
        {subline && (
          <span style={{ color: ACCENT, fontSize: "13px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "14px" }}>
            {subline}
          </span>
        )}
        <span style={{ color: "#fff", fontSize: headSize, fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.02em", whiteSpace: "pre-wrap", marginBottom: "20px" }}>
          {headline}
        </span>
        {body && (
          <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "17px", lineHeight: 1.45, marginBottom: "24px", maxWidth: "680px" }}>
            {body}
          </span>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", letterSpacing: "0.06em" }}>{DOMAIN}</span>
          <CTAButton />
        </div>
      </div>
    </div>
  );
}

// ── Layout 2: Light Editorial Split ──────────────────────────────────────────
// Left: off-white with large dark text. Right: photo. Logo on photo side.
function Layout2({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const isSquare = W === H;
  const textW = isSquare ? Math.floor(W * 0.47) : Math.floor(W * 0.44);
  const photoW = W - textW;
  const headSize = headline.length > 35 ? (isSquare ? 50 : 42) : (isSquare ? 62 : 52);

  return (
    <div style={{ width: W, height: H, display: "flex", background: "#F5F3EF" }}>
      {/* Text side */}
      <div style={{ width: textW, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: isSquare ? "48px 40px" : "40px 44px", background: "#F5F3EF" }}>
        <LogoMarkDark size={60} />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {subline && (
            <span style={{ color: ACCENT, fontSize: "11px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              {subline}
            </span>
          )}
          <span style={{ color: DARK, fontSize: headSize, fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.025em", whiteSpace: "pre-wrap" }}>
            {headline}
          </span>
          {body && (
            <span style={{ color: "#555", fontSize: "15px", lineHeight: 1.55, marginTop: "4px" }}>
              {body}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <CTAButton dark />
          <span style={{ color: "#aaa", fontSize: "12px", letterSpacing: "0.04em" }}>{DOMAIN}</span>
        </div>
      </div>
      {/* Photo side */}
      <div style={{ width: photoW, height: H, display: "flex", position: "relative" }}>
        {photoUrl && (
          <img src={photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {/* Subtle left edge fade */}
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: "80px", display: "flex",
          background: "linear-gradient(to right, #F5F3EF, rgba(245,243,239,0))",
        }} />
      </div>
    </div>
  );
}

// ── Layout 3: Top Photo ───────────────────────────────────────────────────────
// Photo fills top 52%, white content panel below.
function Layout3({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const photoH = Math.floor(H * 0.52);
  const contentH = H - photoH;
  const headSize = headline.length > 38 ? 44 : 56;

  return (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#fff" }}>
      {/* Photo */}
      <div style={{ width: W, height: photoH, display: "flex", position: "relative" }}>
        {photoUrl && (
          <img src={photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "110px", display: "flex",
          background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
        }} />
        <div style={{ position: "absolute", top: 28, right: 36, display: "flex" }}>
          <LogoMark size={64} />
        </div>
      </div>
      {/* Content */}
      <div style={{ width: W, height: contentH, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "18px 56px 44px", background: "#fff" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {subline && (
            <span style={{ color: ACCENT, fontSize: "12px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              {subline}
            </span>
          )}
          <span style={{ color: DARK, fontSize: headSize, fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.025em", whiteSpace: "pre-wrap" }}>
            {headline}
          </span>
          {body && (
            <span style={{ color: "#666", fontSize: "17px", lineHeight: 1.5, marginTop: "4px" }}>
              {body}
            </span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#bbb", fontSize: "13px", letterSpacing: "0.04em" }}>{DOMAIN}</span>
          <CTAButton dark />
        </div>
      </div>
    </div>
  );
}

// ── Layout 4: Centered Dark Statement ────────────────────────────────────────
// Full photo, dark uniform overlay, all text centered, accent line above.
function Layout4({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const large = W === H;
  const headSize = headline.length > 32 ? (large ? 70 : 58) : (large ? 90 : 72);

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#000" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.38 }} />
      )}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex",
        background: "rgba(0,0,0,0.48)",
      }} />
      {/* Logo top-right */}
      <div style={{ position: "absolute", top: 36, right: 40, display: "flex" }}>
        <LogoMark size={68} />
      </div>
      {/* Domain bottom-left */}
      <div style={{ position: "absolute", bottom: 40, left: 48, display: "flex" }}>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", letterSpacing: "0.06em" }}>{DOMAIN}</span>
      </div>
      {/* CTA bottom-right */}
      <div style={{ position: "absolute", bottom: 36, right: 40, display: "flex" }}>
        <CTAButton />
      </div>
      {/* Centered content */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 72px",
      }}>
        {/* Gradient accent line */}
        <div style={{
          width: "52px", height: "3px", marginBottom: "32px", display: "flex",
          background: `linear-gradient(to right, ${GRAD_START}, ${GRAD_END})`,
        }} />
        {subline && (
          <span style={{ color: ACCENT, fontSize: "13px", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", textAlign: "center", marginBottom: "18px" }}>
            {subline}
          </span>
        )}
        <span style={{ color: "#fff", fontSize: headSize, fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.025em", textAlign: "center", whiteSpace: "pre-wrap" }}>
          {headline}
        </span>
        {body && (
          <span style={{ color: "rgba(255,255,255,0.68)", fontSize: "19px", lineHeight: 1.55, textAlign: "center", maxWidth: "660px", marginTop: "26px" }}>
            {body}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────
interface LayoutProps {
  photoUrl: string;
  headline: string;
  subline: string;
  body: string;
  W: number;
  H: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const headline = searchParams.get("hl") ?? "AUTOMATE\nEVERYTHING.";
  const subline = searchParams.get("sl") ?? "AI Agency · Houston, TX";
  const body = searchParams.get("bd") ?? "";
  const photoUrl = searchParams.get("photo") ?? "";
  const layout = parseInt(searchParams.get("layout") ?? "1");
  const aspect = searchParams.get("aspect") ?? "square";

  const W = aspect === "landscape" ? 1200 : 1080;
  const H = aspect === "landscape" ? 630 : 1080;

  const props: LayoutProps = { photoUrl, headline, subline, body, W, H };

  let content: React.ReactElement;
  switch (layout) {
    case 2: content = <Layout2 {...props} />; break;
    case 3: content = <Layout3 {...props} />; break;
    case 4: content = <Layout4 {...props} />; break;
    default: content = <Layout1 {...props} />;
  }

  return new ImageResponse(content, { width: W, height: H });
}
