import Image from "next/image";

import { TemplateLibrary } from "@/components/templates/template-library";
import templates from "@/data/templates.json";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <section className="card-strong relative overflow-hidden">
        <Image
          src="/illustrations/city-grid.svg"
          alt="Templates hero"
          fill
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f3f]/92 via-[#11284c]/84 to-[#11284c]/58" />
        <div className="relative z-10">
          <p className="kicker">Template Library</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Vorlagen
            <span className="text-[#17a7ff]">. Klar. Einsetzbar.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-200">
            Starke Gesprächsleitfäden für Feedback, Delegation, Konflikt und Entwicklung.
          </p>
        </div>
      </section>

      <TemplateLibrary templates={templates} />
    </div>
  );
}
