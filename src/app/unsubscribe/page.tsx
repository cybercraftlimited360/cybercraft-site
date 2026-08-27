"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnsubscribeContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (!id) { setStatus("error"); return; }
    fetch(`/api/unsubscribe?id=${encodeURIComponent(id)}`, { method: "POST" })
      .then(r => r.json())
      .then(d => setStatus(d.ok ? "done" : "error"))
      .catch(() => setStatus("error"));
  }, [id]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 480, padding: "40px 24px" }}>
        {status === "loading" && (
          <>
            <div style={{ width: 48, height: 48, border: "3px solid #334155", borderTopColor: "#38bdf8", borderRadius: "50%", margin: "0 auto 24px", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "#94a3b8", fontSize: 15 }}>Processing your request…</p>
          </>
        )}
        {status === "done" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 600, margin: "0 0 12px" }}>You've been unsubscribed</h1>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.6 }}>You won't receive any more emails from CyberCraft360. If this was a mistake, you can reply directly to any email you received.</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✗</div>
            <h1 style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 600, margin: "0 0 12px" }}>Link expired or invalid</h1>
            <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.6 }}>This unsubscribe link may have already been used or is invalid. Reply directly to any email you received and we'll remove you immediately.</p>
          </>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
