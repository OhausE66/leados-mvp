import { NextResponse } from "next/server";
import { createContactRequest, listMessages, respondToContact } from "@/lib/domain/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const coachId = url.searchParams.get("coachId");
  const leaderId = url.searchParams.get("leaderId");

  const all = await listMessages();

  if (role === "coach" && coachId) {
    return NextResponse.json({ messages: all.filter((message) => message.coachId === coachId) });
  }

  if (role === "leader" && leaderId) {
    return NextResponse.json({ messages: all.filter((message) => message.leaderId === leaderId) });
  }

  return NextResponse.json({ messages: all });
}

export async function POST(request: Request) {
  try {
    const message = await createContactRequest(await request.json());
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      {
        error: "MESSAGE_CREATE_FAILED",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const message = await respondToContact(await request.json());
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      {
        error: "MESSAGE_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 400 },
    );
  }
}
