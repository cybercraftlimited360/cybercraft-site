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
// Full photo, deep bottom gradient, text bottom-left, logo top-right
function Layout1({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const isSquare = W === H;
  const headSize = headline.length > 30 ? (isSquare ? 62 : 52) : headline.length > 20 ? (isSquare ? 72 : 60) : (isSquare ? 82 : 68);
  const bodySize = isSquare ? 18 : 16;

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#060606" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.78 }} />
      )}
      {/* Deep cinematic gradient — covers bottom 70% so long body text is always readable */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.08) 22%, rgba(0,0,0,0.55) 48%, rgba(0,0,0,0.88) 68%, rgba(0,0,0,0.97) 100%)",
      }} />
      {/* Logo top-right */}
      <div style={{ position: "absolute", top: 36, right: 40, display: "flex" }}>
        <LogoMark size={62} />
      </div>
      {/* Content anchored to bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isSquare ? "0 52px 44px" : "0 48px 36px", display: "flex", flexDirection: "column" }}>
        {subline && (
          <span style={{ color: ACCENT, fontSize: "12px", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: "12px" }}>
            {subline}
          </span>
        )}
        <span style={{ color: "#fff", fontSize: headSize, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.025em", whiteSpace: "pre-wrap", marginBottom: "18px" }}>
          {headline}
        </span>
        {body && (
          <span style={{ color: "rgba(255,255,255,0.78)", fontSize: bodySize, lineHeight: 1.6, marginBottom: "28px", maxWidth: isSquare ? "820px" : "960px" }}>
            {body}
          </span>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", letterSpacing: "0.08em" }}>{DOMAIN}</span>
          <CTAButton />
        </div>
      </div>
    </div>
  );
}

// ── Layout 2: Light Editorial Split ──────────────────────────────────────────
// Left: off-white text panel. Right: photo. Body text is the hero of this layout.
function Layout2({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const isSquare = W === H;
  // Give text side more room when there's a long body
  const textW = isSquare ? Math.floor(W * 0.52) : Math.floor(W * 0.50);
  const photoW = W - textW;
  const headSize = headline.length > 30 ? (isSquare ? 42 : 36) : headline.length > 20 ? (isSquare ? 50 : 42) : (isSquare ? 58 : 48);
  const bodySize = isSquare ? 15 : 14;

  return (
    <div style={{ width: W, height: H, display: "flex", background: "#F4F2EE" }}>
      {/* Text panel */}
      <div style={{ width: textW, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: isSquare ? "44px 36px 40px" : "36px 40px 32px", background: "#F4F2EE" }}>
        <LogoMarkDark size={54} />
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1, justifyContent: "center", padding: isSquare ? "28px 0" : "20px 0" }}>
          {subline && (
            <span style={{ color: ACCENT, fontSize: "10px", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              {subline}
            </span>
          )}
          <span style={{ color: DARK, fontSize: headSize, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.025em", whiteSpace: "pre-wrap" }}>
            {headline}
          </span>
          {body && (
            <span style={{ color: "#3a3a3a", fontSize: bodySize, lineHeight: 1.65, marginTop: "6px" }}>
              {body}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <CTAButton dark />
          <span style={{ color: "#b0a898", fontSize: "11px", letterSpacing: "0.05em" }}>{DOMAIN}</span>
        </div>
      </div>
      {/* Photo panel */}
      <div style={{ width: photoW, height: H, display: "flex", position: "relative" }}>
        {photoUrl && (
          <img src={photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: "90px", display: "flex",
          background: "linear-gradient(to right, #F4F2EE, rgba(244,242,238,0))",
        }} />
      </div>
    </div>
  );
}

// ── Layout 3: Top Photo ───────────────────────────────────────────────────────
// Photo fills top 42%, generous white content panel below for long-form body.
function Layout3({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const isSquare = W === H;
  const photoH = Math.floor(H * (isSquare ? 0.40 : 0.44));
  const contentH = H - photoH;
  const headSize = headline.length > 30 ? (isSquare ? 42 : 36) : headline.length > 20 ? (isSquare ? 50 : 42) : (isSquare ? 58 : 48);
  const bodySize = isSquare ? 17 : 15;

  return (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#fff" }}>
      {/* Photo */}
      <div style={{ width: W, height: photoH, display: "flex", position: "relative" }}>
        {photoUrl && (
          <img src={photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }} />
        )}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "90px", display: "flex",
          background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
        }} />
        <div style={{ position: "absolute", top: 24, right: 32, display: "flex" }}>
          <LogoMark size={58} />
        </div>
      </div>
      {/* Content panel */}
      <div style={{ width: W, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: isSquare ? "14px 52px 40px" : "12px 52px 32px", background: "#fff" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {subline && (
            <span style={{ color: ACCENT, fontSize: "11px", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              {subline}
            </span>
          )}
          <span style={{ color: DARK, fontSize: headSize, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.025em", whiteSpace: "pre-wrap" }}>
            {headline}
          </span>
          {body && (
            <span style={{ color: "#444", fontSize: bodySize, lineHeight: 1.65, marginTop: "6px" }}>
              {body}
            </span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#c0bbb4", fontSize: "12px", letterSpacing: "0.05em" }}>{DOMAIN}</span>
          <CTAButton dark />
        </div>
      </div>
    </div>
  );
}

// ── Layout 4: Centered Dark Statement ────────────────────────────────────────
// Full photo, rich dark overlay, centered composition with body as editorial pull-quote.
function Layout4({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const isSquare = W === H;
  const headSize = headline.length > 30 ? (isSquare ? 58 : 48) : headline.length > 20 ? (isSquare ? 68 : 56) : (isSquare ? 78 : 64);
  const bodySize = isSquare ? 17 : 15;

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#040404" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.32 }} />
      )}
      {/* Rich vignette overlay */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex",
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.72) 100%)",
      }} />
      {/* Logo top-right */}
      <div style={{ position: "absolute", top: 34, right: 40, display: "flex" }}>
        <LogoMark size={62} />
      </div>
      {/* Domain bottom-left */}
      <div style={{ position: "absolute", bottom: 36, left: 48, display: "flex" }}>
        <span style={{ color: "rgba(255,255,255,0.28)", fontSize: "12px", letterSpacing: "0.08em" }}>{DOMAIN}</span>
      </div>
      {/* CTA bottom-right */}
      <div style={{ position: "absolute", bottom: 32, right: 40, display: "flex" }}>
        <CTAButton />
      </div>
      {/* Centered editorial block */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 80, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isSquare ? "0 80px" : "0 88px",
      }}>
        <div style={{
          width: "44px", height: "2px", marginBottom: "28px", display: "flex",
          background: `linear-gradient(to right, ${GRAD_START}, ${GRAD_END})`,
        }} />
        {subline && (
          <span style={{ color: ACCENT, fontSize: "11px", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", textAlign: "center", marginBottom: "16px" }}>
            {subline}
          </span>
        )}
        <span style={{ color: "#fff", fontSize: headSize, fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.025em", textAlign: "center", whiteSpace: "pre-wrap" }}>
          {headline}
        </span>
        {body && (
          <span style={{ color: "rgba(255,255,255,0.72)", fontSize: bodySize, lineHeight: 1.65, textAlign: "center", maxWidth: isSquare ? "720px" : "840px", marginTop: "22px" }}>
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

async function fetchPhotoAsDataUri(url: string): Promise<string> {
  if (!url) return "";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return url;
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return `data:${contentType};base64,${b64}`;
  } catch {
    return url;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const headline = searchParams.get("hl") ?? "AUTOMATE\nEVERYTHING.";
  const subline = searchParams.get("sl") ?? "AI Agency · Houston, TX";
  const body = searchParams.get("bd") ?? "";
  const rawPhotoUrl = searchParams.get("photo") ?? "";
  const layout = parseInt(searchParams.get("layout") ?? "1");
  const aspect = searchParams.get("aspect") ?? "square";

  const W = aspect === "landscape" ? 1200 : 1080;
  const H = aspect === "landscape" ? 630 : 1080;

  // Fetch photo as data URI so Satori doesn't need to make external requests
  const photoUrl = rawPhotoUrl ? await fetchPhotoAsDataUri(rawPhotoUrl) : "";

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
