"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Role = "leader" | "coach" | "pe";

type ChatResponse = {
  caseId: string;
  text: string;
  machine: {
    phase: "intake" | "clarify" | "self_help" | "recommend" | "contact" | "booking";
    clarifying_questions: string[];
    coach_recommendations: { coach_id: string; rank: number; fit_reason: string[]; risk_flags: string[] }[];
    platform_message_draft: { to_coach: string; subject: string; body: string };
    coaching_needed: "yes" | "no" | "unclear";
  };
};

type Coach = { id: string; displayName: string };

type PlatformMessage = {
  id: string;
  caseId: string;
  leaderId: string;
  coachId: string;
  subject: string;
  body: string;
  status: "pending" | "accepted" | "declined";
  updatedAt: string;
};

type Booking = {
  id: string;
  caseId: string;
  leaderId: string;
  coachId: string;
  requestedHours: number;
  proposedDates: string[];
  status: "pending" | "confirmed" | "declined";
  leaderConfirmed: boolean;
  coachConfirmed: boolean;
};

type ChatTurn = {
  id: string;
  userText: string;
  assistantText: string;
  machineJson: string;
};

const LEADER_ID = "leader-demo";

function splitAssistantResponse(text: string): { assistantText: string; machineJson: string } {
  const separator = "\n\n---JSON---\n";
  if (!text.includes(separator)) {
    return { assistantText: text, machineJson: "" };
  }

  const [assistantText, machineJson] = text.split(separator);
  return {
    assistantText: assistantText.trim(),
    machineJson: machineJson.trim(),
  };
}

export function PrototypeApp() {
  const [role, setRole] = useState<Role>("leader");
  const [message, setMessage] = useState("");
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [latestChat, setLatestChat] = useState<ChatResponse | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachActorId, setCoachActorId] = useState("coach-001");
  const [messages, setMessages] = useState<PlatformMessage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [report, setReport] = useState<{ report: unknown[]; summary: { totalCases: number; totalEstimatedMinutesSaved: number } } | null>(null);
  const [bookingHours, setBookingHours] = useState(2);
  const [bookingDates, setBookingDates] = useState("2026-03-03T10:00,2026-03-04T15:00");
  const [error, setError] = useState("");

  async function loadCoaches() {
    const res = await fetch("/api/coaches");
    const data = await res.json();
    setCoaches(data.coaches ?? []);
    if (data.coaches?.[0]?.id) {
      setCoachActorId((curr: string) => curr || data.coaches[0].id);
    }
  }

  async function loadMessages() {
    const q = role === "coach" ? `?role=coach&coachId=${coachActorId}` : `?role=leader&leaderId=${LEADER_ID}`;
    const res = await fetch(`/api/messaging${q}`);
    const data = await res.json();
    setMessages(data.messages ?? []);
  }

  async function loadBookings() {
    const actorId = role === "coach" ? coachActorId : LEADER_ID;
    const roleParam = role === "coach" ? "coach" : "leader";
    const res = await fetch(`/api/booking?role=${roleParam}&actorId=${actorId}`);
    const data = await res.json();
    setBookings(data.bookings ?? []);
  }

  async function loadReport() {
    const res = await fetch("/api/reporting/pe");
    const data = await res.json();
    setReport(data);
  }

  useEffect(() => {
    void loadCoaches();
  }, []);

  useEffect(() => {
    void loadMessages();
    void loadBookings();
    if (role === "pe") {
      void loadReport();
    }
  }, [role, coachActorId]);

  const preferredCoachId = useMemo(() => {
    if (latestChat?.machine.platform_message_draft.to_coach) {
      return latestChat.machine.platform_message_draft.to_coach;
    }

    return latestChat?.machine.coach_recommendations?.[0]?.coach_id ?? "";
  }, [latestChat]);

  const latestPhase = latestChat?.machine.phase ?? "intake";
  const latestRecommendations = latestChat?.machine.coach_recommendations ?? [];
  const currentCaseMessages = useMemo(
    () => (caseId ? messages.filter((entry) => entry.caseId === caseId) : []),
    [caseId, messages],
  );
  const currentCaseBookings = useMemo(
    () => (caseId ? bookings.filter((entry) => entry.caseId === caseId) : []),
    [bookings, caseId],
  );
  const latestContact = currentCaseMessages[currentCaseMessages.length - 1];
  const contactAccepted = latestContact?.status === "accepted";

  async function onSendChat(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseId: caseId ?? undefined,
          leaderId: LEADER_ID,
          message,
        }),
      });

      const data = (await res.json()) as ChatResponse;
      if (!res.ok) throw new Error((data as { message?: string }).message ?? "Fehler im Chat");

      setCaseId(data.caseId);
      setLatestChat(data);
      const parsed = splitAssistantResponse(data.text);
      let assistantText = parsed.assistantText;
      if (data.machine.phase === "clarify" && data.machine.clarifying_questions.length > 0) {
        const questions = data.machine.clarifying_questions
          .map((question, index) => `${index + 1}. ${question}`)
          .join("\n");
        assistantText = `${assistantText}\n\nKlärungsfrage:\n${questions}`;
      }
      setChatTurns((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          userText: message,
          assistantText,
          machineJson: parsed.machineJson,
        },
      ]);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    }
  }

  async function sendContactRequest() {
    if (!caseId || !preferredCoachId || !latestChat) return;
    setError("");

    try {
      const draft = latestChat.machine.platform_message_draft;
      const res = await fetch("/api/messaging", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseId,
          leaderId: LEADER_ID,
          coachId: preferredCoachId,
          subject: draft.subject || "Erstanfrage Coaching",
          body: draft.body || "Bitte Erstkontakt über die Plattform.",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Nachricht konnte nicht erstellt werden");
      await loadMessages();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    }
  }

  async function answerContact(messageId: string, decision: "accepted" | "declined") {
    setError("");
    try {
      const res = await fetch("/api/messaging", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messageId, coachId: coachActorId, decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Antwort konnte nicht gespeichert werden");
      await loadMessages();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    }
  }

  async function createBookingRequest() {
    if (!caseId || !preferredCoachId) return;
    setError("");
    try {
      const proposedDates = bookingDates
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caseId,
          leaderId: LEADER_ID,
          coachId: preferredCoachId,
          requestedHours: bookingHours,
          proposedDates,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Buchung konnte nicht erstellt werden");
      await loadBookings();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    }
  }

  async function confirmBooking(bookingId: string, actorRole: "leader" | "coach", actorId: string) {
    setError("");
    try {
      const res = await fetch("/api/booking", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bookingId,
          actorRole,
          actorId,
          decision: "confirm",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Bestätigung fehlgeschlagen");
      await loadBookings();
      if (role === "pe") await loadReport();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    }
  }

  function resetCase() {
    setCaseId(null);
    setLatestChat(null);
    setChatTurns([]);
    setMessage("");
    setError("");
  }

  return (
    <main>
      <h1>Coaching-Vermittlung Prototyp</h1>
      <p className="small">Rollen-Simulation ohne externen Auth-Provider. Datenschutz-Reminder ist in jedem Chat-Output enthalten.</p>

      <div className="card row">
        <button className={role === "leader" ? "primary" : ""} onClick={() => setRole("leader")}>Leader</button>
        <button className={role === "coach" ? "primary" : ""} onClick={() => setRole("coach")}>Coach</button>
        <button className={role === "pe" ? "primary" : ""} onClick={() => setRole("pe")}>PE</button>
      </div>

      {error ? <div className="card"><strong>Fehler:</strong> {error}</div> : null}

      {role === "leader" ? (
        <div>
          <div>
            <div className="card">
              <h2>1) Anliegen im Chat</h2>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p className="small">Case-ID: {caseId ?? "(wird erzeugt)"}</p>
                <button type="button" onClick={resetCase}>Neuen Fall starten</button>
              </div>

              <div className="chat-window">
                {chatTurns.length === 0 ? (
                  <p className="small">Starte den Dialog mit deinem Anliegen.</p>
                ) : null}
                {chatTurns.map((turn) => (
                  <div key={turn.id}>
                    <div className="chat-bubble chat-user">
                      <strong>Du</strong>
                      <div>{turn.userText}</div>
                    </div>
                    <div className="chat-bubble chat-assistant">
                      <strong>Assistent</strong>
                      <div style={{ whiteSpace: "pre-wrap" }}>{turn.assistantText}</div>
                      {turn.machineJson ? (
                        <details style={{ marginTop: 8 }}>
                          <summary>Technik-JSON anzeigen</summary>
                          <pre>{turn.machineJson}</pre>
                        </details>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={onSendChat} style={{ marginTop: 12 }}>
                <textarea
                  rows={4}
                  placeholder="Beschreibe kurz dein Anliegen..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="primary" type="submit">Senden</button>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <h3>Nächster Schritt</h3>
            {latestPhase === "intake" || latestPhase === "clarify" ? (
              <p className="small">Bitte antworte im Chat auf die Klärungsfrage. Danach kommen passende Coach-Vorschläge.</p>
            ) : null}
            {latestPhase === "self_help" ? (
              <p className="small">Der Assistent hat Mikro-Impulse geliefert. Wenn du doch Coaching willst, antworte im Chat mit Wunsch nach Coaching.</p>
            ) : null}
            {latestRecommendations.length > 0 ? (
              <div>
                <p className="small">Empfohlene Coaches (Top-3):</p>
                {latestRecommendations.map((rec) => (
                  <div key={`${rec.coach_id}-${rec.rank}`} style={{ borderTop: "1px solid #d5dae3", paddingTop: 8, marginTop: 8 }}>
                    <strong>#{rec.rank} {rec.coach_id || "n/a"}</strong>
                    <div className="small">{rec.fit_reason.join(" | ") || "Fit-Gründe folgen aus Matching-Kriterien."}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {latestRecommendations.length > 0 ? (
            <div className="card">
              <h3>3) Empfehlung & Erstkontakt</h3>
              <p className="small">Erstelle jetzt die Plattform-Nachricht an den favorisierten Coach.</p>
              <p>Bevorzugter Coach: <strong>{preferredCoachId || "-"}</strong></p>
              <button className="primary" onClick={sendContactRequest} disabled={!caseId || !preferredCoachId}>Nachricht an Coach senden</button>
            </div>
          ) : null}

          {latestContact ? (
            <div className="card">
              <h3>Kontaktstatus</h3>
              <p className="small">Coach: {latestContact.coachId} | Status: {latestContact.status}</p>
            </div>
          ) : null}

          {contactAccepted || currentCaseBookings.length > 0 ? (
            <div className="card">
              <h3>5) Buchung (200 EUR/h)</h3>
              <label>Einzelstunden</label>
              <input type="number" min={1} max={10} value={bookingHours} onChange={(e) => setBookingHours(Number(e.target.value))} />
              <label style={{ marginTop: 8, display: "block" }}>Terminvorschläge (kommagetrennt)</label>
              <input value={bookingDates} onChange={(e) => setBookingDates(e.target.value)} />
              <div className="row" style={{ marginTop: 8 }}>
                <button className="primary" onClick={createBookingRequest} disabled={!caseId || !preferredCoachId}>Buchung vorschlagen</button>
              </div>
              <p className="small">Leader bestätigt beim Erstellen automatisch. Coach-Bestätigung separat erforderlich.</p>
            </div>
          ) : null}

          {currentCaseBookings.length > 0 ? (
            <div className="card">
              <h3>Leader Buchungen</h3>
              {currentCaseBookings.map((booking) => (
                <div key={booking.id} style={{ borderTop: "1px solid #d5dae3", paddingTop: 8, marginTop: 8 }}>
                  <div>{booking.id}</div>
                  <div className="small">Status: {booking.status} | Coach bestätigt: {String(booking.coachConfirmed)}</div>
                  {!booking.leaderConfirmed ? (
                    <button onClick={() => confirmBooking(booking.id, "leader", LEADER_ID)}>Leader bestätigen</button>
                  ) : null}
                </div>
              ))}
              {currentCaseBookings.length === 0 ? <p className="small">Keine Buchungen vorhanden.</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {role === "coach" ? (
        <div className="card">
          <h2>4) Coach-Erstkontakt</h2>
          <label>Coach-Identität</label>
          <select value={coachActorId} onChange={(e) => setCoachActorId(e.target.value)}>
            {coaches.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.displayName} ({coach.id})
              </option>
            ))}
          </select>

          <h3 style={{ marginTop: 16 }}>Kontaktanfragen</h3>
          {messages.map((entry) => (
            <div key={entry.id} style={{ borderTop: "1px solid #d5dae3", paddingTop: 8, marginTop: 8 }}>
              <strong>{entry.subject}</strong>
              <p className="small">Case: {entry.caseId} | Status: {entry.status}</p>
              <p>{entry.body}</p>
              {entry.status === "pending" ? (
                <div className="row">
                  <button className="primary" onClick={() => answerContact(entry.id, "accepted")}>Annehmen</button>
                  <button onClick={() => answerContact(entry.id, "declined")}>Ablehnen</button>
                </div>
              ) : null}
            </div>
          ))}
          {messages.length === 0 ? <p className="small">Keine Nachrichten für diesen Coach.</p> : null}

          <h3 style={{ marginTop: 16 }}>Buchungen</h3>
          {bookings.map((booking) => (
            <div key={booking.id} style={{ borderTop: "1px solid #d5dae3", paddingTop: 8, marginTop: 8 }}>
              <p>
                {booking.id} - {booking.requestedHours}h - {booking.proposedDates.join(" | ")}
              </p>
              <p className="small">Status: {booking.status} | Leader bestätigt: {String(booking.leaderConfirmed)}</p>
              {!booking.coachConfirmed && booking.status === "pending" ? (
                <button className="primary" onClick={() => confirmBooking(booking.id, "coach", coachActorId)}>Coach bestätigt</button>
              ) : null}
            </div>
          ))}
          {bookings.length === 0 ? <p className="small">Keine Buchungen vorhanden.</p> : null}
        </div>
      ) : null}

      {role === "pe" ? (
        <div className="card">
          <h2>6) PE-Dashboard (Metadaten)</h2>
          <button onClick={loadReport}>Aktualisieren</button>
          <p className="small">Keine Gesprächsinhalte. Nur Status-, Matching- und Buchungsmetadaten.</p>
          {report ? (
            <>
              <p>
                Fälle: <strong>{report.summary.totalCases}</strong> | Geschätzte Zeitersparnis: <strong>{report.summary.totalEstimatedMinutesSaved} Minuten</strong>
              </p>
              <pre>{JSON.stringify(report.report, null, 2)}</pre>
            </>
          ) : (
            <p className="small">Noch keine Reportdaten geladen.</p>
          )}
        </div>
      ) : null}
    </main>
  );
}
