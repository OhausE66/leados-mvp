"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      if (!isSupabaseConfigured()) {
        return;
      }
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.replace("/app");
      }
    };
    void run();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMessage(error.message);
        } else {
          setMessage("Account angelegt. Bitte prüfe ggf. deine E-Mails zur Bestätigung.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(error.message);
        } else {
          router.replace("/app");
        }
      }
    } catch (error) {
      setMessage(String(error));
    } finally {
      setLoading(false);
    }
  }

  if (isDemoMode()) {
    return (
      <main className="mx-auto max-w-4xl p-6 md:pt-16">
        <section className="card-strong relative overflow-hidden">
          <Image
            src="/illustrations/city-grid.svg"
            alt="Demo hero"
            fill
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f3f]/92 via-[#11284c]/84 to-[#11284c]/58" />
          <div className="relative z-10">
            <p className="kicker">Demo Access</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Start
              <span className="text-[#17a7ff]">. Sofort. Ohne Login.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-slate-200">
              Demo Mode ist aktiv. Du kannst direkt mit allen Kernflows starten.
            </p>
            <Link href="/app" className="btn btn-primary mt-5">
              Zur Demo-App
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-xl p-6 md:pt-16">
        <div className="card">
          <h1 className="text-2xl font-semibold text-[#11284c]">LeadOS Auth</h1>
          <p className="mt-3 text-slate-700">
            Fehlende Supabase-Konfiguration. Setze `NEXT_PUBLIC_SUPABASE_URL` und
            `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:pt-12">
      <section className="card-strong relative overflow-hidden">
        <Image
          src="/illustrations/city-grid.svg"
          alt="Auth hero"
          fill
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f3f]/92 via-[#11284c]/84 to-[#11284c]/58" />
        <div className="relative z-10">
          <p className="kicker">LeadOS</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Results
            <span className="text-[#17a7ff]"> through Leadership.</span>
          </h1>
          <p className="mt-3 max-w-xl text-slate-200">
            Daily Briefings, 1:1-Skripte und Follow-ups in einer klaren Führungsoberfläche.
          </p>
        </div>
      </section>

      <section className="card">
        <p className="kicker">Account</p>
        <h2 className="mt-2 text-3xl font-semibold text-[#11284c]">
          {mode === "signin" ? "Anmelden" : "Registrieren"}
        </h2>

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="email">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              className="input"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              className="input"
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Bitte warten..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        {message ? <p className="mt-3 text-sm font-medium text-slate-700">{message}</p> : null}

        <button
          type="button"
          className="mt-4 text-sm font-semibold text-[#11284c] underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Neu hier? Account erstellen" : "Schon registriert? Sign in"}
        </button>
      </section>
    </main>
  );
}
