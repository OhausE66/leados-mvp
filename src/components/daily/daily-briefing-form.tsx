"use client";

import { useState } from "react";

import { CopyButton } from "@/components/common/copy-button";

type DailyResponse = {
  output: {
    daily_briefing: {
      top_actions: Array<{
        title: string;
        why: string;
        script: string;
        timebox_minutes: number;
      }>;
      watchouts: string[];
    };
    assumptions: string[];
    clarifying_questions: string[];
  };
};

export function DailyBriefingForm() {
  const [weekGoal, setWeekGoal] = useState("");
  const [challenge, setChallenge] = useState("");
  const [tone, setTone] = useState("direkt, respektvoll");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DailyResponse["output"] | null>(null);

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/ai/daily-briefing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ week_goal: weekGoal, challenge, tone, context }),
    });

    const body = (await response.json()) as
      | DailyResponse
      | { error?: { message?: string; code?: string } };

    if (!response.ok || !("output" in body)) {
      const errorMessage =
        "error" in body && body.error?.message ? body.error.message : "Unbekannter Fehler";
      setError(errorMessage);
      setLoading(false);
      return;
    }

    setResult(body.output);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div className="card aurora">
        <h2 className="text-2xl font-semibold tracking-tight">Daily Leadership Briefing</h2>
        <p className="mt-1 text-sm text-slate-600">
          Erhalte maximal 3 priorisierte Aktionen mit Script und Timebox.
        </p>

        <form className="mt-5 grid gap-3" onSubmit={generate}>
          <label>
            <span className="label">Ziel der Woche</span>
            <input
              className="input"
              placeholder="z. B. Launch ohne Eskalationen abschließen"
              required
              value={weekGoal}
              onChange={(event) => setWeekGoal(event.target.value)}
            />
          </label>
          <label>
            <span className="label">Herausforderung</span>
            <input
              className="input"
              placeholder="z. B. Prioritätenkonflikte zwischen Teams"
              required
              value={challenge}
              onChange={(event) => setChallenge(event.target.value)}
            />
          </label>
          <label>
            <span className="label">Ton</span>
            <input
              className="input"
              required
              value={tone}
              onChange={(event) => setTone(event.target.value)}
            />
          </label>
          <label>
            <span className="label">Kontext (optional)</span>
            <textarea
              className="input min-h-24"
              placeholder="Welche Termine, Risiken oder Stakeholder sind heute wichtig?"
              value={context}
              onChange={(event) => setContext(event.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary w-full sm:w-fit" disabled={loading}>
            {loading ? "Generiert..." : "Briefing generieren"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </div>

      {result ? (
        <div className="card space-y-5">
          <h3 className="text-lg font-semibold">Top Aktionen</h3>
          <div className="grid gap-3">
            {result.daily_briefing.top_actions.map((action, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{action.title}</p>
                  <span className="badge">{action.timebox_minutes} Min</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{action.why}</p>
                <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800">
                  {action.script}
                </p>
                <div className="mt-3">
                  <CopyButton text={action.script} />
                </div>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold">Watchouts</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {result.daily_briefing.watchouts.map((watchout, index) => (
                <li key={index}>{watchout}</li>
              ))}
            </ul>
          </div>

          {result.assumptions.length > 0 ? (
            <div>
              <h4 className="font-semibold">Annahmen</h4>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {result.assumptions.map((entry, index) => (
                  <li key={index}>{entry}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.clarifying_questions.length > 0 ? (
            <div>
              <h4 className="font-semibold">Rückfragen</h4>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                {result.clarifying_questions.map((entry, index) => (
                  <li key={index}>{entry}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
