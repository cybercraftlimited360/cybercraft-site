import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const BRAND = "CyberCraft360";
const DOMAIN = "cybercraft360.com";
const ACCENT = "#a78bfa";
const DARK = "#0A0A0A";

function Logo({ dark = false }: { dark?: boolean }) {
  const color = dark ? DARK : "#ffffff";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "9px",
          height: "9px",
          borderRadius: "50%",
          background: ACCENT,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          color,
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        {BRAND}
      </span>
    </div>
  );
}

// Layout 1: Dark Immersive — full photo, heavy bottom gradient, text anchored bottom-left
function Layout1({
  photoUrl, headline, subline, body, W, H,
}: {
  photoUrl: string; headline: string; subline: string; body: string; W: number; H: number;
}) {
  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#000" }}>
      {photoUrl && (
        <img
          src={photoUrl}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
        />
      )}
      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.72) 68%, rgba(0,0,0,0.93) 100%)",
          display: "flex",
        }}
      />
      {/* Logo top-right */}
      <div style={{ position: "absolute", top: 40, right: 40, display: "flex" }}>
        <Logo />
      </div>
      {/* Text bottom-left */}
      <div
        style={{
          position: "absolute", bottom: 52, left: 56, right: 56,
          display: "flex", flexDirection: "column", gap: "0px",
        }}
      >
        {subline && (
          <span style={{ color: ACCENT, fontSize: "15px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "16px" }}>
            {subline}
          </span>
        )}
        <span
          style={{
            color: "#ffffff",
            fontSize: headline.length > 30 ? (W === 1080 ? "78px" : "64px") : (W === 1080 ? "96px" : "72px"),
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-0.02em",
            whiteSpace: "pre-wrap",
            marginBottom: "20px",
          }}
        >
          {headline}
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", letterSpacing: "0.04em" }}>
            {DOMAIN}
          </span>
          {body && (
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", maxWidth: "480px", textAlign: "right", lineHeight: 1.4 }}>
              {body}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Layout 2: Light Editorial Split — text left on near-white, photo right
function Layout2({
  photoUrl, headline, subline, body, W, H,
}: {
  photoUrl: string; headline: string; subline: string; body: string; W: number; H: number;
}) {
  const isSquare = W === H;
  const textW = isSquare ? Math.floor(W * 0.48) : Math.floor(W * 0.45);
  const photoW = W - textW;

  return (
    <div style={{ width: W, height: H, display: "flex", background: "#F5F4F0" }}>
      {/* Text side */}
      <div
        style={{
          width: textW,
          height: H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: isSquare ? "48px 44px" : "40px 48px",
          background: "#F5F4F0",
        }}
      >
        <Logo dark />
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {subline && (
            <span style={{ color: ACCENT, fontSize: "12px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              {subline}
            </span>
          )}
          <span
            style={{
              color: DARK,
              fontSize: headline.length > 35 ? (isSquare ? "52px" : "44px") : (isSquare ? "64px" : "54px"),
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              whiteSpace: "pre-wrap",
            }}
          >
            {headline}
          </span>
          {body && (
            <span style={{ color: "#555555", fontSize: "16px", lineHeight: 1.55, marginTop: "4px" }}>
              {body}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              background: DARK,
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "12px 24px",
              display: "flex",
            }}
          >
            EXPLORE MORE →
          </div>
          <span style={{ color: "#999", fontSize: "13px" }}>{DOMAIN}</span>
        </div>
      </div>
      {/* Photo side */}
      <div style={{ width: photoW, height: H, display: "flex", position: "relative", overflow: "hidden" }}>
        {photoUrl && (
          <img
            src={photoUrl}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
    </div>
  );
}

// Layout 3: Top Photo — photo fills top 52%, white content panel below
function Layout3({
  photoUrl, headline, subline, body, W, H,
}: {
  photoUrl: string; headline: string; subline: string; body: string; W: number; H: number;
}) {
  const photoH = Math.floor(H * 0.52);
  const contentH = H - photoH;

  return (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#fff" }}>
      {/* Photo top */}
      <div style={{ width: W, height: photoH, display: "flex", position: "relative" }}>
        {photoUrl && (
          <img
            src={photoUrl}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        {/* Bottom fade */}
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "120px",
            background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 100%)",
            display: "flex",
          }}
        />
        {/* Logo */}
        <div style={{ position: "absolute", top: 28, right: 36, display: "flex" }}>
          <Logo />
        </div>
      </div>
      {/* Content bottom */}
      <div
        style={{
          width: W, height: contentH,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "20px 56px 44px",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {subline && (
            <span style={{ color: ACCENT, fontSize: "12px", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              {subline}
            </span>
          )}
          <span
            style={{
              color: DARK,
              fontSize: headline.length > 40 ? "44px" : "56px",
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              whiteSpace: "pre-wrap",
            }}
          >
            {headline}
          </span>
          {body && (
            <span style={{ color: "#666", fontSize: "17px", lineHeight: 1.5, marginTop: "4px" }}>
              {body}
            </span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#aaa", fontSize: "14px", letterSpacing: "0.04em" }}>{DOMAIN}</span>
          <div
            style={{
              background: DARK,
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "12px 28px",
              display: "flex",
            }}
          >
            BOOK A FREE CALL →
          </div>
        </div>
      </div>
    </div>
  );
}

// Layout 4: Centered Dark — full photo, dark uniform overlay, all text centered
function Layout4({
  photoUrl, headline, subline, body, W, H,
}: {
  photoUrl: string; headline: string; subline: string; body: string; W: number; H: number;
}) {
  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: "#000" }}>
      {photoUrl && (
        <img
          src={photoUrl}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }}
        />
      )}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
        }}
      />
      {/* Logo */}
      <div style={{ position: "absolute", top: 40, right: 44, display: "flex" }}>
        <Logo />
      </div>
      {/* Domain */}
      <div style={{ position: "absolute", bottom: 40, left: 48, display: "flex" }}>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", letterSpacing: "0.06em" }}>{DOMAIN}</span>
      </div>
      {/* Centered content */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "60px 72px",
        }}
      >
        {/* Accent line */}
        <div style={{ width: "48px", height: "3px", background: ACCENT, marginBottom: "36px", display: "flex" }} />
        {subline && (
          <span
            style={{
              color: ACCENT,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            {subline}
          </span>
        )}
        <span
          style={{
            color: "#ffffff",
            fontSize: headline.length > 35 ? (W === 1080 ? "68px" : "58px") : (W === 1080 ? "88px" : "72px"),
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}
        >
          {headline}
        </span>
        {body && (
          <span
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: "19px",
              lineHeight: 1.55,
              textAlign: "center",
              maxWidth: "680px",
              marginTop: "28px",
            }}
          >
            {body}
          </span>
        )}
      </div>
    </div>
  );
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

  const props = { photoUrl, headline, subline, body, W, H };

  let content: React.ReactElement;

  switch (layout) {
    case 2:
      content = <Layout2 {...props} />;
      break;
    case 3:
      content = <Layout3 {...props} />;
      break;
    case 4:
      content = <Layout4 {...props} />;
      break;
    default:
      content = <Layout1 {...props} />;
  }

  return new ImageResponse(content, { width: W, height: H });
}
