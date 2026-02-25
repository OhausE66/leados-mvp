import Image from "next/image";
import Link from "next/link";

import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function DashboardContent({
  teamCount,
  briefingCount,
  oneOnOneCount,
  demoMode,
  guestMode,
}: {
  teamCount: number | string;
  briefingCount: number | string;
  oneOnOneCount: number | string;
  demoMode: boolean;
  guestMode: boolean;
}) {
  return (
    <div className="space-y-6">
      <section className="sticky top-16 z-20 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
            Quick Start Navigation
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/daily" className="btn btn-secondary">
              Daily testen
            </Link>
            <Link href="/app/one-on-one" className="btn btn-secondary">
              1:1 testen
            </Link>
            <Link href="/app/templates" className="btn btn-secondary">
              Templates
            </Link>
            <Link href="/app/example" className="btn btn-primary">
              Beispiel öffnen
            </Link>
          </div>
        </div>
      </section>

      <section className="card-strong relative overflow-hidden">
        <Image
          src="/illustrations/city-grid.svg"
          alt="Corporate skyline background"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f3f]/92 via-[#11284c]/85 to-[#11284c]/60" />

        <div className="relative z-10 grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <p className="kicker">Unser Ansatz</p>
            <h1 className="mt-3 text-5xl font-semibold leading-[0.95] tracking-tight text-white md:text-7xl">
              Results
              <br />
              <span className="text-[#17a7ff]">Redefined.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium text-slate-200 md:text-lg">
              LeadOS verbindet Führungsmethodik mit KI-gestützter Geschwindigkeit, damit
              Führungskräfte schneller klare Entscheidungen und wirksame Umsetzung erzielen.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button className="btn btn-primary">Intelligence Suite</button>
              <button className="btn border border-white/35 bg-white/8 text-white hover:bg-white/16">
                Über LeadOS
              </button>
              <Link
                href="/app/example"
                className="btn border border-[#17a7ff]/55 bg-[#17a7ff]/10 text-[#bde9ff] hover:bg-[#17a7ff]/20"
              >
                Beispiel-Dokument
              </Link>
            </div>
            {demoMode ? (
              <p className="mt-4 text-sm font-medium text-cyan-200">Demo Mode ohne Backend aktiv.</p>
            ) : null}
          </div>

          <div className="justify-self-start rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur md:justify-self-end">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
              Current Status
            </p>
            <p className="mt-1 text-xl font-semibold text-white">AI Integrated Advisory</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Teammitglieder" value={teamCount} />
        <MetricCard label="Daily Briefings" value={briefingCount} />
        <MetricCard label="1:1 Outputs" value={oneOnOneCount} />
      </section>

      {guestMode ? (
        <section className="card space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Ohne Login testen
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#11284c]">
              Diese Leistungen kannst du sofort ausprobieren
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TrialCard
              title="Daily Leadership Briefing"
              description="3 konkrete Führungsaktionen mit Script und Timebox erzeugen."
              href="/app/daily"
              cta="Daily testen"
            />
            <TrialCard
              title="1:1 Studio"
              description="Mit Demo-Teammitgliedern Agenda, Feedback und Follow-ups generieren."
              href="/app/one-on-one"
              cta="1:1 testen"
            />
            <TrialCard
              title="Templates Library"
              description="Vorlagen für Feedback, Delegation, Konflikt und Entwicklung ansehen."
              href="/app/templates"
              cta="Templates öffnen"
            />
            <TrialCard
              title="Beispiel-Dokument"
              description="Ein komplettes Musterergebnis ansehen, bevor du eigene Inputs eingibst."
              href="/app/example"
              cta="Beispiel ansehen"
            />
          </div>
          <div className="rounded-xl border border-[#c6dcf9] bg-[#f3f8ff] p-3">
            <p className="text-sm text-[#1a4270]">
              Für dauerhafte Speicherung und Team-Historie: beim ersten Teammitglied anmelden.
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <MonetizationCard
          title="Starter"
          detail="Für 1 Führungskraft, Kernflows und Standard-Templates."
          hint="Ideal zum Einstieg"
        />
        <MonetizationCard
          title="Team"
          detail="Mehrere Führungskräfte, gemeinsame Standards und mehr Verlauf."
          hint="Für wachsende Teams"
        />
        <MonetizationCard
          title="Scale"
          detail="Strukturierte Führungsprozesse für mehrere Bereiche."
          hint="Für Organisationen mit Reifegrad"
        />
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="card">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-5xl font-semibold tracking-tight text-[#11284c]">{value}</p>
    </article>
  );
}

function TrialCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-700">{description}</p>
      <Link href={href} className="mt-4 inline-flex text-sm font-semibold text-[#0f2a55] underline">
        {cta}
      </Link>
    </article>
  );
}

function MonetizationCard({
  title,
  detail,
  hint,
}: {
  title: string;
  detail: string;
  hint: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{hint}</p>
      <h3 className="mt-2 text-lg font-semibold text-[#11284c]">{title}</h3>
      <p className="mt-2 text-sm text-slate-700">{detail}</p>
    </article>
  );
}

export default async function DashboardPage() {
  if (isDemoMode()) {
    return (
      <DashboardContent
        teamCount="-"
        briefingCount="-"
        oneOnOneCount="-"
        demoMode
        guestMode
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <DashboardContent
        teamCount="-"
        briefingCount="-"
        oneOnOneCount="-"
        demoMode={false}
        guestMode
      />
    );
  }

  const [{ count: teamCount }, { count: briefingCount }, { count: oneOnOneCount }] =
    await Promise.all([
      supabase.from("team_members").select("id", { count: "exact", head: true }),
      supabase.from("daily_briefings").select("id", { count: "exact", head: true }),
      supabase.from("one_on_ones").select("id", { count: "exact", head: true }),
    ]);

  return (
    <DashboardContent
      teamCount={teamCount ?? 0}
      briefingCount={briefingCount ?? 0}
      oneOnOneCount={oneOnOneCount ?? 0}
      demoMode={false}
      guestMode={false}
    />
  );
}
