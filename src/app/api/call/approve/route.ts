import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PENDING_FILE = path.join(process.cwd(), "data", "pending-calls.json");

function readPending(): any[] {
  try { return JSON.parse(fs.readFileSync(PENDING_FILE, "utf-8")); }
  catch { return []; }
}

function writePending(items: any[]) {
  fs.mkdirSync(path.dirname(PENDING_FILE), { recursive: true });
  fs.writeFileSync(PENDING_FILE, JSON.stringify(items, null, 2));
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const action = req.nextUrl.searchParams.get("action"); // "approve" | "skip"

  if (!token) return new Response("Missing token", { status: 400 });

  const pending = readPending();
  const idx = pending.findIndex((p: any) => p.token === token);
  if (idx === -1) {
    return new Response(html("Already handled", "This call request has already been actioned or has expired.", "#f59e0b"), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const lead = pending[idx];

  // Remove from pending regardless of action
  pending.splice(idx, 1);
  writePending(pending);

  if (action === "skip") {
    return new Response(html("Skipped — You'll Call Them", `Got it. You'll reach out to ${lead.name} (${lead.phone}) yourself. Good luck!`, "#7c3aed"), {
      headers: { "Content-Type": "text/html" },
    });
  }

  // action === "approve" — fire the Bland call
  const origin = req.nextUrl.origin;
  const callRes = await fetch(`${origin}/api/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: lead.phone,
      name: lead.name,
      company: lead.company,
      challenge: lead.challenge,
    }),
  });

  const callData = await callRes.json();

  if (!callRes.ok) {
    return new Response(html("Call Failed", `Bland returned an error: ${callData.error || "Unknown error"}`, "#ef4444"), {
      headers: { "Content-Type": "text/html" },
    });
  }

  return new Response(html("Aria Is Calling Now", `Bland is dialing ${lead.name} at ${lead.phone} right now. Call ID: ${callData.callId}`, "#22c55e"), {
    headers: { "Content-Type": "text/html" },
  });
}

function html(title: string, message: string, color: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — CyberCraft360</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0c12; font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #0f1117; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; }
    .dot { width: 56px; height: 56px; border-radius: 50%; background: ${color}22; border: 2px solid ${color}44; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 24px; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 12px; }
    p { font-size: 0.9rem; color: rgba(255,255,255,0.45); line-height: 1.6; }
    .badge { display: inline-block; margin-top: 24px; padding: 6px 16px; border-radius: 999px; background: ${color}18; border: 1px solid ${color}33; color: ${color}; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    .brand { margin-top: 36px; font-size: 0.65rem; color: rgba(255,255,255,0.15); letter-spacing: 0.15em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="dot">✓</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="badge">CyberCraft360 · Call Control</div>
    <p class="brand">cybercraft360.com</p>
  </div>
</body>
</html>`;
}
