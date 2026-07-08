import { redis } from "./redis";

export type ActivityEvent = {
  id: string;
  type: "lead" | "booking" | "invoice" | "call" | "cancellation" | "payment";
  title: string;
  detail: string;
  clientName?: string;
  amount?: number;
  createdAt: string;
};

export async function logActivity(event: Omit<ActivityEvent, "id" | "createdAt">) {
  try {
    const feed = await redis.get<ActivityEvent[]>("activity:feed") ?? [];
    feed.unshift({
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    });
    // Keep last 100 events
    await redis.set("activity:feed", feed.slice(0, 100));
  } catch {}
}
