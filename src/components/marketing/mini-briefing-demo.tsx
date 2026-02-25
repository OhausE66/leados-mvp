"use client";

import { useMemo, useState } from "react";

type DemoAction = {
  title: string;
  why: string;
  script: string;
  timebox_minutes: number;
};

function buildActions(goal: string, challenge: string): DemoAction[] {
  const shortGoal = goal.trim().slice(0, 70) || "Wochenziel schärfen";
  const shortChallenge = challenge.trim().slice(0, 70) || "Prioritätenkonflikte";

  return [
    {
      title: `Top-Priorität klären: ${shortGoal}`,
      why: "Klare Priorität reduziert Kontextwechsel und sichert Führungsfokus.",
      script: `Heute ist unser Fokus '${shortGoal}'. Ich priorisiere Entscheidungen zu '${shortChallenge}' bis 15:00.`,
      timebox_minutes: 20,
    },
    {
      title: "Engpass im Kernteam früh adressieren",
      why: "Frühe Klärung verhindert Eskalationen am Tagesende.",
      script:
        "Ich starte einen 15-Minuten-Check: Was blockiert uns, welche Entscheidung braucht heute Leadership-Tempo?",
      timebox_minutes: 15,
    },
    {
      title: "Follow-up mit klarer Ownership",
      why: "Verbindliche Owner erhöhen Umsetzung und Verlässlichkeit.",
      script: `Wir schließen mit 2 klaren Zusagen: Owner, nächster Schritt und Deadline zu '${shortChallenge}'.`,
      timebox_minutes: 10,
    },
  ];
}

export function MiniBriefingDemo() {
  const [goal, setGoal] = useState("Launch ohne Eskalation abschließen");
  const [challenge, setChallenge] = useState("Zu viele parallele Prioritäten");
  const [showResult, setShowResult] = useState(false);

  const actions = useMemo(() => buildActions(goal, challenge), [goal, challenge]);

  return (
    <section className="card space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Interaktive Demo</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#11284c]">
          In 20 Sekunden ein Ergebnis sehen
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label>
          <span className="label">Ziel der Woche</span>
          <input className="input" value={goal} onChange={(event) => setGoal(event.target.value)} />
        </label>
        <label>
          <span className="label">Herausforderung</span>
          <input
            className="input"
            value={challenge}
            onChange={(event) => setChallenge(event.target.value)}
          />
        </label>
      </div>

      <button type="button" className="btn btn-primary" onClick={() => setShowResult(true)}>
        Demo-Briefing erzeugen
      </button>

      {showResult ? (
        <div className="grid gap-3 md:grid-cols-3">
          {actions.map((action, index) => (
            <article
              key={`${action.title}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-slate-900">{action.title}</p>
              <p className="mt-2 text-xs text-slate-600">{action.why}</p>
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
                {action.script}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {action.timebox_minutes} Minuten
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
