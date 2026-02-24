import { NextResponse } from "next/server";

import { formatAIError, generateLeadershipOutputs } from "@/lib/ai";
import { requireApiUser } from "@/lib/api-auth";
import { saveOneOnOne } from "@/lib/db/ai-results";
import { isDemoMode } from "@/lib/env";
import { oneOnOneRequestSchema } from "@/lib/schemas";

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

  const parsed = oneOnOneRequestSchema.safeParse(payload);
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
    let teamMemberName = parsed.data.team_member_name ?? "Teammitglied";

    if (!demoMode && auth) {
      const { data: teamMember, error: teamMemberError } = await auth.supabase
        .from("team_members")
        .select("id, name")
        .eq("id", parsed.data.team_member_id)
        .maybeSingle<{ id: string; name: string }>();

      if (teamMemberError || !teamMember) {
        return NextResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "Team member not found",
            },
          },
          { status: 404 },
        );
      }

      teamMemberName = teamMember.name;
    }

    const output = await generateLeadershipOutputs({
      kind: "one-on-one",
      team_member_name: teamMemberName,
      context: parsed.data.context,
      tone: parsed.data.tone,
      goal: parsed.data.goal,
    });

    if (!demoMode && auth) {
      await saveOneOnOne({
        supabase: auth.supabase,
        userId: auth.user.id,
        teamMemberId: parsed.data.team_member_id,
        inputContext: parsed.data.context,
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
