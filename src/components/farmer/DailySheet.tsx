import type { DailySheet as Sheet } from "@/lib/reports/dailySheet";

const DOTS = "border-b border-dotted border-black/25";

/**
 * The farm's paper Daily Report, on screen: the same boxes, the same order, the same bilingual
 * labels. It is laid out left-to-right even for an Urdu farmer, because the sheet itself is
 * bilingual and its English and Urdu labels sit side by side on every line.
 */
export function DailySheetView({ sheet }: { sheet: Sheet }) {
  const row = (label: string, value: string, second?: { label: string; value: string }) => (
    <div key={label} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-4 py-2 text-sm sm:text-base">
      <span className="font-semibold text-black/80">{label}</span>
      <span className={`min-w-16 flex-1 text-center font-bold ${DOTS}`}>{value}</span>
      {second && (
        <>
          <span className="font-semibold text-black/80">{second.label}</span>
          <span className={`min-w-16 flex-1 text-center font-bold ${DOTS}`}>{second.value}</span>
        </>
      )}
    </div>
  );

  return (
    <article dir="ltr" className="mx-auto w-full max-w-2xl space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
      <p className="text-center text-lg font-bold text-brand-green-dark">بسم اللہ الرحمن الرحیم</p>

      <h2 className="rounded-2xl border-2 border-[#cde9d5] px-4 py-3 text-center text-2xl font-extrabold text-brand-green-dark sm:text-3xl">
        {sheet.title}
      </h2>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 rounded-2xl border-2 border-[#cde9d5] px-4 py-3 text-sm sm:text-base">
        <span className="font-semibold text-black/80">{sheet.dateLabel}:</span>
        <span className={`min-w-24 flex-1 text-center font-bold ${DOTS}`}>{sheet.date}</span>
        <span className="font-semibold text-black/80">{sheet.farmLabel}:</span>
        <span className={`min-w-24 flex-1 text-center font-bold ${DOTS}`}>{sheet.farmName}</span>
      </div>

      {sheet.sheds.map((shed) => (
        <section key={shed.heading} className="overflow-hidden rounded-2xl border-2 border-[#cde9d5]">
          <header className="flex flex-wrap items-baseline gap-x-3 bg-[#dff1e4] px-4 py-2.5">
            <span aria-hidden className="text-xl">🐔</span>
            <h3 className="text-xl font-extrabold text-brand-green-dark sm:text-2xl">{shed.heading}</h3>
            <span className="text-xs text-brand-green-dark/70">{shed.subtitle}</span>
          </header>
          <div className="divide-y divide-black/[0.04] py-1">
            {shed.rows.map((r) => row(r.label, r.value, r.second))}
            {shed.extras && <p className="px-4 py-2 text-xs text-black/45">{shed.extras}</p>}
          </div>
        </section>
      ))}

      <section className="overflow-hidden rounded-2xl border-2 border-[#cde9d5]">
        <header className="bg-[#dff1e4] px-4 py-2 text-center">
          <h3 className="text-lg font-extrabold text-brand-green-dark">{sheet.stockHeading}</h3>
        </header>
        <div className="py-1">{row(sheet.stockRow.label, sheet.stockRow.value, sheet.stockRow.second)}</div>
      </section>

      <div className="space-y-1 rounded-2xl bg-[#f2f9f4] px-4 py-3 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold text-brand-green-dark">{sheet.notesLabel}:</span>
          <span className={`min-w-24 flex-1 ${DOTS}`}>{sheet.notes}</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold text-brand-green-dark">{sheet.signatureLabel}:</span>
          <span className={`min-w-24 flex-1 ${DOTS}`}>{sheet.signature}</span>
        </div>
      </div>

      <p className="text-center text-xs text-black/40">{sheet.footer}</p>
    </article>
  );
}
