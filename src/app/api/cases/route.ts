import { NextResponse } from "next/server";
import { listCases } from "@/lib/domain/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const leaderId = url.searchParams.get("leaderId");
  const role = url.searchParams.get("role");

  const cases = await listCases();

  if (role === "leader" && leaderId) {
    return NextResponse.json({ cases: cases.filter((item) => item.leaderId === leaderId) });
  }

  return NextResponse.json({ cases });
}
