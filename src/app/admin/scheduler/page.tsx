"use client";

import { useState, useEffect, useCallback } from "react";

const SECRET = process.env.NEXT_PUBLIC_CRON_SECRET ?? "";

interface ScheduledPost {
  id: string;
  content: string;
  imageUrl?: string;
  platforms: string[];
  scheduledAt: number;
  status: "pending" | "published" | "failed";
  error?: string;
}

const PLATFORMS = [
  { id: "facebook", label: "Facebook", icon: "f" },
  { id: "linkedin", label: "LinkedIn", icon: "in" },
  { id: "instagram", label: "Instagram", icon: "ig" },
];

function platformColor(p: string) {
  if (p === "facebook") return "#1877f2";
  if (p === "linkedin") return "#0a66c2";
  if (p === "instagram") return "#e1306c";
  return "#a78bfa";
}

export default function SchedulerPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["facebook", "linkedin"]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPosts = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/scheduler/list", {
        headers: { Authorization: `Bearer ${s}` },
      });
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/scheduler/list", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (res.ok) {
      setAuthed(true);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } else {
      showToast("Wrong password", false);
    }
  };

  useEffect(() => {
    if (authed) {
      const interval = setInterval(() => fetchPosts(secret), 30000);
      return () => clearInterval(interval);
    }
  }, [authed, secret, fetchPosts]);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !scheduledAt || !platforms.length) return;
    if (platforms.includes("instagram") && !imageUrl.trim()) {
      showToast("Instagram requires an image URL", false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/scheduler/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined,
          platforms,
          scheduledAt: new Date(scheduledAt).getTime(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Post scheduled!", true);
        setContent("");
        setImageUrl("");
        setScheduledAt("");
        await fetchPosts(secret);
      } else {
        showToast(data.error ?? "Failed", false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/scheduler/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast("Post removed", true);
      await fetchPosts(secret);
    }
  };

  const charCount = content.length;
  const charLimit = platforms.includes("twitter") ? 280 : 3000;

  if (!authed) {
    return (
      <main className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#a78bfa]" />
              <span className="text-[#a78bfa] text-xs uppercase tracking-[0.2em]">CyberCraft360</span>
            </div>
            <h1 className="text-2xl font-light text-white">Post Scheduler</h1>
          </div>
          <input
            type="password"
            placeholder="Enter access key"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8b8fa8] text-sm focus:outline-none focus:border-[#a78bfa]/50"
          />
          <button
            type="submit"
            className="w-full bg-[#a78bfa] text-[#0f1117] font-semibold py-3 rounded-xl text-sm hover:bg-white transition-colors"
          >
            Access Scheduler
          </button>
        </form>
      </main>
    );
  }

  const pending = posts.filter((p) => p.status === "pending");
  const published = posts.filter((p) => p.status !== "pending");

  return (
    <main className="min-h-screen bg-[#0f1117] text-[#e4e6f0]">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${toast.ok ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
          {toast.msg}
        </div>
      )}

      <nav className="sticky top-0 z-40 border-b border-white/5 px-6 py-4" style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(15,17,23,0.92)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#a78bfa]" />
            <span className="text-[#a78bfa] text-xs uppercase tracking-[0.2em] font-medium">CyberCraft360</span>
            <span className="text-white/20">/</span>
            <span className="text-sm text-[#8b8fa8]">Post Scheduler</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-[#8b8fa8]">Publishes hourly</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Compose form */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <h2 className="text-xs uppercase tracking-[0.15em] text-[#a78bfa] font-medium mb-5">Schedule a Post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Platforms */}
              <div>
                <label className="text-xs text-[#8b8fa8] mb-2 block">Platforms</label>
                <div className="flex gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlatform(p.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                      style={{
                        borderColor: platforms.includes(p.id) ? platformColor(p.id) : "rgba(255,255,255,0.08)",
                        background: platforms.includes(p.id) ? `${platformColor(p.id)}18` : "transparent",
                        color: platforms.includes(p.id) ? platformColor(p.id) : "#8b8fa8",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-xs text-[#8b8fa8] mb-2 block">Post content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={7}
                  placeholder="Write your post here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8b8fa8] text-sm focus:outline-none focus:border-[#a78bfa]/50 resize-none"
                />
                <div className="text-right text-xs text-[#8b8fa8] mt-1">{charCount} chars</div>
              </div>

              {/* Image URL — always show when Instagram selected */}
              {platforms.includes("instagram") && (
                <div>
                  <label className="text-xs text-[#8b8fa8] mb-2 block">Image URL <span className="text-[#e1306c]">*</span> <span className="text-[#8b8fa8]">(required for Instagram)</span></label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8b8fa8] text-sm focus:outline-none focus:border-[#a78bfa]/50"
                  />
                </div>
              )}

              {/* Schedule time */}
              <div>
                <label className="text-xs text-[#8b8fa8] mb-2 block">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a78bfa]/50"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !content.trim() || !scheduledAt || !platforms.length}
                className="w-full bg-[#a78bfa] text-[#0f1117] font-semibold py-3 rounded-xl text-sm hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Scheduling..." : "Schedule Post"}
              </button>
            </form>
          </div>
        </div>

        {/* Queue */}
        <div className="lg:col-span-3 space-y-8">
          {/* Pending */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-[0.15em] text-[#a78bfa] font-medium">
                Upcoming <span className="text-[#8b8fa8]">({pending.length})</span>
              </h2>
              <button
                onClick={() => fetchPosts(secret)}
                className="text-xs text-[#8b8fa8] hover:text-white transition-colors"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {pending.length === 0 && (
              <div className="border border-white/5 rounded-2xl p-8 text-center text-[#8b8fa8] text-sm">
                No posts scheduled yet
              </div>
            )}

            <div className="space-y-3">
              {pending.sort((a, b) => a.scheduledAt - b.scheduledAt).map((post) => (
                <PostCard key={post.id} post={post} onDelete={handleDelete} />
              ))}
            </div>
          </div>

          {/* Published */}
          {published.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-[0.15em] text-[#8b8fa8] font-medium mb-4">
                Recently Published <span className="text-[#8b8fa8]/50">({published.length})</span>
              </h2>
              <div className="space-y-3">
                {published.slice(0, 5).map((post) => (
                  <PostCard key={post.id} post={post} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function PostCard({ post, onDelete }: { post: ScheduledPost; onDelete: (id: string) => void }) {
  const date = new Date(post.scheduledAt);
  const isPending = post.status === "pending";
  const isFailed = post.status === "failed";

  return (
    <div className={`border rounded-2xl p-4 transition-all ${isFailed ? "border-red-500/20 bg-red-500/5" : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {post.platforms.map((p) => (
            <span
              key={p}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ color: platformColor(p), background: `${platformColor(p)}15` }}
            >
              {p}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isPending ? "bg-amber-500/15 text-amber-400" : isFailed ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
            {post.status}
          </span>
          {isPending && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-[#8b8fa8] hover:text-red-400 transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-[#e4e6f0] leading-relaxed mb-3 line-clamp-3">{post.content}</p>

      {post.imageUrl && (
        <p className="text-xs text-[#8b8fa8] mb-3 truncate">📎 {post.imageUrl}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8b8fa8]">
          {isPending ? "Publishes" : "Published"}{" "}
          <span className="text-[#e4e6f0]">
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at{" "}
            {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </span>
        {isFailed && post.error && (
          <span className="text-xs text-red-400 truncate max-w-[200px]">{post.error}</span>
        )}
      </div>
    </div>
  );
}
