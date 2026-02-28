export type Role = "leader" | "coach" | "pe";

export type Phase =
  | "intake"
  | "clarify"
  | "self_help"
  | "recommend"
  | "contact"
  | "booking";

export type Intensity = "soft" | "clear" | "balanced" | "unknown";
export type Urgency = "low" | "medium" | "high" | "unknown";
export type Format = "remote" | "onsite" | "hybrid" | "unknown";

export interface MatchingPreferences {
  topic_tags: string[];
  intensity: Intensity;
  urgency: Urgency;
  format: Format;
  availability_window: string;
}

export interface CoachRecommendation {
  coach_id: string;
  rank: 1 | 2 | 3;
  fit_reason: string[];
  risk_flags: string[];
}

export interface AssistantMachineOutput {
  phase: Phase;
  privacy_reminder_shown: true;
  case_summary: string;
  clarifying_questions: string[];
  self_help_micro_coaching: {
    provided: boolean;
    tips: string[];
    check_question: string;
  };
  coaching_needed: "yes" | "no" | "unclear";
  matching_preferences: MatchingPreferences;
  coach_recommendations: CoachRecommendation[];
  platform_message_draft: {
    to_coach: string;
    subject: string;
    body: string;
  };
  booking_proposal: {
    requested_hours: number | null;
    hourly_rate_eur: 200;
    proposed_dates: string[];
    requires_dual_confirmation: true;
  };
  handoff_to_human: {
    required: boolean;
    reason: string;
  };
}

export interface CoachProfile {
  id: string;
  displayName: string;
  tags: string[];
  intensity: Exclude<Intensity, "unknown">[];
  formats: Exclude<Format, "unknown">[];
  availability: string;
  responseSlaHours: number;
}

export interface CaseRecord {
  id: string;
  leaderId: string;
  status: Phase | "handoff" | "done";
  createdAt: string;
  updatedAt: string;
  clarifyingQuestionsAsked: number;
  coachingNeeded: "yes" | "no" | "unclear";
  selectedCoachIds: string[];
  chosenCoachId: string | null;
  bookingId: string | null;
  messageId: string | null;
  handoffReason: string | null;
  estimatedPeTimeSavedMinutes: number;
  latestAssistantPayload: AssistantMachineOutput;
}

export interface PlatformMessage {
  id: string;
  caseId: string;
  leaderId: string;
  coachId: string;
  subject: string;
  body: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  caseId: string;
  leaderId: string;
  coachId: string;
  requestedHours: number;
  hourlyRateEur: 200;
  proposedDates: string[];
  requiresDualConfirmation: true;
  leaderConfirmed: boolean;
  coachConfirmed: boolean;
  status: "pending" | "confirmed" | "declined";
  createdAt: string;
  updatedAt: string;
}

export interface CaseMetaReport {
  caseId: string;
  status: CaseRecord["status"];
  createdAt: string;
  updatedAt: string;
  clarifyingQuestionsAsked: number;
  coachingNeeded: CaseRecord["coachingNeeded"];
  selectedCoachIds: string[];
  bookingStatus: Booking["status"] | "none";
  handoffReason: string | null;
  estimatedPeTimeSavedMinutes: number;
}

export interface AppData {
  cases: Record<string, CaseRecord>;
  messages: Record<string, PlatformMessage>;
  bookings: Record<string, Booking>;
}
