import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const fieldVets = await prisma.fieldVet.findMany();

  const whatsappProvider = process.env.WHATSAPP_PROVIDER === "meta" ? "Real Meta Cloud API" : "Mock (demo mode)";
  const aiProviderName = process.env.AI_PROVIDER || "gemini";
  const aiModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const aiConfigured = Boolean(process.env.GEMINI_API_KEY);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold">AI Configuration</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Provider" value={aiProviderName} />
            <Row label="Model" value={aiModel} />
            <Row label="API Key" value={aiConfigured ? "Configured ✓" : "Missing — set GEMINI_API_KEY"} />
          </dl>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold">WhatsApp Integration</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Provider" value={whatsappProvider} />
            <Row label="Note" value="Switch WHATSAPP_PROVIDER=meta with real credentials to go live." />
          </dl>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="text-sm font-bold">Field Vet Team</h2>
          <ul className="mt-3 divide-y divide-black/5 text-sm">
            {fieldVets.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-2">
                <span>
                  {v.name} — {v.region}
                </span>
                <span className="text-black/50">{v.phoneNumber}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-black/40">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
