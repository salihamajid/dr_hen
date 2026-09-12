import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { FarmerActions } from "./FarmerActions";
import { FARMER_STATUS_COLOR, FARMER_STATUS_LABEL, DISEASE_LABEL } from "@/lib/constants";

export interface FarmerOverviewRow {
  id: string;
  name: string;
  location: string;
  flockSize: number;
  status: string;
  currentIssue: string;
  lastTreatmentLabel: string;
  nextActionLabel: string;
}

export function FarmersOverviewTable({ farmers }: { farmers: FarmerOverviewRow[] }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Farmers Overview</h2>
        <Link
          href="/farmers/new"
          className="rounded-lg bg-brand-red px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          + Add Farmer
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-black/40">
              <th className="pb-3 pr-4 font-medium">Farmer Name</th>
              <th className="pb-3 pr-4 font-medium">Location</th>
              <th className="pb-3 pr-4 font-medium">Flock Size</th>
              <th className="pb-3 pr-4 font-medium">Current Issue</th>
              <th className="pb-3 pr-4 font-medium">Last Treatment</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pl-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {farmers.map((f) => (
              <tr key={f.id}>
                <td className="py-3 pr-4 font-medium">{f.name}</td>
                <td className="py-3 pr-4 text-black/60">{f.location}</td>
                <td className="py-3 pr-4 text-black/60">{f.flockSize.toLocaleString()}</td>
                <td className="py-3 pr-4">
                  <span className={f.currentIssue === "Healthy" ? "text-green-600" : "text-red-600"}>
                    {f.currentIssue}
                  </span>
                </td>
                <td className="py-3 pr-4 text-black/60">{f.lastTreatmentLabel}</td>
                <td className="py-3 pr-4">
                  <Badge className={FARMER_STATUS_COLOR[f.status]}>{FARMER_STATUS_LABEL[f.status]}</Badge>
                </td>
                <td className="py-3 pl-4">
                  <FarmerActions farmerId={f.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden">
        {farmers.map((f) => (
          <div key={f.id} className="rounded-xl border border-black/5 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs text-black/50">{f.location}</div>
              </div>
              <Badge className={FARMER_STATUS_COLOR[f.status]}>{FARMER_STATUS_LABEL[f.status]}</Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
              <dt className="text-black/40">Flock Size</dt>
              <dd className="text-right">{f.flockSize.toLocaleString()}</dd>
              <dt className="text-black/40">Current Issue</dt>
              <dd className={`text-right ${f.currentIssue === "Healthy" ? "text-green-600" : "text-red-600"}`}>
                {f.currentIssue}
              </dd>
              <dt className="text-black/40">Last Treatment</dt>
              <dd className="text-right">{f.lastTreatmentLabel}</dd>
            </dl>
            <div className="mt-3">
              <FarmerActions farmerId={f.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function issueLabelFor(diseaseCode?: string | null): string {
  if (!diseaseCode) return "Healthy";
  return DISEASE_LABEL[diseaseCode] ?? diseaseCode;
}
