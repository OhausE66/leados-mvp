import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthContext, getProfile } from "@/lib/auth";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";

export default async function HomePage() {
  if (isDemoMode()) {
    redirect("/app");
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-4xl p-6 md:pt-16">
        <div className="card-strong aurora">
          <p className="badge">LeadOS Setup</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Startklar in wenigen Minuten</h1>
          <p className="mt-3 text-slate-700">
            Setze zuerst Supabase-Variablen in `.env.local` oder aktiviere `NEXT_PUBLIC_DEMO_MODE=true`.
          </p>
          <Link href="/auth" className="btn btn-primary mt-4">
            Zur Anmeldung
          </Link>
        </div>
      </main>
    );
  }

  const { user } = await getAuthContext();
  if (!user) {
    redirect("/auth");
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    redirect("/onboarding");
  }

  redirect("/app");
}
