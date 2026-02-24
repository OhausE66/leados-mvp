import { NextResponse } from "next/server";

import { formatAIError, generateLeadershipOutputs } from "@/lib/ai";
import { requireApiUser } from "@/lib/api-auth";
import { saveDailyBriefing } from "@/lib/db/ai-results";
import { isDemoMode } from "@/lib/env";
import { dailyBriefingRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const demoMode = isDemoMode();
  const auth = demoMode ? null : await requireApiUser();
  if (!demoMode && !auth) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid JSON body" } },
      { status: 400 },
    );
  }

  const parsed = dailyBriefingRequestSchema.safeParse(payload);
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
    const output = await generateLeadershipOutputs({
      kind: "daily-briefing",
      week_goal: parsed.data.week_goal,
      challenge: parsed.data.challenge,
      tone: parsed.data.tone,
      context: parsed.data.context,
    });

    if (!demoMode && auth) {
      await saveDailyBriefing({
        supabase: auth.supabase,
        userId: auth.user.id,
        weekGoal: parsed.data.week_goal,
        challenge: parsed.data.challenge,
        output,
      });
    }

    return NextResponse.json({ output }, { status: 200 });
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
