import Image from "next/image";

import { OneOnOneStudio, type TeamMember } from "@/components/one-on-one/one-on-one-studio";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function OneOnOneHeader() {
  return (
    <section className="card-strong relative overflow-hidden">
      <Image
        src="/illustrations/city-grid.svg"
        alt="One-on-one hero"
        fill
        className="object-cover opacity-35"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f3f]/92 via-[#11284c]/84 to-[#11284c]/58" />
      <div className="relative z-10">
        <p className="kicker">1:1 Studio</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Gespräche
          <span className="text-[#17a7ff]">. Präzise. Führungsstark.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-slate-200">
          Agenda, Feedback-Skript und Follow-ups für wirksame 1:1s auf Knopfdruck.
        </p>
      </div>
    </section>
  );
}

export default async function OneOnOnePage() {
  if (isDemoMode()) {
    const demoMembers: TeamMember[] = [
      { id: "demo-1", name: "Alex", role: "Product Manager" },
      { id: "demo-2", name: "Sam", role: "Engineer" },
    ];

    return (
      <div className="space-y-6">
        <OneOnOneHeader />
        <OneOnOneStudio teamMembers={demoMembers} />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("id, name, role")
    .order("name");

  return (
    <div className="space-y-6">
      <OneOnOneHeader />
      {teamMembers && teamMembers.length > 0 ? (
        <OneOnOneStudio teamMembers={teamMembers as TeamMember[]} />
      ) : (
        <div className="card text-slate-700">
          Bitte zuerst Teammitglieder anlegen, bevor du ein 1:1 erzeugst.
        </div>
      )}
    </div>
  );
}
