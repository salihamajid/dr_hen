import type { AlertSeverity } from "@prisma/client";

const STYLE: Record<AlertSeverity, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  ALERT: "bg-amber-100 text-amber-800",
  INFO: "bg-blue-100 text-blue-700",
};
const LABEL: Record<AlertSeverity, string> = { CRITICAL: "Critical", ALERT: "Alert", INFO: "Info" };

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STYLE[severity]}`}>{LABEL[severity]}</span>;
}
