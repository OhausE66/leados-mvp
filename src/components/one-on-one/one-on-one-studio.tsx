"use client";

import { useState } from "react";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
};

type OneOnOneResponse = {
  output: {
    one_on_one: {
      agenda: Array<{ topic: string; goal: string; questions: string[] }>;
      feedback_script: {
        opening: string;
        core: string;
        support: string;
        close: string;
      };
      followups: Array<{ owner: string; action: string; due_in_days: number }>;
    };
    assumptions: string[];
    clarifying_questions: string[];
  };
};

export function OneOnOneStudio({ teamMembers }: { teamMembers: TeamMember[] }) {
  const [teamMemberId, setTeamMemberId] = useState(teamMembers[0]?.id ?? "");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("direkt, unterstützend");
  const [goal, setGoal] = useState("Leistungsentwicklung und Fokus");
  const [result, setResult] = useState<OneOnOneResponse["output"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const selectedMember = teamMembers.find((entry) => entry.id === teamMemberId);
    const response = await fetch("/api/ai/one-on-one", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        team_member_id: teamMemberId,
        team_member_name: selectedMember?.name,
        context,
        tone,
        goal,
      }),
    });

    const body = (await response.json()) as OneOnOneResponse | { error?: { message?: string } };

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
        <h2 className="text-2xl font-semibold tracking-tight">1:1 Studio</h2>
        <p className="mt-1 text-sm text-slate-600">
          Agenda, Feedback-Skript und Follow-ups in einem Schritt.
        </p>

        <form className="mt-5 grid gap-3" onSubmit={generate}>
          <label>
            <span className="label">Teammitglied</span>
            <select
              className="input"
              value={teamMemberId}
              onChange={(event) => setTeamMemberId(event.target.value)}
              required
            >
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Gesprächsziel</span>
            <input
              className="input"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              required
            />
          </label>
          <label>
            <span className="label">Ton</span>
            <input
              className="input"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              required
            />
          </label>
          <label>
            <span className="label">Kontext</span>
            <textarea
              className="input min-h-28"
              placeholder="Was ist seit dem letzten Gespräch passiert?"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary w-full sm:w-fit" disabled={loading || !teamMemberId}>
            {loading ? "Generiert..." : "1:1 Paket generieren"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </div>

      {result ? (
        <div className="card space-y-5">
          <div>
            <h3 className="text-lg font-semibold">Agenda</h3>
            <div className="mt-3 space-y-3">
              {result.one_on_one.agenda.map((item, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4"
                >
                  <p className="font-semibold text-slate-900">{item.topic}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.goal}</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                    {item.questions.map((question, qIndex) => (
                      <li key={qIndex}>{question}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Feedback-Skript</h3>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <ScriptBlock title="Opening" text={result.one_on_one.feedback_script.opening} />
              <ScriptBlock title="Core" text={result.one_on_one.feedback_script.core} />
              <ScriptBlock title="Support" text={result.one_on_one.feedback_script.support} />
              <ScriptBlock title="Close" text={result.one_on_one.feedback_script.close} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Follow-ups</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {result.one_on_one.followups.map((entry, index) => (
                <li key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                  <span className="font-semibold">{entry.owner || "Leader"}</span>
                  <span className="text-slate-700">: {entry.action}</span>
                  <span className="ml-2 badge">+{entry.due_in_days} Tage</span>
                </li>
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

function ScriptBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-slate-700">{text}</p>
    </div>
  );
}
