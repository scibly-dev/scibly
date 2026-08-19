import type { UseCasePage } from "../types";

export const useCase: UseCasePage = {
  slugDe: "handwerk",
  slugEn: "trades-and-construction",
  de: {
    meta: {
      title: "DGUV-Unterweisungen für Handwerksbetriebe | Scibly",
      description:
        "Sicherheitsunterweisungen digital durchführen und exportierbar belegen. Neue Mitarbeitende schnell einweisen, mehrsprachig schulen. Scibly für Handwerksbetriebe.",
      keywords: [
        "DGUV Unterweisung digital",
        "Handwerksbetrieb LMS",
        "Sicherheitsunterweisung Software",
        "Berufsgenossenschaft Nachweis",
        "Unterweisung mehrsprachig",
      ],
    },
    hero: {
      eyebrow: "Für Handwerksbetriebe",
      headline: "DGUV-Unterweisungen. Digital. Nachweisbar.",
      subheadline:
        "Wenn die BG-Kontrolle kommt, hast du den Nachweis. Zeitstempel, exportierbar in zwei Minuten. Und neue Mitarbeitende werden eingewiesen, bevor sie anfangen.",
      ctaLabel: "Demo anfordern",
    },
    pain: {
      eyebrow: "Das Problem",
      title: "Papiernachweise halten keiner Kontrolle stand",
      items: [
        {
          title: "Unterschriften im Ordner. Bis die BG-Kontrolle kommt.",
          description:
            "Unterweisungen werden auf Papier unterschrieben und abgeheftet. Beim ersten Unfall oder der nächsten Kontrolle wird nach dem Nachweis gefragt. Dann sucht jemand.",
        },
        {
          title:
            "Neue Mitarbeitende starten manchmal ohne vollständige Einweisung.",
          description:
            "Wenn kein Vorgesetzter Zeit hat und die Checkliste nicht griffbereit ist, starten neue Leute manchmal ohne alle Unterweisungen. Das ist rechtlich problematisch.",
        },
        {
          title: "Türkisch, Polnisch, Arabisch: Deutsch erreicht nicht alle.",
          description:
            "Sicherheitsunterweisungen auf Deutsch kommen bei mehrsprachigen Teams nicht vollständig an. Das Risiko bleibt, auch wenn der Zettel unterschrieben ist.",
        },
      ],
    },
    solution: {
      eyebrow: "Was Scibly löst",
      title: "Digital unterweisen, rechtssicher nachweisen",
      items: [
        {
          title: "Digitale Unterweisung mit exportierbarem Nachweis",
          description:
            "Unterweisungen digital durchführen, Teilnahme mit Zeitstempel festhalten. Jederzeit als Protokoll exportierbar.",
        },
        {
          title: "Neue Mitarbeitende schnell einweisen",
          description:
            "Sobald jemand im System angelegt ist, weist du die Pflichtkurse mit einem Klick zu. Bevor der erste Arbeitstag beginnt.",
        },
        {
          title: "Unterweisungen in mehreren Sprachen",
          description:
            "Mit KI-Unterstützung Unterweisungen in wenigen Minuten in weitere Sprachen übersetzen. Alle Mitarbeitenden verstehen, was wichtig ist.",
        },
      ],
    },
    faq: {
      title: "Häufige Fragen",
      questions: [
        {
          id: "digital-induction-recognized",

          q: "Sind digitale Unterweisungen bei der Berufsgenossenschaft anerkannt?",
          a: "Scibly liefert dir vollständige Nachweise mit Zeitstempel und Abschlussprotokoll, automatisch exportierbar. Ob das im Einzelfall anerkannt wird, entscheidet die zuständige Berufsgenossenschaft.",
        },
        {
          id: "incomplete-course-status",

          q: "Was, wenn ein Mitarbeitender den Kurs nicht abschließt?",
          a: "Im Dashboard siehst du jederzeit, wer den Kurs noch nicht abgeschlossen hat, und kannst gezielt nachfassen.",
        },
        {
          id: "import-materials",

          q: "Kann ich meine bestehenden Unterweisungsunterlagen übernehmen?",
          a: "Ja. Du kannst PDFs, Word-Dokumente oder Präsentationen hochladen. Scibly wandelt sie automatisch in interaktive Kurse um.",
        },
      ],
    },
  },
  en: {
    meta: {
      title: "Safety Training for Trades and Construction | Scibly",
      description:
        "Run legally compliant health and safety inductions digitally with a timestamped record. Onboard new starters quickly, train in multiple languages. Scibly for skilled trades.",
      keywords: [
        "health and safety training digital",
        "trades LMS",
        "safety induction software",
        "construction induction records",
        "multilingual safety training",
      ],
    },
    hero: {
      eyebrow: "For trades and construction",
      headline: "Health and safety inductions. Digital. Documented.",
      subheadline:
        "When an inspector arrives, you have the evidence. Timestamped, exportable in two minutes. And new starters are inducted before their first shift begins.",
      ctaLabel: "Request demo",
    },
    pain: {
      eyebrow: "The problem",
      title: "Paper records don't hold up under inspection",
      items: [
        {
          title: "Signatures in a folder. Until the inspector arrives.",
          description:
            "Inductions are signed on paper and filed away. When an incident happens or an inspection is called, someone needs to find the evidence. That's when the searching starts.",
        },
        {
          title: "New starters sometimes begin without a full induction.",
          description:
            "When no supervisor has time and the checklist isn't at hand, new people sometimes start before all inductions are done. That creates legal exposure.",
        },
        {
          title: "Multilingual teams: not everyone is reached in English.",
          description:
            "Safety inductions in English don't fully land with employees who work in other languages. The risk stays, even if the form is signed.",
        },
      ],
    },
    solution: {
      eyebrow: "What Scibly solves",
      title: "Digital inductions, legally sound records",
      items: [
        {
          title: "Digital inductions with exportable records",
          description:
            "Run inductions digitally, capture attendance with timestamps. Exportable as a report at any time.",
        },
        {
          title: "Induct new starters quickly",
          description:
            "The moment someone is added to the system, you assign all required courses in one click. Before their first working day begins.",
        },
        {
          title: "Inductions in multiple languages",
          description:
            "Translate inductions into additional languages in minutes using AI. Every employee understands what matters.",
        },
      ],
    },
    faq: {
      title: "Common questions",
      questions: [
        {
          id: "digital-induction-recognized",

          q: "Are digital inductions legally recognised?",
          a: "Scibly gives you complete records with timestamps and completion protocols, automatically exportable. Whether they're accepted in a specific case is at the discretion of the relevant authority.",
        },
        {
          id: "incomplete-course-status",

          q: "What happens if an employee doesn't complete the course?",
          a: "The dashboard always shows a clear view of who hasn't completed the course yet, so you can follow up directly.",
        },
        {
          id: "import-materials",

          q: "Can I import my existing induction materials?",
          a: "Yes. You can upload PDFs, Word documents, or presentations. Scibly converts them into interactive courses automatically.",
        },
      ],
    },
  },
};
