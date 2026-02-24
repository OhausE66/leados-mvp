"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TeamVoiceProfile = {
  summary: string;
  strengths: string[];
  growth_areas: string[];
  motivation_triggers: string[];
  stress_signals: string[];
  communication_style: string;
  feedback_preference: string;
  leadership_recommendations: string[];
  first_1on1_focus: string[];
  confidence: "low" | "medium" | "high";
  assumptions: string[];
  clarifying_questions: string[];
};

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const QUESTIONS = [
  "Was ist die Rolle und Hauptverantwortung dieser Person?",
  "Worin ist die Person besonders stark?",
  "Wo verliert sie aktuell Wirksamkeit?",
  "Was motiviert sie sichtbar?",
  "Was demotiviert oder blockiert sie?",
  "Wie kommuniziert sie unter Druck?",
  "Wie gibt und nimmt sie Feedback?",
  "Welche Entwicklung in 90 Tagen wäre am wichtigsten?",
];

export function VoiceProfileWizard({
  open,
  onClose,
  teamMemberId,
  teamMemberName,
  onProfileGenerated,
}: {
  open: boolean;
  onClose: () => void;
  teamMemberId: string;
  teamMemberName: string;
  onProfileGenerated: (profile: TeamVoiceProfile) => void;
}) {
  const [answers, setAnswers] = useState<string[]>(() => QUESTIONS.map(() => ""));
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<TeamVoiceProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const answeredCount = answers.filter((entry) => entry.trim().length > 0).length;
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);
  const followUpQuestions = useMemo(() => {
    const text = answers.join(" ").toLowerCase();
    const list: string[] = [];

    if (text.includes("konflikt") || text.includes("spannung") || text.includes("friktion")) {
      list.push("Welche konkrete Konfliktsituation sollte im nächsten 1:1 aktiv geklärt werden?");
    }

    if (text.includes("motivation") || text.includes("antrieb") || text.includes("demotiv")) {
      list.push("Welche zwei Trigger erhöhen Motivation kurzfristig messbar?");
    }

    if (text.includes("priorit") || text.includes("fokus") || text.includes("überlast")) {
      list.push("Welche Aufgabe sollte als Erstes depriorisiert oder delegiert werden?");
    }

    if (text.includes("feedback") || text.includes("kommunikation")) {
      list.push("Welches Feedback-Format funktioniert bei dieser Person am besten?");
    }

    return list.slice(0, 3);
  }, [answers]);

  function cleanupAudioMeter() {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setAudioLevel(0);
  }

  useEffect(() => {
    return () => {
      cleanupAudioMeter();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  async function startAudioMeter() {
    cleanupAudioMeter();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(Math.min(1, average / 90));
      rafIdRef.current = requestAnimationFrame(update);
    };

    rafIdRef.current = requestAnimationFrame(update);
  }

  function stopRecognition() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    cleanupAudioMeter();
    setRecordingIndex(null);
  }

  async function startRecognition(questionIndex: number) {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? ((window as Window & {
            webkitSpeechRecognition?: SpeechRecognitionConstructor;
            SpeechRecognition?: SpeechRecognitionConstructor;
          }).SpeechRecognition ||
          (window as Window & {
            webkitSpeechRecognition?: SpeechRecognitionConstructor;
            SpeechRecognition?: SpeechRecognitionConstructor;
          }).webkitSpeechRecognition)
        : undefined;

    if (!SpeechRecognition) {
      setError("Spracherkennung wird in diesem Browser nicht unterstützt.");
      return;
    }

    stopRecognition();
    setError(null);

    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (!transcript) {
        return;
      }

      setAnswers((prev) => {
        const next = [...prev];
        next[questionIndex] = `${prev[questionIndex]} ${transcript}`.trim();
        return next;
      });
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      cleanupAudioMeter();
      setRecordingIndex(null);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      cleanupAudioMeter();
      setRecordingIndex(null);
      setError("Spracherkennung konnte nicht abgeschlossen werden.");
    };

    recognitionRef.current = recognition;
    setRecordingIndex(questionIndex);

    try {
      await startAudioMeter();
    } catch {
      setError("Mikrofonzugriff für Pegelanzeige nicht verfügbar. Aufnahme läuft ggf. trotzdem.");
    }

    recognition.start();
  }

  async function toggleRecording(questionIndex: number) {
    if (recordingIndex === questionIndex) {
      stopRecognition();
      return;
    }

    if (recordingIndex !== null && recordingIndex !== questionIndex) {
      return;
    }

    await startRecognition(questionIndex);
  }

  async function generateProfile() {
    setSubmitting(true);
    setError(null);

    const payload = {
      team_member_id: teamMemberId,
      team_member_name: teamMemberName,
      answers: [
        ...QUESTIONS.map((question, index) => ({
          question,
          answer: answers[index].trim(),
        })),
        ...followUpQuestions.map((question) => ({
          question,
          answer: (followUpAnswers[question] ?? "").trim(),
        })),
      ].filter((entry) => entry.answer.length > 0),
    };

    if (payload.answers.length < 3) {
      setError("Bitte mindestens drei Fragen beantworten.");
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/team/profile-from-voice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as
      | { profile: TeamVoiceProfile; persisted: boolean }
      | { error?: { message?: string; code?: string } };

    if (!response.ok || !("profile" in body)) {
      const message =
        "error" in body && body.error?.message
          ? body.error.message
          : "Profil konnte nicht erstellt werden.";
      if (message.includes("Authentication") || message.includes("einloggen")) {
        router.push("/auth?next=/app/team");
      } else {
        setError(message);
      }
      setSubmitting(false);
      return;
    }

    setProfile(body.profile);
    onProfileGenerated(body.profile);
    setSubmitting(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Profil wurde erzeugt. Zum Speichern bitte anmelden.");
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 p-4 md:p-8">
      <div className="mx-auto max-h-[92vh] max-w-5xl overflow-y-auto rounded-xl bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="kicker">Sprach-Interview</p>
            <h3 className="mt-1 text-2xl font-semibold text-[#11284c]">
              Profil für {teamMemberName} skizzieren
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Ein Klick pro Frage: starten, sprechen, stoppen.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              stopRecognition();
              onClose();
            }}
          >
            Schließen
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            <span>Fortschritt</span>
            <span>
              {answeredCount}/{QUESTIONS.length} beantwortet
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded bg-slate-200">
            <div
              className="h-2 bg-[#17a7ff] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {QUESTIONS.map((question, index) => {
            const answered = answers[index].trim().length > 0;
            const active = recordingIndex === index;

            return (
              <div key={question} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-700">
                    {index + 1}. {question}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                      active
                        ? "bg-red-100 text-red-700"
                        : answered
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {active ? "Aufnahme läuft" : answered ? "Beantwortet" : "Offen"}
                  </span>
                </div>

                <textarea
                  className="input mt-2 min-h-20"
                  value={answers[index]}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[index] = value;
                      return next;
                    });
                  }}
                />

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`btn ${active ? "btn-secondary" : "btn-primary"}`}
                    onClick={() => void toggleRecording(index)}
                    disabled={recordingIndex !== null && recordingIndex !== index}
                  >
                    {active ? "Aufnahme stoppen" : "Aufnahme starten"}
                  </button>

                  {active ? (
                    <div className="flex min-w-44 items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Pegel
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded bg-slate-200">
                        <div
                          className="h-2 bg-red-500 transition-all"
                          style={{ width: `${Math.max(6, Math.round(audioLevel * 100))}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {followUpQuestions.length > 0 ? (
          <div className="mt-5 space-y-3 rounded-lg border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-sky-700">
                Dynamische Folgefragen
              </p>
              <span className="text-xs text-sky-700">Automatisch aus Antworten abgeleitet</span>
            </div>
            {followUpQuestions.map((question) => (
              <label key={question} className="block">
                <p className="text-sm font-medium text-slate-700">{question}</p>
                <textarea
                  className="input mt-2 min-h-16"
                  value={followUpAnswers[question] ?? ""}
                  onChange={(event) =>
                    setFollowUpAnswers((prev) => ({
                      ...prev,
                      [question]: event.target.value,
                    }))
                  }
                />
              </label>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => void generateProfile()}
            disabled={submitting}
          >
            {submitting ? "Profil wird erstellt..." : "Profil generieren"}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}

        {profile ? (
          <div className="mt-5 space-y-3 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xl font-semibold text-[#11284c]">Erzeugtes Profil</h4>
            <p className="text-sm text-slate-700">{profile.summary}</p>
            <ProfileList title="Stärken" items={profile.strengths} />
            <ProfileList title="Entwicklungsfelder" items={profile.growth_areas} />
            <ProfileList title="Führungshebel" items={profile.leadership_recommendations} />
            <ProfileList title="Erster 1:1 Fokus" items={profile.first_1on1_focus} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProfileList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
