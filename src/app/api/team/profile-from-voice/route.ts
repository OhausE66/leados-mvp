import { NextResponse } from "next/server";

import { formatAIError, generateTeamVoiceProfile } from "@/lib/ai";
import { requireApiUser } from "@/lib/api-auth";
import { saveTeamVoiceProfile } from "@/lib/db/ai-results";
import { isDemoMode } from "@/lib/env";
import { teamVoiceProfileRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const demoMode = isDemoMode();
  const auth = demoMode ? null : await requireApiUser();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const parsed = teamVoiceProfileRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Request validation failed",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  try {
    const profile = await generateTeamVoiceProfile(parsed.data);

    if (!demoMode && auth && parsed.data.team_member_id) {
      await saveTeamVoiceProfile({
        supabase: auth.supabase,
        userId: auth.user.id,
        teamMemberId: parsed.data.team_member_id,
        profile,
        sourceAnswers: parsed.data.answers,
      });
    }

    return NextResponse.json(
      {
        profile,
        persisted: Boolean(!demoMode && auth && parsed.data.team_member_id),
      },
      { status: 200 },
    );
  } catch (error) {
    const formatted = formatAIError(error);
    const status = formatted.code === "INVALID_INPUT" ? 400 : 500;

    return NextResponse.json(
      {
        error: {
          code: formatted.code,
          message: formatted.message,
          details: formatted.details,
        },
      },
      { status },
    );
  }
}
