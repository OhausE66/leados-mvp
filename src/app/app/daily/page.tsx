import Image from "next/image";

import { DailyBriefingForm } from "@/components/daily/daily-briefing-form";

export default function DailyPage() {
  return (
    <div className="space-y-6">
      <section className="card-strong relative overflow-hidden">
        <Image
          src="/illustrations/city-grid.svg"
          alt="Daily briefing hero"
          fill
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f3f]/92 via-[#11284c]/84 to-[#11284c]/58" />
        <div className="relative z-10">
          <p className="kicker">Daily Leadership</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Fokus
            <span className="text-[#17a7ff]">. Klarheit. Umsetzung.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-200">
            Erzeuge drei präzise Führungsaktionen für den Tag inklusive Script und Timebox.
          </p>
        </div>
      </section>

      <DailyBriefingForm />
    </div>
  );
}
