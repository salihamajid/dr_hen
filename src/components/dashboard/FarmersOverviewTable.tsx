import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { FarmerActions } from "./FarmerActions";
import { FARMER_STATUS_COLOR, FARMER_STATUS_LABEL, DISEASE_LABEL } from "@/lib/constants";

export interface FarmerOverviewRow {
  id: string;
  name: string;
  location: string;
  whatsappNumber: string;
  flockSize: number;
  status: string;
  currentIssue: string;
  lastTreatmentLabel: string;
  lastTreatmentDate: string;
  nextActionLabel: string;
  nextActionDate: string;
  nextActionOverdue: boolean;
}

const HEADERS = [
  "Farmer Name",
  "Location",
  "Flock Size",
  "Current Issue",
  "Last Treatment",
  "Next Action",
  "Status",
  "Actions",
];

export function FarmersOverviewTable({
  farmers,
  totalFarmers,
}: {
  farmers: FarmerOverviewRow[];
  totalFarmers: number;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between px-5 py-3">
        <h2 className="text-base font-bold">Farmers Overview</h2>
        <Link
          href="/farmers/new"
          className="flex items-center gap-1 rounded-lg bg-brand-red px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Farmer
        </Link>
      </div>

      {farmers.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-5 py-8 text-sm text-black/40">
          No farmers found.
        </div>
      ) : (
        <>
          {/* Desktop table — scrolls internally so the page itself never does */}
          <div className="hidden min-h-0 flex-1 overflow-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="text-[11px] uppercase tracking-wide text-black/40">
                  <th scope="col" className="w-9 border-b border-black/[0.06] px-3 pb-2 pt-1 font-medium">
                    <span className="sr-only">Select</span>
                  </th>
                  {HEADERS.map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="whitespace-nowrap border-b border-black/[0.06] px-3 pb-2 pt-1 font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {farmers.map((f) => (
                  <tr key={f.id} className="align-middle hover:bg-black/[0.015]">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label={`Select ${f.name}`}
                        className="h-3.5 w-3.5 rounded border-black/20 accent-brand-red"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium">{f.name}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-black/60">{f.location}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-black/60 tabular-nums">
                      {f.flockSize.toLocaleString("en-IN")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className={f.currentIssue === "Healthy" ? "text-green-600" : "text-brand-red"}>
                        {f.currentIssue}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-black/60">
                      <div>{f.lastTreatmentLabel}</div>
                      {f.lastTreatmentDate && <div className="text-[11px] text-black/40">{f.lastTreatmentDate}</div>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className={f.nextActionOverdue ? "text-brand-red" : "text-black/70"}>{f.nextActionLabel}</div>
                      {f.nextActionDate && (
                        <div className={`text-[11px] ${f.nextActionOverdue ? "text-brand-red" : "text-black/40"}`}>
                          {f.nextActionDate}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <Badge className={FARMER_STATUS_COLOR[f.status]}>{FARMER_STATUS_LABEL[f.status]}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <FarmerActions farmerId={f.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-3 md:hidden">
            {farmers.map((f) => (
              <div key={f.id} className="rounded-xl border border-black/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{f.name}</div>
                    <div className="text-xs text-black/50">{f.location}</div>
                  </div>
                  <Badge className={FARMER_STATUS_COLOR[f.status]}>{FARMER_STATUS_LABEL[f.status]}</Badge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
                  <dt className="text-black/40">Flock Size</dt>
                  <dd className="text-right">{f.flockSize.toLocaleString("en-IN")}</dd>
                  <dt className="text-black/40">Current Issue</dt>
                  <dd className={`text-right ${f.currentIssue === "Healthy" ? "text-green-600" : "text-brand-red"}`}>
                    {f.currentIssue}
                  </dd>
                  <dt className="text-black/40">Last Treatment</dt>
                  <dd className="text-right">{f.lastTreatmentLabel}</dd>
                  <dt className="text-black/40">Next Action</dt>
                  <dd className={`text-right ${f.nextActionOverdue ? "text-brand-red" : ""}`}>{f.nextActionLabel}</dd>
                </dl>
                <div className="mt-3">
                  <FarmerActions farmerId={f.id} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex shrink-0 items-center justify-between border-t border-black/[0.06] px-5 py-2.5 text-xs text-black/45">
        <span>
          Showing {farmers.length} of {totalFarmers.toLocaleString("en-IN")} farmer{totalFarmers === 1 ? "" : "s"}
        </span>
        <Link href="/farmers" className="font-medium text-black/60 hover:text-black">
          View all →
        </Link>
      </div>
    </div>
  );
}

export function issueLabelFor(diseaseCode?: string | null): string {
  if (!diseaseCode) return "Healthy";
  return DISEASE_LABEL[diseaseCode] ?? diseaseCode;
}
