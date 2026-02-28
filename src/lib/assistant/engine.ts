import { createHash } from "node:crypto";
import { recommendCoaches } from "@/lib/domain/matching";
import { abstractSensitiveContent, detectEscalation, privacyReminder } from "@/lib/domain/privacy";
import { AssistantMachineOutput, CaseRecord, MatchingPreferences, Phase } from "@/lib/domain/types";
import { createLlmProvider } from "@/lib/providers/llm";
import { getAssistantPolicy } from "@/lib/assistant/policy";

function inferPreferences(text: string): MatchingPreferences {
  const lower = text.toLowerCase();

  const tags: string[] = [];
  if (/konflikt|team/.test(lower)) tags.push("teamkonflikt");
  if (/führung|rolle|leadership/.test(lower)) tags.push("führung");
  if (/feedback|gespräch/.test(lower)) tags.push("feedback");
  if (/zeit|prior|fokus/.test(lower)) tags.push("selbstmanagement");
  if (/change|transformation|reorg/.test(lower)) tags.push("change");

  let intensity: MatchingPreferences["intensity"] = "unknown";
  if (/weich|sanft|soft/.test(lower)) intensity = "soft";
  if (/klar|direkt|clear/.test(lower)) intensity = "clear";
  if (/ausgewogen|balanced|balanc/.test(lower)) intensity = "balanced";

  let urgency: MatchingPreferences["urgency"] = "unknown";
  if (/sofort|dringend|diese woche|hoch/.test(lower)) urgency = "high";
  if (/bald|zeitnah|mittel/.test(lower)) urgency = "medium";
  if (/kein druck|niedrig|später/.test(lower)) urgency = "low";

  let format: MatchingPreferences["format"] = "unknown";
  if (/remote|online|video/.test(lower)) format = "remote";
  if (/vor ort|onsite|büro/.test(lower)) format = "onsite";
  if (/hybrid/.test(lower)) format = "hybrid";

  const availabilityMatch = lower.match(/(montag|dienstag|mittwoch|donnerstag|freitag|nächste woche|diese woche)/);

  return {
    topic_tags: Array.from(new Set(tags)),
    intensity,
    urgency,
    format,
    availability_window: availabilityMatch?.[0] ?? "",
  };
}

function coachingNeededHeuristic(text: string): "yes" | "no" | "unclear" {
  const lower = text.toLowerCase();
  if (/eskaliert|kündigung|teamkrise|überfordert|massiver konflikt/.test(lower)) return "yes";
  if (/kleine frage|kurzer tipp|selbst lösen|ohne coach|nur impuls/.test(lower)) return "no";
  return "unclear";
}

function buildClarifyingQuestions(prefs: MatchingPreferences, asked: number): string[] {
  const remaining = Math.max(0, 3 - asked);
  if (remaining === 0) {
    return [];
  }

  const questions: string[] = [];
  if (prefs.topic_tags.length === 0) {
    questions.push("Welches konkrete Ziel oder Ergebnis soll das Coaching erreichen?");
  }
  if (prefs.intensity === "unknown") {
    questions.push("Bevorzugst du eher einen soften oder klar-direkten Coaching-Stil?");
  }
  if (prefs.format === "unknown" || prefs.availability_window.length === 0) {
    questions.push("Welches Format und welcher Zeitraum passt dir am besten (remote/onsite/hybrid, z. B. nächste Woche)?");
  }
  if (prefs.urgency === "unknown") {
    questions.push("Wie dringend ist das Anliegen (niedrig, mittel, hoch)?");
  }

  if (questions.length === 0) {
    return [];
  }

  // Progression by turn: first clarification -> first question, second -> second, third -> third.
  const questionIndex = Math.min(asked, questions.length - 1);
  return [questions[questionIndex]];
}

function buildSelfHelp(): AssistantMachineOutput["self_help_micro_coaching"] {
  return {
    provided: true,
    tips: [
      "Formuliere dein Ziel für das nächste Gespräch in einem klaren Satz.",
      "Nutze die 2x2-Matrix: Einfluss vs. Wichtigkeit, um Prioritäten zu ordnen.",
      "Plane ein 15-Minuten-Reflexionsfenster direkt nach dem nächsten Führungstermin.",
    ],
    check_question: "Hilft dir das bereits ausreichend, oder möchtest du trotzdem ein Coaching starten?",
  };
}

function defaultMachineOutput(summary: string, prefs: MatchingPreferences): AssistantMachineOutput {
  return {
    phase: "intake",
    privacy_reminder_shown: true,
    case_summary: summary,
    clarifying_questions: [],
    self_help_micro_coaching: {
      provided: false,
      tips: [],
      check_question: "",
    },
    coaching_needed: "unclear",
    matching_preferences: prefs,
    coach_recommendations: [],
    platform_message_draft: {
      to_coach: "",
      subject: "",
      body: "",
    },
    booking_proposal: {
      requested_hours: null,
      hourly_rate_eur: 200,
      proposed_dates: [],
      requires_dual_confirmation: true,
    },
    handoff_to_human: {
      required: false,
      reason: "",
    },
  };
}

function buildPlatformMessageDraft(summary: string, coachId: string): AssistantMachineOutput["platform_message_draft"] {
  return {
    to_coach: coachId,
    subject: "Erstanfrage Coaching über Plattform",
    body: `Kurzprofil Anliegen (abstrahiert): ${summary}.\nGewünschter Start: zeitnah. Bitte Annahme/Ablehnung in der Plattform.`,
  };
}

export async function runAssistant(input: {
  message: string;
  existingCase?: CaseRecord;
}): Promise<{ text: string; machine: AssistantMachineOutput; policyHash: string }> {
  const sanitized = abstractSensitiveContent(input.message);
  const prefs = inferPreferences(sanitized);
  const escalation = detectEscalation(sanitized);
  const asked = input.existingCase?.clarifyingQuestionsAsked ?? 0;
  const policyHash = createHash("sha1").update(getAssistantPolicy()).digest("hex").slice(0, 10);

  const machine = defaultMachineOutput(sanitized, prefs);
  machine.case_summary = sanitized;

  if (escalation.required) {
    machine.phase = "intake";
    machine.coaching_needed = "unclear";
    machine.handoff_to_human = escalation;
    const base = [
      privacyReminder(),
      "Ich kann diesen Fall nicht weiter triagieren.",
      "Bitte sofortige Übergabe an PE/geeignete interne Stelle auslösen.",
    ].join(" ");

    return {
      text: await createLlmProvider().rewriteResponse(`${base}\n\n---JSON---\n${JSON.stringify(machine, null, 2)}`),
      machine,
      policyHash,
    };
  }

  const needed = coachingNeededHeuristic(sanitized);
  machine.coaching_needed = needed;

  if (needed === "no") {
    machine.phase = "self_help";
    machine.self_help_micro_coaching = buildSelfHelp();

    const base = [
      privacyReminder(),
      "Auf Basis deiner Skizze wirkt ein direkter Coaching-Einstieg aktuell optional.",
      "Ich habe dir kurze Mikro-Impulse ergänzt.",
    ].join(" ");

    return {
      text: await createLlmProvider().rewriteResponse(`${base}\n\n---JSON---\n${JSON.stringify(machine, null, 2)}`),
      machine,
      policyHash,
    };
  }

  const questions = buildClarifyingQuestions(prefs, asked);
  const shouldAskMore = questions.length > 0 && asked < 2;

  if (shouldAskMore) {
    machine.phase = "clarify";
    machine.clarifying_questions = questions;
    const base = [
      privacyReminder(),
      "Danke, ich habe dein Anliegen abstrahiert zusammengefasst.",
      `Ich brauche noch ${questions.length} kurze Klärung(en), bevor ich passende Coaches empfehle.`,
    ].join(" ");

    return {
      text: await createLlmProvider().rewriteResponse(`${base}\n\n---JSON---\n${JSON.stringify(machine, null, 2)}`),
      machine,
      policyHash,
    };
  }

  const recs = await recommendCoaches(prefs);
  machine.phase = "recommend";
  machine.coach_recommendations = recs;

  if (recs.length === 1 && recs[0].risk_flags.includes("coach_catalog_missing")) {
    machine.coaching_needed = "unclear";
    machine.clarifying_questions = [
      "Welche Themen-Schwerpunkte sind für dich am wichtigsten?",
      "Welcher Stil (soft/klar/balanced) passt für dich?",
      "Welches Zeitfenster ist realistisch?",
    ];
  } else if (recs[0]) {
    machine.platform_message_draft = buildPlatformMessageDraft(sanitized, recs[0].coach_id);
  }

  const base = [
    privacyReminder(),
    "Coaching erscheint sinnvoll. Ich habe dir die Top-3-Matches mit Begründung vorbereitet.",
    "Wenn du willst, erstelle ich direkt die Plattform-Nachricht an den bevorzugten Coach.",
  ].join(" ");

  return {
    text: await createLlmProvider().rewriteResponse(`${base}\n\n---JSON---\n${JSON.stringify(machine, null, 2)}`),
    machine,
    policyHash,
  };
}

export function deriveCasePhase(machine: AssistantMachineOutput): Phase | "handoff" {
  if (machine.handoff_to_human.required) {
    return "handoff";
  }

  return machine.phase;
}
