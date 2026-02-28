import { randomUUID } from "node:crypto";
import { runAssistant, deriveCasePhase } from "@/lib/assistant/engine";
import { bookingConfirmSchema, bookingCreateSchema, contactCreateSchema, contactDecisionSchema } from "@/lib/domain/schemas";
import { Booking, CaseMetaReport, CaseRecord, PlatformMessage } from "@/lib/domain/types";
import { storage } from "@/lib/storage";

function now() {
  return new Date().toISOString();
}

function estimateTimeSaved(caseRecord: CaseRecord): number {
  let value = 15 + caseRecord.clarifyingQuestionsAsked * 5;
  if (caseRecord.coachingNeeded === "no") value += 20;
  if (caseRecord.chosenCoachId) value += 15;
  if (caseRecord.bookingId) value += 20;
  if (caseRecord.status === "handoff") value = 5;
  return value;
}

function createDefaultCase(caseId: string, leaderId: string): CaseRecord {
  const timestamp = now();
  return {
    id: caseId,
    leaderId,
    status: "intake",
    createdAt: timestamp,
    updatedAt: timestamp,
    clarifyingQuestionsAsked: 0,
    coachingNeeded: "unclear",
    selectedCoachIds: [],
    chosenCoachId: null,
    bookingId: null,
    messageId: null,
    handoffReason: null,
    estimatedPeTimeSavedMinutes: 0,
    latestAssistantPayload: {
      phase: "intake",
      privacy_reminder_shown: true,
      case_summary: "",
      clarifying_questions: [],
      self_help_micro_coaching: {
        provided: false,
        tips: [],
        check_question: "",
      },
      coaching_needed: "unclear",
      matching_preferences: {
        topic_tags: [],
        intensity: "unknown",
        urgency: "unknown",
        format: "unknown",
        availability_window: "",
      },
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
    },
  };
}

export async function handleChat(params: { caseId?: string; leaderId: string; message: string }) {
  const caseId = params.caseId ?? randomUUID();
  const existingCase = (await storage.getCase(caseId)) ?? createDefaultCase(caseId, params.leaderId);

  const assistant = await runAssistant({
    message: params.message,
    existingCase,
  });

  const updatedCase: CaseRecord = {
    ...existingCase,
    leaderId: params.leaderId,
    updatedAt: now(),
    clarifyingQuestionsAsked:
      existingCase.clarifyingQuestionsAsked + assistant.machine.clarifying_questions.length,
    coachingNeeded: assistant.machine.coaching_needed,
    status: deriveCasePhase(assistant.machine),
    selectedCoachIds: assistant.machine.coach_recommendations
      .map((rec) => rec.coach_id)
      .filter(Boolean),
    handoffReason: assistant.machine.handoff_to_human.required
      ? assistant.machine.handoff_to_human.reason
      : null,
    latestAssistantPayload: assistant.machine,
  };

  updatedCase.estimatedPeTimeSavedMinutes = estimateTimeSaved(updatedCase);
  await storage.upsertCase(updatedCase);

  return {
    caseId,
    text: assistant.text,
    machine: assistant.machine,
    policyHash: assistant.policyHash,
  };
}

export async function createContactRequest(input: unknown) {
  const payload = contactCreateSchema.parse(input);
  const caseRecord = await storage.getCase(payload.caseId);
  if (!caseRecord) {
    throw new Error("Fall nicht gefunden");
  }

  const message: PlatformMessage = {
    id: randomUUID(),
    caseId: payload.caseId,
    leaderId: payload.leaderId,
    coachId: payload.coachId,
    subject: payload.subject,
    body: payload.body,
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
  };

  caseRecord.status = "contact";
  caseRecord.messageId = message.id;
  caseRecord.chosenCoachId = payload.coachId;
  caseRecord.updatedAt = now();
  caseRecord.estimatedPeTimeSavedMinutes = estimateTimeSaved(caseRecord);

  await storage.upsertMessage(message);
  await storage.upsertCase(caseRecord);

  return message;
}

export async function respondToContact(input: unknown) {
  const payload = contactDecisionSchema.parse(input);
  const message = await storage.getMessage(payload.messageId);
  if (!message) {
    throw new Error("Nachricht nicht gefunden");
  }

  if (message.coachId !== payload.coachId) {
    throw new Error("Coach-ID passt nicht zur Nachricht");
  }

  message.status = payload.decision;
  message.updatedAt = now();
  await storage.upsertMessage(message);

  const caseRecord = await storage.getCase(message.caseId);
  if (caseRecord) {
    caseRecord.status = payload.decision === "accepted" ? "contact" : "done";
    caseRecord.updatedAt = now();
    caseRecord.estimatedPeTimeSavedMinutes = estimateTimeSaved(caseRecord);
    await storage.upsertCase(caseRecord);
  }

  return message;
}

export async function createBooking(input: unknown) {
  const payload = bookingCreateSchema.parse(input);
  const caseRecord = await storage.getCase(payload.caseId);
  if (!caseRecord) {
    throw new Error("Fall nicht gefunden");
  }

  const booking: Booking = {
    id: randomUUID(),
    caseId: payload.caseId,
    leaderId: payload.leaderId,
    coachId: payload.coachId,
    requestedHours: payload.requestedHours,
    hourlyRateEur: 200,
    proposedDates: payload.proposedDates,
    requiresDualConfirmation: true,
    leaderConfirmed: true,
    coachConfirmed: false,
    status: "pending",
    createdAt: now(),
    updatedAt: now(),
  };

  caseRecord.status = "booking";
  caseRecord.bookingId = booking.id;
  caseRecord.updatedAt = now();
  caseRecord.estimatedPeTimeSavedMinutes = estimateTimeSaved(caseRecord);

  await storage.upsertBooking(booking);
  await storage.upsertCase(caseRecord);

  return booking;
}

export async function confirmBooking(input: unknown) {
  const payload = bookingConfirmSchema.parse(input);
  const booking = await storage.getBooking(payload.bookingId);

  if (!booking) {
    throw new Error("Buchung nicht gefunden");
  }

  if (payload.actorRole === "leader" && booking.leaderId !== payload.actorId) {
    throw new Error("Leader-ID passt nicht zur Buchung");
  }

  if (payload.actorRole === "coach" && booking.coachId !== payload.actorId) {
    throw new Error("Coach-ID passt nicht zur Buchung");
  }

  if (payload.decision === "decline") {
    booking.status = "declined";
  } else {
    if (payload.actorRole === "leader") booking.leaderConfirmed = true;
    if (payload.actorRole === "coach") booking.coachConfirmed = true;
    booking.status = booking.leaderConfirmed && booking.coachConfirmed ? "confirmed" : "pending";
  }

  booking.updatedAt = now();
  await storage.upsertBooking(booking);

  const caseRecord = await storage.getCase(booking.caseId);
  if (caseRecord) {
    caseRecord.status = booking.status === "confirmed" ? "done" : "booking";
    caseRecord.updatedAt = now();
    caseRecord.estimatedPeTimeSavedMinutes = estimateTimeSaved(caseRecord);
    await storage.upsertCase(caseRecord);
  }

  return booking;
}

export async function listMessages() {
  return storage.listMessages();
}

export async function listBookings() {
  return storage.listBookings();
}

export async function listCases() {
  return storage.listCases();
}

export async function getPeReport(): Promise<CaseMetaReport[]> {
  const [cases, bookings] = await Promise.all([storage.listCases(), storage.listBookings()]);

  return cases
    .map<CaseMetaReport>((item) => {
      const booking = bookings.find((entry) => entry.id === item.bookingId);
      return {
        caseId: item.id,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        clarifyingQuestionsAsked: item.clarifyingQuestionsAsked,
        coachingNeeded: item.coachingNeeded,
        selectedCoachIds: item.selectedCoachIds,
        bookingStatus: booking ? booking.status : "none",
        handoffReason: item.handoffReason,
        estimatedPeTimeSavedMinutes: item.estimatedPeTimeSavedMinutes,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
