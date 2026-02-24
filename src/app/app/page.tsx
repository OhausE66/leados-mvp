import Image from "next/image";

import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function DashboardContent({
  teamCount,
  briefingCount,
  oneOnOneCount,
  demoMode,
}: {
  teamCount: number | string;
  briefingCount: number | string;
  oneOnOneCount: number | string;
  demoMode: boolean;
}) {
  return (
    <div className="space-y-6">
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

export default async function DashboardPage() {
  if (isDemoMode()) {
    return <DashboardContent teamCount="-" briefingCount="-" oneOnOneCount="-" demoMode />;
  }

  const supabase = await createSupabaseServerClient();

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
    />
  );
}
