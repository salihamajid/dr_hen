import type { Metadata } from "next";
import Link from "next/link";
import { Bird } from "lucide-react";
import { AddFlockForm } from "@/components/farmer/AddFlockForm";
import { requireFarmer } from "@/lib/auth/dal";
import { flockAgeWeeks } from "@/lib/flocks";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "My Flocks — Dr. Hen" };
export const dynamic = "force-dynamic";

export default async function FarmerFlocksPage() {
  const { farmerId } = await requireFarmer();

  const flocks = await prisma.flock.findMany({
    where: { farmerId },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, breed: true, sizeCount: true, startDate: true, active: true },
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">My Flocks</h1>
          <p className="text-xs text-black/50">Keep this list matching the birds on your farm.</p>
        </div>
      </div>

      <AddFlockForm />

      {flocks.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-black/45 shadow-sm ring-1 ring-black/5">
          No flocks yet. Add your first flock to start recording daily data.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {flocks.map((f) => (
            <article key={f.id} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e7f5ea] text-brand-green">
                    <Bird className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold leading-tight">{f.name}</h2>
                    <p className="truncate text-xs text-black/50">{f.breed}</p>
                  </div>
                </div>
                {!f.active && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-black/50">Inactive</span>}
              </div>

              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-black/[0.03] px-3 py-2">
                  <dt className="text-[11px] text-black/45">Birds</dt>
                  <dd className="font-bold">{f.sizeCount.toLocaleString("en-IN")}</dd>
                </div>
                <div className="rounded-xl bg-black/[0.03] px-3 py-2">
                  <dt className="text-[11px] text-black/45">Age</dt>
                  <dd className="font-bold">{flockAgeWeeks(f.startDate)} weeks</dd>
                </div>
              </dl>

              <Link
                href={`/farmer/flocks/${f.id}`}
                className="mt-auto rounded-xl border border-brand-green-dark px-4 py-2 text-center text-sm font-semibold text-brand-green-dark hover:bg-brand-green-dark hover:text-white"
              >
                View Details
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
