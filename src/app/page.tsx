import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

import { MiniBriefingDemo } from "@/components/marketing/mini-briefing-demo";
import { getAuthContext, getProfile } from "@/lib/auth";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";

export default async function HomePage() {
  if (isDemoMode()) {
    redirect("/app");
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-4xl p-6 md:pt-16">
        <div className="card-strong aurora">
          <p className="badge">LeadOS Setup</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Startklar in wenigen Minuten</h1>
          <p className="mt-3 text-slate-700">
            Setze zuerst Supabase-Variablen in `.env.local` oder aktiviere `NEXT_PUBLIC_DEMO_MODE=true`.
          </p>
          <Link href="/auth" className="btn btn-primary mt-4">
            Zur Anmeldung
          </Link>
        </div>
      </main>
    );
  }

  const { user } = await getAuthContext();
  if (user) {
    const profile = await getProfile(user.id);
    if (!profile) {
      redirect("/onboarding");
    }
    redirect("/app");
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 md:pt-12">
      <section className="card-strong relative overflow-hidden">
        <Image
          src="/illustrations/city-grid.svg"
          alt="LeadOS Startseite"
          fill
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f3f]/92 via-[#11284c]/84 to-[#11284c]/58" />
        <div className="relative z-10">
          <p className="kicker">LeadOS für KMU-Führung</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Erst ausprobieren,
            <span className="text-[#17a7ff]"> dann anmelden.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-200">
            Erzeuge Daily Briefings, 1:1-Skripte und Teamprofile direkt im Browser. Login
            wird erst benötigt, wenn du Daten dauerhaft speichern willst.
          </p>
          <div className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-3">
            <ProofBadge label="Zeit bis Output" value="< 5 min" />
            <ProofBadge label="Kern-Outputs" value="Daily + 1:1 + Follow-ups" />
            <ProofBadge label="Try-Out ohne Login" value="Ja" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="btn btn-primary">
              Jetzt ausprobieren
            </Link>
            <Link href="/app/example" className="btn border border-white/35 bg-white/8 text-white hover:bg-white/16">
              Beispiel ansehen
            </Link>
            <Link href="/auth" className="btn border border-[#17a7ff]/55 bg-[#17a7ff]/10 text-[#bde9ff] hover:bg-[#17a7ff]/20">
              Anmelden
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Vorher</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#11284c]">
            Führung durch Bauchgefühl und Ad-hoc
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Unklare Prioritäten im Tagesgeschäft</li>
            <li>1:1 Gespräche ohne klares Ergebnis</li>
            <li>Follow-ups gehen im Alltag verloren</li>
          </ul>
        </article>
        <article className="card border-[#b8d8ff] bg-gradient-to-br from-[#eff7ff] to-white">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#25558f]">Nachher mit LeadOS</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#11284c]">
            Klarer Führungsoutput pro Tag
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>3 priorisierte Führungsaktionen mit Timebox</li>
            <li>Strukturierte Agenda + Feedback-Skript im 1:1</li>
            <li>Verbindliche Follow-ups mit Owner und Termin</li>
          </ul>
        </article>
      </section>

      <MiniBriefingDemo />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="card overflow-hidden p-0">
          <div className="relative">
            <Image
              src="/illustrations/leadership-flow.svg"
              alt="LeadOS Workflow Visual"
              width={960}
              height={640}
              className="h-auto w-full"
            />
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
              Produkt-Vorschau
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#11284c]">
              Von Input zu Führungsoutput in einem klaren Flow
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              Dieses Muster zeigt die typische LeadOS-Struktur: Priorisieren, Gespräch vorbereiten
              und Follow-up verbindlich machen.
            </p>
          </div>
        </article>

        <article className="card overflow-hidden p-0">
          <div className="relative">
            <Image
              src="/illustrations/studio-orbit.svg"
              alt="1:1 Studio Visual"
              width={960}
              height={640}
              className="h-auto w-full"
            />
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">1:1 Fokus</p>
            <h3 className="mt-2 text-xl font-semibold text-[#11284c]">
              Gesprächsbausteine im Blick, nächste Schritte direkt klar
            </h3>
            <p className="mt-2 text-sm text-slate-700">
              Agenda, Feedback und Follow-ups entstehen aus einem kompakten Input und bleiben
              jederzeit nachvollziehbar.
            </p>
          </div>
        </article>
      </section>

      <section className="card">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Vertrauenssignale</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {["KMU-Produktion", "IT-Services", "Professional Services", "Handel"].map((item) => (
            <span key={item} className="badge">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <QuoteCard
            quote="Wir kommen in 1:1 Gesprächen sofort auf den Punkt."
            author="Teamlead, 45 MA"
          />
          <QuoteCard
            quote="Daily Briefings sparen uns jeden Tag wertvolle Abstimmungszeit."
            author="Geschäftsführer, 28 MA"
          />
          <QuoteCard
            quote="Die Follow-ups machen Führung endlich messbar."
            author="Bereichsleitung, 62 MA"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card">
          <Image
            src="/illustrations/leadership-flow.svg"
            alt="Daily Briefing Illustration"
            width={960}
            height={640}
            className="mb-3 h-auto w-full rounded-lg border border-slate-200"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            1. Daily Briefing
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Wochenziel + Herausforderung eingeben und sofort 3 priorisierte Führungsaktionen erhalten.
          </p>
        </article>
        <article className="card">
          <Image
            src="/illustrations/studio-orbit.svg"
            alt="1:1 Studio Illustration"
            width={960}
            height={640}
            className="mb-3 h-auto w-full rounded-lg border border-slate-200"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            2. 1:1 Studio
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Agenda, Feedback-Skript und Follow-ups als direkt nutzbares Gesprächspaket generieren.
          </p>
        </article>
        <article className="card">
          <Image
            src="/illustrations/city-grid.svg"
            alt="Sprachprofil Illustration"
            width={1600}
            height={900}
            className="mb-3 h-auto w-full rounded-lg border border-slate-200"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            3. Sprachprofil
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Teammitglied per Leitfragen und Spracheingabe skizzieren, dann ein individuelles Profil erzeugen.
          </p>
        </article>
      </section>

      <section className="card-strong">
        <p className="kicker">Nächster Schritt</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Erst testen, dann Team onboarden.
        </h2>
        <p className="mt-3 max-w-2xl text-slate-200">
          Starte mit Demo-Inputs. Wenn dir die Ergebnisse passen, legst du dein erstes Teammitglied
          an und speicherst alles im Account.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/app" className="btn btn-primary">
            Jetzt Trial starten
          </Link>
          <Link
            href="/auth?next=/app/team"
            className="btn border border-white/35 bg-white/8 text-white hover:bg-white/16"
          >
            Team dauerhaft speichern
          </Link>
        </div>
      </section>
    </main>
  );
}

function ProofBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/25 bg-white/10 p-3 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function QuoteCard({ quote, author }: { quote: string; author: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-800">“{quote}”</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{author}</p>
    </article>
  );
}
