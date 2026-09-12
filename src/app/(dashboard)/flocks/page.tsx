import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FlocksPage() {
  const farmers = await prisma.farmer.findMany({
    orderBy: { createdAt: "desc" },
    include: { flocks: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Flocks</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {farmers.map((f) => (
          <Link
            key={f.id}
            href={`/farmers/${f.id}`}
            className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md"
          >
            <div className="font-semibold">{f.name}</div>
            <div className="text-xs text-black/50">{f.location}</div>
            <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs">
              <dt className="text-black/40">Breed</dt>
              <dd className="text-right">{f.breed}</dd>
              <dt className="text-black/40">Flock Size</dt>
              <dd className="text-right">{f.flockSize.toLocaleString()}</dd>
              <dt className="text-black/40">Sheds</dt>
              <dd className="text-right">{f.numberOfSheds}</dd>
              <dt className="text-black/40">Age</dt>
              <dd className="text-right">{f.flockAgeWeeks} weeks</dd>
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}
