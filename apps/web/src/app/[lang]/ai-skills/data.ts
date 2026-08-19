import type { Locale } from "@scibly/i18n/constants";

export type SkillCategory = "analysis" | "design" | "content" | "production";

export type SkillEntry = {
  id: string;
  displayName: string;
  category: SkillCategory;
  de: {
    tagline: string;
    description: string;
    when: string;
  };
  en: {
    tagline: string;
    description: string;
    when: string;
  };
};

export const SKILLS: SkillEntry[] = [
  {
    id: "needs-analysis",
    displayName: "needs-analysis",
    category: "analysis",
    de: {
      tagline: "Was muss gelernt werden?",
      description:
        "Verarbeitet SME-Notizen, Transkripte und Stellenbeschreibungen zu einer strukturierten Kompetenzlückenanalyse. Aus rohem Input wird ein Lernbriefing, das man direkt weiterverarbeiten kann.",
      when: "Wenn unklar ist, was ein Kurs eigentlich abdecken soll. Besonders nützlich nach SME-Interviews oder vor dem Start eines neuen Trainingsprojekts.",
    },
    en: {
      tagline: "What needs to be learned?",
      description:
        "Turns SME notes, transcripts, and job descriptions into a structured skill gap analysis. Raw input becomes a learning brief you can build from immediately.",
      when: "When it's unclear what a course should actually cover. Most useful after SME interviews or before scoping a new training project.",
    },
  },
  {
    id: "didactic-reduction",
    displayName: "didactic-reduction",
    category: "analysis",
    de: {
      tagline: "Raus mit allem, was nicht unterrichtet werden muss.",
      description:
        "Filtert jeden Inhalt auf das didaktisch notwendige Minimum. Der Skill nutzt drei Prüffilter aus der deutschen Bildungswissenschaft, um zu entscheiden, was wirklich gelehrt werden muss und was wegfällt.",
      when: "Wenn ein SME 200 Folien geliefert hat und unklar ist, was davon in den Kurs gehört. Oder wenn Schulungsinhalt zu umfangreich für die verfügbare Zeit ist.",
    },
    en: {
      tagline: "Cut everything that doesn't need to be taught.",
      description:
        "Filters any topic down to its didactically essential core. Uses three filters from educational science to decide what learners must understand and what can be left out without losing integrity.",
      when: "When an SME has delivered 200 slides and it's unclear what belongs in the course. Or when training content is too broad for the time available.",
    },
  },
  {
    id: "learning-objectives",
    displayName: "learning-objectives",
    category: "design",
    de: {
      tagline: "Von vage zu messbar.",
      description:
        "Wandelt schwache Lernziele wie 'Mitarbeitende kennen den Prozess' in präzise, testbare Verhaltensformulierungen nach Bloom's Taxonomie und dem ABCD-Modell um.",
      when: "Direkt nach der Bedarfsanalyse oder bevor ein Kurs strukturiert wird. Ohne klare Lernziele produzieren Assessments die falschen Fragen und Microlearning-Module das falsche Thema.",
    },
    en: {
      tagline: "From vague to measurable.",
      description:
        'Turns weak objectives like "employees understand the process" into precise, testable behavior statements using Bloom\'s Taxonomy and the ABCD model.',
      when: "Directly after needs analysis or before structuring a course. Without clear objectives, assessments test the wrong things and microlearning covers the wrong topics.",
    },
  },
  {
    id: "microlearning-design",
    displayName: "microlearning-design",
    category: "design",
    de: {
      tagline: "Struktur für 3- bis 10-minütige Lerneinheiten.",
      description:
        "Entwirft fokussierte Microlearning-Sessions: Welche Szenen, welche Reihenfolge, welcher Übungsmoment. Der Skill strukturiert die Lerneinheit, nicht nur den Inhalt.",
      when: "Wenn ein Kurs in kurze, mobile Lerneinheiten aufgeteilt werden soll. Besonders hilfreich für Onboarding, Performance Support und Just-in-time Training.",
    },
    en: {
      tagline: "Structure for 3–10 minute learning moments.",
      description:
        "Designs focused microlearning sessions: which scenes, what sequence, which practice moment. The skill structures the learning unit, not just the content.",
      when: "When a course needs to be split into short, mobile-friendly units. Especially useful for onboarding, performance support, and just-in-time training.",
    },
  },
  {
    id: "assessment-design",
    displayName: "assessment-design",
    category: "design",
    de: {
      tagline: "Quizfragen, die wirklich prüfen.",
      description:
        "Erstellt Quizfragen, die über einfaches Wiedererkennen hinausgehen. Der Skill nutzt Bloom's Taxonomie, um Fragen auf Anwendungsebene zu erzeugen, inklusive funktionierender Distraktoren und Feedback, das weiterlehrt.",
      when: "Wenn KI-generierte Fragen zu einfach, zu offensichtlich oder rein auswendiglernbasiert sind. Oder wenn ein Kurs einen validen Abschlussnachweis braucht.",
    },
    en: {
      tagline: "Quiz questions that actually test understanding.",
      description:
        "Creates questions that go beyond simple recognition. Uses Bloom's Taxonomy to generate application-level items with working distractors and feedback that continues teaching.",
      when: "When AI-generated questions are too easy, too obvious, or test only recall. Or when a course needs a valid completion record.",
    },
  },
  {
    id: "scenario-generation",
    displayName: "scenario-generation",
    category: "content",
    de: {
      tagline: "Realistische Arbeitsszenarien im Dutzend.",
      description:
        "Generiert realistische Szenarien, Fallstudien und Verzweigungssituationen. Mit dem richtigen Briefing produziert KI in der Zeit eines handgeschriebenen Szenarios zehn.",
      when: "Wenn für eine Kompetenz viele Übungssituationen gebraucht werden oder wenn bestehende Szenarien zu generisch oder unrealistisch wirken.",
    },
    en: {
      tagline: "Realistic workplace scenarios at scale.",
      description:
        "Generates realistic scenarios, case studies, and branching situations. With the right brief, AI produces ten scenarios in the time it takes to write one by hand.",
      when: "When a skill needs many practice situations, or when existing scenarios feel too generic or unrealistic.",
    },
  },
  {
    id: "content-editing",
    displayName: "content-editing",
    category: "content",
    de: {
      tagline: "KI schreibt den Entwurf. Du machst ihn gut.",
      description:
        "Führt durch die Überarbeitung von KI-generiertem Inhalt: Was suchen, wie schnell beheben. Kürzt Entwicklungszeit, ohne Qualität zu opfern.",
      when: "Wenn KI-Output vorhanden ist, aber etwas nicht stimmt. Oder wenn ein Team KI als Entwurfsmaschine nutzen will, ohne die redaktionelle Kontrolle zu verlieren.",
    },
    en: {
      tagline: "AI writes the draft. You make it good.",
      description:
        "Guides the review of AI-generated content: what to look for, how to fix it fast. Cuts development time without sacrificing quality.",
      when: "When there's AI output that feels off but it's hard to say why. Or when a team wants to use AI as a first-draft machine without losing editorial control.",
    },
  },
  {
    id: "instructional-prompt-engineering",
    displayName: "instructional-prompt-engineering",
    category: "content",
    de: {
      tagline: "Bessere Prompts, bessere Kursinhalte.",
      description:
        "Zeigt, wie man KI-Prompts für Lerninhalte strukturiert: eine 4-Zutaten-Struktur, die pädagogisch fundierte, zielgruppengerechte Inhalte liefert statt generischem Text.",
      when: "Wenn KI-Output sich generisch anfühlt oder nicht zum Publikum passt. Oder wenn jemand lernen will, wie man KI für Instructional-Design-Aufgaben gezielt brieft.",
    },
    en: {
      tagline: "Better prompts, better course content.",
      description:
        "Shows how to structure AI prompts for learning content using a 4-ingredient framework that delivers pedagogically sound, audience-appropriate output instead of generic text.",
      when: "When AI output feels generic or off-target for the audience. Or when someone wants to learn how to brief AI specifically for instructional design tasks.",
    },
  },
  {
    id: "storyboard",
    displayName: "storyboard",
    category: "production",
    de: {
      tagline: "Was produzieren wir, und wo macht es Sinn?",
      description:
        "Wandelt eine Kursstruktur in einen Medienplan um: welche Szene ein Video, eine Animation, ein interaktives Szenario oder einfachen Text bekommt, mit didaktischer Begründung.",
      when: "Wenn eine Kursstruktur steht und die Frage kommt: Was produzieren wir eigentlich? Besonders nützlich, bevor Video- oder Animationsproduktion beginnt.",
    },
    en: {
      tagline: "What do we produce, and where does it make sense?",
      description:
        "Turns a course outline into a media plan: which scene gets a video, animation, interactive scenario, or plain text, with didactic reasoning for each decision.",
      when: "When a course structure exists and the question arises: what do we actually produce? Most useful before video or animation production begins.",
    },
  },
];

export type SkillsPageContent = {
  meta: { title: string; description: string; keywords: string[] };
  hero: { headline: string; subheadline: string };
  githubLabel: string;
  categories: Record<SkillCategory, string>;
  cardWhenLabel: string;
};

export const SKILLS_PAGE_CONTENT = {
  de: {
    meta: {
      title: "KI-Skills für Instructional Designer | Scibly",
      description:
        "9 Open-Source KI-Skills für Instructional Designer und L&D-Teams. Von Bedarfsanalyse bis Storyboard: Kursinhalte schneller und besser bauen.",
      keywords: [
        "KI Instructional Design",
        "KI Kurs erstellen",
        "AI Skills L&D",
        "Lernziele schreiben KI",
        "Needs Analysis KI",
        "Microlearning Design",
        "Storyboard KI",
      ],
    },
    hero: {
      headline: "KI-Skills für\nInstructional Designer und Course Creator",
      subheadline:
        "Neun spezialisierte Agent Skills für L&D-Teams. Von der Bedarfsanalyse bis zum Storyboard, in jeder Phase des Kursdesigns.",
    },
    githubLabel: "GitHub ansehen",
    categories: {
      analysis: "Analyse",
      design: "Kursdesign",
      content: "Inhalt",
      production: "Produktion",
    },
    cardWhenLabel: "Wann einsetzen",
  },
  en: {
    meta: {
      title: "AI Skills for Instructional Designers | Scibly",
      description:
        "9 open-source AI skills for instructional designers and L&D teams. From needs analysis to storyboard: build better course content, faster.",
      keywords: [
        "AI instructional design",
        "AI course creation",
        "learning objectives AI",
        "needs analysis AI",
        "microlearning design tool",
        "storyboard AI",
        "L&D AI tools",
      ],
    },
    hero: {
      headline: "AI Skills for\nInstructional Designers and Course Creators",
      subheadline:
        "Nine specialized agent skills for L&D teams. From needs analysis to storyboard, for every phase of course design.",
    },
    githubLabel: "View on GitHub",
    categories: {
      analysis: "Analysis",
      design: "Course design",
      content: "Content",
      production: "Production",
    },
    cardWhenLabel: "When to use",
  },
} satisfies Record<Locale, SkillsPageContent>;
