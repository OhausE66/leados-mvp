import type { SupabaseClient } from "@supabase/supabase-js";

import type { LeadershipOutput } from "@/lib/schemas";

export async function saveDailyBriefing(params: {
  supabase: SupabaseClient;
  userId: string;
  weekGoal: string;
  challenge: string;
  output: LeadershipOutput;
}) {
  const { error } = await params.supabase.from("daily_briefings").insert({
    user_id: params.userId,
    week_goal: params.weekGoal,
    challenge: params.challenge,
    output_json: params.output,
  });

  if (error) {
    throw new Error(`Failed to save daily briefing: ${error.message}`);
  }
}

export async function saveOneOnOne(params: {
  supabase: SupabaseClient;
  userId: string;
  teamMemberId: string;
  inputContext: string;
  output: LeadershipOutput;
}) {
  const { error } = await params.supabase.from("one_on_ones").insert({
    user_id: params.userId,
    team_member_id: params.teamMemberId,
    input_context: params.inputContext,
    output_json: params.output,
  });

  if (error) {
    throw new Error(`Failed to save one-on-one output: ${error.message}`);
  }
}
