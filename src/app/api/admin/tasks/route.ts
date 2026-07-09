import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export interface Task {
  id: string;
  title: string;
  clientName?: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  done: boolean;
  createdAt: string;
}

function verifyToken(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:${pw}`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await redis.get<Task[]>("tasks:all") ?? [];
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "add") {
    const tasks = await redis.get<Task[]>("tasks:all") ?? [];
    const task: Task = {
      id: `task_${Date.now()}`,
      title: body.title,
      clientName: body.clientName,
      dueDate: body.dueDate,
      priority: body.priority || "medium",
      done: false,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    await redis.set("tasks:all", tasks);
    return NextResponse.json({ ok: true, task });
  }

  if (body.action === "toggle") {
    const tasks = await redis.get<Task[]>("tasks:all") ?? [];
    const idx = tasks.findIndex(t => t.id === body.id);
    if (idx !== -1) { tasks[idx].done = !tasks[idx].done; await redis.set("tasks:all", tasks); }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    const tasks = await redis.get<Task[]>("tasks:all") ?? [];
    await redis.set("tasks:all", tasks.filter(t => t.id !== body.id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

