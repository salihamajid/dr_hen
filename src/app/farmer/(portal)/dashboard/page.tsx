import { Bell, Bird, ClipboardList, Layers } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AssistantPanel } from "@/components/farmer/AssistantPanel";
import { requireFarmer } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { whatsappChatLink } from "@/lib/whatsapp/businessNumber";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const weekAgo = () => new Date(Date.now() - WEEK_MS);

export default async function FarmerDashboardPage() {
  // The only source of farmerId on this page: the verified session, never the request.
  const { farmerId } = await requireFarmer();
  const weekStart = weekAgo();

  const [farmer, flocks, activeAlerts, week, waLink] = await Promise.all([
    prisma.farmer.findFirst({ where: { id: farmerId }, select: { name: true, location: true } }),
    prisma.flock.aggregate({ where: { farmerId, active: true }, _count: { _all: true }, _sum: { sizeCount: true } }),
    prisma.alert.count({ where: { farmerId, status: "OPEN" } }),
    prisma.dailyReport.aggregate({
      where: { farmerId, date: { gte: weekStart } },
      _count: { _all: true },
      _sum: { mortalityCount: true },
    }),
    whatsappChatLink(),
  ]);

  const fmt = (n: number) => n.toLocaleString("en-IN");

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <section className="rounded-2xl bg-brand-green-dark p-6 text-white shadow-sm">
        <p className="text-sm text-white/70">Welcome back, {farmer?.name}</p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
          Healthy Flocks, Stronger Farm
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/75">
          Disease detection, treatment guidance, daily reporting and expert advice, all in one place.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Layers} label="My Flocks" value={fmt(flocks._count._all)} tint="green" />
        <StatCard icon={Bird} label="Total Birds" value={fmt(flocks._sum.sizeCount ?? 0)} tint="blue" />
        <StatCard icon={Bell} label="Active Alerts" value={fmt(activeAlerts)} tint={activeAlerts > 0 ? "red" : "amber"} />
        <StatCard
          icon={ClipboardList}
          label={`This Week · ${fmt(week._count._all)} ${week._count._all === 1 ? "entry" : "entries"}`}
          value={`${fmt(week._sum.mortalityCount ?? 0)} deaths`}
          tint="amber"
        />
      </div>

      <AssistantPanel aiChatHref="/farmer/assistant" whatsappHref={waLink} />
    </div>
  );
}
