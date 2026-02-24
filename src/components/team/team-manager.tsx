"use client";

import { useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  notes_private: string | null;
};

export type Note = {
  id: string;
  team_member_id: string;
  content: string;
  tags: string[];
  created_at: string;
};

export function TeamManager({
  initialTeamMembers,
  initialNotes,
  demoMode,
}: {
  initialTeamMembers: TeamMember[];
  initialNotes: Note[];
  demoMode: boolean;
}) {
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [notes, setNotes] = useState(initialNotes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({ name: "", role: "", notes_private: "" });
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => (demoMode ? null : createSupabaseBrowserClient()), [demoMode]);

  async function resetAndReload() {
    if (!supabase) {
      return;
    }

    const [{ data: memberData }, { data: noteData }] = await Promise.all([
      supabase.from("team_members").select("id, name, role, notes_private").order("name"),
      supabase
        .from("notes")
        .select("id, team_member_id, content, tags, created_at")
        .order("created_at", { ascending: false }),
    ]);

    setTeamMembers((memberData ?? []) as TeamMember[]);
    setNotes((noteData ?? []) as Note[]);
  }

  async function saveMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!memberForm.name || !memberForm.role) {
      setError("Name und Rolle sind erforderlich.");
      return;
    }

    if (demoMode) {
      if (editingId) {
        setTeamMembers((prev) =>
          prev.map((member) =>
            member.id === editingId
              ? {
                  ...member,
                  name: memberForm.name,
                  role: memberForm.role,
                  notes_private: memberForm.notes_private,
                }
              : member,
          ),
        );
      } else {
        setTeamMembers((prev) => [
          {
            id: crypto.randomUUID(),
            name: memberForm.name,
            role: memberForm.role,
            notes_private: memberForm.notes_private,
          },
          ...prev,
        ]);
      }

      setMemberForm({ name: "", role: "", notes_private: "" });
      setEditingId(null);
      return;
    }

    if (editingId) {
      const { error: updateError } = await supabase!
        .from("team_members")
        .update(memberForm)
        .eq("id", editingId);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase!.auth.getUser();
      if (!user) {
        setError("Bitte neu einloggen.");
        return;
      }

      const { error: insertError } = await supabase!.from("team_members").insert({
        ...memberForm,
        user_id: user.id,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    setMemberForm({ name: "", role: "", notes_private: "" });
    setEditingId(null);
    await resetAndReload();
  }

  async function addNote(memberId: string) {
    const content = noteDrafts[memberId]?.trim();
    if (!content) {
      return;
    }

    if (demoMode) {
      setNotes((prev) => [
        {
          id: crypto.randomUUID(),
          team_member_id: memberId,
          content,
          tags: ["private"],
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNoteDrafts((prev) => ({ ...prev, [memberId]: "" }));
      return;
    }

    const {
      data: { user },
    } = await supabase!.auth.getUser();
    if (!user) {
      setError("Bitte neu einloggen.");
      return;
    }

    const { error: insertError } = await supabase!.from("notes").insert({
      user_id: user.id,
      team_member_id: memberId,
      content,
      tags: ["private"],
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNoteDrafts((prev) => ({ ...prev, [memberId]: "" }));
    await resetAndReload();
  }

  function beginEdit(member: TeamMember) {
    setEditingId(member.id);
    setMemberForm({
      name: member.name,
      role: member.role,
      notes_private: member.notes_private ?? "",
    });
  }

  return (
    <div className="space-y-5">
      {demoMode ? (
        <div className="card border-teal-200 bg-teal-50 text-teal-900">
          Demo Mode aktiv: Teamdaten bleiben nur lokal im Browser.
        </div>
      ) : null}

      <div className="card aurora">
        <h2 className="text-2xl font-semibold tracking-tight">Teammitglied anlegen / bearbeiten</h2>
        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={saveMember}>
          <label>
            <span className="label">Name</span>
            <input
              className="input"
              value={memberForm.name}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>
          <label>
            <span className="label">Rolle</span>
            <input
              className="input"
              value={memberForm.role}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, role: event.target.value }))}
              required
            />
          </label>
          <label className="md:col-span-2">
            <span className="label">Private Notes Mode (Kurznotiz)</span>
            <textarea
              className="input min-h-24"
              value={memberForm.notes_private}
              onChange={(event) =>
                setMemberForm((prev) => ({ ...prev, notes_private: event.target.value }))
              }
            />
          </label>
          <div className="flex items-center gap-2 md:col-span-2">
            <button type="submit" className="btn btn-primary">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setMemberForm({ name: "", role: "", notes_private: "" });
                }}
              >
                Abbrechen
              </button>
            ) : null}
          </div>
        </form>
        {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </div>

      <div className="space-y-3">
        {teamMembers.length === 0 ? (
          <div className="card text-slate-600">Noch keine Teammitglieder vorhanden.</div>
        ) : (
          teamMembers.map((member) => {
            const memberNotes = notes.filter((entry) => entry.team_member_id === member.id);
            return (
              <article key={member.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{member.name}</h3>
                    <p className="text-sm text-slate-600">{member.role}</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => beginEdit(member)}>
                    Bearbeiten
                  </button>
                </div>

                {member.notes_private ? (
                  <p className="mt-3 rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-sm text-slate-700">
                    {member.notes_private}
                  </p>
                ) : null}

                <div className="mt-4">
                  <label className="label">Neue Notiz</label>
                  <textarea
                    className="input min-h-24"
                    value={noteDrafts[member.id] ?? ""}
                    onChange={(event) =>
                      setNoteDrafts((prev) => ({ ...prev, [member.id]: event.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="btn btn-primary mt-2"
                    onClick={() => void addNote(member.id)}
                  >
                    Notiz speichern
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Gespeicherte Notizen</p>
                  {memberNotes.length === 0 ? (
                    <p className="text-sm text-slate-500">Keine Notizen vorhanden.</p>
                  ) : (
                    memberNotes.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <p>{entry.content}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(entry.created_at).toLocaleString("de-DE")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
