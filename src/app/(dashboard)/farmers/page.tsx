import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { FarmerActions } from "@/components/dashboard/FarmerActions";
import { issueLabelFor } from "@/components/dashboard/FarmersOverviewTable";
import { FARMER_STATUS_COLOR, FARMER_STATUS_LABEL } from "@/lib/constants";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function FarmersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1"));

  const [farmers, total] = await Promise.all([
    prisma.farmer.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { treatments: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.farmer.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Farmers</h1>
        <Link href="/farmers/new" className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white">
          + Add Farmer
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-black/40">
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Location</th>
              <th className="pb-3 pr-4 font-medium">WhatsApp</th>
              <th className="pb-3 pr-4 font-medium">Flock Size</th>
              <th className="pb-3 pr-4 font-medium">Breed</th>
              <th className="pb-3 pr-4 font-medium">Current Issue</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pl-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {farmers.map((f) => (
              <tr key={f.id}>
                <td className="py-3 pr-4 font-medium">{f.name}</td>
                <td className="py-3 pr-4 text-black/60">{f.location}</td>
                <td className="py-3 pr-4 text-black/60">{f.whatsappNumber}</td>
                <td className="py-3 pr-4 text-black/60">{f.flockSize.toLocaleString()}</td>
                <td className="py-3 pr-4 text-black/60">{f.breed}</td>
                <td className="py-3 pr-4">{issueLabelFor(f.treatments[0]?.diseaseCode)}</td>
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

        <div className="mt-4 flex items-center justify-between text-sm text-black/50">
          <span>
            Showing {farmers.length} of {total} farmers
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 10)
              .map((p) => (
                <Link
                  key={p}
                  href={`/farmers?page=${p}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    p === page ? "bg-brand-red text-white" : "hover:bg-black/5"
                  }`}
                >
                  {p}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
