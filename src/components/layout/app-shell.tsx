"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { isDemoMode } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navigation = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/team", label: "Team" },
  { href: "/app/daily", label: "Daily Briefing" },
  { href: "/app/one-on-one", label: "1:1 Studio" },
  { href: "/app/templates", label: "Templates" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    if (isDemoMode()) {
      router.replace("/");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/app" className="flex items-center gap-3">
              <div className="inline-flex items-center overflow-hidden rounded border border-slate-300">
                <span className="bg-sky-50 px-2 py-1 text-lg font-bold text-sky-700">hs</span>
                <span className="px-2 py-1 text-lg font-semibold text-slate-600">leadOS</span>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
              {navigation.map((entry) => {
                const active = pathname === entry.href;
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    className={`transition ${
                      active ? "text-slate-900" : "hover:text-slate-900"
                    }`}
                  >
                    {entry.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-slate-800"
              onClick={signOut}
            >
              {isDemoMode() ? "Startseite" : "Abmelden"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 md:px-8 md:pt-8">{children}</main>
    </div>
  );
}
