import { ReportForm } from "@/components/farmer/ReportForm";
import { requireFarmer } from "@/lib/auth/dal";
import { getT } from "@/lib/i18n";
import { localizedTitle } from "@/lib/i18n/metadata";
import { prisma } from "@/lib/prisma";

export const generateMetadata = () => localizedTitle("title.attributes");
export const dynamic = "force-dynamic";

export default async function AttributesPage() {
  const { farmerId, language } = await requireFarmer();
  const t = getT(language);
  const flocks = await prisma.flock.findMany({
    where: { farmerId, active: true },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">{t("attr.title")}</h1>
        <p className="text-xs text-black/50">{t("attr.subtitle")}</p>
      </div>
      <ReportForm flocks={flocks} />
    </div>
  );
}
