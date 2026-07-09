import { NextRequest, NextResponse } from "next/server";
import { redis, getBookings } from "@/lib/redis";
import { Invoice } from "@/app/api/invoice/route";
import { PipelineLead } from "@/app/api/admin/pipeline/route";
import { Task } from "@/app/api/admin/tasks/route";
import { ActivityEvent } from "@/lib/activity";

function verifyToken(req: NextRequest) {
  const token = req.headers.get("x-admin-token");
  const pw = process.env.ADMIN_SECRET;
  if (!pw || !token) return false;
  return token === Buffer.from(`cc360:${pw}:${pw}`).toString("base64");
}

export async function GET(req: NextRequest) {
  if (!verifyToken(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7);
    const todayStr = now.toISOString().slice(0, 10);

    const [bookings, leadsRaw, invoicesRaw, pipelineRaw, tasksRaw, activityRaw, chatStats, laurenStats, dailyKeys, irisConvsRaw, laurenConvsRaw, offboardedRaw] =
      await Promise.all([
        getBookings(),
        redis.get<any[]>("leads:all"),
        redis.get<Invoice[]>("invoices:all"),
        redis.get<PipelineLead[]>("pipeline:leads"),
        redis.get<Task[]>("tasks:all"),
        redis.get<ActivityEvent[]>("activity:feed"),
        redis.hgetall("chat:stats"),
        redis.hgetall("lauren:stats"),
        redis.keys("chat:daily:*"),
        redis.get<any[]>("iris:conversations"),
        redis.get<any[]>("lauren:transcripts"),
        redis.get<any[]>("clients:offboarded"),
      ]);

    const leads = leadsRaw ?? [];
    const invoices = invoicesRaw ?? [];
    const pipeline = pipelineRaw ?? [];
    const tasks = tasksRaw ?? [];
    const activity = activityRaw ?? [];

    // â”€â”€ Leads â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const leadsThisMonth = leads.filter(l => (l.capturedAt ?? "").startsWith(monthStr));
    const leadSources = {
      iris: leads.filter(l => l.source === "iris" || !l.source).length,
      lauren: leads.filter(l => l.source === "lauren").length,
      intake: leads.filter(l => l.source === "intake").length,
    };

    // â”€â”€ Bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const upcoming = bookings.filter(b => b.date >= todayStr && b.status !== "cancelled");
    const cancelledBookings = bookings.filter(b => b.status === "cancelled");
    const bookingsThisMonth = bookings.filter(b => b.date.startsWith(monthStr));

    // â”€â”€ Invoices / Finances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
    const totalSent = invoices.reduce((s, i) => s + i.total, 0);
    const outstanding = invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0);
    const monthInvoices = invoices.filter(i => i.sentAt?.startsWith(monthStr));
    const monthRevenue = monthInvoices.reduce((s, i) => s + i.total, 0);
    const mrr = invoices
      .filter(i => i.status !== "cancelled" && i.monthlyFee > 0)
      .reduce((s, i) => s + i.monthlyFee, 0);

    // Monthly revenue chart (last 6 months)
    const revenueByMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      revenueByMonth[key] = 0;
    }
    for (const inv of invoices) {
      const key = inv.sentAt?.slice(0, 7);
      if (key && revenueByMonth[key] !== undefined) revenueByMonth[key] += inv.total;
    }

    // â”€â”€ Pipeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const pipelineByStage: Record<string, number> = { new: 0, contacted: 0, demo: 0, proposal: 0, won: 0, lost: 0 };
    const pipelineValueByStage: Record<string, number> = { new: 0, contacted: 0, demo: 0, proposal: 0, won: 0, lost: 0 };
    for (const l of pipeline) {
      pipelineByStage[l.stage] = (pipelineByStage[l.stage] ?? 0) + 1;
      pipelineValueByStage[l.stage] = (pipelineValueByStage[l.stage] ?? 0) + (l.value ?? 0);
    }
    const totalPipelineValue = pipeline.filter(l => l.stage !== "lost").reduce((s, l) => s + (l.value ?? 0), 0);

    // â”€â”€ Clients (unified) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const clientMap: Record<string, any> = {};
    for (const lead of leads) {
      const key = lead.email?.toLowerCase() || lead.name?.toLowerCase();
      if (key && !clientMap[key]) clientMap[key] = { name: lead.name, email: lead.email, company: lead.company, phone: lead.phone, firstSeen: lead.capturedAt, source: "lead", bookings: 0, invoices: 0, totalSpent: 0 };
    }
    for (const b of bookings) {
      const key = b.email?.toLowerCase();
      if (key) {
        if (!clientMap[key]) clientMap[key] = { name: b.name, email: b.email, company: b.company, phone: b.phone, firstSeen: b.createdAt, source: "booking", bookings: 0, invoices: 0, totalSpent: 0 };
        clientMap[key].bookings = (clientMap[key].bookings || 0) + 1;
      }
    }
    for (const inv of invoices) {
      const key = inv.customerEmail?.toLowerCase();
      if (key) {
        if (!clientMap[key]) clientMap[key] = { name: inv.customerName, email: inv.customerEmail, company: "", phone: "", firstSeen: inv.sentAt, source: "invoice", bookings: 0, invoices: 0, totalSpent: 0 };
        clientMap[key].invoices = (clientMap[key].invoices || 0) + 1;
        clientMap[key].totalSpent = (clientMap[key].totalSpent || 0) + inv.total;
      }
    }
    const clients = Object.values(clientMap).sort((a: any, b: any) => (b.firstSeen > a.firstSeen ? 1 : -1));

    // â”€â”€ Daily chat (last 14 days) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
    const daily: Record<string, { conversations: number; leads: number }> = {};
    await Promise.all(
      dailyKeys.filter(k => k.replace("chat:daily:", "") >= cutoff).map(async k => {
        const date = k.replace("chat:daily:", "");
        const rec = await redis.hgetall(k);
        if (rec) daily[date] = { conversations: Number(rec.conversations ?? 0), leads: Number(rec.leads ?? 0) };
      })
    );

    // â”€â”€ Tasks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const openTasks = tasks.filter(t => !t.done);
    const overdueTasks = tasks.filter(t => !t.done && t.dueDate && t.dueDate < todayStr);

    return NextResponse.json({
      overview: {
        totalClients: clients.length,
        totalRevenue,
        mrr,
        openTasks: openTasks.length,
        overdueTasks: overdueTasks.length,
        upcomingBookings: upcoming.length,
        totalLeads: leads.length,
        pipelineValue: totalPipelineValue,
      },
      clients: clients.slice(0, 50),
      leads: {
        total: leads.length,
        thisMonth: leadsThisMonth.length,
        withPhone: leads.filter(l => l.phone).length,
        sources: leadSources,
        recent: leads.slice(-5).reverse(),
      },
      bookings: {
        total: bookings.length,
        upcoming: upcoming.length,
        thisMonth: bookingsThisMonth.length,
        cancelled: cancelledBookings.length,
        upcomingList: upcoming.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10),
      },
      invoices: {
        total: invoices.length,
        totalRevenue,
        totalSent,
        outstanding,
        monthRevenue,
        mrr,
        revenueByMonth,
        list: invoices.slice(0, 20),
      },
      pipeline: {
        leads: pipeline,
        byStage: pipelineByStage,
        valueByStage: pipelineValueByStage,
        totalValue: totalPipelineValue,
      },
      tasks: {
        all: tasks,
        open: openTasks.length,
        overdue: overdueTasks.length,
      },
      activity: activity.slice(0, 30),
      chat: {
        totalConversations: Number(chatStats?.totalConversations ?? 0),
        totalLeads: Number(chatStats?.totalLeads ?? 0),
        bookingClicks: Number(chatStats?.bookingClicks ?? 0),
        daily,
      },
      lauren: { totalCalls: Number(laurenStats?.totalCalls ?? 0) },
      conversations: {
        iris: (irisConvsRaw ?? []).slice(0, 50),
        lauren: (laurenConvsRaw ?? []).slice(0, 50).map((c: any) => ({
          ...c,
          messages: (c.messages || []).filter((m: any) => m.role !== "system"),
        })),
      },
      offboarded: offboardedRaw ?? [],
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

