import { getAllPosts } from "@/lib/blog";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cybercraft360.com";
  const posts = getAllPosts();

  const staticPages = [
    { url: base, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${base}/blog`, priority: 0.9, changeFrequency: "daily" as const },
    { url: `${base}/book`, priority: 0.8, changeFrequency: "monthly" as const },
    { url: `${base}/intake`, priority: 0.7, changeFrequency: "monthly" as const },
  ];

  const blogPages = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    priority: 0.8,
    changeFrequency: "monthly" as const,
  }));

  return [...staticPages, ...blogPages];
}
