import Image from "next/image";
import { Camera, Stethoscope, Users } from "lucide-react";
import { getT } from "@/lib/i18n";
import { getRequestLang } from "@/lib/i18n/server";
import { LanguageSwitch } from "./LanguageSwitch";

function Brand({ name = "Dr. Hen", tagline = "AI Care for Healthier Flocks" }: { name?: string; tagline?: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-white ring-2 ring-brand-green/20">
        <Image src="/images/dr-hen-v2.jpeg" alt={name} fill sizes="64px" className="object-cover object-top" priority />
      </div>
      <div className="text-center">
        <div className="text-2xl font-extrabold leading-none text-brand-green-dark">{name}</div>
        <div className="mt-1 text-[11px] font-medium text-black/45">{tagline}</div>
      </div>
    </div>
  );
}

interface ShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

function Card({ title, subtitle, children, footer, brandName, tagline, top }: ShellProps & { brandName?: string; tagline?: string; top?: React.ReactNode }) {
  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5 sm:p-9">
      {top && <div className="mb-4 flex justify-end">{top}</div>}
      <div className="mb-6 flex flex-col items-center text-center">
        <Brand name={brandName} tagline={tagline} />
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-black/50">{subtitle}</p>
      </div>
      {children}
      <div className="mt-6 space-y-2 border-t border-black/[0.06] pt-5 text-center text-sm text-black/55">{footer}</div>
    </div>
  );
}

/** Admin login: a single centred card. Deliberately no sign-up anywhere near it. */
export function AdminAuthShell(props: ShellProps) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-5 py-10">
      <Card {...props} />
    </main>
  );
}

const FEATURES = [
  { icon: Camera, title: "auth.f1", body: "auth.f1b" },
  { icon: Stethoscope, title: "auth.f2", body: "auth.f2b" },
  { icon: Users, title: "auth.f3", body: "auth.f3b" },
] as const;

/** Farmer login / sign-up: form card beside the promotional panel, in the visitor's language. */
export async function FarmerAuthShell(props: ShellProps) {
  const t = getT(await getRequestLang());

  return (
    <main className="grid min-h-screen w-full bg-background lg:grid-cols-[minmax(0,540px)_1fr]">
      <div className="flex items-center justify-center px-5 py-10">
        <Card {...props} brandName={t("brand.name")} tagline={t("auth.tagline")} top={<LanguageSwitch />} />
      </div>

      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-green-dark via-brand-green to-[#2d9d63] p-14 text-white lg:flex lg:flex-col lg:justify-center">
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/[0.07]" />

        <div className="relative max-w-lg">
          <h2 className="text-4xl font-extrabold leading-tight">
            {t("auth.promoHead")}
            <br />
            <span className="text-[#b6f0c9]">{t("brand.name")}</span>
          </h2>
          <p className="mt-4 text-base text-white/80">{t("auth.promoBody")}</p>

          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <div className="font-bold">{t(title)}</div>
                  <div className="text-sm text-white/75">{t(body)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </main>
  );
}
