import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cybercraft360.com";
const DOMAIN = "CyberCraft360.com";
const ACCENT = "#8B9CF4";

// ── Font loader ───────────────────────────────────────────────────────────────
async function loadFonts() {
  try {
    const [bold, semibold, regular] = await Promise.all([
      fetch("https://fonts.bunny.net/manrope/files/manrope-latin-800-normal.woff").then(r => r.arrayBuffer()),
      fetch("https://fonts.bunny.net/manrope/files/manrope-latin-600-normal.woff").then(r => r.arrayBuffer()),
      fetch("https://fonts.bunny.net/manrope/files/manrope-latin-400-normal.woff").then(r => r.arrayBuffer()),
    ]);
    return [
      { name: "Manrope", data: bold,     weight: 800 as const },
      { name: "Manrope", data: semibold, weight: 600 as const },
      { name: "Manrope", data: regular,  weight: 400 as const },
    ];
  } catch {
    return [];
  }
}

// ── Text shadow tokens ────────────────────────────────────────────────────────
// Deep layered shadows for maximum readability over any photo
const HS = "0 2px 4px rgba(0,0,0,1), 0 4px 16px rgba(0,0,0,0.98), 0 8px 40px rgba(0,0,0,0.95), 0 0 80px rgba(0,0,0,0.8)";
const BS = "0 1px 3px rgba(0,0,0,1), 0 3px 12px rgba(0,0,0,0.98), 0 6px 24px rgba(0,0,0,0.9)";
const ES = "0 1px 2px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.98), 0 4px 16px rgba(0,0,0,0.9)";

// ── Scrim overlays — directional dark gradients to anchor text legibility ─────
const SCRIM_BOTTOM = "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.78) 70%, rgba(0,0,0,0.92) 100%)";
const SCRIM_LEFT   = "linear-gradient(to right,  rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.0) 100%)";
const SCRIM_TOP    = "linear-gradient(to top,    rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.78) 70%, rgba(0,0,0,0.92) 100%)";
const SCRIM_RIGHT  = "linear-gradient(to left,   rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.0) 100%)";
const SCRIM_CENTER = "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 50%, rgba(0,0,0,0.65) 100%)";

function Logo({ logoSrc, size = 52, right = true }: { logoSrc: string; size?: number; right?: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: right ? "flex-end" : "flex-start", gap: "4px",
    }}>
      {logoSrc && (
        <img src={logoSrc} width={size} height={size} style={{ objectFit: "contain" }} />
      )}
      <span style={{
        color: "rgba(255,255,255,0.85)", fontSize: "9px", fontWeight: 600,
        letterSpacing: "0.2em", textTransform: "uppercase",
        textShadow: "0 1px 4px rgba(0,0,0,0.9)",
      }}>
        CyberCraft360
      </span>
    </div>
  );
}

interface Props {
  photoUrl: string;
  logoSrc: string;
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  W: number;
  H: number;
}

// ── Layout 1: Bottom-left text — full bleed, text anchored lower-left ─────────
function Layout1({ photoUrl, logoSrc, eyebrow, headline, body, cta, W, H }: Props) {
  const isPortrait = H > W;
  const headSize = headline.length > 35 ? (isPortrait ? 52 : 44) : headline.length > 22 ? (isPortrait ? 64 : 54) : (isPortrait ? 76 : 64);

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
      )}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: SCRIM_BOTTOM, display: "flex" }} />
      {/* Logo */}
      <div style={{ position: "absolute", top: 32, right: 36, display: "flex" }}>
        <Logo logoSrc={logoSrc} size={48} />
      </div>
      {/* Text block — lower left */}
      <div style={{
        position: "absolute",
        bottom: isPortrait ? 56 : 48,
        left: isPortrait ? 52 : 60,
        right: isPortrait ? 52 : "38%",
        display: "flex", flexDirection: "column", gap: "0px",
      }}>
        {eyebrow && (
          <span style={{
            color: ACCENT, fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.24em", textTransform: "uppercase",
            marginBottom: "14px", textShadow: ES,
          }}>
            {eyebrow}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: headSize, fontWeight: 800,
          lineHeight: 1.06, letterSpacing: "-0.02em",
          marginBottom: "16px", textShadow: HS,
          whiteSpace: "pre-wrap",
        }}>
          {headline}
        </span>
        {body && (
          <span style={{
            color: "rgba(255,255,255,0.82)", fontSize: isPortrait ? 16 : 15,
            fontWeight: 400, lineHeight: 1.65,
            marginBottom: "22px", textShadow: BS,
          }}>
            {body}
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <span style={{
            color: "#ffffff", fontSize: "12px", fontWeight: 600,
            letterSpacing: "0.14em", textTransform: "uppercase",
            textShadow: ES,
          }}>
            {cta}
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", letterSpacing: "0.06em", textShadow: ES }}>
            {DOMAIN}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Layout 2: Left-aligned center — subject right, text left-center ───────────
function Layout2({ photoUrl, logoSrc, eyebrow, headline, body, cta, W, H }: Props) {
  const isPortrait = H > W;
  const headSize = headline.length > 35 ? (isPortrait ? 50 : 42) : headline.length > 22 ? (isPortrait ? 62 : 52) : (isPortrait ? 74 : 62);

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "right center" }} />
      )}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: SCRIM_LEFT, display: "flex" }} />
      {/* Logo top-right */}
      <div style={{ position: "absolute", top: 32, right: 36, display: "flex" }}>
        <Logo logoSrc={logoSrc} size={48} />
      </div>
      {/* Text — left column, vertically centered */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: isPortrait ? 52 : 60,
        right: isPortrait ? "44%" : "48%",
        transform: "translateY(-50%)",
        display: "flex", flexDirection: "column",
      }}>
        {eyebrow && (
          <span style={{
            color: ACCENT, fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.24em", textTransform: "uppercase",
            marginBottom: "14px", textShadow: ES,
          }}>
            {eyebrow}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: headSize, fontWeight: 800,
          lineHeight: 1.06, letterSpacing: "-0.02em",
          marginBottom: "18px", textShadow: HS,
          whiteSpace: "pre-wrap",
        }}>
          {headline}
        </span>
        {body && (
          <span style={{
            color: "rgba(255,255,255,0.80)", fontSize: isPortrait ? 16 : 14,
            fontWeight: 400, lineHeight: 1.65,
            marginBottom: "24px", textShadow: BS,
          }}>
            {body}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: "12px", fontWeight: 600,
          letterSpacing: "0.14em", textTransform: "uppercase",
          textShadow: ES,
        }}>
          {cta}
        </span>
      </div>
      {/* Domain — bottom left */}
      <div style={{ position: "absolute", bottom: 36, left: isPortrait ? 52 : 60, display: "flex" }}>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", letterSpacing: "0.06em", textShadow: ES }}>
          {DOMAIN}
        </span>
      </div>
    </div>
  );
}

// ── Layout 3: Upper statement — text in clean upper zone, subject below ────────
function Layout3({ photoUrl, logoSrc, eyebrow, headline, body, cta, W, H }: Props) {
  const isPortrait = H > W;
  const headSize = headline.length > 35 ? (isPortrait ? 54 : 44) : headline.length > 22 ? (isPortrait ? 66 : 56) : (isPortrait ? 78 : 66);

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center bottom" }} />
      )}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: SCRIM_TOP, display: "flex" }} />
      {/* Logo — top-left this time for variety */}
      <div style={{ position: "absolute", top: 32, left: 48, display: "flex" }}>
        <Logo logoSrc={logoSrc} size={48} right={false} />
      </div>
      {/* Text — upper area */}
      <div style={{
        position: "absolute",
        top: isPortrait ? 120 : 100,
        left: isPortrait ? 52 : 60,
        right: isPortrait ? 52 : "32%",
        display: "flex", flexDirection: "column",
      }}>
        {eyebrow && (
          <span style={{
            color: ACCENT, fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.24em", textTransform: "uppercase",
            marginBottom: "14px", textShadow: ES,
          }}>
            {eyebrow}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: headSize, fontWeight: 800,
          lineHeight: 1.06, letterSpacing: "-0.02em",
          marginBottom: "18px", textShadow: HS,
          whiteSpace: "pre-wrap",
        }}>
          {headline}
        </span>
        {body && (
          <span style={{
            color: "rgba(255,255,255,0.80)", fontSize: isPortrait ? 16 : 14,
            fontWeight: 400, lineHeight: 1.65,
            marginBottom: "24px", textShadow: BS,
          }}>
            {body}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: "12px", fontWeight: 600,
          letterSpacing: "0.14em", textTransform: "uppercase",
          textShadow: ES,
        }}>
          {cta}
        </span>
      </div>
      {/* Domain — bottom right */}
      <div style={{ position: "absolute", bottom: 36, right: 48, display: "flex" }}>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", letterSpacing: "0.06em", textShadow: ES }}>
          {DOMAIN}
        </span>
      </div>
    </div>
  );
}

// ── Layout 4: Centered editorial — subject framed, text centered ───────────────
function Layout4({ photoUrl, logoSrc, eyebrow, headline, body, cta, W, H }: Props) {
  const isPortrait = H > W;
  const headSize = headline.length > 35 ? (isPortrait ? 52 : 44) : headline.length > 22 ? (isPortrait ? 64 : 54) : (isPortrait ? 76 : 64);

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: SCRIM_CENTER, display: "flex" }} />
      {/* Logo top-right */}
      <div style={{ position: "absolute", top: 32, right: 36, display: "flex" }}>
        <Logo logoSrc={logoSrc} size={48} />
      </div>
      {/* Centered text block */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: isPortrait ? "0 64px" : "0 100px",
      }}>
        {/* Thin accent rule */}
        <div style={{ width: "36px", height: "1px", background: ACCENT, marginBottom: "24px", display: "flex" }} />
        {eyebrow && (
          <span style={{
            color: ACCENT, fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.26em", textTransform: "uppercase",
            textAlign: "center", marginBottom: "16px", textShadow: ES,
          }}>
            {eyebrow}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: headSize, fontWeight: 800,
          lineHeight: 1.06, letterSpacing: "-0.02em",
          textAlign: "center", marginBottom: "20px",
          textShadow: HS, whiteSpace: "pre-wrap",
        }}>
          {headline}
        </span>
        {body && (
          <span style={{
            color: "rgba(255,255,255,0.78)", fontSize: isPortrait ? 16 : 14,
            fontWeight: 400, lineHeight: 1.65,
            textAlign: "center", maxWidth: isPortrait ? "640px" : "760px",
            marginBottom: "24px", textShadow: BS,
          }}>
            {body}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: "12px", fontWeight: 600,
          letterSpacing: "0.14em", textTransform: "uppercase",
          textShadow: ES, textAlign: "center",
        }}>
          {cta}
        </span>
      </div>
      {/* Domain bottom center */}
      <div style={{ position: "absolute", bottom: 36, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <span style={{ color: "rgba(255,255,255,0.30)", fontSize: "11px", letterSpacing: "0.06em", textShadow: ES }}>
          {DOMAIN}
        </span>
      </div>
    </div>
  );
}

// ── Layout 5: Right-aligned — subject left, text right-center ─────────────────
function Layout5({ photoUrl, logoSrc, eyebrow, headline, body, cta, W, H }: Props) {
  const isPortrait = H > W;
  const headSize = headline.length > 35 ? (isPortrait ? 50 : 42) : headline.length > 22 ? (isPortrait ? 62 : 52) : (isPortrait ? 74 : 62);

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "left center" }} />
      )}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: SCRIM_RIGHT, display: "flex" }} />
      {/* Logo top-left */}
      <div style={{ position: "absolute", top: 32, left: 48, display: "flex" }}>
        <Logo logoSrc={logoSrc} size={48} right={false} />
      </div>
      {/* Text — right side, vertically centered */}
      <div style={{
        position: "absolute",
        top: "50%",
        right: isPortrait ? 52 : 60,
        left: isPortrait ? "44%" : "48%",
        transform: "translateY(-50%)",
        display: "flex", flexDirection: "column",
        alignItems: "flex-end",
      }}>
        {eyebrow && (
          <span style={{
            color: ACCENT, fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.24em", textTransform: "uppercase",
            marginBottom: "14px", textShadow: ES, textAlign: "right",
          }}>
            {eyebrow}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: headSize, fontWeight: 800,
          lineHeight: 1.06, letterSpacing: "-0.02em",
          marginBottom: "18px", textShadow: HS,
          textAlign: "right", whiteSpace: "pre-wrap",
        }}>
          {headline}
        </span>
        {body && (
          <span style={{
            color: "rgba(255,255,255,0.80)", fontSize: isPortrait ? 16 : 14,
            fontWeight: 400, lineHeight: 1.65,
            marginBottom: "24px", textShadow: BS, textAlign: "right",
          }}>
            {body}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: "12px", fontWeight: 600,
          letterSpacing: "0.14em", textTransform: "uppercase",
          textShadow: ES, textAlign: "right",
        }}>
          {cta}
        </span>
      </div>
      {/* Domain — bottom right */}
      <div style={{ position: "absolute", bottom: 36, right: isPortrait ? 52 : 60, display: "flex" }}>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", letterSpacing: "0.06em", textShadow: ES }}>
          {DOMAIN}
        </span>
      </div>
    </div>
  );
}

// ── Layout 6: Minimal — headline + CTA only, maximum image ────────────────────
function Layout6({ photoUrl, logoSrc, eyebrow, headline, cta, W, H }: Props) {
  const isPortrait = H > W;
  const headSize = headline.length > 25 ? (isPortrait ? 60 : 50) : headline.length > 15 ? (isPortrait ? 74 : 62) : (isPortrait ? 88 : 74);

  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#0a0a0a", overflow: "hidden" }}>
      {photoUrl && (
        <img src={photoUrl} style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: SCRIM_BOTTOM, display: "flex" }} />
      {/* Logo top-right */}
      <div style={{ position: "absolute", top: 32, right: 36, display: "flex" }}>
        <Logo logoSrc={logoSrc} size={44} />
      </div>
      {/* Minimal text — just eyebrow + headline + cta, lower right */}
      <div style={{
        position: "absolute",
        bottom: isPortrait ? 60 : 52,
        right: isPortrait ? 52 : 60,
        display: "flex", flexDirection: "column",
        alignItems: "flex-end", maxWidth: isPortrait ? "68%" : "56%",
      }}>
        {eyebrow && (
          <span style={{
            color: ACCENT, fontSize: "10px", fontWeight: 600,
            letterSpacing: "0.26em", textTransform: "uppercase",
            marginBottom: "12px", textShadow: ES, textAlign: "right",
          }}>
            {eyebrow}
          </span>
        )}
        <span style={{
          color: "#ffffff", fontSize: headSize, fontWeight: 800,
          lineHeight: 1.06, letterSpacing: "-0.025em",
          marginBottom: "20px", textShadow: HS,
          textAlign: "right", whiteSpace: "pre-wrap",
        }}>
          {headline}
        </span>
        <span style={{
          color: "rgba(255,255,255,0.85)", fontSize: "12px", fontWeight: 600,
          letterSpacing: "0.16em", textTransform: "uppercase",
          textShadow: ES,
        }}>
          {cta}
        </span>
      </div>
      {/* Domain — bottom left */}
      <div style={{ position: "absolute", bottom: 36, left: isPortrait ? 52 : 60, display: "flex" }}>
        <span style={{ color: "rgba(255,255,255,0.30)", fontSize: "11px", letterSpacing: "0.06em", textShadow: ES }}>
          {DOMAIN}
        </span>
      </div>
    </div>
  );
}

// ── Photo fetch ───────────────────────────────────────────────────────────────
function arrayBufferToBase64(buf: ArrayBuffer): string {
  // Chunked to avoid stack overflow with large images (spread limit ~65k args)
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchPhotoAsDataUri(url: string): Promise<string> {
  if (!url) return "";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return url;
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${contentType};base64,${arrayBufferToBase64(buf)}`;
  } catch {
    return url;
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const eyebrow  = searchParams.get("ey") ?? "";
  const headline = searchParams.get("hl") ?? "PRECISION\nRUNS THE BUSINESS.";
  const body     = searchParams.get("bd") ?? "";
  const cta      = searchParams.get("ct") ?? "EXPLORE MORE →";
  const rawPhoto = searchParams.get("photo") ?? "";
  const layout   = parseInt(searchParams.get("layout") ?? "1");
  const aspect   = searchParams.get("aspect") ?? "square";

  // Instagram: 4:5 portrait, Facebook/LinkedIn: 4:5 or 1.91:1 landscape
  const W = aspect === "landscape" ? 1200 : 1080;
  const H = aspect === "landscape" ? 630  : 1350; // 4:5 portrait for square request

  const [photoUrl, logoDataUri, fonts] = await Promise.all([
    rawPhoto ? fetchPhotoAsDataUri(rawPhoto) : Promise.resolve(""),
    fetchPhotoAsDataUri(`${SITE}/logo-icon.png`),
    loadFonts(),
  ]);

  const props: Props = { photoUrl, logoSrc: logoDataUri, eyebrow, headline, body, cta, W, H };

  let content: React.ReactElement;
  switch (layout) {
    case 2: content = <Layout2 {...props} />; break;
    case 3: content = <Layout3 {...props} />; break;
    case 4: content = <Layout4 {...props} />; break;
    case 5: content = <Layout5 {...props} />; break;
    case 6: content = <Layout6 {...props} />; break;
    default: content = <Layout1 {...props} />;
  }

  return new ImageResponse(content, {
    width: W,
    height: H,
    fonts: fonts.length > 0 ? fonts : undefined,
  });
}
