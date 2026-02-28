import { NextResponse } from "next/server";
import { z } from "zod";
import { recommendCoaches } from "@/lib/domain/matching";

const schema = z.object({
  topic_tags: z.array(z.string()).default([]),
  intensity: z.enum(["soft", "clear", "balanced", "unknown"]),
  urgency: z.enum(["low", "medium", "high", "unknown"]),
  format: z.enum(["remote", "onsite", "hybrid", "unknown"]),
  availability_window: z.string().default(""),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const recommendations = await recommendCoaches(payload);
    return NextResponse.json({ recommendations });
  } catch (error) {
    return NextResponse.json(
      {
        error: "MATCHING_REQUEST_INVALID",
        message: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 400 },
    );
  }
}
