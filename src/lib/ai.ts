import { z } from "zod";

import {
  aiGenerateInputSchema,
  leadershipOutputSchema,
  teamVoiceProfileRequestSchema,
  teamVoiceProfileSchema,
  type AIGenerateInput,
  type LeadershipOutput,
  type TeamVoiceProfile,
} from "@/lib/schemas";
import { getAiConfig } from "@/lib/env";

export type AIErrorCode =
  | "INVALID_INPUT"
  | "INVALID_OUTPUT"
  | "UNAUTHORIZED"
  | "PROVIDER_ERROR"
  | "CONFIG_ERROR"
  | "UNKNOWN";

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: AIErrorCode,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

function buildDailyMock(input: Extract<AIGenerateInput, { kind: "daily-briefing" }>) {
  const focus = input.week_goal.slice(0, 80);
  const blocker = input.challenge.slice(0, 80);

  return {
    top_actions: [
      {
        title: `Priorisiere Team-Fokus auf: ${focus}`,
        why: "Klare Prioritäten reduzieren Reibung und erhöhen Umsetzungsgeschwindigkeit.",
        script: `Heute priorisieren wir '${focus}'. Blocker '${blocker}' adressieren wir bis 15:00 mit klaren Verantwortlichkeiten.`,
        timebox_minutes: 20,
      },
      {
        title: "Schneller Alignment-Check mit Kernteam",
        why: "Frühes Alignment verhindert spätere Nacharbeit.",
        script:
          "Kurzer Sync: Was ist heute kritisch, was kann warten, und welche Entscheidung braucht mich als Lead sofort?",
        timebox_minutes: 15,
      },
      {
        title: "Risikopunkt aktiv entschärfen",
        why: "Proaktive Risikosteuerung stärkt Lieferfähigkeit.",
        script: `Ich nehme mir den Hauptengpass '${blocker}' direkt vor und sichere ein klares Next Step Commitment.`,
        timebox_minutes: 25,
      },
    ],
    watchouts: [
      "Nicht zu viele Prioritäten gleichzeitig setzen.",
      "Unklare Ownership sofort klären.",
      "Ton sachlich und lösungsorientiert halten.",
    ],
  };
}

function buildOneOnOneMock(
  input: Extract<AIGenerateInput, { kind: "one-on-one" }>,
) {
  return {
    agenda: [
      {
        topic: "Status und Energielevel",
        goal: "Aktuelle Lage schnell verstehen",
        questions: [
          "Was lief seit dem letzten Gespräch gut?",
          "Wo hakt es aktuell am meisten?",
        ],
      },
      {
        topic: `Ziel-Fokus: ${input.goal.slice(0, 70)}`,
        goal: "Konkreten Fortschritt für die nächste Woche sichern",
        questions: [
          "Was ist der wichtigste Fortschritt bis nächste Woche?",
          "Welche Unterstützung brauchst du von mir?",
        ],
      },
    ],
    feedback_script: {
      opening: `Danke für deine Offenheit, ${input.team_member_name}. Ich möchte heute klar und unterstützend auf ${input.goal} schauen.`,
      core: "Mir ist aufgefallen, dass die Priorisierung noch schwankt. Ich möchte, dass wir den Fokus auf den wirkungsvollsten Hebel legen.",
      support:
        "Ich unterstütze dich, indem ich Hindernisse eskaliere und Entscheidungen schneller treffe, wenn du mir Optionen mit kurzer Empfehlung bringst.",
      close:
        "Lass uns mit zwei klaren Zusagen schließen: dein nächster Schritt und mein Support-Schritt bis zum nächsten 1:1.",
    },
    followups: [
      {
        owner: "Leader",
        action: "Blocker im nächsten Leadership-Standup adressieren",
        due_in_days: 2,
      },
      {
        owner: input.team_member_name,
        action: "Priorisierte Aufgabenliste für die nächste Woche teilen",
        due_in_days: 1,
      },
    ],
  };
}

function buildGuardrailsPrompt(): string {
  return [
    "You are a leadership copilot for SMB managers.",
    "Output valid JSON only.",
    "Do not provide legal advice, medical/mental health diagnoses, or discriminatory content.",
    "If information is missing, fill assumptions[] and ask up to 3 clarifying_questions[].",
    "Keep recommendations actionable and concise.",
  ].join(" ");
}

async function callLiveModel(input: AIGenerateInput): Promise<LeadershipOutput> {
  const { apiKey, model } = getAiConfig();
  if (!apiKey) {
    throw new AIServiceError("Missing AI_API_KEY", "CONFIG_ERROR");
  }

  const system = buildGuardrailsPrompt();
  const payload = {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `Generate leadership output JSON that matches this shape exactly: ${JSON.stringify(
          leadershipOutputSchema.shape,
        )}. Input: ${JSON.stringify(input)}`,
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new AIServiceError("Live AI provider error", "PROVIDER_ERROR", {
      status: response.status,
    });
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) {
    throw new AIServiceError("Live AI empty output", "PROVIDER_ERROR");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new AIServiceError("Live AI invalid JSON", "INVALID_OUTPUT", error);
  }

  const validated = leadershipOutputSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AIServiceError(
      "Live AI response schema mismatch",
      "INVALID_OUTPUT",
      validated.error.flatten(),
    );
  }

  return validated.data;
}

function buildMockOutput(input: AIGenerateInput): LeadershipOutput {
  const daily =
    input.kind === "daily-briefing"
      ? buildDailyMock(input)
      : buildDailyMock({
          kind: "daily-briefing",
          week_goal: `1:1 Fortschritt mit ${input.team_member_name}`,
          challenge: "Kapazität und Priorisierung im Team",
          tone: input.tone,
          context: input.context,
        });

  const oneOnOne =
    input.kind === "one-on-one"
      ? buildOneOnOneMock(input)
      : buildOneOnOneMock({
          kind: "one-on-one",
          team_member_name: "Teammitglied",
          context: input.context,
          tone: input.tone,
          goal: input.week_goal,
        });

  const assumptions: string[] = [];
  const clarifyingQuestions: string[] = [];

  if (input.kind === "daily-briefing" && input.context.trim().length === 0) {
    assumptions.push("Kein zusätzlicher Kontext vorhanden; Fokus auf Standard-Leadership-Hebel.");
    clarifyingQuestions.push("Welches Teamziel hat diese Woche den höchsten Business-Impact?");
  }

  if (input.kind === "one-on-one" && input.context.trim().length < 20) {
    assumptions.push("Kontext ist knapp; angenommen, dass das Gespräch entwicklungsorientiert ist.");
    clarifyingQuestions.push("Gibt es konkrete Verhaltensbeispiele aus der letzten Woche?");
  }

  return {
    daily_briefing: daily,
    one_on_one: oneOnOne,
    templates_used: ["structured-feedback", "prioritization-check"],
    assumptions,
    clarifying_questions: clarifyingQuestions.slice(0, 3),
  };
}

export async function generateLeadershipOutputs(
  rawInput: unknown,
): Promise<LeadershipOutput> {
  const inputResult = aiGenerateInputSchema.safeParse(rawInput);
  if (!inputResult.success) {
    throw new AIServiceError("Invalid AI input payload", "INVALID_INPUT", {
      issues: inputResult.error.issues,
    });
  }

  const input = inputResult.data;
  const aiConfig = getAiConfig();

  let candidate: unknown;
  if (aiConfig.mode === "mock" || !aiConfig.apiKey) {
    candidate = buildMockOutput(input);
  } else {
    try {
      candidate = await callLiveModel(input);
    } catch {
      candidate = buildMockOutput(input);
    }
  }

  const result = leadershipOutputSchema.safeParse(candidate);
  if (!result.success) {
    throw new AIServiceError("AI output failed schema validation", "INVALID_OUTPUT", {
      issues: result.error.issues,
    });
  }

  return result.data;
}

export function formatAIError(error: unknown): {
  code: AIErrorCode;
  message: string;
  details?: unknown;
} {
  if (error instanceof AIServiceError) {
    return { code: error.code, message: error.message, details: error.details };
  }

  if (error instanceof z.ZodError) {
    return { code: "INVALID_INPUT", message: "Validation failed", details: error.issues };
  }

  return {
    code: "UNKNOWN",
    message: "Unexpected AI service error",
    details: String(error),
  };
}

export async function generateTeamVoiceProfile(rawInput: unknown): Promise<TeamVoiceProfile> {
  const parsed = teamVoiceProfileRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AIServiceError("Invalid voice profile input", "INVALID_INPUT", {
      issues: parsed.error.issues,
    });
  }

  const { team_member_name: teamMemberName, answers } = parsed.data;
  const answerText = answers.map((entry) => entry.answer).join(" ").toLowerCase();

  const profile: TeamVoiceProfile = {
    summary: `${teamMemberName} zeigt klare Potenziale mit Fokus auf Umsetzung und Kommunikation im Team.`,
    strengths: [
      "Hohe Verantwortungsbereitschaft",
      "Gute fachliche Stabilität in Kernaufgaben",
      "Bereitschaft zur Zusammenarbeit",
    ],
    growth_areas: [
      "Prioritäten im Tagesgeschäft konsequenter halten",
      "Früher auf Risiken und Blocker hinweisen",
    ],
    motivation_triggers: [
      "Klare Ziele mit sichtbarem Impact",
      "Vertrauen und Entscheidungsspielraum",
    ],
    stress_signals: [
      "Zögerliche Kommunikation bei Zielkonflikten",
      "Wechsel zwischen zu vielen Parallelthemen",
    ],
    communication_style: "Direkt und sachlich, bei Druck punktuell zurückhaltend.",
    feedback_preference: "Konkret, beobachtbar und mit klarer nächster Handlung.",
    leadership_recommendations: [
      "Top-3 Prioritäten pro Woche fixieren und sichtbar halten",
      "Frühe Eskalationsregeln für Blocker vereinbaren",
      "Kurze wöchentliche Check-ins mit konkreten Commitments nutzen",
    ],
    first_1on1_focus: [
      "Aktuelle Top-2 Ziele und Hindernisse",
      "Konkreter Supportbedarf durch die Führungskraft",
      "Messbarer Fortschritt bis zum nächsten Termin",
    ],
    confidence: "medium",
    assumptions: [],
    clarifying_questions: [],
  };

  if (answerText.includes("konflikt") || answerText.includes("spannung")) {
    profile.growth_areas.unshift("Konfliktsituationen proaktiv und strukturiert adressieren");
    profile.first_1on1_focus.unshift("Aktuelle Konfliktlage und gewünschtes Zielbild klären");
  }

  if (answerText.includes("motivation") || answerText.includes("antrieb")) {
    profile.motivation_triggers.unshift("Sichtbare Anerkennung von Fortschritten");
  }

  if (answers.length < 6) {
    profile.assumptions.push("Es wurden nur wenige Antworten gegeben; Profil basiert auf begrenztem Kontext.");
    profile.clarifying_questions.push(
      "Welche zwei Verhaltensbeispiele aus den letzten 14 Tagen sind für die Entwicklung am wichtigsten?",
    );
  }

  const validated = teamVoiceProfileSchema.safeParse(profile);
  if (!validated.success) {
    throw new AIServiceError("Generated voice profile failed schema validation", "INVALID_OUTPUT", {
      issues: validated.error.issues,
    });
  }

  return validated.data;
}
