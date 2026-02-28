import { NextResponse } from "next/server";
import { chatInputSchema } from "@/lib/domain/schemas";
import { handleChat } from "@/lib/domain/service";

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as { caseId?: string | null; leaderId?: string; message?: string };
    const normalized = {
      ...raw,
      caseId: raw.caseId ?? undefined,
    };
    const payload = chatInputSchema.parse(normalized);
    const result = await handleChat(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "CHAT_REQUEST_INVALID",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 400 },
    );
  }
}
