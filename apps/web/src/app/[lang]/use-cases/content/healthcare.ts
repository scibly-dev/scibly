import type { UseCasePage } from "../types";

export const useCase: UseCasePage = {
  slugDe: "pflege",
  slugEn: "healthcare",
  de: {
    meta: {
      title: "Schulungsnachweise für Pflegeeinrichtungen | Scibly",
      description:
        "MDK-Prüfung ohne Aktensuche. Pflichtschulungen zentral zuweisen, Mitarbeitende in der Schicht schulen, Nachweis auf Knopfdruck. Scibly für Pflegeheime und ambulante Dienste.",
      keywords: [
        "MDK Schulungsnachweis",
        "Pflege LMS",
        "Hygieneschulung Pflegeheim",
        "Pflichtschulung Pflegekräfte",
        "Brandschutzunterweisung Pflege",
      ],
    },
    hero: {
      eyebrow: "Für Pflegeeinrichtungen",
      headline: "Keine Aktensuche vor der nächsten MDK-Prüfung.",
      subheadline:
        "Hygieneschulung, Erste-Hilfe-Auffrischung, Brandschutzunterweisung: Kurs einmal erstellen, allen Mitarbeitenden zuweisen und den Nachweis für den MDK jederzeit ohne Suchen exportieren.",
      ctaLabel: "Demo anfordern",
    },
    pain: {
      eyebrow: "Das Problem",
      title: "MDK-Prüfung heißt: jemand sucht in Ordnern",
      items: [
        {
          title: "MDK-Prüfung. Wer hat wann was gemacht?",
          description:
            "Hygieneschulung, Erste-Hilfe-Auffrischung, Brandschutzunterweisung: Der MDK will Nachweise. Die liegen in Ordnern, die niemand in fünf Minuten findet.",
        },
        {
          title: "30 bis 80 Mitarbeitende mit Dienstplan koordinieren.",
          description:
            "Jährliche Pflichtschulungen für Teilzeitkräfte, Nachtwachen und wechselnde Dienste einzuplanen ist aufwändig und fehleranfällig.",
        },
        {
          title: "Einarbeitung blockiert wertvolle Präsenzzeit.",
          description:
            "Stunden, die für Einarbeitungen gebunden sind, fehlen bei der direkten Pflege. Das ist keine Kleinigkeit.",
        },
      ],
    },
    solution: {
      eyebrow: "Was Scibly löst",
      title: "Alle Schulungen zentral zugewiesen. Alle Nachweise sofort.",
      items: [
        {
          title:
            "Pflichtschulungen zentral zuweisen und Fortschritt im Blick behalten",
          description:
            "Alle Pflichtschulungen weist du mit einem Klick allen Mitarbeitenden zu. Wer noch nicht abgeschlossen hat, siehst du jederzeit auf einen Blick.",
        },
        {
          title: "Schulung in der Schichtpause, auf dem Tablet",
          description:
            "Mitarbeitende absolvieren Kurse in der Pause auf Tablet oder Handy. Keine Freistellungen, kein Präsenzseminar.",
        },
        {
          title: "MDK-Nachweis in zwei Klicks",
          description:
            "Wer hat was wann abgeschlossen? Exportierbar, für jede MDK-Prüfung sofort bereit.",
        },
      ],
    },
    faq: {
      title: "Häufige Fragen",
      questions: [
        {
          id: "mdk-accepted",

          q: "Werden digitale Schulungsnachweise beim MDK anerkannt?",
          a: "Scibly liefert dir vollständige, exportierbare Nachweise mit Zeitstempel und Abschlussprotokoll – im Format, das bei einer MDK-Prüfung typischerweise verlangt wird. Die endgültige Anerkennung liegt beim jeweiligen Prüfer.",
        },
        {
          id: "completion-overview",

          q: "Wie behalte ich den Überblick, wer eine Pflichtschulung noch nicht abgeschlossen hat?",
          a: "Im Dashboard siehst du auf einen Blick, wer welche Pflichtschulung bereits abgeschlossen hat und wer noch fehlt. Für jährliche Auffrischungen weist du den Kurs mit einem Klick erneut zu.",
        },
        {
          id: "home-care-mobile",

          q: "Kann Scibly auch für ambulante Pflegedienste genutzt werden?",
          a: "Ja. Scibly funktioniert vollständig mobil. Mitarbeitende im Außendienst können Schulungen auf dem Smartphone absolvieren.",
        },
      ],
    },
  },
  en: {
    meta: {
      title: "Training Records for Care Homes and Nursing Facilities | Scibly",
      description:
        "Inspection-ready without the file hunt. Assign mandatory training centrally, let staff train during shift breaks, generate compliance reports instantly.",
      keywords: [
        "care home training records",
        "CQC compliance training",
        "nursing home LMS",
        "mandatory training care staff",
        "fire safety training care",
      ],
    },
    hero: {
      eyebrow: "For care homes and nursing facilities",
      headline: "No folder search before the next inspection.",
      subheadline:
        "Hygiene training, first aid refreshers, fire safety: build the course once, assign it to every staff member, and export the compliance report whenever an inspector asks.",
      ctaLabel: "Request demo",
    },
    pain: {
      eyebrow: "The problem",
      title: "Every inspection means searching through folders",
      items: [
        {
          title: "Inspection time. Who completed what, and when?",
          description:
            "Hygiene training, first aid refreshers, fire safety inductions: inspectors want records. Those records are in folders that take more than five minutes to find.",
        },
        {
          title: "Coordinating 30 to 80 staff across shift patterns.",
          description:
            "Scheduling annual mandatory training for part-time workers, night shifts, and rotating rotas is complex and easy to get wrong.",
        },
        {
          title: "Inductions take up time that care staff need elsewhere.",
          description:
            "Hours spent on inductions are hours away from direct care. That's not a detail — it adds up.",
        },
      ],
    },
    solution: {
      eyebrow: "What Scibly solves",
      title: "All training centrally assigned. All records instant.",
      items: [
        {
          title:
            "Assign mandatory training centrally, track progress at a glance",
          description:
            "Assign all mandatory training to every staff member in one click. See exactly who is still outstanding at any time.",
        },
        {
          title: "Training during a shift break, on a tablet",
          description:
            "Staff complete courses on a tablet or phone during their break. No protected time, no off-site training days.",
        },
        {
          title: "Compliance export in two clicks",
          description:
            "Who completed what, and when? Exported in seconds, ready for every inspection.",
        },
      ],
    },
    faq: {
      title: "Common questions",
      questions: [
        {
          id: "mdk-accepted",

          q: "Are digital training records accepted by inspectors?",
          a: "Scibly gives you complete, exportable records with timestamps and completion protocols — in the format inspections typically require. Final acceptance is at the inspector's discretion.",
        },
        {
          id: "completion-overview",

          q: "How do I keep track of who hasn't completed a mandatory training yet?",
          a: "The dashboard shows at a glance who has completed which mandatory training and who is still outstanding. For annual refreshers, you reassign the course in one click.",
        },
        {
          id: "home-care-mobile",

          q: "Can Scibly be used for community and home care services?",
          a: "Yes. Scibly is fully mobile. Field-based staff can complete training on their smartphone wherever they are.",
        },
      ],
    },
  },
};
