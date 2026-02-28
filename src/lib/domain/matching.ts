import { readFile } from "node:fs/promises";
import path from "node:path";
import { CoachProfile, CoachRecommendation, MatchingPreferences, Urgency } from "@/lib/domain/types";

let cachedCatalog: CoachProfile[] | null = null;

export async function loadCoachCatalog(): Promise<CoachProfile[]> {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  const catalogPath = path.join(process.cwd(), "data", "coach_catalog.json");

  try {
    const raw = await readFile(catalogPath, "utf-8");
    const parsed = JSON.parse(raw) as CoachProfile[];
    cachedCatalog = Array.isArray(parsed) ? parsed : [];
    return cachedCatalog;
  } catch {
    cachedCatalog = [];
    return [];
  }
}

function urgencyWeight(urgency: Urgency): number {
  if (urgency === "high") return 2;
  if (urgency === "medium") return 1;
  return 0;
}

export async function recommendCoaches(preferences: MatchingPreferences): Promise<CoachRecommendation[]> {
  const catalog = await loadCoachCatalog();

  if (catalog.length === 0) {
    return [
      {
        coach_id: "",
        rank: 1,
        fit_reason: ["Coach-Katalog derzeit nicht verfügbar"],
        risk_flags: ["coach_catalog_missing"],
      },
    ];
  }

  const ranked = catalog
    .map((coach) => {
      const overlap = coach.tags.filter((tag) => preferences.topic_tags.includes(tag));
      const intensityFit =
        preferences.intensity === "unknown" || coach.intensity.includes(preferences.intensity);
      const formatFit = preferences.format === "unknown" || coach.formats.includes(preferences.format);
      const availabilityFit =
        preferences.availability_window.length > 0
          ? coach.availability.toLowerCase().includes(preferences.availability_window.toLowerCase())
          : true;

      let score = overlap.length * 3;
      if (intensityFit) score += 2;
      if (formatFit) score += 2;
      if (availabilityFit) score += 1;
      score += urgencyWeight(preferences.urgency) * (coach.responseSlaHours <= 24 ? 1 : 0);

      const fitReason: string[] = [];
      if (overlap.length > 0) {
        fitReason.push(`Thematische Passung: ${overlap.join(", ")}`);
      }
      if (intensityFit) {
        fitReason.push(`Passender Stil: ${preferences.intensity === "unknown" ? "flexibel" : preferences.intensity}`);
      }
      if (formatFit) {
        fitReason.push(`Format möglich: ${preferences.format === "unknown" ? "mehrere" : preferences.format}`);
      }
      if (availabilityFit) {
        fitReason.push(`Verfügbarkeit: ${coach.availability}`);
      }

      return {
        coach,
        score,
        fitReason,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry, idx) => ({
      coach_id: entry.coach.id,
      rank: (idx + 1) as 1 | 2 | 3,
      fit_reason: entry.fitReason,
      risk_flags: [],
    }));

  return ranked;
}
