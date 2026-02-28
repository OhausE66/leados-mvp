import { NextResponse } from "next/server";
import { getPeReport } from "@/lib/domain/service";

export async function GET() {
  const report = await getPeReport();
  const totalCases = report.length;
  const totalEstimatedMinutesSaved = report.reduce(
    (sum, item) => sum + item.estimatedPeTimeSavedMinutes,
    0,
  );

  return NextResponse.json({
    report,
    summary: {
      totalCases,
      totalEstimatedMinutesSaved,
    },
  });
}
