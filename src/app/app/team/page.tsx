import Image from "next/image";

import { TeamManager, type Note, type TeamMember } from "@/components/team/team-manager";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function TeamHeader() {
  return (
    <section className="card-strong relative overflow-hidden">
      <Image
        src="/illustrations/city-grid.svg"
        alt="Team management hero"
        fill
        className="object-cover opacity-35"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f3f]/92 via-[#11284c]/84 to-[#11284c]/58" />
      <div className="relative z-10">
        <p className="kicker">Teamführung</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Team
          <span className="text-[#17a7ff]">. Struktur. Wirkung.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-slate-200">
          Profile, private Notizen und Gesprächskontext zentral und klar organisiert.
        </p>
      </div>
    </section>
  );
}

export default async function TeamPage() {
  if (isDemoMode()) {
    return (
      <div className="space-y-6">
        <TeamHeader />
        <TeamManager initialTeamMembers={[]} initialNotes={[]} demoMode />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: members }, { data: notes }] = await Promise.all([
    supabase.from("team_members").select("id, name, role, notes_private").order("name"),
    supabase
      .from("notes")
      .select("id, team_member_id, content, tags, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <TeamHeader />
      <TeamManager
        initialTeamMembers={(members ?? []) as TeamMember[]}
        initialNotes={(notes ?? []) as Note[]}
        demoMode={false}
      />
    </div>
  );
}
