import { NextResponse } from "next/server";
import { loadCoachCatalog } from "@/lib/domain/matching";

export async function GET() {
  const coaches = await loadCoachCatalog();
  return NextResponse.json({ coaches });
}
