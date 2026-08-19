import type { Locale } from "@scibly/i18n/constants";

export type CourseFrequency =
  | "mandatory"
  | "oneTime"
  | "recurring"
  | "onDemand";

export type CourseCard = {
  name: string;
  description: string;
  frequency: CourseFrequency;
  roles: string[];
  slug?: string;
};

export type OverviewTab = {
  id: string;
  label: string;
  cards: CourseCard[];
};

type OverviewContent = {
  meta: { title: string; description: string; keywords: string[] };
  hero: { eyebrow: string; headline: string; subheadline: string };
  slugLabel: string;
  frequencyLabels: Record<CourseFrequency, string>;
  tabs: OverviewTab[];
};

export const OVERVIEW_CONTENT = {
  de: {
    meta: {
      title:
        "LMS-Anwendungsfälle: Compliance, Onboarding und KI-Training | Scibly",
      description:
        "Von DSGVO-Pflichtschulung bis KI-Enablement: Konkrete Kursbeispiele aus echten Unternehmen. Compliance, Onboarding und Sicherheitsunterweisungen, digital und nachweisbar.",
      keywords: [
        "LMS Anwendungsfälle",
        "Compliance Schulung digital",
        "Onboarding LMS",
        "KI-Training Mitarbeiter",
        "Schulungsnachweise digital",
        "DSGVO Pflichtschulung",
        "E-Learning Unternehmen",
      ],
    },
    hero: {
      eyebrow: "Anwendungsfälle",
      headline: "Was Teams mit Scibly aufbauen",
      subheadline:
        "Pflichtschulung, Onboarding, KI-Enablement. Konkrete Kursbeispiele aus echten Unternehmen.",
    },
    slugLabel: "Branche",
    frequencyLabels: {
      mandatory: "Jährlich Pflicht",
      oneTime: "Einmalig",
      recurring: "Wiederkehrend",
      onDemand: "Bei Bedarf",
    },
    tabs: [
      {
        id: "compliance",
        label: "Compliance & Pflicht",
        cards: [
          {
            name: "DSGVO-Grundschulung",
            description:
              "Pflichtschulung für alle Mitarbeitenden. Deckt Datenschutz-Grundverordnung, Betroffenenrechte und betriebliche Meldepflichten ab.",
            frequency: "mandatory",
            roles: ["HR", "IT-Leitung", "Datenschutzbeauftragte"],
            slug: "it-unternehmen",
          },
          {
            name: "ISO 27001 Informationssicherheit",
            description:
              "Schulungsnachweis für ISO-27001-Audits. Zugriffsrechte, Incident Response und sichere Passwortverwaltung für IT-Mitarbeitende.",
            frequency: "mandatory",
            roles: ["IT-Leitung", "Entwicklerteams"],
            slug: "it-unternehmen",
          },
          {
            name: "HACCP-Hygieneunterweisung",
            description:
              "Gesetzlich vorgeschriebene Lebensmittelhygieneschulung. Temperaturkontrollen, Kreuzkontamination und HACCP-Protokolle für Küchen- und Servicepersonal.",
            frequency: "mandatory",
            roles: ["Betriebsleitung", "Küchenleitung"],
            slug: "gastronomie",
          },
          {
            name: "Brandschutzunterweisung",
            description:
              "Pflichtunterweisung nach ASR A2.2. Fluchtwege, Feuerlöscher, Meldekette. Einmal erstellt, für jeden Neuzugang mit einem Klick zuweisbar.",
            frequency: "mandatory",
            roles: ["Betriebsleitung", "Sicherheitsbeauftragte"],
          },
          {
            name: "MDK-Schulungspaket Pflege",
            description:
              "Hygieneschulung, Erste-Hilfe-Auffrischung und Brandschutz in einem Paket. Strukturiert für die jährliche MDK-Prüfung.",
            frequency: "mandatory",
            roles: ["Pflegedienstleitung"],
            slug: "pflege",
          },
          {
            name: "SOC-2 Security Awareness",
            description:
              "Schulungsnachweis für SOC-2-Audits. Phishing, Social Engineering, sicherer Umgang mit Kundendaten und Zugriffsmanagement.",
            frequency: "mandatory",
            roles: ["IT-Leitung", "Alle Mitarbeitenden"],
            slug: "it-unternehmen",
          },
        ],
      },
      {
        id: "onboarding",
        label: "Onboarding",
        cards: [
          {
            name: "IT-Onboarding für Entwickler",
            description:
              "Tools, Prozesse, Codestandards, Sicherheitsregeln. Einmal erstellt, für jeden Neuzugang mit einem Klick zuweisbar.",
            frequency: "oneTime",
            roles: ["IT-Leitung", "HR"],
            slug: "it-unternehmen",
          },
          {
            name: "Pflege-Ersteinarbeitung",
            description:
              "Dokumentationspflichten, Hygieneprozesse und Notfallabläufe. Für neue Pflegekräfte, abrufbar zwischen den Diensten.",
            frequency: "oneTime",
            roles: ["Pflegedienstleitung"],
            slug: "pflege",
          },
          {
            name: "Gastronomie-Erstunterweisung",
            description:
              "Hygiene, Servicestandards, HACCP-Grundlagen. Alles, was neue Mitarbeitende vor dem ersten Dienst wissen müssen.",
            frequency: "oneTime",
            roles: ["Betriebsleitung"],
            slug: "gastronomie",
          },
          {
            name: "Handwerk-Einarbeitung",
            description:
              "Sicherheitsregeln, Werkzeugkunde, DGUV-Grundunterweisung. Neue Fachkräfte werden eingewiesen, bevor sie auf die Baustelle gehen.",
            frequency: "oneTime",
            roles: ["Meister", "Betriebsinhaber"],
            slug: "handwerk",
          },
          {
            name: "Aushilfen-Onboarding Einzelhandel",
            description:
              "Kassensystem, Produktkenntnisse, Verhaltensregeln im Kundenkontakt. Für Saisonkräfte, auf dem Handy, vor dem ersten Tag.",
            frequency: "oneTime",
            roles: ["Filialleitung"],
            slug: "einzelhandel",
          },
          {
            name: "Logistik-Einweisung für Zeitarbeit",
            description:
              "Sicherheitsunterweisung, Lagerprozesse und Meldewege für wechselnde Zeitarbeitskräfte. Per E-Mail-Link, auf dem eigenen Handy.",
            frequency: "oneTime",
            roles: ["Lagerleitung", "HR"],
            slug: "logistik",
          },
        ],
      },
      {
        id: "ai",
        label: "KI-Enablement",
        cards: [
          {
            name: "ChatGPT-Grundkurs für alle Mitarbeitenden",
            description:
              "Was ist KI, was kann sie, was kann sie nicht? Erste Schritte für Mitarbeitende ohne technischen Hintergrund.",
            frequency: "oneTime",
            roles: ["HR", "Geschäftsführung"],
            slug: "ki-enablement",
          },
          {
            name: "Prompting für Teams",
            description:
              "Wie schreibe ich gute Prompts? Anhand von Beispielen aus dem eigenen Arbeitsalltag für Marketing, HR, Vertrieb und Support.",
            frequency: "recurring",
            roles: ["Teamleads", "HR"],
            slug: "ki-enablement",
          },
          {
            name: "KI-Richtlinien und Datenschutz",
            description:
              "Was darf mit KI-Tools geteilt werden, was nicht? Klare Regeln für Kundendaten, interne Dokumente und DSGVO-Grenzen.",
            frequency: "mandatory",
            roles: ["Datenschutzbeauftragte", "IT-Leitung"],
            slug: "it-unternehmen",
          },
          {
            name: "KI-Tools für HR",
            description:
              "Recruiting-Prompts, Leistungsbeurteilungen, Onboarding-Texte. Wie HR-Teams KI strukturiert in den Alltag integrieren.",
            frequency: "oneTime",
            roles: ["HR"],
            slug: "ki-enablement",
          },
          {
            name: "Fortgeschrittenes Prompt Engineering",
            description:
              "Chain-of-Thought, Few-Shot-Prompting, Systemprompts. Für Entwickler und technisch versierte Mitarbeitende.",
            frequency: "oneTime",
            roles: ["IT-Leitung", "Entwicklerteams"],
            slug: "ki-enablement",
          },
        ],
      },
      {
        id: "safety",
        label: "Sicherheitsunterweisung",
        cards: [
          {
            name: "Arbeitssicherheit Grundunterweisung",
            description:
              "DGUV-konforme Grundunterweisung für alle Mitarbeitenden. Allgemeine Gefährdungen, Verhaltensregeln und Meldepflichten.",
            frequency: "mandatory",
            roles: ["Betriebsleitung", "Sicherheitsbeauftragte"],
          },
          {
            name: "Gabelstapler und Flurförderzeuge",
            description:
              "Jährliche Sicherheitsunterweisung nach DGUV 308-001. Für Lager und Logistik, mit digitalem Abschlussnachweis.",
            frequency: "mandatory",
            roles: ["Lagerleitung", "Logistikleitung"],
            slug: "logistik",
          },
          {
            name: "Gefahrguttransport (ADR)",
            description:
              "Schulung für Fahrer, die gefährliche Güter transportieren. Klassifizierung, Kennzeichnung, Notfallmaßnahmen.",
            frequency: "recurring",
            roles: ["Fuhrparkleitung", "Fahrer"],
            slug: "logistik",
          },
          {
            name: "PSA-Unterweisung",
            description:
              "Persönliche Schutzausrüstung: Auswahl, Trageweise und Pflege. Für Handwerk, Bau und Produktion.",
            frequency: "mandatory",
            roles: ["Meister", "Betriebsinhaber"],
            slug: "handwerk",
          },
          {
            name: "Elektrische Sicherheit",
            description:
              "Schutzmaßnahmen, Gefährdungsbeurteilung und DGUV V3-Grundlagen. Für Elektrofachkräfte und technisches Personal.",
            frequency: "mandatory",
            roles: ["Sicherheitsbeauftragte", "Technische Leitung"],
          },
        ],
      },
      {
        id: "product",
        label: "Produkt- und Prozesstraining",
        cards: [
          {
            name: "Neue Produktlinie für Verkäufer",
            description:
              "Produktfeatures, USPs und häufige Einwände. Kompakt, auf dem Handy, für alle Filialen gleichzeitig ausrollbar.",
            frequency: "onDemand",
            roles: ["Filialleitung", "Vertriebsleitung"],
            slug: "einzelhandel",
          },
          {
            name: "ERP-Systemeinführung",
            description:
              "Schritt-für-Schritt-Schulung für die Einführung eines neuen ERP- oder CRM-Systems. Mit Quizfragen und Zertifikat.",
            frequency: "oneTime",
            roles: ["HR", "IT-Leitung", "Projektleitung"],
          },
          {
            name: "Qualitätsprozesse und SOPs",
            description:
              "Interne Qualitätsstandards, Produktionsprozesse und Arbeitsanweisungen als interaktive Kurse. Änderungen sofort für alle ausrollbar.",
            frequency: "recurring",
            roles: ["Qualitätsmanagement", "Produktionsleitung"],
          },
          {
            name: "Kassierschulung für Aushilfen",
            description:
              "Kassensystem, Rabattregeln, Retouren. Kompakt erklärt für neue Kassierkräfte im Einzelhandel.",
            frequency: "oneTime",
            roles: ["Filialleitung"],
            slug: "einzelhandel",
          },
          {
            name: "Kundenkommunikation und Beschwerdemanagement",
            description:
              "Wie reagiere ich auf schwierige Kundensituationen? Szenarien, Rollenspiele und Gesprächsleitfäden.",
            frequency: "recurring",
            roles: ["Teamleads", "HR"],
          },
        ],
      },
    ],
  },
  en: {
    meta: {
      title: "LMS Use Cases: Compliance, Onboarding and AI Training | Scibly",
      description:
        "From GDPR compliance training to AI enablement: concrete course examples from real companies. Compliance, onboarding, and safety inductions — digital and audit-ready.",
      keywords: [
        "LMS use cases",
        "compliance training software",
        "onboarding LMS",
        "AI training employees",
        "digital training records",
        "GDPR mandatory training",
        "e-learning business",
      ],
    },
    hero: {
      eyebrow: "Use cases",
      headline: "What teams build with Scibly",
      subheadline:
        "Compliance training, onboarding, AI enablement. Concrete course examples from real companies.",
    },
    slugLabel: "Industry",
    frequencyLabels: {
      mandatory: "Annually required",
      oneTime: "One-time",
      recurring: "Recurring",
      onDemand: "On demand",
    },
    tabs: [
      {
        id: "compliance",
        label: "Compliance",
        cards: [
          {
            name: "GDPR Essentials",
            description:
              "Mandatory training for all employees. Covers GDPR fundamentals, data subject rights, and internal reporting obligations.",
            frequency: "mandatory",
            roles: ["HR", "IT leadership", "DPO"],
            slug: "it-companies",
          },
          {
            name: "ISO 27001 Information Security",
            description:
              "Training records for ISO 27001 audits. Access rights, incident response, and secure password management for IT staff.",
            frequency: "mandatory",
            roles: ["IT leadership", "Engineering teams"],
            slug: "it-companies",
          },
          {
            name: "HACCP Food Hygiene",
            description:
              "Legally required food safety training. Temperature controls, cross-contamination prevention, and HACCP protocols for kitchen and service staff.",
            frequency: "mandatory",
            roles: ["Operations manager", "Kitchen management"],
            slug: "hospitality",
          },
          {
            name: "Fire Safety Induction",
            description:
              "Mandatory fire safety training. Evacuation routes, fire extinguisher use, and emergency contact chains. Built once, assignable to every new hire in one click.",
            frequency: "mandatory",
            roles: ["Operations manager", "Safety officer"],
          },
          {
            name: "Care Home Mandatory Training",
            description:
              "Hygiene, first aid refresher, and fire safety in one package. Structured for annual inspection requirements.",
            frequency: "mandatory",
            roles: ["Care manager"],
            slug: "healthcare",
          },
          {
            name: "SOC-2 Security Awareness",
            description:
              "Training records for SOC-2 audits. Phishing, social engineering, secure handling of customer data, and access management.",
            frequency: "mandatory",
            roles: ["IT leadership", "All staff"],
            slug: "it-companies",
          },
        ],
      },
      {
        id: "onboarding",
        label: "Onboarding",
        cards: [
          {
            name: "Developer Onboarding",
            description:
              "Tools, processes, code standards, security rules. Built once, assignable to every new engineer in one click.",
            frequency: "oneTime",
            roles: ["IT leadership", "HR"],
            slug: "it-companies",
          },
          {
            name: "Care Staff Induction",
            description:
              "Documentation requirements, hygiene protocols, and emergency procedures. For new care staff, completable between shifts.",
            frequency: "oneTime",
            roles: ["Care manager"],
            slug: "healthcare",
          },
          {
            name: "Hospitality New Starter Induction",
            description:
              "Hygiene, service standards, HACCP basics. Everything new employees need to know before their first shift.",
            frequency: "oneTime",
            roles: ["Operations manager"],
            slug: "hospitality",
          },
          {
            name: "Trades Induction",
            description:
              "Safety rules, equipment handling, statutory induction. New workers are inducted before they go on site.",
            frequency: "oneTime",
            roles: ["Site manager", "Business owner"],
            slug: "trades-and-construction",
          },
          {
            name: "Retail New Starter Onboarding",
            description:
              "Till system, product knowledge, customer contact guidelines. For seasonal and temporary staff, on their phone, before day one.",
            frequency: "oneTime",
            roles: ["Store manager"],
            slug: "retail",
          },
          {
            name: "Agency Worker Induction (Logistics)",
            description:
              "Safety briefing, warehouse processes, and reporting procedures for rotating agency staff. Via an email link, on their own phone.",
            frequency: "oneTime",
            roles: ["Warehouse manager", "HR"],
            slug: "logistics",
          },
        ],
      },
      {
        id: "ai",
        label: "AI Enablement",
        cards: [
          {
            name: "ChatGPT Basics for All Staff",
            description:
              "What is AI, what can it do, what can't it? First steps for employees without a technical background.",
            frequency: "oneTime",
            roles: ["HR", "Leadership"],
            slug: "ai-enablement",
          },
          {
            name: "Prompting for Teams",
            description:
              "How to write effective prompts, using examples from your own daily work — for marketing, HR, sales, and support.",
            frequency: "recurring",
            roles: ["Team leads", "HR"],
            slug: "ai-enablement",
          },
          {
            name: "AI Usage Policy and Data Protection",
            description:
              "What can be shared with AI tools, and what can't? Clear rules for customer data, internal documents, and GDPR boundaries.",
            frequency: "mandatory",
            roles: ["DPO", "IT leadership"],
            slug: "it-companies",
          },
          {
            name: "AI Tools for HR",
            description:
              "Recruiting prompts, performance reviews, onboarding copy: how HR teams integrate AI tools into their daily work.",
            frequency: "oneTime",
            roles: ["HR"],
            slug: "ai-enablement",
          },
          {
            name: "Advanced Prompt Engineering",
            description:
              "Chain-of-thought, few-shot prompting, system prompts. For developers and technically proficient employees.",
            frequency: "oneTime",
            roles: ["IT leadership", "Engineering teams"],
            slug: "ai-enablement",
          },
        ],
      },
      {
        id: "safety",
        label: "Safety Training",
        cards: [
          {
            name: "Workplace Safety Induction",
            description:
              "General health and safety induction for all employees. Common hazards, conduct rules, and reporting obligations.",
            frequency: "mandatory",
            roles: ["Operations manager", "Safety officer"],
          },
          {
            name: "Forklift and Materials Handling",
            description:
              "Annual safety training for forklift operators. For warehouse and logistics staff, with a digital completion record.",
            frequency: "mandatory",
            roles: ["Warehouse manager", "Logistics manager"],
            slug: "logistics",
          },
          {
            name: "Hazardous Goods Transport (ADR)",
            description:
              "Training for drivers transporting dangerous goods. Classification, labelling, and emergency procedures.",
            frequency: "recurring",
            roles: ["Fleet manager", "Drivers"],
            slug: "logistics",
          },
          {
            name: "PPE Training",
            description:
              "Personal protective equipment: correct selection, fitting, and maintenance. For trades, construction, and production.",
            frequency: "mandatory",
            roles: ["Site manager", "Business owner"],
            slug: "trades-and-construction",
          },
          {
            name: "Electrical Safety",
            description:
              "Protective measures, risk assessment, and statutory safety basics. For qualified electricians and technical personnel.",
            frequency: "mandatory",
            roles: ["Safety officer", "Technical management"],
          },
        ],
      },
      {
        id: "product",
        label: "Product Training",
        cards: [
          {
            name: "New Product Range for Sales Staff",
            description:
              "Product features, USPs, and common objections. Short, on mobile, deployable to all stores at once.",
            frequency: "onDemand",
            roles: ["Store manager", "Sales leadership"],
            slug: "retail",
          },
          {
            name: "ERP System Introduction",
            description:
              "Step-by-step training for a new ERP or CRM system rollout. With quiz questions and a completion certificate.",
            frequency: "oneTime",
            roles: ["HR", "IT leadership", "Project management"],
          },
          {
            name: "Quality Processes and SOPs",
            description:
              "Internal quality standards, production processes, and standard operating procedures as interactive courses. Update and roll out changes instantly.",
            frequency: "recurring",
            roles: ["Quality management", "Production management"],
          },
          {
            name: "Till Training for New Staff",
            description:
              "Till system, discount rules, returns handling. Explained concisely for new checkout staff in retail.",
            frequency: "oneTime",
            roles: ["Store manager"],
            slug: "retail",
          },
          {
            name: "Customer Communication and Complaints",
            description:
              "How to handle difficult customer situations. Scenarios, role-plays, and conversation guides.",
            frequency: "recurring",
            roles: ["Team leads", "HR"],
          },
        ],
      },
    ],
  },
} satisfies Record<Locale, OverviewContent>;
