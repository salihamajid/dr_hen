import "server-only";

import { prisma } from "@/lib/prisma";
import { startOfUtcDay } from "@/lib/reports/dates";

/**
 * Every figure on the admin dashboard, read from Postgres on each request.
 *
 * Nothing here is a constant or a placeholder. Where the reference screenshot showed a number
 * the database cannot answer on its own — "Vaccination Coverage", "Compliance Score" — the
 * definition is written out beside the query, because a percentage nobody can define is worse
 * than no percentage at all. The same words are shown to the admin on hover.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Alerts and treatments still needing attention. RESOLVED/COMPLETED are done with. */
const UNRESOLVED = { not: "RESOLVED" } as const;

export interface Kpis {
  totalFarmers: number;
  newFarmersThisMonth: number;
  totalFlocks: number;
  newFlocksThisMonth: number;
  activeAlerts: number;
  alertsBySeverity: { critical: number; moderate: number; info: number };
  coverage: {
    /** null when nothing has fallen due yet — an honest blank, not a 0% that reads as failure. */
    percent: number | null;
    done: number;
    due: number;
    /** Percentage points versus where coverage stood at the start of this month; null if unknowable. */
    deltaPoints: number | null;
  };
}

export interface FlockHealth {
  healthy: number;
  atRisk: number;
  sick: number;
  total: number;
}

export interface ManagementBar {
  label: string;
  percent: number;
  /** The exact meaning, shown on hover. Every bar must be able to explain itself. */
  definition: string;
  detail: string;
}

export interface RecentAlertRow {
  id: string;
  severity: "CRITICAL" | "ALERT" | "INFO";
  title: string;
  farmName: string;
  farmerId: string;
  ago: string;
  /** Whether the farmer has opened it in the portal. We know this; we do not know "delivered". */
  seen: boolean;
}

export interface RecentBroadcastRow {
  id: string;
  kind: "MESSAGE" | "VIDEO" | "TEMPLATE";
  title: string;
  status: "DRAFT" | "SENDING" | "SENT" | "PARTIAL" | "FAILED";
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  ago: string;
}

export interface AgentStatus {
  connected: boolean;
  label: string;
  detail: string;
}

export interface TreatmentStatusDatum {
  status: "COMPLETED" | "IN_PROGRESS" | "SCHEDULED" | "OVERDUE";
  count: number;
}

export interface DiseaseShare {
  code: string;
  percent: number;
  count: number;
}

export interface PendingRequestRow {
  id: string;
  farmName: string;
  farmerId: string;
  detail: string;
  ago: string;
}

export interface AdminDashboardData {
  kpis: Kpis;
  flockHealth: FlockHealth;
  management: ManagementBar[];
  recentAlerts: RecentAlertRow[];
  recentBroadcasts: RecentBroadcastRow[];
  agent: AgentStatus;
  treatmentStatus: TreatmentStatusDatum[];
  diseaseShares: DiseaseShare[];
  /** What farmers have asked for from their own dashboard and nobody has answered yet. */
  pendingVetRequests: PendingRequestRow[];
  pendingFeedOrders: PendingRequestRow[];
  pendingVetCount: number;
  pendingFeedCount: number;
  /** Bell badge: things genuinely waiting for an admin. */
  pendingForAdmin: number;
}

/** "2h ago", "3 days ago" — short enough for a list row. */
export function timeAgo(from: Date, now = new Date()): string {
  const mins = Math.max(0, Math.round((now.getTime() - from.getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

/**
 * Just what the frame around every admin page needs: the agent status in the menu and the
 * bell's count. Kept separate from the dashboard's full read so visiting, say, the Farmers
 * page doesn't run the dashboard's dozen queries.
 */
export async function loadAdminChrome(): Promise<{ agent: AgentStatus; pendingForAdmin: number }> {
  const [criticalAlerts, pendingEscalations, pendingFeedOrders, lastWhatsappMessage] = await Promise.all([
    prisma.alert.count({ where: { status: UNRESOLVED, severity: "CRITICAL" } }),
    prisma.vetEscalation.count({ where: { status: "PENDING" } }),
    prisma.feedOrder.count({ where: { status: "REQUESTED" } }),
    prisma.message.findFirst({ where: { channel: "WHATSAPP" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  return {
    agent: agentStatus(lastWhatsappMessage?.createdAt ?? null),
    pendingForAdmin: criticalAlerts + pendingEscalations + pendingFeedOrders,
  };
}

/** Whether Dr. Hen can actually send on WhatsApp right now — not a decorative green dot. */
function agentStatus(lastMessageAt: Date | null, now = new Date()): AgentStatus {
  const configured =
    process.env.WHATSAPP_PROVIDER === "meta" && !!process.env.WHATSAPP_PHONE_NUMBER_ID && !!process.env.WHATSAPP_ACCESS_TOKEN;
  if (!configured) return { connected: false, label: "Not connected", detail: "Demo mode · no Meta credentials" };

  if (!lastMessageAt) return { connected: true, label: "Connected", detail: "Online · no messages yet" };
  const recent = now.getTime() - lastMessageAt.getTime() < DAY_MS;
  return { connected: true, label: "Connected", detail: recent ? "Online · Active" : `Online · last message ${timeAgo(lastMessageAt, now)}` };
}

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  const now = new Date();
  const today = startOfUtcDay(now);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  // The last seven COMPLETE days. Today is still being lived through, so counting it would
  // mark every farm behind each morning and make the compliance bar meaningless.
  const yesterday = new Date(today.getTime() - DAY_MS);
  const weekStart = new Date(today.getTime() - 7 * DAY_MS);

  const [
    totalFarmers,
    newFarmersThisMonth,
    totalFlocks,
    newFlocksThisMonth,
    alertsBySeverityRows,
    vaccDue,
    vaccDone,
    vaccDueBefore,
    vaccDoneBefore,
    activeFlocks,
    flockAlertRows,
    farmsReportingThisWeek,
    flocksReportedYesterday,
    reportsThisWeek,
    alerts,
    broadcasts,
    lastWhatsappMessage,
    treatmentsByStatus,
    treatmentsByDisease,
    pendingEscalations,
    pendingFeedOrders,
    recentVetRequests,
    recentFeedOrders,
  ] = await Promise.all([
    prisma.farmer.count(),
    prisma.farmer.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.flock.count({ where: { active: true } }),
    // Flock.createdAt exists precisely for this: startDate is when the birds arrived, which
    // farmers routinely backdate, so it cannot answer "how many were added this month".
    prisma.flock.count({ where: { active: true, createdAt: { gte: monthStart } } }),
    prisma.alert.groupBy({ by: ["severity"], where: { status: UNRESOLVED }, _count: { severity: true } }),

    // Vaccination coverage: of the doses that have FALLEN DUE, the share recorded as given.
    // Doses scheduled for the future are not yet anybody's failure, so they stay out of both
    // sides of the fraction.
    prisma.vaccination.count({ where: { scheduledDate: { lte: now } } }),
    prisma.vaccination.count({ where: { scheduledDate: { lte: now }, status: "COMPLETED" } }),
    prisma.vaccination.count({ where: { scheduledDate: { lt: monthStart } } }),
    prisma.vaccination.count({ where: { scheduledDate: { lt: monthStart }, status: "COMPLETED" } }),

    // Flock health needs each flock's farm status as well as its own alerts, so the two
    // signals the system actually maintains both count.
    prisma.flock.findMany({
      where: { active: true },
      select: { id: true, farmer: { select: { status: true } } },
      take: 5000,
    }),
    prisma.alert.groupBy({
      by: ["flockId", "severity"],
      where: { status: UNRESOLVED, flockId: { not: null } },
      _count: { _all: true },
    }),

    prisma.dailyReport.groupBy({ by: ["farmerId"], where: { date: { gte: weekStart } } }),
    prisma.dailyReport.groupBy({ by: ["flockId"], where: { date: yesterday, flockId: { not: null } } }),
    // @@unique([farmerId, flockId, date]) guarantees one row per flock per day, so a plain
    // count is already the number of flock-days recorded — no de-duplication needed.
    prisma.dailyReport.count({ where: { date: { gte: weekStart, lte: yesterday }, flockId: { not: null } } }),

    prisma.alert.findMany({
      where: { status: UNRESOLVED },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, severity: true, titleEn: true, createdAt: true, readAt: true, farmerId: true, farmer: { select: { name: true } } },
    }),
    prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, kind: true, title: true, status: true, recipientCount: true, deliveredCount: true, failedCount: true, createdAt: true, sentAt: true },
    }),
    prisma.message.findFirst({ where: { channel: "WHATSAPP" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),

    prisma.treatment.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.treatment.groupBy({ by: ["diseaseCode"], _count: { diseaseCode: true } }),
    prisma.vetEscalation.count({ where: { status: "PENDING" } }),
    prisma.feedOrder.count({ where: { status: "REQUESTED" } }),
    // The requests themselves, so the dashboard can name the farms waiting rather than
    // showing a number the admin has to go elsewhere to understand.
    prisma.vetEscalation.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, createdAt: true, farmerId: true, farmer: { select: { name: true, whatsappNumber: true } } },
    }),
    prisma.feedOrder.findMany({
      where: { status: "REQUESTED" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, bags: true, createdAt: true, farmerId: true, farmer: { select: { name: true } } },
    }),
  ]);

  // --- alerts by severity
  const sevCount = (s: string) => alertsBySeverityRows.find((r) => r.severity === s)?._count.severity ?? 0;
  const alertsBySeverity = { critical: sevCount("CRITICAL"), moderate: sevCount("ALERT"), info: sevCount("INFO") };
  const activeAlerts = alertsBySeverity.critical + alertsBySeverity.moderate + alertsBySeverity.info;

  // --- vaccination coverage
  const coveragePercent = vaccDue === 0 ? null : pct(vaccDone, vaccDue);
  const coverageBefore = vaccDueBefore === 0 ? null : pct(vaccDoneBefore, vaccDueBefore);
  const coverage = {
    percent: coveragePercent,
    done: vaccDone,
    due: vaccDue,
    deltaPoints: coveragePercent !== null && coverageBefore !== null ? coveragePercent - coverageBefore : null,
  };

  // --- flock health, one classification per active flock
  // Sick beats At Risk: a flock with both a critical alert and a mild one is sick.
  const worstAlertByFlock = new Map<string, "CRITICAL" | "ALERT" | "INFO">();
  const RANK = { INFO: 1, ALERT: 2, CRITICAL: 3 } as const;
  for (const row of flockAlertRows) {
    if (!row.flockId) continue;
    const current = worstAlertByFlock.get(row.flockId);
    const next = row.severity as "CRITICAL" | "ALERT" | "INFO";
    if (!current || RANK[next] > RANK[current]) worstAlertByFlock.set(row.flockId, next);
  }

  let sick = 0;
  let atRisk = 0;
  for (const flock of activeFlocks) {
    const alert = worstAlertByFlock.get(flock.id);
    const farmStatus = flock.farmer.status;
    // A farm under treatment or escalated is a sick farm; a treatment row carries no flockId
    // (diagnoses arrive by WhatsApp, where no shed is named), so the farm status is the only
    // place that signal lives.
    // An INFO alert is paperwork (a day with no entry), not illness, so it leaves a flock
    // healthy. Only a real warning or a farm the system has flagged moves it.
    if (alert === "CRITICAL" || farmStatus === "ESCALATED" || farmStatus === "UNDER_TREATMENT") sick++;
    else if (alert === "ALERT" || farmStatus === "AT_RISK") atRisk++;
  }
  const flockHealth: FlockHealth = {
    total: activeFlocks.length,
    sick,
    atRisk,
    healthy: activeFlocks.length - sick - atRisk,
  };

  // --- farm management
  const activeFlockCount = activeFlocks.length;
  const reportedYesterday = flocksReportedYesterday.length;
  const expectedThisWeek = activeFlockCount * 7;
  const management: ManagementBar[] = [
    {
      label: "Active Farms",
      percent: pct(farmsReportingThisWeek.length, totalFarmers),
      definition: "Farms that recorded at least one daily entry in the last 7 days.",
      detail: `${farmsReportingThisWeek.length} of ${totalFarmers} farms`,
    },
    {
      label: "Pending Reports",
      percent: pct(Math.max(0, activeFlockCount - reportedYesterday), activeFlockCount),
      definition: "Active flocks with no entry for yesterday, the last full day.",
      detail: `${Math.max(0, activeFlockCount - reportedYesterday)} of ${activeFlockCount} flocks`,
    },
    {
      label: "Compliance Score",
      // Capped: a backdated correction can push a flock over its seven slots, and a bar
      // past 100% would just look broken.
      percent: Math.min(100, pct(reportsThisWeek, expectedThisWeek)),
      definition: "Daily entries actually recorded over the last 7 full days, against one per active flock per day.",
      detail: `${reportsThisWeek} of ${expectedThisWeek} entries`,
    },
  ];

  // --- recent alerts
  const recentAlerts: RecentAlertRow[] = alerts.map((a) => ({
    id: a.id,
    severity: a.severity as RecentAlertRow["severity"],
    title: a.titleEn,
    farmName: a.farmer.name,
    farmerId: a.farmerId,
    ago: timeAgo(a.createdAt, now),
    seen: a.readAt !== null,
  }));

  const recentBroadcasts: RecentBroadcastRow[] = broadcasts.map((b) => ({
    id: b.id,
    kind: b.kind,
    title: b.title,
    status: b.status,
    recipientCount: b.recipientCount,
    deliveredCount: b.deliveredCount,
    failedCount: b.failedCount,
    ago: timeAgo(b.sentAt ?? b.createdAt, now),
  }));

  const agent = agentStatus(lastWhatsappMessage?.createdAt ?? null, now);

  const totalDiseaseTreatments = treatmentsByDisease.reduce((sum, t) => sum + t._count.diseaseCode, 0);
  const diseaseShares: DiseaseShare[] = treatmentsByDisease
    .map((t) => ({ code: t.diseaseCode, count: t._count.diseaseCode, percent: pct(t._count.diseaseCode, totalDiseaseTreatments) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const statusCount = (s: string) => treatmentsByStatus.find((t) => t.status === s)?._count.status ?? 0;

  return {
    kpis: {
      totalFarmers,
      newFarmersThisMonth,
      totalFlocks,
      newFlocksThisMonth,
      activeAlerts,
      alertsBySeverity,
      coverage,
    },
    flockHealth,
    management,
    recentAlerts,
    recentBroadcasts,
    agent,
    treatmentStatus: [
      { status: "COMPLETED", count: statusCount("COMPLETED") },
      { status: "IN_PROGRESS", count: statusCount("IN_PROGRESS") },
      { status: "SCHEDULED", count: statusCount("SCHEDULED") },
      { status: "OVERDUE", count: statusCount("OVERDUE") },
    ],
    diseaseShares,
    pendingVetRequests: recentVetRequests.map((v) => ({
      id: v.id,
      farmerId: v.farmerId,
      farmName: v.farmer.name,
      detail: v.farmer.whatsappNumber,
      ago: timeAgo(v.createdAt, now),
    })),
    pendingFeedOrders: recentFeedOrders.map((f) => ({
      id: f.id,
      farmerId: f.farmerId,
      farmName: f.farmer.name,
      detail: `${f.bags} bag${f.bags === 1 ? "" : "s"}`,
      ago: timeAgo(f.createdAt, now),
    })),
    pendingVetCount: pendingEscalations,
    pendingFeedCount: pendingFeedOrders,
    pendingForAdmin: alertsBySeverity.critical + pendingEscalations + pendingFeedOrders,
  };
}
