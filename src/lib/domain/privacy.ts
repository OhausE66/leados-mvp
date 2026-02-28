const escalations = [
  /suizid|selbstmord|selbstverletz|ich kann nicht mehr|harm myself|kill myself/i,
  /gewalt|fremdgefährd|bedrohung|attack/i,
  /anwalt|rechtsstreit|compliance-verstoß|betrug|korruption/i,
  /depression|diagnose|medikament|therapie|psychiatr/i,
  /datenleck|personenbezogen|kundendaten export|gehaltliste/i,
];

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phoneRegex = /\+?[0-9][0-9\-\s]{7,}[0-9]/g;

export function detectEscalation(text: string): { required: boolean; reason: string } {
  for (const rule of escalations) {
    if (rule.test(text)) {
      return {
        required: true,
        reason:
          "Akute Krise, Rechts-/Compliance- oder Datenschutzrisiko erkannt. Fall an PE/geeignete Stelle übergeben.",
      };
    }
  }

  return { required: false, reason: "" };
}

export function abstractSensitiveContent(input: string): string {
  let result = input.replace(emailRegex, "[E-MAIL ENTFERNT]");
  result = result.replace(phoneRegex, "[KONTAKT ENTFERNT]");
  result = result.replace(/\b(Herr|Frau)\s+[A-ZÄÖÜ][a-zäöüß]+/g, "$1 [NAME]");
  result = result.replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, "[NAME]");
  result = result.replace(/\b(Antidepressiva|Diagnose|Krankschreibung|Patient)\b/gi, "[SENSIBEL]");
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

export function privacyReminder(): string {
  return "Bitte teile keine privaten Kontaktdaten, keine Namen Dritter, keine Gesundheitsdaten und keine vertraulichen Unternehmensdetails.";
}
