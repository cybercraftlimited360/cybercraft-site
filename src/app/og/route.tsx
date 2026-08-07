import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "CyberCraft360";
  const tag = searchParams.get("tag") ?? "AI Agency · USA";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0f1117",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%", background: "#a78bfa"
          }} />
          <span style={{ color: "#a78bfa", fontSize: "14px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            CyberCraft360
          </span>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, justifyContent: "center" }}>
          <span style={{
            color: "#a78bfa",
            fontSize: "13px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            {tag}
          </span>
          <div style={{
            color: "#ffffff",
            fontSize: title.length > 50 ? "44px" : "56px",
            fontWeight: 300,
            lineHeight: 1.2,
            maxWidth: "900px",
          }}>
            {title}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#8b8fa8", fontSize: "16px" }}>cybercraft360.com/blog</span>
          <div style={{
            background: "#a78bfa",
            color: "#0f1117",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "10px 24px",
            borderRadius: "100px",
          }}>
            Book a Free Call
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
