import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppProfile = {
  leadership_level: string;
  industry: string;
  team_size: string;
  team_setup: string;
  tone: string;
};

export async function getAuthContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireAuth() {
  const context = await getAuthContext();

  if (!context.user) {
    redirect("/auth");
  }

  return { supabase: context.supabase, user: context.user };
}

export async function getProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("leadership_level, industry, team_size, team_setup, tone")
    .eq("user_id", userId)
    .maybeSingle<AppProfile>();

  return data;
}

export async function requireOnboarding() {
  const { user } = await requireAuth();

  const profile = await getProfile(user.id);
  if (!profile) {
    redirect("/onboarding");
  }

  return { user, profile };
}
