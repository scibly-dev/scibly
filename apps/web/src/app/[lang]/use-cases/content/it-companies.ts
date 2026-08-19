import type { UseCasePage } from "../types";

export const useCase: UseCasePage = {
  slugDe: "it-unternehmen",
  slugEn: "it-companies",
  de: {
    meta: {
      title:
        "Scibly für IT-Unternehmen | Compliance, Onboarding und KI-Training",
      description:
        "ISO 27001, DSGVO, SOC-2: Schulungsnachweise ohne Excel. Onboarding einmal erstellt, KI-Kenntnisse je Person messbar. Scibly für schnell wachsende IT-Teams.",
      keywords: [
        "LMS IT-Unternehmen",
        "ISO 27001 Schulungsnachweis",
        "DSGVO Compliance LMS",
        "Onboarding Software Entwickler",
        "KI-Training Mitarbeiter",
      ],
    },
    hero: {
      eyebrow: "Für IT-Teams",
      headline: "Compliance. Onboarding. KI. Alles in einem System.",
      subheadline:
        "Wenn der Auditor anruft, hast du die Nachweise. Wenn jemand neu anfängt, weiß er vom ersten Tag an, was zu tun ist. Und wenn jemand nach KI-Kenntnissen fragt, kannst du zeigen, wer was gelernt hat.",
      ctaLabel: "Demo anfordern",
    },
    pain: {
      eyebrow: "Das Problem",
      title: "Das kostet Zeit, die eigentlich niemand hat",
      items: [
        {
          title: "Audit in einer Woche. Das Tabellenblatt ist veraltet.",
          description:
            "Für ISO 27001, DSGVO oder SOC-2 werden Schulungsnachweise gebraucht. Die liegen in Excel. Kurz vor dem Audit sucht jemand, aktualisiert manuell und hofft, dass alles stimmt.",
        },
        {
          title: "Jede Teamlead macht Onboarding anders.",
          description:
            "In einem schnell wachsenden IT-Team bekommt jeder neue Entwickler andere Informationen, je nachdem wer ihn einarbeitet. Das kostet Vertrauen und Qualität.",
        },
        {
          title: "KI ist überall. Wer geschult wurde, weiß kaum jemand.",
          description:
            "Alle Tools sind eingeführt, alle reden über KI. Aber wer tatsächlich eine Schulung hatte, wer sie sinnvoll nutzt und wer noch überhaupt nicht angefangen hat, bleibt unklar.",
        },
      ],
    },
    solution: {
      eyebrow: "Was Scibly löst",
      title: "Ein System für Compliance, Onboarding und KI",
      items: [
        {
          title: "Nachweis für jeden Audit",
          description:
            "Pflichtschulungen weist du gezielt nach Rolle zu. Jeder Abschluss hat einen Zeitstempel und ein Zertifikat, exportierbar für jeden Prüfer.",
        },
        {
          title: "Onboarding einmal aufsetzen, für alle wiederverwenden",
          description:
            "Strukturiertes Onboarding für Entwickler, Support und alle anderen Teams. Einmal erstellt, weist du es mit einem Klick jeder neuen Person zu.",
        },
        {
          title: "KI-Schulungen aufsetzen und Fortschritt je Person sehen",
          description:
            "Eigene KI-Kurse erstellen, den Lernstand je Person einsehen, Zertifikate ausstellen. Wer welches Modul abgeschlossen hat, ist jederzeit sichtbar.",
        },
      ],
    },
    faq: {
      title: "Häufige Fragen",
      questions: [
        {
          id: "customer-training",

          q: "Kann ich Scibly auch für Kundenschulungen nutzen?",
          a: "Ja. Du kannst eigene Organisationen für Kunden, Partner oder externe Teams anlegen und ihnen gezielt Kurse zuweisen.",
        },
        {
          id: "gdpr-compliance",

          q: "Ist Scibly DSGVO-konform?",
          a: "Ja. Alle Daten werden in Deutschland und der EU verarbeitet. Scibly ist vollständig DSGVO-konform und eignet sich als Nachweis-System für ISO-27001- und SOC-2-Vorbereitungen.",
        },
        {
          id: "setup-time",

          q: "Wie lange dauert die Einrichtung?",
          a: "Das erste Team ist in unter 30 Minuten dabei. Kurse lassen sich per KI aus bestehenden Dokumenten erstellen, kein langes Implementierungsprojekt nötig.",
        },
      ],
    },
  },
  en: {
    meta: {
      title: "Scibly for IT Companies | Compliance, Onboarding and AI Training",
      description:
        "ISO 27001, GDPR, SOC-2: training records without spreadsheets. Structured onboarding built once, AI skills tracked per person. The LMS for fast-growing tech teams.",
      keywords: [
        "LMS for IT companies",
        "ISO 27001 training records",
        "GDPR compliance LMS",
        "developer onboarding software",
        "AI training employees",
      ],
    },
    hero: {
      eyebrow: "For IT teams",
      headline: "Compliance. Onboarding. AI. One system for all three.",
      subheadline:
        "When the auditor calls, you have the records. When someone joins, they know what to do from day one. And when leadership asks about AI skills, you have the answer.",
      ctaLabel: "Request demo",
    },
    pain: {
      eyebrow: "The problem",
      title: "The tasks that eat time nobody has",
      items: [
        {
          title: "Audit next week. The spreadsheet is out of date.",
          description:
            "ISO 27001, GDPR, SOC-2: when audit prep begins, someone opens an Excel file and starts updating it manually. Stressful, error-prone, and completely avoidable.",
        },
        {
          title: "Every team lead runs onboarding their own way.",
          description:
            "In a fast-growing tech team, new engineers get different information depending on who they report to. Inconsistency at scale is a real problem.",
        },
        {
          title:
            "AI is everywhere. Who has actually been trained stays unclear.",
          description:
            "The tools are deployed, the initiative is announced. But who has actually been trained, who uses them well, and who hasn't started yet — that stays murky.",
        },
      ],
    },
    solution: {
      eyebrow: "What Scibly solves",
      title: "One system for compliance, onboarding, and AI",
      items: [
        {
          title: "Audit evidence without the scramble",
          description:
            "Assign mandatory training by role in a few clicks. Every completion carries a timestamp and certificate, exportable for any auditor.",
        },
        {
          title: "Build onboarding once, use it for everyone",
          description:
            "Structured onboarding for engineers, support, and every other team. Set it up once, then assign it to every new hire with one click.",
        },
        {
          title: "Build AI training and see who has completed it",
          description:
            "Create internal AI courses, track progress per person, issue certificates. Who finished which module is always visible.",
        },
      ],
    },
    faq: {
      title: "Common questions",
      questions: [
        {
          id: "customer-training",

          q: "Can I use Scibly for customer training?",
          a: "Yes. You can set up separate organisations for customers, partners, or external teams and assign them specific courses.",
        },
        {
          id: "gdpr-compliance",

          q: "Is Scibly GDPR-compliant?",
          a: "Yes. All data is processed in Germany and the EU. Scibly is fully GDPR-compliant and well suited as the evidence system for ISO 27001 and SOC-2 preparations.",
        },
        {
          id: "setup-time",

          q: "How long does setup take?",
          a: "Your first team is up and running in under 30 minutes. Courses can be generated from existing documents using AI, with no lengthy implementation project required.",
        },
      ],
    },
  },
};
