import Link from "next/link";

export default function ExampleDocumentPage() {
  return (
    <div className="space-y-6">
      <section className="card">
        <p className="kicker">Beispiel-Ausgabe</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#11284c]">
          So sieht ein vollständiges Leadership-Dokument aus
        </h1>
        <p className="mt-3 text-slate-700">
          Dieses Beispiel kombiniert Daily Briefing und 1:1 Output. So kann ein Ergebnis für
          Führungskräfte in LeadOS konkret aussehen.
        </p>
      </section>

      <section className="card space-y-4">
        <h2 className="text-2xl font-semibold text-[#11284c]">Daily Leadership Briefing</h2>
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Aktion 1</p>
            <p className="mt-1 text-lg font-semibold text-[#11284c]">Prioritäten im Team auf Top-3 reduzieren</p>
            <p className="mt-2 text-sm text-slate-700">
              Warum: Das Team arbeitet aktuell auf zu viele Ziele gleichzeitig. Ein Top-3 Fokus
              schafft Geschwindigkeit und senkt Reibung.
            </p>
            <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-800">
              Script: &quot;Heute fokussieren wir uns nur auf drei Ergebnisse: A, B und C.
              Alles andere ist heute bewusst nachrangig.&quot;
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Aktion 2</p>
            <p className="mt-1 text-lg font-semibold text-[#11284c]">Klärungsgespräch mit Engpass-Rolle führen</p>
            <p className="mt-2 text-sm text-slate-700">
              Warum: Der aktuelle Blocker liegt bei unklarer Ownership. Ein 15-Minuten-Reset
              verhindert weitere Verzögerung.
            </p>
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-2xl font-semibold text-[#11284c]">1:1 Studio Ergebnis (Beispiel)</h2>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Agenda</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            <li>Status und Energielevel (5 Min)</li>
            <li>Fortschritt auf Quartalsziel (10 Min)</li>
            <li>Blocker + Unterstützung durch Lead (10 Min)</li>
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Feedback-Skript</p>
          <p className="mt-2 text-sm text-slate-700">
            Opening: &quot;Danke für deinen Einsatz in der letzten Woche. Ich möchte mit dir
            heute strukturiert auf Fokus und Wirkung schauen.&quot;
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Core: &quot;Mir ist aufgefallen, dass du stark in Details gehst, aber dadurch
            Prioritäten zwischen A und B wechseln.&quot;
          </p>
          <p className="mt-2 text-sm text-slate-700">
            Close: &quot;Lass uns bis nächste Woche eine klare Top-2 Priorisierung halten und
            ich unterstütze dich bei Eskalationen.&quot;
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">Follow-ups</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
            <li>Leader: Eskalation mit Stakeholder X bis Freitag</li>
            <li>Mitarbeiter: Top-2 Plan bis morgen 12:00 teilen</li>
          </ul>
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-700">Jetzt selbst ausprobieren:</p>
        <div className="flex gap-2">
          <Link href="/app/daily" className="btn btn-primary">
            Daily testen
          </Link>
          <Link href="/app/one-on-one" className="btn btn-secondary">
            1:1 testen
          </Link>
        </div>
      </section>
    </div>
  );
}
