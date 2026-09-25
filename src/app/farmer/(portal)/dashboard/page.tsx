import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { requireFarmer } from "@/lib/auth/dal";

// Placeholder so the post-login redirect lands somewhere real. Phase 3 replaces
// this with the full farmer dashboard inside the farmer shell.
export default async function FarmerDashboardPlaceholder() {
  const { farmerId } = await requireFarmer();

  // Filtered by the session's farmerId — never an id taken from the request.
  const farmer = await prisma.farmer.findFirst({
    where: { id: farmerId },
    select: { name: true, location: true, _count: { select: { flocks: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-xl p-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-xl font-bold">Welcome, {farmer?.name}</h1>
        <p className="mt-1 text-sm text-black/55">
          {farmer?.location} · {farmer?._count.flocks} flock{farmer?._count.flocks === 1 ? "" : "s"}
        </p>
        <p className="mt-4 text-sm text-black/45">Your dashboard is coming next.</p>
        <LogoutButton className="mt-4 -ml-3" />
      </div>
    </main>
  );
}
