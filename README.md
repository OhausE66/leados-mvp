# LeadOS MVP

Erster lauffähiger MVP-Prototyp für eine KMU-Führungs-App mit:
- Next.js (App Router) + TypeScript
- TailwindCSS (minimal)
- Supabase (Auth + Postgres + RLS)
- Zod für strikte JSON-Schema-Validation
- AI-Service mit Mock-Fallback

## Voraussetzungen
- Node.js 20+
- npm 10+
- Supabase Projekt

## Setup
### Option A: Ohne Backend testen (empfohlen für schnellen Demo-Check)
1. Dependencies installieren:
```bash
npm install
```
2. Environment anlegen:
```bash
cp .env.example .env.local
```
3. In `.env.local` setzen:
- `NEXT_PUBLIC_DEMO_MODE=true`
- `AI_MODE=mock`
4. Starten:
```bash
npm run dev
```

### Option B: Mit Supabase (voller Persistenz-Flow)
1. Dependencies installieren:
```bash
npm install
```

2. Environment anlegen:
```bash
cp .env.example .env.local
```

3. `.env.local` befüllen:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DEMO_MODE=false`
- `AI_MODE=mock` (empfohlen für lokale Demo ohne Key)
- Optional: `AI_MODE=live`, `AI_API_KEY`, `AI_MODEL`

4. Supabase Migration ausführen:
- Datei: `supabase/migrations/001_init.sql`
- Inhalte im SQL Editor ausführen oder per CLI migrieren.

5. Dev Server starten:
```bash
npm run dev
```

## Commands
```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Implementierte User-Flows
1. Auth Flow
- `/auth`: Sign up / Sign in
- Nach Login Redirect auf `/onboarding` falls Profil fehlt, sonst `/app`

2. Onboarding
- `/onboarding`: Rolle, Branche, Teamgröße, Team-Setup, Tonpräferenz
- Speichert in `profiles`

3. Dashboard
- `/app`: KPI-Karten (Teammitglieder, Daily Briefings, 1:1 Outputs)

4. Teamverwaltung + Private Notes
- `/app/team`
- Teammitglied erstellen/bearbeiten (`team_members`)
- Private Kurznotiz pro Mitglied (`notes_private`)
- Notizen pro Mitglied speichern/anzeigen (`notes`)

5. Daily Leadership Briefing
- `/app/daily`
- Input: Wochenziel, Herausforderung, Ton, Kontext
- API: `POST /api/ai/daily-briefing`
- Ausgabe: max. 3 Aktionen + Watchouts + Copy-Buttons
- Persistenz: `daily_briefings.output_json`

6. 1:1 Studio
- `/app/one-on-one`
- Teammitglied auswählen, Ziel/Kontext/Ton eingeben
- API: `POST /api/ai/one-on-one`
- Ausgabe: Agenda + Feedback-Skript + Follow-ups
- Persistenz: `one_on_ones.output_json`

7. Templates Library
- `/app/templates`
- 20 statische Templates aus `src/data/templates.json`
- Filter: Feedback / Delegation / Konflikt / Entwicklung
- Detailansicht mit Situation, Ziel, Fragen, Beispiel-Sätzen, Follow-ups

## AI-Modi
- `NEXT_PUBLIC_DEMO_MODE=true`:
  - Kein Auth-/DB-Backend notwendig
  - Teamdaten bleiben lokal in der UI
  - AI-Routen laufen ohne Login und ohne Persistenz

- `AI_MODE=mock`:
  - Deterministische Antworten ohne externen API-Key
  - Immer schema-validiert via Zod

- `AI_MODE=live` + `AI_API_KEY`:
  - Versuch eines echten Modell-Calls
  - Bei Fehlern automatischer Fallback auf Mock

## Tests
Enthalten sind mindestens 3 geforderte Tests:
1. Unit: Zod Schema Validation (`tests/unit/schemas.test.ts`)
2. Integration: API Happy Path (`tests/integration/daily-briefing-route.test.ts`)
3. Integration: API Unauthorized (`tests/integration/daily-briefing-route.test.ts`)

## Wichtige Dateien
- AI-Service: `src/lib/ai.ts`
- Zod-Schemas: `src/lib/schemas.ts`
- API-Routen:
  - `src/app/api/ai/daily-briefing/route.ts`
  - `src/app/api/ai/one-on-one/route.ts`
- Supabase Clients:
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/middleware.ts`
- SQL Migration: `supabase/migrations/001_init.sql`
