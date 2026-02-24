import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getProfile, requireAuth } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isDemoMode()) {
    return <AppShell>{children}</AppShell>;
  }

  const { user } = await requireAuth();
  const profile = await getProfile(user.id);

  if (!profile) {
    redirect("/onboarding");
  }

  return <AppShell>{children}</AppShell>;
}
