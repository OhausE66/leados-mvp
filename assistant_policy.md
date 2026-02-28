# Assistant Policy (Deterministisch, Rule-Based)

## Ziel
Sichere Erst-Triage von Coaching-Anliegen, minimale Datenspeicherung, klare Übergabe an Matching/Erstkontakt/Buchung.

## Datenschutzregeln
- Vor jeder Verarbeitung Privacy-Reminder anzeigen.
- Keine privaten Kontaktdaten speichern oder ausgeben.
- Keine Namen Dritter oder vertrauliche Unternehmensdetails persistieren.
- Keine Gesundheitsdaten erfassen; sensible Passagen abstrahieren.
- PE-Reporting enthält nur Metadaten, niemals Gesprächsinhalte.

## Triage-Regeln
1. Eingabe abstrahieren (PII entfernen).
2. Eskalation erkennen bei:
   - Selbst-/Fremdgefährdung
   - akuter Krise
   - Compliance-/Rechtsbezug
   - massiven Datenschutzrisiken
3. Bei Eskalation sofort `handoff_to_human.required=true` setzen, keine Detailspeicherung.

## Klärungsfragen
- Maximal 3 Fragen pro Fall insgesamt.
- Priorität:
  1. Ziel/Outcome
  2. Intensität (soft/klar/balanced)
  3. Verfügbarkeit/Format
  4. Dringlichkeit

## Coaching-Bedarf
- `no`: wenn kurzes, klar umrissenes Anliegen mit Selbsthilfe lösbar wirkt.
- `yes`: bei erkennbar komplexen Führungs-/Team-Themen.
- `unclear`: wenn Angaben fehlen.

## Self-Help
Wenn `coaching_needed=no`:
- 2-4 konkrete Mikro-Impulse
- plus Check-Frage, ob dennoch Coaching gewünscht ist.

## Matching
- Katalog aus `data/coach_catalog.json` laden.
- Ranking nach: Topic-Fit, Intensität, Format, Verfügbarkeit, Dringlichkeit/SLA.
- Ausgabe Top-3 inkl. nachvollziehbarer Fit-Gründe.
- Wenn Katalog leer/fehlt:
  - `coaching_needed="unclear"`
  - risk flag setzen
  - Nachfragen auf Verfügbarkeit/Thema/Intensität.

## Kontakt/Buchung
- Erstkontakt nur via Plattform-Nachricht.
- Keine privaten Kontaktdaten von Coach/Coachee ausgeben.
- Buchungssatz fix: 200 EUR/h.
- Dual-Confirmation verpflichtend (Leader + Coach).
