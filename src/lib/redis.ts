import { Redis } from "@upstash/redis";

// Vercel integration adds KV_REST_API_URL + KV_REST_API_TOKEN automatically
export const redis = new Redis({
  url:   process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export interface Booking {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  date: string;
  time: string;
  message: string;
  timezone: string;
  status: string;
  createdAt: string;
  gcal_event_id: string | null;
}

export async function getBookings(): Promise<Booking[]> {
  try {
    const data = await redis.get<Booking[]>("bookings");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  await redis.set("bookings", bookings);
}
