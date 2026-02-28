# Coaching-Vermittlungsplattform Prototyp (Funke)

Lauffähiger Next.js-Prototyp für sichere Triage, Matching, Plattform-Erstkontakt, Buchungsbestätigung und PE-Entlastung.

## Stack
- Next.js (App Router) + TypeScript
- Zod für Validierung
- Storage-Abstraktion: InMemory oder FileStorage (JSON, Default)
- Keine externe Auth (Rollen-Simulation: Leader/Coach/PE)

## Setup
1. Node.js 20+ verwenden.
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. Dev-Server starten:
   ```bash
   npm run dev
   ```
4. App öffnen: [http://localhost:3000](http://localhost:3000)

## Konfiguration
- `STORAGE_DRIVER=file|memory` (Default: `file`)
- `ENABLE_LLM_PROVIDER=true|false` (Default: `false`)
- `LLM_API_KEY=...` (optional, nur wenn Hook aktiv sein soll)

Hinweis: Der LLM-Hook ist standardmäßig deaktiviert und macht ohne API-Key keine externen Calls.

## Rollen und Flows

### Leader
1. Anliegen im Chat senden.
2. Assistent liefert Text + `---JSON---` Maschinenblock im festen Schema.
3. Bei Coaching-Bedarf: Top-3 Empfehlungen.
4. Plattform-Nachricht an Coach senden.
5. Buchungsvorschlag (200 EUR/h) mit Terminen erstellen.
6. Leader-Bestätigung erfolgt beim Erstellen der Buchung automatisch.

### Coach
1. Eingehende Plattform-Nachricht sehen.
2. Anfrage annehmen oder ablehnen.
3. Bei Buchung: zweite Bestätigung (Dual-Confirmation) ausführen.

### PE
1. Dashboard öffnen.
2. Nur Metadaten sehen (keine Gesprächsinhalte):
   - Status
   - Timestamps
   - Anzahl Nachfragen
   - coaching_needed
   - ausgewählte Coach-IDs
   - Buchungsstatus
   - geschätzte PE-Zeitersparnis

## API-Routen
- `POST /api/chat` - Triage, Nachfragen, Self-Help, Empfehlungen
- `POST /api/matching` - Direktes Matching auf Basis Präferenzen
- `GET/POST/PATCH /api/messaging` - Erstkontakt erstellen, annehmen/ablehnen
- `GET/POST/PATCH /api/booking` - Buchungsvorschlag und Dual-Confirmation
- `GET /api/reporting/pe` - PE-Reporting (nur Metadaten)
- `GET /api/coaches` - Coach-Katalog
- `GET /api/cases` - Fallliste (debug/UI)

## Datenschutz-Notizen
- Datenschutz-Reminder wird in jedem Chat-Output angezeigt.
- Eingaben werden vor der Verarbeitung abstrahiert (PII-Reduktion).
- Keine privaten Kontaktdatenfreigaben außerhalb der Plattform.
- Keine Gesundheitsdatenverarbeitung.
- Eskalationsfälle (Krise, Selbst-/Fremdgefährdung, Compliance/Recht, Datenschutzrisiko) werden an PE/geeignete Stelle übergeben; keine Detailspeicherung.
- PE-Reporting enthält keine Gesprächsinhalte.

## Akzeptanzkriterien und UI-Test

1. **Leader → Empfehlung → Nachricht → Coach akzeptiert → Booking vorgeschlagen → beide bestätigen**
   1. Rolle `Leader`: Anliegen mit Coaching-Bedarf senden (z. B. Teamkonflikt, hoher Druck).
   2. `Nachricht an Coach senden` klicken.
   3. Rolle `Coach`: Anfrage `Annehmen`.
   4. Rolle `Leader`: `Buchung vorschlagen`.
   5. Rolle `Coach`: `Coach bestätigt`.
   6. Optional Rolle `PE`: Report prüfen (Status/Buchungsstatus aktualisiert).

2. **Leader → Self-Help → Coaching entfällt**
   1. Rolle `Leader`: Anliegen wie „nur kurzer Impuls, ich möchte es selbst lösen" senden.
   2. JSON zeigt `phase=self_help`, 2-4 Tipps und `coaching_needed=no`.

3. **Eskalation → Handoff an PE mit Grund**
   1. Rolle `Leader`: kritischen Text mit Selbst-/Fremdgefährdung oder Compliance-/Rechtsrisiko senden.
   2. JSON zeigt `handoff_to_human.required=true` mit Grund.
   3. Rolle `PE`: Metadaten-Fall mit Handoff sichtbar.

## Projektstruktur
- `src/app` - UI und Route Handler
- `src/lib/assistant` - rule-based Assistentenlogik
- `src/lib/domain` - Typen, Matching, Privacy, Service-Orchestrierung
- `src/lib/storage` - Storage-Interface + InMemory/FileStorage
- `assistant_policy.md` - Triage/Matching-Regeln
- `data/coach_catalog.json` - Beispiel-Coach-Katalog
- `data/app_storage.json` - lokaler Persistenzzustand

## Annahmen
- Identitäten sind Demo-IDs (`leader-demo`, `coach-001` ...).
- Leader-Buchung gilt als erste Bestätigung beim Erstellen.
- Keine Kalenderintegration; Terminvorschläge sind ISO-Strings.
- Kein separates Rechte-/Mandantenmodell im Prototyp.

## Nächste Schritte
- Echte rollenbasierte AuthN/AuthZ ergänzen.
- Audit-Log und feinere Datenschutzklassifikation einführen.
- Optionalen LLM-Provider mit strukturiertem Prompting und Guardrails erweitern.
- Persistenzadapter für SQLite implementieren.
