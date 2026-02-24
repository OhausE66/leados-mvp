"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { isDemoMode } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const defaults = {
  leadership_level: "Teamlead",
  industry: "SaaS",
  team_size: "6-10",
  team_setup: "Hybrid",
  tone: "direkt, respektvoll",
};

export default function OnboardingPage() {
  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isDemoMode()) {
      return;
    }

    const check = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        router.replace("/app");
      }
    };

    void check();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (isDemoMode()) {
      router.replace("/app");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Nicht eingeloggt.");
      setSaving(false);
      return;
    }

    const { error: upsertError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      ...form,
    });

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
      return;
    }

    router.replace("/app");
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 md:pt-12">
      <section className="card-strong relative overflow-hidden">
        <Image
          src="/illustrations/city-grid.svg"
          alt="Onboarding hero"
          fill
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f3f]/92 via-[#11284c]/84 to-[#11284c]/58" />
        <div className="relative z-10">
          <p className="kicker">Onboarding</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Führungsprofil
            <span className="text-[#17a7ff]">. Präzise hinterlegen.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-200">
            Einmalige Einrichtung für personalisierte Outputs, Tonalität und Teamkontext.
          </p>
        </div>
      </section>

      <section className="card">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Field
            label="Rolle"
            value={form.leadership_level}
            onChange={(value) => setForm((prev) => ({ ...prev, leadership_level: value }))}
          />
          <Field
            label="Branche"
            value={form.industry}
            onChange={(value) => setForm((prev) => ({ ...prev, industry: value }))}
          />
          <Field
            label="Teamgröße"
            value={form.team_size}
            onChange={(value) => setForm((prev) => ({ ...prev, team_size: value }))}
          />
          <Field
            label="Team-Setup"
            value={form.team_setup}
            onChange={(value) => setForm((prev) => ({ ...prev, team_setup: value }))}
          />
          <div className="md:col-span-2">
            <Field
              label="Tonpräferenz"
              value={form.tone}
              onChange={(value) => setForm((prev) => ({ ...prev, tone: value }))}
            />
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Speichert..." : "Onboarding speichern"}
            </button>
          </div>
        </form>

        {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        className="input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}
