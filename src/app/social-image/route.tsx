import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
const DOMAIN = "cybercraft360.com";
const ACCENT = "#a78bfa";
const DARK = "#080808";
const DARK2 = "#111111";

function LogoMark({ size = 64 }: { size?: number }) {
  const logoUrl = `${SITE}/logo-mark.svg`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
      <img src={logoUrl} width={size} height={Math.round(size * 0.655)} style={{ objectFit: "contain" }} />
      <span style={{ color: "#ffffff", fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", lineHeight: 1 }}>
        CyberCraft360
      </span>
    </div>
  );
}

interface LayoutProps {
  photoUrl: string;
  headline: string;
  subline: string;
  body: string;
  W: number;
  H: number;
}

// ── Layout 1: Photo Top / Dark Text Panel Bottom ──────────────────────────────
// Photo fills top 58%, solid dark panel bottom 42%. Apple-clean split.
function Layout1({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const isSquare = W === H;
  const photoH = Math.round(H * (isSquare ? 0.56 : 0.52));
  const panelH = H - photoH;
  const headSize = headline.length > 28 ? (isSquare ? 56 : 44) : headline.length > 18 ? (isSquare ? 66 : 52) : (isSquare ? 76 : 60);
  const bodySize = isSquare ? 17 : 15;
  const pad = isSquare ? 48 : 52;

  return (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: DARK }}>
      {/* Photo section */}
      <div style={{ width: W, height: photoH, display: "flex", position: "relative", overflow: "hidden", background: "#111" }}>
        {photoUrl && (
          <img src={photoUrl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        )}
        {/* Logo top-right */}
        <div style={{ position: "absolute", top: 28, right: 32, display: "flex" }}>
          <LogoMark size={56} />
        </div>
        {/* Subtle bottom fade into panel */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "80px", display: "flex",
          background: `linear-gradient(to bottom, rgba(8,8,8,0) 0%, rgba(8,8,8,0.9) 100%)`,
        }} />
      </div>
      {/* Dark text panel */}
      <div style={{
        width: W, height: panelH, display: "flex", flexDirection: "column",
        background: DARK, padding: `${isSquare ? 28 : 22}px ${pad}px ${isSquare ? 32 : 26}px`,
      }}>
        {subline && (
          <span style={{ color: ACCENT, fontSize: "11px", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "10px" }}>
            {subline}
          </span>
        )}
        <span style={{ color: "#ffffff", fontSize: headSize, fontWeight: 900, lineHeight: 1.03, letterSpacing: "-0.028em", marginBottom: "12px" }}>
          {headline}
        </span>
        {body && (
          <span style={{ color: "rgba(255,255,255,0.62)", fontSize: bodySize, lineHeight: 1.58, flex: 1 }}>
            {body}
          </span>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
          <span style={{ color: "rgba(255,255,255,0.28)", fontSize: "11px", letterSpacing: "0.08em" }}>{DOMAIN}</span>
          <div style={{
            background: "#ffffff", color: DARK, fontSize: "11px", fontWeight: 800,
            letterSpacing: "0.13em", textTransform: "uppercase", padding: "11px 24px", display: "flex",
          }}>
            BOOK A FREE CALL →
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Layout 2: Full Bleed Dark — photo dimmed, centered white text ─────────────
// Photo fills entire frame at low opacity, all text centered on dark ground.
function Layout2({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const isSquare = W === H;
  const headSize = headline.length > 28 ? (isSquare ? 64 : 50) : headline.length > 18 ? (isSquare ? 76 : 60) : (isSquare ? 88 : 70);
  const bodySize = isSquare ? 18 : 15;

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: DARK }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.22 }} />
      )}
      {/* Logo top-right */}
      <div style={{ position: "absolute", top: 36, right: 40, display: "flex" }}>
        <LogoMark size={60} />
      </div>
      {/* Domain bottom-left */}
      <div style={{ position: "absolute", bottom: 36, left: 48, display: "flex" }}>
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11px", letterSpacing: "0.08em" }}>{DOMAIN}</span>
      </div>
      {/* CTA bottom-right */}
      <div style={{ position: "absolute", bottom: 32, right: 40, display: "flex" }}>
        <div style={{
          background: "#ffffff", color: DARK, fontSize: "11px", fontWeight: 800,
          letterSpacing: "0.13em", textTransform: "uppercase", padding: "11px 24px", display: "flex",
        }}>
          BOOK A FREE CALL →
        </div>
      </div>
      {/* Centered content */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: isSquare ? "0 72px" : "0 96px",
      }}>
        {/* Accent rule */}
        <div style={{ width: "40px", height: "1px", background: ACCENT, marginBottom: "28px", display: "flex" }} />
        {subline && (
          <span style={{ color: ACCENT, fontSize: "11px", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", textAlign: "center", marginBottom: "20px" }}>
            {subline}
          </span>
        )}
        <span style={{ color: "#ffffff", fontSize: headSize, fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.03em", textAlign: "center" }}>
          {headline}
        </span>
        {body && (
          <span style={{ color: "rgba(255,255,255,0.60)", fontSize: bodySize, lineHeight: 1.65, textAlign: "center", maxWidth: isSquare ? "680px" : "820px", marginTop: "22px" }}>
            {body}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Layout 3: Dark Left / Photo Right split ───────────────────────────────────
// Left 46% solid dark with text. Right 54% full-bleed photo.
function Layout3({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const isSquare = W === H;
  const splitW = Math.round(W * (isSquare ? 0.47 : 0.44));
  const headSize = headline.length > 28 ? (isSquare ? 52 : 42) : headline.length > 18 ? (isSquare ? 62 : 50) : (isSquare ? 72 : 58);
  const bodySize = isSquare ? 16 : 14;

  return (
    <div style={{ width: W, height: H, display: "flex", background: DARK }}>
      {/* Left dark text panel */}
      <div style={{
        width: splitW, height: H, display: "flex", flexDirection: "column",
        background: DARK2, padding: isSquare ? "44px 44px 40px" : "36px 40px 34px",
      }}>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "1px", background: ACCENT, marginBottom: "24px", display: "flex" }} />
          {subline && (
            <span style={{ color: ACCENT, fontSize: "10px", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "16px" }}>
              {subline}
            </span>
          )}
          <span style={{ color: "#ffffff", fontSize: headSize, fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.025em" }}>
            {headline}
          </span>
          {body && (
            <span style={{ color: "rgba(255,255,255,0.58)", fontSize: bodySize, lineHeight: 1.6, marginTop: "18px" }}>
              {body}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{
            background: "#ffffff", color: DARK, fontSize: "10px", fontWeight: 800,
            letterSpacing: "0.13em", textTransform: "uppercase", padding: "11px 20px",
            display: "flex", alignSelf: "flex-start",
          }}>
            BOOK A FREE CALL →
          </div>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", letterSpacing: "0.07em" }}>{DOMAIN}</span>
        </div>
      </div>
      {/* Right photo panel */}
      <div style={{ flex: 1, height: H, display: "flex", position: "relative", overflow: "hidden" }}>
        {photoUrl && (
          <img src={photoUrl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", top: 28, right: 28, display: "flex" }}>
          <LogoMark size={52} />
        </div>
      </div>
    </div>
  );
}

// ── Layout 4: Photo Left / Dark Right split ───────────────────────────────────
// Left 52% photo, right 48% solid dark text panel.
function Layout4({ photoUrl, headline, subline, body, W, H }: LayoutProps) {
  const isSquare = W === H;
  const photoW = Math.round(W * (isSquare ? 0.52 : 0.50));
  const headSize = headline.length > 28 ? (isSquare ? 52 : 42) : headline.length > 18 ? (isSquare ? 62 : 50) : (isSquare ? 72 : 58);
  const bodySize = isSquare ? 16 : 14;

  return (
    <div style={{ width: W, height: H, display: "flex", background: DARK }}>
      {/* Left photo panel */}
      <div style={{ width: photoW, height: H, display: "flex", position: "relative", overflow: "hidden" }}>
        {photoUrl && (
          <img src={photoUrl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
      {/* Right dark text panel */}
      <div style={{
        flex: 1, height: H, display: "flex", flexDirection: "column",
        background: DARK2, padding: isSquare ? "44px 44px 40px" : "36px 44px 34px",
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <LogoMark size={52} />
        </div>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "1px", background: ACCENT, marginBottom: "24px", display: "flex" }} />
          {subline && (
            <span style={{ color: ACCENT, fontSize: "10px", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "16px" }}>
              {subline}
            </span>
          )}
          <span style={{ color: "#ffffff", fontSize: headSize, fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.025em" }}>
            {headline}
          </span>
          {body && (
            <span style={{ color: "rgba(255,255,255,0.58)", fontSize: bodySize, lineHeight: 1.6, marginTop: "18px" }}>
              {body}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{
            background: "#ffffff", color: DARK, fontSize: "10px", fontWeight: 800,
            letterSpacing: "0.13em", textTransform: "uppercase", padding: "11px 20px",
            display: "flex", alignSelf: "flex-start",
          }}>
            BOOK A FREE CALL →
          </div>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", letterSpacing: "0.07em" }}>{DOMAIN}</span>
        </div>
      </div>
    </div>
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

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
  const subline = searchParams.get("sl") ?? "AI Engineering · USA";
  const body = searchParams.get("bd") ?? "";
  const rawPhotoUrl = searchParams.get("photo") ?? "";
  const layout = parseInt(searchParams.get("layout") ?? "1");
  const aspect = searchParams.get("aspect") ?? "square";

  const W = aspect === "landscape" ? 1200 : 1080;
  const H = aspect === "landscape" ? 630 : 1080;

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
