import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppProfile } from "@/lib/auth";

export async function upsertProfile(params: {
  supabase: SupabaseClient;
  userId: string;
  profile: AppProfile;
}) {
  const { error } = await params.supabase.from("profiles").upsert({
    user_id: params.userId,
    ...params.profile,
  });

  if (error) {
    throw new Error(`Failed to save profile: ${error.message}`);
  }
}
