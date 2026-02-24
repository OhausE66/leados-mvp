"use client";

import { useMemo, useState } from "react";

type Template = {
  key: string;
  category: string;
  title: string;
  situation: string;
  goal: string;
  questions: string[];
  example_phrases: string[];
  followups: string[];
};

const categories = ["Alle", "Feedback", "Delegation", "Konflikt", "Entwicklung"];

export function TemplateLibrary({ templates }: { templates: Template[] }) {
  const [filter, setFilter] = useState("Alle");

  const filtered = useMemo(() => {
    if (filter === "Alle") {
      return templates;
    }
    return templates.filter((entry) => entry.category === filter);
  }, [filter, templates]);

  return (
    <div className="space-y-5">
      <section className="card aurora">
        <h2 className="text-2xl font-semibold tracking-tight">Template Library</h2>
        <p className="mt-1 text-sm text-slate-600">{templates.length} sofort nutzbare Gesprächsvorlagen</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`btn ${filter === category ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {filtered.map((template) => (
          <details key={template.key} className="card group open:shadow-lg">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-900">{template.title}</h3>
                <span className="badge">{template.category}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{template.situation}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wide text-teal-700 group-open:hidden">
                Öffnen für Details
              </p>
            </summary>
            <div className="mt-4 space-y-3 text-sm">
              <section>
                <p className="font-semibold">Ziel</p>
                <p className="text-slate-700">{template.goal}</p>
              </section>
              <section>
                <p className="font-semibold">Fragen</p>
                <ul className="mt-1 list-disc pl-5 text-slate-700">
                  {template.questions.map((entry, index) => (
                    <li key={index}>{entry}</li>
                  ))}
                </ul>
              </section>
              <section>
                <p className="font-semibold">Beispiel-Sätze</p>
                <ul className="mt-1 list-disc pl-5 text-slate-700">
                  {template.example_phrases.map((entry, index) => (
                    <li key={index}>{entry}</li>
                  ))}
                </ul>
              </section>
              <section>
                <p className="font-semibold">Follow-ups</p>
                <ul className="mt-1 list-disc pl-5 text-slate-700">
                  {template.followups.map((entry, index) => (
                    <li key={index}>{entry}</li>
                  ))}
                </ul>
              </section>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
