import { DISEASE_PROTOCOL, MEDICINE_MANUFACTURER } from "@/lib/ai/diseaseProtocol";

export default function DiseaseGuidePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Disease Guide</h1>
        <p className="text-sm text-black/50">
          Dr. Hen&apos;s AI diagnoses and recommends medicine strictly from this reference — the same list that
          powers the AI&apos;s allowlist enforcement.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(DISEASE_PROTOCOL).map(([code, entry]) => (
          <div key={code} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold">{entry.diseaseName}</h2>
            <p className="mt-1 text-sm text-black/60">{entry.notes}</p>
            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-black/40">Recommended Medicines</div>
              <ul className="mt-1.5 space-y-1">
                {entry.medicines.map((m) => (
                  <li key={m} className="flex items-center justify-between text-sm">
                    <span>{m}</span>
                    <span className="text-xs text-black/40">{MEDICINE_MANUFACTURER[m]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
