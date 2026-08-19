import { type Locale } from "@scibly/i18n/constants";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  category: "education" | "product" | "engineering" | "design" | "company";
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  featured?: boolean;
  thumbnail: string;
  keywords: string[];
}

export function formatReadTime(readTime: number, lang: Locale): string {
  return lang === "de" ? `${readTime} Min. Lesezeit` : `${readTime} min read`;
}

export const BLOG_POSTS = {
  en: [
    {
      slug: "adobe-captivate-alternativen",
      title: "Adobe Captivate Alternatives: What to Do Now",
      description:
        'Adobe Captivate isn\'t being discontinued entirely, but the current desktop version \\"Captivate Classic\\" is being phased out: regular support ends August 23, 2026, extended support August 23, 2027.',
      date: "July 25, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "adobe captivate alternative",
        "captivate discontinued",
        "captivate replacement",
      ],
    },
    {
      slug: "beste-kostenlose-ki-tools-lernen",
      title: "The Best Free AI Tools for Learning, Compared",
      description:
        "Gemini Notebook (known as NotebookLM until July 2026), ChatGPT, Gemini, and Claude can all be used for free to learn, but they differ significantly in what they're best suited for.",
      date: "July 23, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "best free ai tools for learning",
        "notebooklm chatgpt gemini claude comparison",
        "free ai tools to learn",
        "gemini notebook chatgpt claude comparison",
      ],
    },
    {
      slug: "branchenspezifische-compliance-schulung",
      title:
        "Industry-Specific Compliance Training: Why Standard Courses Often Aren't Enough",
      description:
        "Pharma, financial services, and healthcare have one thing in common: mandatory training here isn't just good practice, it's directly tied to industry-specific regulation, with correspondingly higher documentation requirements than in less regulated industries.",
      date: "July 21, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "pharma compliance training software",
        "financial services mandatory training software",
        "healthcare employee training",
        "industry-specific compliance training",
      ],
    },
    {
      slug: "bsi-grundschutz-schulung-mitarbeiter",
      title:
        "BSI IT-Grundschutz and Employee Training: What the Standard Requires for Awareness",
      description:
        "Germany's BSI IT-Grundschutz standard treats training and awareness as its own dedicated component, not an optional add-on.",
      date: "July 19, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "bsi grundschutz training",
        "it-grundschutz awareness training",
        "bsi grundschutz employee training",
      ],
    },
    {
      slug: "cornerstone-alternativen",
      title:
        "Cornerstone Alternatives: When the Enterprise LMS Is Too Big for Your Needs",
      description:
        "Cornerstone OnDemand is a comprehensive enterprise system for people development that covers talent management, performance reviews, and succession planning alongside learning management.",
      date: "July 17, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "cornerstone alternative",
        "cornerstone ondemand alternative",
        "cornerstone lms replacement",
      ],
    },
    {
      slug: "docebo-vs-talentlms",
      title: "Docebo vs. TalentLMS: Which LMS Fits Which Company Size",
      description:
        "Docebo and TalentLMS solve the same basic problem, managing employee training centrally, but they target very different company sizes.",
      date: "July 15, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "docebo vs talentlms",
        "docebo talentlms comparison",
        "talentlms or docebo",
      ],
    },
    {
      slug: "duolingo-prinzip-mitarbeiterschulung",
      title:
        "Duolingo as a Model for Employee Training? What's Actually Transferable",
      description:
        "Duolingo is often cited in L&D circles as a model when it comes to engagement in training.",
      date: "July 13, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "duolingo principle for companies",
        "gamification employee training worthwhile",
        "spaced repetition employee training",
        "why employees forget training content",
      ],
    },
    {
      slug: "e-learning-oeffentlicher-dienst",
      title:
        "E-Learning in the Public Sector: A Response to the Skills Shortage and Retirement Wave",
      description:
        "The public sector faces a double challenge: a large share of the workforce will retire in the coming years, while new digital administrative procedures need to be rolled out at the same time.",
      date: "July 11, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "e-learning public sector",
        "digital government training",
        "digital employee training government",
      ],
    },
    {
      slug: "entdeckendes-lernen-nachteile",
      title:
        'Discovery Learning: Why \\"Just Let Them Figure It Out\\" Often Works Worse Than Expected',
      description:
        "Discovery learning lets learners explore a topic themselves, without prior explanation.",
      date: "July 9, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "discovery learning disadvantages",
        "self-directed learning training",
        "unassisted discovery learning",
      ],
    },
    {
      slug: "enterprise-lms-sicherheit-checkliste",
      title: "Enterprise LMS Security: A Checklist for IT Sign-Off",
      description:
        "Before an enterprise LMS goes live, IT departments typically check more than just course functionality: authentication, data processing, certifications, and auditability.",
      date: "July 7, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "enterprise lms security",
        "lms data protection certification",
        "e-learning platform iso 27001",
        "lms audit trail",
      ],
    },
    {
      slug: "erst-theorie-oder-erst-uebung",
      title:
        "Theory First or Practice First? What Learning Science Means for Employee Training",
      description:
        "Should you explain the process manual to a new colleague first, or throw her in at the deep end and correct her afterward?",
      date: "July 5, 2026",
      readTime: 5,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "theory or practice first learning",
        "best sequence for training",
        "how should training be structured",
        "productive failure training",
      ],
    },
    {
      slug: "gamification-mitarbeiterschulung-grenzen",
      title:
        "Gamification in Employee Training: What Actually Helps and What Just Creates Activity",
      description:
        "Gamification in employee training reliably affects engagement: usage, return visits, and completion rates measurably increase when points, progress bars, or leaderboards are added.",
      date: "July 3, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "gamification training worthwhile",
        "streaks leaderboards learning outcomes",
        "gamification employee training",
      ],
    },
    {
      slug: "gemini-notebook-alternative-eu-hosting",
      title:
        "Gemini Notebook (NotebookLM) Alternatives with EU Hosting: What Matters When Choosing",
      description:
        '\\"EU hosting\\" is often used as a marketing claim for AI tools without it being clear what exactly is meant.',
      date: "July 11, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "gemini notebook alternative eu hosting",
        "notebooklm alternative eu hosting",
        "eu ai tool documents",
        "ai tool gdpr hosting europe",
      ],
    },
    {
      slug: "gemini-notebook-einsatzwecke-unternehmen",
      title:
        "Gemini Notebook in the Enterprise: The Main Use Cases, and Where a Finished Course Does More",
      description:
        "Gemini Notebook, known as NotebookLM until July 2026, is used in a business context mainly for four things: making existing documents searchable, onboarding new employees into extensive documentation, consolidating meeting notes and project knowledge, and creating fast summaries of long documents.",
      date: "July 9, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "gemini notebook use cases enterprise",
        "notebooklm business use cases",
        "what to use gemini notebook for",
        "gemini notebook in the enterprise",
      ],
    },
    {
      slug: "gemini-notebook-unternehmen-dsgvo",
      title:
        "Gemini Notebook (NotebookLM) in the Enterprise: Where the GDPR Line Sits",
      description:
        "Gemini Notebook, known as NotebookLM until July 2026, is Google's AI tool that generates summaries, answers, and even audio overviews from uploaded documents, but those documents are processed on Google's US servers.",
      date: "July 7, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "gemini notebook gdpr",
        "gemini notebook enterprise data protection",
        "notebooklm gdpr",
        "notebooklm enterprise data protection",
        "notebooklm alternative",
      ],
    },
    {
      slug: "h5p-autorentool",
      title:
        "H5P as an Authoring Tool: What It Can Do and Where Its Limits Are",
      description:
        "H5P is a free, open-source authoring tool for interactive e-learning content that runs directly in the browser and integrates into many existing systems like Moodle or WordPress.",
      date: "June 25, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "h5p authoring tool",
        "h5p e-learning",
        "h5p free",
        "h5p interactive content",
      ],
    },
    {
      slug: "interne-doku-in-kurs-umwandeln",
      title: "Turning Internal Documentation into an Onboarding Course",
      description:
        "In most engineering teams, Confluence pages, Notion docs, and internal wikis already contain the complete knowledge new developers need for onboarding, just not in a form that can be worked through like a course.",
      date: "June 23, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "turn internal docs into training course",
        "confluence as lms",
        "turn notion docs into a course",
        "technical onboarding software startup",
        "automate engineering onboarding",
      ],
    },
    {
      slug: "ki-kompetenz-nachweis-mitarbeiter",
      title: "Proving AI Competence: What Companies Need to Document",
      description:
        "Proof of AI competence documents who in a company was trained when and on what topic in the safe and appropriate use of AI systems.",
      date: "June 21, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ai competence proof",
        "ai training documentation audit",
        "ai competence proof company",
      ],
    },
    {
      slug: "ki-onboarding-mitarbeiter",
      title: "AI-Assisted Onboarding: Getting New Employees Up to Speed Faster",
      description:
        "AI-assisted onboarding uses existing company documents, such as process descriptions, manuals, or internal wikis, to automatically generate structured onboarding content, instead of building every onboarding course manually from scratch.",
      date: "June 19, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ai onboarding employees",
        "speed up onboarding with ai",
        "onboard new employees faster ai",
      ],
    },
    {
      slug: "ki-rollenspiele-training",
      title: "AI Roleplay in Training: More Than Another Multiple-Choice Quiz",
      description:
        "AI roleplay lets learners hold a conversation with an AI that simulates a realistic counterpart, such as a difficult customer, a critical employee, or a sales objection.",
      date: "June 17, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ai roleplay training",
        "ai roleplay employee training",
        "ai simulation training",
      ],
    },
    {
      slug: "ki-schulung-mittelstand",
      title:
        "AI Training for Mid-Sized Companies: How Teams Learn to Use AI Tools Safely",
      description:
        "Many mid-sized companies have already rolled out AI tools like Copilot or ChatGPT, but without structured training on them.",
      date: "June 15, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ai training mid-sized companies",
        "copilot training employees",
        "chatgpt policy company",
        "safe use of ai in the company",
      ],
    },
    {
      slug: "kirkpatrick-modell",
      title:
        "The Kirkpatrick Model: The 4 Levels of Training Evaluation Explained",
      description:
        "The Kirkpatrick Model is a four-level framework for evaluating training effectiveness, developed by Donald Kirkpatrick and first published in 1959.",
      date: "June 13, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "kirkpatrick model",
        "kirkpatrick model explained",
        "donald kirkpatrick",
        "kirkpatrick evaluation model",
      ],
    },
    {
      slug: "lms-sso-integration",
      title: "LMS with SSO: What Single Sign-On Means for Rollout",
      description:
        "Single sign-on (SSO) lets employees log into an LMS with their existing company account instead of managing an additional password.",
      date: "June 11, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: ["lms sso", "lms with sso integration", "single sign on lms"],
    },
    {
      slug: "ozg-schulung-verwaltung",
      title:
        "OZG Training: How German Public Administrations Prepare Staff for New Digital Procedures",
      description:
        "Germany's Online Access Act (OZG) requires federal, state, and municipal government to offer administrative services online.",
      date: "June 9, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ozg training",
        "training on new administrative procedures",
        "ozg training government",
      ],
    },
    {
      slug: "productive-failure-methode",
      title:
        "Productive Failure: Why Failing First Can Sometimes Make You Learn Faster",
      description:
        "Productive failure means having learners work on a problem first that they can't yet solve with their current knowledge, and only afterward explaining the correct solution.",
      date: "June 7, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "productive failure method",
        "fail first then learn",
        "problem solving before instruction",
      ],
    },
    {
      slug: "prozedurales-wissen-schulen",
      title:
        "Training Procedural Knowledge: Why Process Knowledge Needs a Different Logic Than Understanding",
      description:
        "Procedural knowledge means correctly executing a fixed sequence, such as an approval process, a safety checklist, or operating a specific software dialog.",
      date: "June 5, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "training procedural knowledge",
        "train processes checklist",
        "procedural knowledge training",
      ],
    },
    {
      slug: "quereinsteiger-einarbeitung-schulungsplan",
      title:
        "Onboarding Career Changers: How a Structured Training Plan Shortens Ramp-Up",
      description:
        "Career changers often bring valuable experience from a different field, but no prior knowledge of the field-specific processes and tools of their new role.",
      date: "June 3, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "onboarding career changers",
        "career changer training plan",
        "skills shortage retraining employees",
      ],
    },
    {
      slug: "recognition-vs-recall-e-learning",
      title: "Recognition vs. Recall: Why Most E-Learning Quizzes Are Too Easy",
      description:
        "Most e-learning quizzes stay stuck at the recognition stage: a question with four answer options, one of which is obviously correct as soon as you read it.",
      date: "June 1, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "e-learning quiz too easy",
        "multiple choice vs free response learning",
        "recognition vs recall learning",
      ],
    },
    {
      slug: "retrieval-practice-mitarbeiterschulung",
      title:
        "Retrieval Practice: The Simplest Way to Make Training Content Stick Long-Term",
      description:
        "Retrieval practice means actively pulling knowledge from memory instead of just rereading or reviewing it.",
      date: "May 30, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "retrieval practice method",
        "recall exercises learning",
        "make knowledge stick long-term",
        "why repetition helps learning",
      ],
    },
    {
      slug: "schulungsunterlagen-erstellen",
      title: "Creating Training Materials: Structure, Template, and Checklist",
      description:
        "Training materials are what a training session is actually delivered with: a slide deck, a guide, a worksheet, or e-learning content.",
      date: "May 28, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "training materials",
        "create training materials",
        "structuring training materials",
        "training materials template",
        "training material",
      ],
    },
    {
      slug: "sharepoint-als-lms",
      title: "Using SharePoint as an LMS: What Works and What's Missing",
      description:
        "SharePoint can be used with folder structures, pages, and Microsoft Lists as a makeshift repository for training materials, but it isn't a learning management system.",
      date: "May 26, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "sharepoint as lms",
        "sharepoint training platform",
        "sharepoint employee training",
      ],
    },
    {
      slug: "slidepresenter-alternative",
      title:
        "SlidePresenter Alternatives: Video-Based Training Without a Custom Quote",
      description:
        "SlidePresenter is a German video platform for employee-generated learning: subject-matter experts record knowledge directly as video instead of building a classic slide deck.",
      date: "May 24, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "slidepresenter alternative",
        "slidepresenter replacement",
        "video-based training tool",
      ],
    },
    {
      slug: "spaced-repetition-praxis",
      title:
        "Spaced Repetition in Practice: How to Build Distributed Repetition Into Training",
      description:
        "Spaced repetition means repeating the same learning content at growing intervals, instead of learning it once and never touching it again.",
      date: "May 22, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "spaced repetition employee training",
        "distributed repetition learning",
        "spaced repetition in practice",
      ],
    },
    {
      slug: "sprachlernen-vs-kompetenztransfer",
      title:
        "Why Employees Forget What They Learned in Day-to-Day Work Despite Completing Training",
      description:
        "Language-learning apps like Duolingo are a revealing comparison case for employee training, because they show a familiar pattern: they're strong at building receptive knowledge, such as recognizing vocabulary or understanding simple sentences, but noticeably weaker at teaching situational and pragmatic competence, meaning reacting appropriately on the spot in a real conversation.",
      date: "May 20, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "why employees forget what they learned",
        "competence transfer training",
        "transfer of training knowledge to day-to-day work",
      ],
    },
    {
      slug: "vorwissen-schulungsdesign",
      title:
        "Prior Knowledge in Training Design: Why the Same Method Doesn't Work for Everyone",
      description:
        "Prior knowledge is the single most important factor in which learning method works best for a given person.",
      date: "May 18, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "prior knowledge learning outcomes",
        "designing training by experience level",
        "prior knowledge training design",
      ],
    },
    {
      slug: "was-ist-articulate-360",
      title:
        "What Is Articulate 360? Pricing, Tools, and Who It's Worth It For",
      description:
        "Articulate 360 is a software suite for e-learning creation, built around two core authoring tools: Rise 360 for fast, responsive, block-based courses and Storyline 360 for more complex, freely designed interactive training.",
      date: "May 16, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "what is articulate 360",
        "articulate 360 cost",
        "articulate rise 360 pricing",
        "articulate 360 suite",
        "articulate software",
      ],
    },
    {
      slug: "wissen-von-beratern-skalieren",
      title:
        "Scaling Knowledge from Consultants Without It Staying Tied to One Person",
      description:
        "In consultancies and agencies, a large share of the actual value sits in the knowledge of individual experienced consultants, not in documents.",
      date: "May 14, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "scale proprietary knowledge consulting",
        "consulting onboarding software",
        "documenting consultant knowledge",
        "knowledge management for agencies",
      ],
    },
    {
      slug: "worked-examples-schulung",
      title:
        "Worked Examples: Why Fully Worked-Out Examples Often Get You There Faster Than Figuring It Out Yourself",
      description:
        "A worked example is a fully worked-out example where every solution step is visibly explained, instead of leaving learners to find the solution themselves.",
      date: "May 12, 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "worked examples learning",
        "worked examples training",
        "fully worked-out examples training",
      ],
    },
    {
      slug: "eu-ai-act-ki-kompetenz-pflicht",
      title:
        "EU AI Act Article 4: What the AI Literacy Obligation Means for Your Company",
      description:
        "Article 4 of the EU AI Act has required AI literacy among staff since February 2025. What it demands, who is affected, and what changes on August 2, 2026.",
      date: "July 17, 2026",
      readTime: 11,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "eu ai act article 4",
        "ai literacy obligation",
        "mandatory ai training company",
        "ai act compliance training",
        "ai literacy requirement",
      ],
    },
    {
      slug: "ki-richtlinie-unternehmen-vorlage",
      title: "AI Usage Policy Template for Companies: Ready to Adapt",
      description:
        "A clear AI usage policy is part of meeting the AI Act Article 4 literacy obligation. A ready-to-adapt template covering every section you actually need.",
      date: "July 17, 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ai usage policy template",
        "ai policy company",
        "ai guidelines employees",
        "corporate ai policy",
        "ai governance policy",
      ],
    },
    {
      slug: "eu-ai-act-transparenzpflichten",
      title:
        "EU AI Act Article 50: What the Transparency Obligations Mean for Your Company",
      description:
        "Article 50 of the EU AI Act requires disclosure for chatbots, AI-generated content, and deepfakes starting August 2, 2026. Who is affected and what to actually do about it.",
      date: "July 24, 2026",
      readTime: 10,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "eu ai act article 50",
        "ai transparency obligation",
        "chatbot disclosure requirement",
        "labeling ai generated content",
        "deepfake disclosure requirement",
      ],
    },
    {
      slug: "schulungsplan-vorlage",
      title:
        "Training Plan Template: How to Build an Annual L&D Plan That Actually Gets Done",
      description:
        "Training plans that stay in spreadsheets don't get executed. Here's a step-by-step guide and template for building an annual training plan — from needs analysis to scheduling to tracking.",
      date: "June 14, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "training plan template",
        "annual training plan",
        "employee training schedule",
        "L&D planning",
        "training needs planning",
      ],
    },
    {
      slug: "onboarding-checkliste",
      title:
        "Employee Onboarding Checklist 2026: A Template for the First 90 Days",
      description:
        "A structured onboarding checklist cuts time-to-productivity and reduces early turnover. Here's a practical template covering preboarding through the first 90 days — free to adapt.",
      date: "June 13, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "onboarding checklist",
        "employee onboarding template",
        "new hire checklist",
        "onboarding plan template",
        "first 90 days onboarding",
      ],
    },
    {
      slug: "ki-lernziele-formulieren",
      title:
        "Writing Learning Objectives with AI: Prompts, Templates, and Quality Checks",
      description:
        "Good learning objectives are the foundation of every effective course — and one of the hardest things to write well. Here's how to use AI to draft them faster, with prompts organized by Bloom's taxonomy level.",
      date: "June 12, 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "writing learning objectives AI",
        "AI learning objectives",
        "Bloom's taxonomy AI prompts",
        "ChatGPT learning objectives",
        "L&D AI prompts",
      ],
    },
    {
      slug: "microsoft-teams-lms",
      title: "Microsoft Teams as an LMS: What Works and What Doesn't",
      description:
        "Many organizations already use Microsoft Teams and wonder if it can replace an LMS. The honest answer: it can't. Here's what Teams does well for training, where it falls short, and what to use instead.",
      date: "June 11, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Microsoft Teams LMS",
        "Teams as LMS",
        "Teams learning platform",
        "Microsoft Teams training",
        "Teams replace LMS",
      ],
    },
    {
      slug: "beste-ki-tools-ld",
      title: "The Best AI Tools for L&D Teams 2026: A Practical Overview",
      description:
        "Which AI tools actually make L&D work faster and better? A practical roundup covering course creation, video, voice, assessment, and translation — with honest verdicts.",
      date: "June 10, 2026",
      readTime: 10,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "beste KI Tools L&D",
        "KI Tools Personalentwicklung",
        "AI Tools E-Learning",
        "KI Tools HR Training",
        "KI Autorentool Vergleich",
      ],
    },
    {
      slug: "ispring-suite-erfahrungen",
      title: "iSpring Suite Review 2026: An Honest Assessment for L&D Teams",
      description:
        "iSpring Suite turns PowerPoint into e-learning. But is it the right authoring tool for your team? Pricing, strengths, weaknesses, and honest comparison with Articulate.",
      date: "June 9, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "iSpring Suite Erfahrungen",
        "iSpring Suite Bewertung",
        "iSpring Suite Review",
        "iSpring PowerPoint E-Learning",
        "iSpring vs Articulate",
      ],
    },
    {
      slug: "talentlms-erfahrungen",
      title: "TalentLMS Review 2026: An Honest Assessment for SMB Teams",
      description:
        "TalentLMS is one of the most popular SMB LMS platforms — but is it the right fit for German mid-market teams? Pricing, UI, compliance features, and honest drawbacks.",
      date: "June 8, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "TalentLMS Erfahrungen",
        "TalentLMS Bewertung",
        "TalentLMS Review",
        "TalentLMS KMU",
        "TalentLMS Deutsch",
      ],
    },
    {
      slug: "schulungsvideo-ki-erstellen",
      title:
        "Creating Training Videos with AI: Synthesia, HeyGen & Co. in Practice",
      description:
        "AI avatar tools like Synthesia and HeyGen let you produce training videos without a camera or studio. What works, what doesn't, and which tool fits your use case.",
      date: "June 7, 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Schulungsvideo KI erstellen",
        "Synthesia vs HeyGen",
        "KI Avatarvideo Training",
        "E-Learning Video KI",
        "AI Schulungsvideo Tool",
      ],
    },
    {
      slug: "articulate-storyline-vs-rise",
      title: "Articulate Storyline vs. Rise 360: Which Tool for Which Course?",
      description:
        "Storyline or Rise 360? Both are part of Articulate 360, but the choice matters. A practical breakdown of when to use each — with no fluff.",
      date: "June 6, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Articulate Storyline vs Rise",
        "Storyline oder Rise 360",
        "Articulate 360 Vergleich",
        "welches Articulate Tool",
        "Rise 360 Storyline Unterschied",
      ],
    },
    {
      slug: "fertige-schulungsinhalte",
      title: "Buy or Build Training Content? A Practical Decision Guide",
      description:
        "Off-the-shelf training content saves time but often misses your specific context. Here's a clear framework for deciding when to buy, when to build, and when to combine both.",
      date: "June 5, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "buy or build training content",
        "off-the-shelf e-learning",
        "custom training content",
        "training content library",
        "ready-made courses",
      ],
    },
    {
      slug: "security-training-kosten-sparen",
      title: "How to Cut Compliance Training Costs Without Cutting Corners",
      description:
        "Mandatory security and compliance training doesn't have to be expensive. Here's where most organizations overspend, and practical ways to reduce costs while staying audit-ready.",
      date: "June 4, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "compliance training cost reduction",
        "security training savings",
        "reduce training budget",
        "cheap compliance training",
        "affordable mandatory training",
      ],
    },
    {
      slug: "ki-schulung-kosten",
      title: "What Does AI Training for Employees Cost? A Realistic Breakdown",
      description:
        "AI upskilling is on every HR agenda — but what does it actually cost? Licences, content, facilitation, lost productivity. A realistic cost breakdown by company size.",
      date: "June 3, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "AI training cost employees",
        "AI upskilling cost",
        "AI literacy training price",
        "employee AI training budget",
        "AI skills training",
      ],
    },
    {
      slug: "chatgpt-prompts-ld",
      title: "ChatGPT Prompts for L&D: 20 Templates You Can Use Today",
      description:
        "Copy-paste ChatGPT prompts for L&D teams: course structure, learning objectives, quiz questions, scenario writing, needs analysis, and more — with real examples.",
      date: "June 2, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ChatGPT prompts L&D",
        "ChatGPT e-learning",
        "AI prompts training",
        "ChatGPT course creation",
        "L&D AI prompts",
      ],
    },
    {
      slug: "dsgvo-konforme-ki-tools",
      title:
        "GDPR-Compliant AI Tools for HR and L&D: What You Can Actually Use",
      description:
        "Can you use ChatGPT to create training content? What data can go into AI tools under GDPR? A practical guide for HR and L&D teams navigating AI compliance in Germany.",
      date: "June 1, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "GDPR AI tools HR",
        "GDPR compliant AI",
        "AI tools data protection",
        "ChatGPT GDPR compliance",
        "AI HR tools Europe",
      ],
    },
    {
      slug: "autorentools-ratgeber",
      title: "E-Learning Authoring Tools: The Complete Buyer's Guide 2026",
      description:
        "Which e-learning authoring tool does your team actually need? A practical buying guide covering all major tools, pricing, and the right questions to ask before you commit.",
      date: "May 31, 2026",
      readTime: 10,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "e-learning authoring tool",
        "authoring tool comparison",
        "best authoring tool",
        "course creation software",
        "SCORM authoring",
      ],
    },
    {
      slug: "mitarbeiter-schulung-planen",
      title:
        "Planning Employee Training: A Complete Guide for HR and L&D Teams",
      description:
        "How to plan employee training that actually sticks — from needs analysis to delivery and measurement. A practical guide for HR managers and L&D teams without a big budget.",
      date: "May 30, 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "employee training plan",
        "training planning",
        "L&D planning",
        "staff training guide",
        "training needs analysis",
      ],
    },
    {
      slug: "ki-autorentools-ratgeber",
      title: "AI Authoring Tools: The Complete Guide for L&D Teams",
      description:
        "AI authoring tools promise to cut course creation time dramatically. This guide explains how they actually work, which tools exist, and how to decide what fits your team.",
      date: "May 29, 2026",
      readTime: 10,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "AI authoring tool",
        "AI e-learning tool",
        "AI course creation software",
        "AI learning design",
        "best AI tools L&D",
      ],
    },
    {
      slug: "lms-mit-zertifikaten",
      title: "LMS with Certificates: What to Check Before You Buy",
      description:
        "Completion certificates sound like a given — but LMS certificate features vary dramatically. Here's what to check so your certificates actually hold up for compliance and audits.",
      date: "May 28, 2026",
      readTime: 5,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1589330273594-fade1ee91647?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS certificates",
        "LMS completion certificate",
        "training certificate LMS",
        "compliance certificate LMS",
        "course certificate",
      ],
    },
    {
      slug: "lms-ohne-it-abteilung",
      title: "LMS Without an IT Department: What to Look for and What to Avoid",
      description:
        "Most LMS platforms assume you have an IT team. If you don't, here's what to look for when evaluating a learning management system your team can actually run on its own.",
      date: "May 27, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS without IT",
        "LMS small business",
        "self-service LMS",
        "easy LMS setup",
        "LMS no technical support",
      ],
    },
    {
      slug: "articulate-alternativen",
      title:
        "Articulate 360 Alternatives: Which E-Learning Authoring Tool Fits Your Team",
      description:
        "Articulate 360 dominates e-learning authoring — but it's not the right fit for every team. An honest comparison of the best alternatives by use case, budget, and technical skill level.",
      date: "May 26, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Articulate 360 alternatives",
        "e-learning authoring tool",
        "Articulate competitor",
        "Rise alternative",
        "Storyline alternative",
      ],
    },
    {
      slug: "ki-kurs-erstellen",
      title: "Creating Courses with AI: What Actually Works",
      description:
        "AI tools promise to cut course creation time dramatically. An honest look at what they deliver, where they fall short, and how to get usable results fast.",
      date: "May 25, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "AI course creation",
        "e-learning AI",
        "create course with AI",
        "AI authoring tool",
        "AI training content",
      ],
    },
    {
      slug: "instructional-design-buecher",
      title: "10 Must-Read Books for Instructional Designers",
      description:
        "Not all instructional design books are worth your time. These 10 are — from evidence-based classics to modern takes on behavior change and agile design.",
      date: "May 25, 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "instructional design books",
        "best books for instructional designers",
        "e-learning books",
        "L&D reading list",
        "must read instructional design",
      ],
    },
    {
      slug: "instructional-design-youtube",
      title: "10 YouTube Channels Every Instructional Designer Should Follow",
      description:
        "The best free learning on instructional design lives on YouTube. These 10 channels cover tools, theory, career advice, and design craft — no filler.",
      date: "May 25, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "instructional design YouTube",
        "e-learning YouTube channels",
        "L&D YouTube",
        "instructional design tutorials",
        "best YouTube for instructional designers",
      ],
    },
    {
      slug: "lnd-podcasts",
      title:
        "10 Podcasts Every L&D and Instructional Design Professional Should Know",
      description:
        "The L&D podcast landscape is crowded. These 10 shows are actually worth your commute — covering design, strategy, career development, and the science of learning.",
      date: "May 25, 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "instructional design podcast",
        "L&D podcast",
        "e-learning podcast",
        "learning and development podcast",
        "ID podcast",
        "best L&D podcasts",
      ],
    },
    {
      slug: "personalentwicklung-podcasts",
      title:
        "German-Language HR and Personalentwicklung Podcasts Worth Following",
      description:
        "German HR podcasts are a genuinely good resource — and most international L&D lists miss them entirely. Here are the 10 best shows for HR and Personalentwicklung practitioners in the DACH region.",
      date: "May 25, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "HR podcast German",
        "Personalentwicklung podcast",
        "German HR podcast",
        "HR podcast Germany",
        "DACH HR podcast",
        "New Work podcast German",
      ],
    },
    {
      slug: "design-for-how-people-learn",
      title:
        "Design for How People Learn: Julie Dirksen's Essential Guide – A Summary",
      description:
        "Julie Dirksen's foundational ID book reframes learning design around actual learner gaps — not information transfer. Here's what it covers and why it matters.",
      date: "May 25, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Design for How People Learn",
        "Julie Dirksen",
        "instructional design book",
        "learning design",
        "e-learning design",
        "ID book summary",
      ],
    },
    {
      slug: "map-it-cathy-moore",
      title: "Map It by Cathy Moore: Action Mapping Explained – A Summary",
      description:
        "Cathy Moore's action mapping method starts with business goals, not content — and it's the most effective antidote to information-dump e-learning available.",
      date: "May 25, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Map It Cathy Moore",
        "action mapping",
        "instructional design",
        "e-learning design",
        "performance-focused learning",
        "ID methodology",
      ],
    },
    {
      slug: "elearning-science-of-instruction",
      title:
        "E-Learning and the Science of Instruction: Clark & Mayer's Design Principles – A Summary",
      description:
        "Clark and Mayer's evidence-based design principles remain the most rigorous foundation for e-learning development — here's what the 12 principles actually say.",
      date: "May 24, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "E-Learning and the Science of Instruction",
        "Clark Mayer",
        "multimedia learning principles",
        "cognitive load theory",
        "e-learning design",
        "instructional design principles",
      ],
    },
    {
      slug: "make-it-stick-buch",
      title:
        "Make It Stick: The Science of Successful Learning – A Summary for L&D Professionals",
      description:
        "Brown, Roediger & McDaniel's research-backed guide debunks the study methods learners trust most and shows what the evidence actually supports.",
      date: "May 24, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Make It Stick",
        "learning science",
        "retrieval practice",
        "spaced repetition",
        "interleaving",
        "cognitive psychology",
        "L&D book summary",
      ],
    },
    {
      slug: "accidental-instructional-designer",
      title:
        "The Accidental Instructional Designer: Cammy Bean's Guide for Career Changers (Summary)",
      description:
        "Cammy Bean's practical guide shows how to go from knowing about L&D to actually doing instructional design work: the core principles for career changers in a 7-minute read.",
      date: "May 23, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Accidental Instructional Designer",
        "Cammy Bean",
        "instructional design career",
        "career change ID",
        "e-learning career",
        "instructional design for beginners",
      ],
    },
    {
      slug: "soziales-lernen",
      title:
        "Social Learning in the Workplace: How People Actually Learn from Each Other",
      description:
        "Most workplace learning doesn't happen in courses. It happens through observation, conversation, and collaboration. Here's how to design for social learning deliberately.",
      date: "May 23, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "social learning",
        "social learning theory",
        "peer learning",
        "collaborative learning",
        "workplace learning",
        "Bandura",
      ],
    },
    {
      slug: "michael-allens-guide-elearning",
      title:
        "Michael Allen's Guide to e-Learning: CCAF and SAM Explained – A Summary",
      description:
        "Allen's CCAF model and SAM process reframe how e-learning should be built — away from information delivery and toward meaningful interaction.",
      date: "May 23, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Michael Allen e-learning",
        "CCAF model",
        "SAM model instructional design",
        "Successive Approximation Model",
        "e-learning design",
        "ADDIE alternative",
      ],
    },
    {
      slug: "training-from-the-back-of-the-room",
      title:
        "Training from the Back of the Room! Sharon Bowman's Brain-Based Design – A Summary",
      description:
        "Bowman's 4Cs model applies neuroscience to training design, explaining why learner activity consistently outperforms instructor-led content delivery.",
      date: "May 22, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Sharon Bowman",
        "Training from the Back of the Room",
        "4Cs model",
        "brain-based learning",
        "instructional design",
        "active learning",
      ],
    },
    {
      slug: "ten-steps-complex-learning",
      title:
        "Ten Steps to Complex Learning: The 4C/ID Model Explained – A Summary",
      description:
        "Van Merriënboer and Kirschner's 4C/ID model is the most rigorous framework for training genuine expertise — and the fourth edition finally makes it accessible.",
      date: "May 22, 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Ten Steps to Complex Learning",
        "4C/ID model",
        "van Merriënboer",
        "Kirschner",
        "complex learning",
        "instructional design frameworks",
        "curriculum design",
      ],
    },
    {
      slug: "soft-skills-training",
      title: "Soft Skills Training That Actually Works",
      description:
        "Soft skills training is one of the most requested — and least effective — categories of corporate learning. Here's why most programs fail and what good design looks like.",
      date: "May 21, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "soft skills training",
        "communication skills training",
        "soft skills development",
        "interpersonal skills",
        "leadership training",
        "professional development",
      ],
    },
    {
      slug: "talk-to-the-elephant",
      title: "Talk to the Elephant: Designing for Behavior Change – A Summary",
      description:
        "Dirksen's follow-up addresses the knowing-doing gap head-on, giving designers a diagnostic framework for understanding why behavior doesn't change even when people know it should.",
      date: "May 21, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Talk to the Elephant",
        "Julie Dirksen",
        "behavior change",
        "knowing-doing gap",
        "COM-B model",
        "instructional design",
        "learning design",
      ],
    },
    {
      slug: "leaving-addie-for-sam",
      title:
        "Leaving ADDIE for SAM: Agile Instructional Design Explained – A Summary",
      description:
        "Allen and Sites make a precise case for why ADDIE's linear structure produces late, costly rework — and how SAM's iterative process fixes that without abandoning rigor.",
      date: "May 21, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Leaving ADDIE for SAM",
        "SAM model",
        "ADDIE instructional design",
        "agile instructional design",
        "Michael Allen",
        "iterative learning design",
      ],
    },
    {
      slug: "lms-kosten",
      title:
        "LMS Pricing: What Does a Learning Management System Actually Cost?",
      description:
        "LMS pricing is confusing by design. Here's a plain breakdown of how pricing models work, what hidden costs to expect, and what realistic budgets look like by company size.",
      date: "May 19, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS pricing",
        "LMS cost",
        "how much does an LMS cost",
        "learning management system price",
        "LMS budget",
      ],
    },
    {
      slug: "lxp-vs-lms",
      title:
        "LXP vs. LMS: What's the Difference and Which One Do You Actually Need?",
      description:
        "Learning Experience Platforms and Learning Management Systems are often confused — sometimes deliberately. Here's a clear breakdown of what each does and who needs what.",
      date: "May 16, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LXP vs LMS",
        "learning experience platform",
        "LXP meaning",
        "LMS vs LXP",
        "LXP definition",
        "what is an LXP",
      ],
    },
    {
      slug: "blended-learning",
      title: "Blended Learning: What It Actually Means and How to Design It",
      description:
        "Blended learning combines online and in-person training — but mixing formats isn't enough. Here's what separates effective blended learning from expensive confusion.",
      date: "May 14, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "blended learning",
        "hybrid learning",
        "blended learning design",
        "online and offline training",
        "learning mix",
        "corporate training strategy",
      ],
    },
    {
      slug: "skills-gap-analyse",
      title:
        "Skills Gap Analysis: How to Identify What Your Team Actually Needs",
      description:
        "A skills gap analysis tells you where your team's capabilities fall short of what your business needs. Here's a practical method that works without an L&D department.",
      date: "May 12, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "skills gap analysis",
        "skills gap",
        "training needs analysis",
        "workforce skills",
        "L&D planning",
        "employee development planning",
      ],
    },
    {
      slug: "moodle-alternativen",
      title: "Moodle Alternatives: What to Use When Moodle Gets in the Way",
      description:
        "Moodle is free and powerful — but it comes with significant complexity. Here's an honest look at when Moodle stops making sense and what to use instead.",
      date: "May 9, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Moodle alternatives",
        "alternatives to Moodle",
        "Moodle replacement",
        "Moodle vs other LMS",
        "best Moodle alternative",
      ],
    },
    {
      slug: "lms-auswahl",
      title: "How to Choose an LMS: A Practical Checklist for HR and L&D Teams",
      description:
        "Choosing a learning management system is easy to get wrong. Here's a structured checklist to help HR and L&D teams evaluate options without getting lost in feature lists.",
      date: "May 7, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "how to choose an LMS",
        "LMS checklist",
        "learning management system comparison",
        "LMS evaluation",
        "best LMS",
        "LMS selection",
      ],
    },
    {
      slug: "70-20-10-modell",
      title: "The 70-20-10 Learning Model: What It Is and What to Do with It",
      description:
        "The 70-20-10 model describes how adults learn at work — 70% from experience, 20% from others, 10% from formal training. Here's what it actually means for your L&D strategy.",
      date: "May 5, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "70-20-10 model",
        "70 20 10 learning",
        "70/20/10 rule",
        "informal learning",
        "experiential learning",
        "L&D framework",
      ],
    },
    {
      slug: "dsgvo-schulung",
      title:
        "GDPR Training for Employees: What's Required and How to Do It Right",
      description:
        "GDPR makes employee data protection training a legal obligation — not a nice-to-have. Here's what training must cover, how often it's required, and how to document it properly.",
      date: "May 2, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "GDPR training",
        "GDPR employee training",
        "data protection training",
        "GDPR compliance training",
        "data privacy training",
      ],
    },
    {
      slug: "digitale-unterweisungen",
      title:
        "Digital Safety Briefings: How to Digitize Mandatory Workplace Instructions",
      description:
        "Mandatory workplace safety briefings are a legal requirement in most countries — and a documentation headache. Here's how to run them digitally without losing compliance standing.",
      date: "April 30, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "digital safety briefings",
        "workplace instructions",
        "mandatory training",
        "occupational health and safety training",
        "compliance training",
        "employee briefings",
      ],
    },
    {
      slug: "ausbildung-digitalisieren",
      title:
        "Digital Tools for Apprenticeship Training: What LMS Platforms Offer Vocational Programs",
      description:
        "Apprenticeship programs involve regulatory documentation, multi-site supervision, and structured competency development. Here's how a modern LMS supports vocational training without adding administrative burden.",
      date: "April 28, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "apprenticeship training software",
        "vocational training LMS",
        "digital apprenticeship",
        "apprentice learning management",
        "vocational education technology",
      ],
    },
    {
      slug: "betriebsrat-elearning",
      title:
        "Employee Representation and E-Learning: What HR Needs to Know Before Rollout",
      description:
        "In many countries, employee representatives have co-determination rights over training software. Here's what HR needs to consider before rolling out an LMS — and how to get it right.",
      date: "April 25, 2026",
      readTime: 5,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "employee representation training software",
        "works council e-learning",
        "co-determination LMS",
        "union approval training",
        "employee representative rights",
      ],
    },
    {
      slug: "was-ist-microlearning",
      title: "What is Microlearning? And Why It Works",
      description:
        "Microlearning delivers training in focused 3–10 minute units. Learn what it is, why the brain loves it, and how to roll it out in your organization.",
      date: "April 23, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "microlearning",
        "e-learning",
        "learning methods",
        "employee training",
        "corporate learning",
        "LMS",
      ],
    },
    {
      slug: "lms-vs-authoring-tools",
      title:
        "LMS vs. Authoring Tools: What's the Difference and Which Do You Need?",
      description:
        "An LMS manages and tracks your training. Authoring tools create the content. Many companies need both — but not always. Here's how to decide.",
      date: "April 21, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS",
        "authoring tools",
        "e-learning software",
        "learning management system",
        "Articulate",
        "course creation",
      ],
    },
    {
      slug: "was-ist-agentic-learning",
      title:
        "What is Agentic Learning? The Shift from Passive to Self-Directed",
      description:
        "Agentic learning means learners drive their own development instead of waiting for training to be pushed at them. Here's what that looks like in practice.",
      date: "April 18, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "agentic learning",
        "self-directed learning",
        "autonomous learning",
        "L&D",
        "corporate learning",
        "learning culture",
      ],
    },
    {
      slug: "die-vergessenskurve",
      title: "The Forgetting Curve: Why Employees Forget 90% of Training",
      description:
        "Hermann Ebbinghaus mapped how fast we forget. His research from 1885 still defines how corporate training fails — and what to do about it.",
      date: "April 16, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "forgetting curve",
        "Ebbinghaus",
        "knowledge retention",
        "spaced repetition",
        "corporate training",
        "learning science",
      ],
    },
    {
      slug: "learning-in-the-flow-of-work",
      title: "Learning in the Flow of Work: Why Training That Interrupts Fails",
      description:
        "Josh Bersin's concept of 'learning in the flow of work' explains why pulling employees out of their day for training rarely sticks — and what works instead.",
      date: "April 14, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "learning in the flow of work",
        "Josh Bersin",
        "performance support",
        "just-in-time learning",
        "L&D strategy",
        "workplace learning",
      ],
    },
    {
      slug: "kontinuierliches-lernen",
      title: "Continuous Learning: Why One-Off Training Isn't Enough",
      description:
        "A single training event doesn't build lasting skills. Continuous learning does — but it requires a deliberate strategy, not just more courses.",
      date: "April 11, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "continuous learning",
        "learning culture",
        "employee development",
        "L&D strategy",
        "upskilling",
        "reskilling",
      ],
    },
    {
      slug: "kurse-aktuell-halten",
      title: "How to Keep E-Learning Courses Up to Date Without Starting Over",
      description:
        "Outdated training content is a trust problem, not just a content problem. Here's a practical system for keeping courses current without rebuilding from scratch.",
      date: "April 9, 2026",
      readTime: 5,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "e-learning maintenance",
        "course updates",
        "content governance",
        "L&D operations",
        "outdated training",
      ],
    },
    {
      slug: "didaktische-grundlagen",
      title: "Instructional Design Basics: What Actually Makes Learning Stick",
      description:
        "Good instructional design isn't about making content look nice. It's about understanding how people learn and designing for that — not against it.",
      date: "April 7, 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "instructional design",
        "learning theory",
        "ADDIE",
        "Bloom taxonomy",
        "learning objectives",
        "e-learning design",
      ],
    },
    {
      slug: "compliance-training-mit-lms",
      title:
        "Compliance Training With an LMS: Automate the Proof, Not Just the Course",
      description:
        "Compliance training is mandatory — but it's also a documentation challenge. Here's how a modern LMS handles the entire audit trail, not just the delivery.",
      date: "April 4, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "compliance training",
        "LMS",
        "audit trail",
        "mandatory training",
        "GDPR training",
        "regulatory compliance",
      ],
    },
    {
      slug: "ki-im-elearning",
      title:
        "AI in E-Learning: What's Already Possible — and What's Still Hype",
      description:
        "AI is reshaping how corporate training is created and delivered. Here's an honest look at what's working now and where to stay skeptical.",
      date: "April 2, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "AI in e-learning",
        "artificial intelligence",
        "learning technology",
        "AI course creation",
        "personalized learning",
        "EdTech AI",
      ],
    },
    {
      slug: "onboarding-mit-lms",
      title:
        "LMS Onboarding: How to Cut Time-to-Productivity Without Losing the Human Touch",
      description:
        "Digital onboarding with an LMS saves time and scales easily. But done wrong, it leaves new hires feeling abandoned. Here's how to get the balance right.",
      date: "March 31, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS onboarding",
        "employee onboarding",
        "digital onboarding",
        "new hire training",
        "onboarding software",
      ],
    },
    {
      slug: "lms-fuer-den-mittelstand",
      title:
        "LMS for Small and Medium Businesses: Getting Started Without an IT Team",
      description:
        "Small companies need training tools that work out of the box — not corporate software that requires a six-month implementation. Here's what to look for.",
      date: "March 28, 2026",
      readTime: 6,
      category: "product",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS for small business",
        "SME learning management",
        "training software SMB",
        "employee training small company",
      ],
    },
    {
      slug: "lms-anwendungsfaelle",
      title:
        "LMS Use Cases: Where a Learning Management System Adds Real Value",
      description:
        "From onboarding to compliance to product training — an LMS covers a wide range of use cases. Here's where organizations see the clearest return.",
      date: "March 26, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS use cases",
        "learning management system",
        "employee training",
        "corporate learning",
        "training ROI",
      ],
    },
    {
      slug: "gamification-im-elearning",
      title: "Gamification in E-Learning: More Than Points and Badges",
      description:
        "Gamification works — when it's tied to the learning, not bolted on top. Here's the difference between decoration and design that actually drives engagement.",
      date: "March 24, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "gamification",
        "e-learning engagement",
        "game-based learning",
        "badges",
        "leaderboards",
        "learning motivation",
      ],
    },
    {
      slug: "lernerfolg-messen",
      title: "Measuring Learning Success: The Kirkpatrick Model Explained",
      description:
        "Most organizations measure whether training happened. The Kirkpatrick model helps you measure whether it worked — at four levels, from reactions to business results.",
      date: "March 21, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Kirkpatrick model",
        "training effectiveness",
        "learning evaluation",
        "L&D ROI",
        "training assessment",
      ],
    },
    {
      slug: "scorm-vs-xapi",
      title:
        "SCORM vs. xAPI: What's the Difference and Which Do You Actually Need?",
      description:
        "SCORM has been the e-learning standard for 25 years. xAPI promises to replace it. Here's what both actually do, where each falls short, and how to decide.",
      date: "March 19, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "SCORM",
        "xAPI",
        "Tin Can API",
        "e-learning standards",
        "LMS integration",
        "SCORM vs xAPI",
      ],
    },
    {
      slug: "scibly-use-cases",
      title:
        "How Companies Use Scibly: Onboarding, Compliance, and Product Training in Practice",
      description:
        "Three real use cases for Scibly: how a retailer onboards 40 new staff per season, how a services firm handles compliance, and how a SaaS company trains its customers.",
      date: "March 17, 2026",
      readTime: 5,
      category: "product",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Scibly use cases",
        "LMS examples",
        "e-learning platform",
        "onboarding software",
        "compliance training tool",
      ],
      featured: true,
    },
    {
      slug: "mitarbeiter-weiterbilden",
      title: "Upskilling Employees: What Actually Works and What Wastes Budget",
      description:
        "Every HR team wants to upskill employees. Most don't see lasting results. Here's an honest look at what separates effective development from expensive theater.",
      date: "March 14, 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "employee development",
        "upskilling",
        "reskilling",
        "training ROI",
        "L&D effectiveness",
        "workforce development",
      ],
    },
    {
      slug: "elearning-kurs-erstellen",
      title: "Creating E-Learning Courses: What You Really Need to Get Started",
      description:
        "You don't need a video studio or an instructional designer to build your first course. Here's the minimum viable setup and the common mistakes to skip.",
      date: "March 12, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "create e-learning course",
        "course creation",
        "build training",
        "e-learning production",
        "LMS content",
      ],
    },
    {
      slug: "remote-learning",
      title: "Remote Learning: How Distributed Teams Actually Learn Together",
      description:
        "Remote work changed how teams learn. Here's what doesn't translate from in-person training to online — and what works better remotely than it ever did in a classroom.",
      date: "March 10, 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "remote learning",
        "distributed teams",
        "online training",
        "remote work L&D",
        "virtual learning",
        "remote employees",
      ],
    },
  ],
  de: [
    {
      slug: "adobe-captivate-alternativen",
      title: "Adobe Captivate Alternativen: Was jetzt zu tun ist",
      description:
        'Adobe Captivate wird nicht komplett eingestellt, aber die bisherige Desktop-Version "Captivate Classic" läuft aus: Der reguläre Support endet am 23. August 2026, der erweiterte Support am 23.',
      date: "25. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "adobe captivate alternative",
        "captivate eingestellt",
        "captivate ersatz",
      ],
    },
    {
      slug: "beste-kostenlose-ki-tools-lernen",
      title: "Die besten kostenlosen KI-Tools zum Lernen im Vergleich",
      description:
        "Gemini Notebook (bis Juli 2026 als NotebookLM bekannt), ChatGPT, Gemini und Claude lassen sich alle kostenlos zum Lernen nutzen, unterscheiden sich aber deutlich darin, wofür sie am besten geeignet sind.",
      date: "23. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "beste kostenlose ki tools lernen",
        "notebooklm chatgpt gemini claude vergleich",
        "kostenlose ki tools zum lernen",
        "gemini notebook chatgpt claude vergleich",
      ],
    },
    {
      slug: "branchenspezifische-compliance-schulung",
      title:
        "Branchenspezifische Compliance-Schulungen: Warum Standardkurse oft nicht reichen",
      description:
        "Pharma, Finanzbranche und Gesundheitswesen haben eines gemeinsam: Pflichtschulungen sind hier nicht nur gute Praxis, sondern direkt an branchenspezifische Regulierung gekoppelt, mit entsprechend höherem Dokumentationsaufwand als in weniger regulierten Branchen.",
      date: "21. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "pharma schulung compliance software",
        "finanzbranche pflichtschulung software",
        "gesundheitswesen mitarbeiterschulung",
        "branchenspezifische compliance schulung",
      ],
    },
    {
      slug: "bsi-grundschutz-schulung-mitarbeiter",
      title:
        "BSI-Grundschutz und Mitarbeiterschulung: Was der Standard zu Awareness verlangt",
      description:
        "Der IT-Grundschutz des BSI sieht Schulung und Sensibilisierung als eigenen Baustein vor, nicht als optionale Ergänzung.",
      date: "19. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "bsi grundschutz schulung",
        "it-grundschutz awareness schulung",
        "bsi grundschutz mitarbeiterschulung",
      ],
    },
    {
      slug: "cornerstone-alternativen",
      title:
        "Cornerstone-Alternativen: Wenn das Enterprise-LMS zu groß für die eigenen Anforderungen ist",
      description:
        "Cornerstone OnDemand ist ein umfangreiches Enterprise-System für Personalentwicklung, das neben Lernmanagement auch Talentmanagement, Performance-Reviews und Nachfolgeplanung abdeckt.",
      date: "17. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "cornerstone alternative",
        "cornerstone ondemand alternative",
        "cornerstone lms ersatz",
      ],
    },
    {
      slug: "docebo-vs-talentlms",
      title: "Docebo vs. TalentLMS: Welches LMS für welche Unternehmensgröße",
      description:
        "Docebo und TalentLMS lösen dasselbe Grundproblem, Mitarbeiterschulung zentral zu verwalten, richten sich aber an unterschiedliche Unternehmensgrößen.",
      date: "15. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "docebo vs talentlms",
        "docebo talentlms vergleich",
        "talentlms oder docebo",
      ],
    },
    {
      slug: "duolingo-prinzip-mitarbeiterschulung",
      title:
        "Duolingo als Vorbild für Mitarbeiterschulungen? Was wirklich übertragbar ist",
      description:
        "Duolingo wird in L&D-Kreisen oft als Vorbild genannt, wenn es um Engagement in Schulungen geht.",
      date: "13. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "duolingo prinzip für unternehmen",
        "gamification mitarbeiterschulung sinnvoll",
        "spaced repetition mitarbeiterschulung",
        "warum vergessen mitarbeiter schulungsinhalte",
      ],
    },
    {
      slug: "e-learning-oeffentlicher-dienst",
      title:
        "E-Learning im öffentlichen Dienst: Antwort auf Fachkräftemangel und Pensionierungswelle",
      description:
        "Der öffentliche Dienst steht vor einer doppelten Herausforderung: Ein großer Teil der Belegschaft geht in den kommenden Jahren in Rente, während gleichzeitig neue digitale Fachverfahren eingeführt werden müssen.",
      date: "11. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "e-learning öffentlicher dienst",
        "fortbildung verwaltung digital",
        "digitale mitarbeiterschulungen verwaltung",
      ],
    },
    {
      slug: "entdeckendes-lernen-nachteile",
      title:
        'Entdeckendes Lernen: Warum "einfach machen lassen" oft schlechter funktioniert als gedacht',
      description:
        "Entdeckendes Lernen lässt Lernende ein Thema selbst erkunden, ohne vorherige Erklärung.",
      date: "9. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "entdeckendes lernen nachteile",
        "selbstgesteuertes lernen schulung",
        "ungestützte entdeckung lernen",
      ],
    },
    {
      slug: "enterprise-lms-sicherheit-checkliste",
      title: "Enterprise-LMS-Sicherheit: Checkliste für die IT-Freigabe",
      description:
        "Bevor ein Enterprise-LMS produktiv eingeführt wird, prüft die IT-Abteilung typischerweise mehr als nur die Kursfunktionen: Authentifizierung, Datenverarbeitung, Zertifizierungen und Nachvollziehbarkeit.",
      date: "7. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "enterprise lms sicherheit",
        "lms datenschutz zertifizierung",
        "e-learning plattform iso 27001",
        "audit trail lms",
      ],
    },
    {
      slug: "erst-theorie-oder-erst-uebung",
      title:
        "Erst Theorie oder erst Übung? Was die Lernforschung für Mitarbeiterschulungen bedeutet",
      description:
        "Soll man einer neuen Kollegin zuerst das Prozesshandbuch erklären oder sie direkt ins kalte Wasser werfen und danach korrigieren?",
      date: "5. Juli 2026",
      readTime: 5,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "erst theorie oder praxis lernen",
        "beste reihenfolge für schulungen",
        "wie sollte eine schulung aufgebaut sein",
        "productive failure schulung",
      ],
    },
    {
      slug: "gamification-mitarbeiterschulung-grenzen",
      title:
        "Gamification in Mitarbeiterschulungen: Was wirklich hilft und was nur Aktivität erzeugt",
      description:
        "Gamification in Mitarbeiterschulungen wirkt zuverlässig auf Engagement: Nutzung, Rückkehr und Abschlussquoten steigen messbar, wenn Punkte, Fortschrittsbalken oder Ranglisten eingebaut werden.",
      date: "3. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "gamification schulung sinnvoll",
        "streaks leaderboards lernerfolg",
        "gamification mitarbeiterschulung",
      ],
    },
    {
      slug: "gemini-notebook-alternative-eu-hosting",
      title:
        "Gemini-Notebook-Alternativen (NotebookLM) mit EU-Hosting: Worauf es bei der Auswahl ankommt",
      description:
        '"EU-Hosting" wird bei KI-Tools oft als Marketingaussage verwendet, ohne dass klar ist, was genau gemeint ist.',
      date: "1. Juli 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "gemini notebook alternative eu hosting",
        "notebooklm alternative eu hosting",
        "eu ki tool dokumente",
        "ki tool dsgvo hosting europa",
      ],
    },
    {
      slug: "gemini-notebook-einsatzwecke-unternehmen",
      title:
        "Gemini Notebook im Unternehmen: Die wichtigsten Einsatzwecke und wo ein fertiger Kurs mehr bringt",
      description:
        "Gemini Notebook, bis Juli 2026 als NotebookLM bekannt, wird im Unternehmenskontext vor allem für vier Dinge genutzt: bestehende Dokumente durchsuchbar machen, neue Mitarbeitende in umfangreiche Unterlagen einarbeiten, Meeting-Notizen und Projektwissen bündeln, und schnelle Zusammenfassungen langer Dokumente erstellen.",
      date: "29. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "gemini notebook einsatzmöglichkeiten unternehmen",
        "notebooklm anwendungsfälle unternehmen",
        "wofür gemini notebook nutzen",
        "gemini notebook im unternehmen einsetzen",
      ],
    },
    {
      slug: "gemini-notebook-unternehmen-dsgvo",
      title:
        "Gemini Notebook (NotebookLM) im Unternehmen: Wo die DSGVO-Grenze liegt",
      description:
        "Gemini Notebook, bis Juli 2026 als NotebookLM bekannt, ist Googles KI-Tool, das aus hochgeladenen Dokumenten Zusammenfassungen, Antworten und sogar Audio-Übersichten erstellt, aber die Dokumente werden auf US-Servern von Google verarbeitet.",
      date: "27. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "gemini notebook dsgvo",
        "gemini notebook unternehmen datenschutz",
        "notebooklm dsgvo",
        "notebooklm unternehmen datenschutz",
        "notebooklm alternative",
      ],
    },
    {
      slug: "h5p-autorentool",
      title: "H5P als Autorentool: Was es kann und wo die Grenzen liegen",
      description:
        "H5P ist ein kostenloses, quelloffenes Autorenwerkzeug für interaktive E-Learning-Inhalte, das direkt im Browser läuft und sich in viele bestehende Systeme wie Moodle oder WordPress einbinden lässt.",
      date: "25. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "h5p autorentool",
        "h5p e-learning",
        "h5p kostenlos",
        "h5p interaktive inhalte",
      ],
    },
    {
      slug: "interne-doku-in-kurs-umwandeln",
      title: "Interne Dokumentation in einen Onboarding-Kurs umwandeln",
      description:
        "Confluence-Seiten, Notion-Docs und interne Wikis enthalten in den meisten Engineering-Teams schon das komplette Wissen, das neue Entwicklerinnen und Entwickler beim Onboarding brauchen, nur nicht in einer Form, die sich wie ein Kurs durcharbeiten lässt.",
      date: "23. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "interne doku in trainingskurs umwandeln",
        "confluence als lms",
        "notion doku in kurs umwandeln",
        "technical onboarding software startup",
        "engineering onboarding automatisieren",
      ],
    },
    {
      slug: "ki-kompetenz-nachweis-mitarbeiter",
      title: "KI-Kompetenz nachweisen: Was Unternehmen dokumentieren müssen",
      description:
        "Ein KI-Kompetenz-Nachweis dokumentiert, wer im Unternehmen wann zu welchem Thema im sicheren und sachgerechten Umgang mit KI-Systemen geschult wurde.",
      date: "21. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ki kompetenz nachweis",
        "ki schulung dokumentation audit",
        "ki kompetenz nachweis unternehmen",
      ],
    },
    {
      slug: "ki-onboarding-mitarbeiter",
      title:
        "KI-gestütztes Onboarding: Neue Mitarbeitende schneller einarbeiten",
      description:
        "KI-gestütztes Onboarding nutzt bestehende Unternehmensdokumente, etwa Prozessbeschreibungen, Handbücher oder interne Wikis, um daraus automatisch strukturierte Einarbeitungsinhalte zu erstellen, statt jeden Onboarding-Kurs manuell von Grund auf zu bauen.",
      date: "19. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ki onboarding mitarbeiter",
        "onboarding mit ki beschleunigen",
        "neue mitarbeiter schneller einarbeiten ki",
      ],
    },
    {
      slug: "ki-rollenspiele-training",
      title:
        "KI-Rollenspiele im Training: Mehr als ein weiteres Multiple-Choice-Quiz",
      description:
        "KI-Rollenspiele lassen Lernende ein Gespräch mit einer KI führen, die eine realistische Gegenseite simuliert, etwa eine schwierige Kundin, einen kritischen Mitarbeiter oder einen Verkaufseinwand.",
      date: "17. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ki rollenspiel training",
        "ai roleplay mitarbeiterschulung",
        "ki simulation schulung",
      ],
    },
    {
      slug: "ki-schulung-mittelstand",
      title:
        "KI-Schulung im Mittelstand: Wie Teams KI-Tools sicher nutzen lernen",
      description:
        "Viele Mittelstandsunternehmen haben KI-Tools wie Copilot oder ChatGPT bereits eingeführt, aber ohne strukturierte Schulung dazu.",
      date: "15. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ki schulung mittelstand",
        "copilot schulung mitarbeiter",
        "chatgpt richtlinie unternehmen",
        "sicherer umgang mit ki im unternehmen",
      ],
    },
    {
      slug: "kirkpatrick-modell",
      title: "Kirkpatrick-Modell: Die 4 Ebenen der Trainingsevaluation erklärt",
      description:
        "Das Kirkpatrick-Modell ist ein vierstufiges Framework zur Bewertung von Schulungserfolg, entwickelt von Donald Kirkpatrick und 1959 erstmals veröffentlicht.",
      date: "13. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "kirkpatrick modell",
        "kirkpatrick model deutsch",
        "donald kirkpatrick",
        "kirkpatrick evaluationsmodell",
      ],
    },
    {
      slug: "lms-sso-integration",
      title: "LMS mit SSO: Was Single Sign-On für die Einführung bedeutet",
      description:
        "Single Sign-On (SSO) erlaubt es Mitarbeitenden, sich mit ihrem bestehenden Firmen-Account bei einem LMS anzumelden, statt ein zusätzliches Passwort zu verwalten.",
      date: "11. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: ["lms sso", "lms mit sso integration", "single sign on lms"],
    },
    {
      slug: "ozg-schulung-verwaltung",
      title:
        "OZG-Schulung: Wie Verwaltungen ihre Mitarbeitenden auf neue Fachverfahren vorbereiten",
      description:
        "Das Onlinezugangsgesetz verpflichtet Bund, Länder und Kommunen, Verwaltungsleistungen online anzubieten.",
      date: "9. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ozg schulung",
        "schulung fachverfahren verwaltung",
        "ozg schulung verwaltung",
      ],
    },
    {
      slug: "productive-failure-methode",
      title:
        "Productive Failure: Warum erst scheitern manchmal schneller lernen lässt",
      description:
        "Productive Failure bedeutet, Lernende zuerst an einem Problem arbeiten zu lassen, das sie mit ihrem aktuellen Wissen noch nicht lösen können, und erst danach die richtige Lösung zu erklären.",
      date: "7. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "productive failure methode",
        "erst scheitern dann lernen",
        "problem solving vor instruktion",
      ],
    },
    {
      slug: "prozedurales-wissen-schulen",
      title:
        "Prozedurales Wissen schulen: Warum Verfahrenswissen eine andere Logik braucht als Verständnis",
      description:
        "Prozedurales Wissen bedeutet, einen festen Ablauf korrekt auszuführen, etwa einen Freigabeprozess, eine Sicherheitscheckliste oder die Bedienung eines bestimmten Software-Dialogs.",
      date: "5. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "verfahrenswissen schulen",
        "prozesse trainieren checkliste",
        "prozedurales wissen training",
      ],
    },
    {
      slug: "quereinsteiger-einarbeitung-schulungsplan",
      title:
        "Quereinsteiger einarbeiten: Wie ein strukturierter Schulungsplan die Einarbeitung verkürzt",
      description:
        "Quereinsteigende bringen oft wertvolle Erfahrung aus einem anderen Berufsfeld mit, aber kein Vorwissen zu den fachspezifischen Prozessen und Werkzeugen der neuen Rolle.",
      date: "3. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "quereinsteiger einarbeitung",
        "quereinsteiger schulungsplan",
        "fachkräftemangel umschulung mitarbeiter",
      ],
    },
    {
      slug: "recognition-vs-recall-e-learning",
      title:
        "Wiedererkennen vs. Abruf: Warum die meisten E-Learning-Quizze zu leicht sind",
      description:
        "Die meisten E-Learning-Quizze bleiben auf der Stufe des Wiedererkennens stehen: eine Frage mit vier Antwortmöglichkeiten, von denen eine offensichtlich richtig ist, sobald man sie liest.",
      date: "1. Juni 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "e-learning quiz zu einfach",
        "multiple choice vs freie antwort lernen",
        "wiedererkennen vs abrufen lernen",
      ],
    },
    {
      slug: "retrieval-practice-mitarbeiterschulung",
      title:
        "Retrieval Practice: Die einfachste Methode, Schulungsinhalte langfristig zu verankern",
      description:
        "Retrieval Practice bedeutet, sich Wissen aktiv aus dem Gedächtnis zu holen, statt es nur nochmal zu lesen oder anzuschauen.",
      date: "30. Mai 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "retrieval practice methode",
        "abrufübungen lernen",
        "wissen langfristig verankern",
        "warum wiederholen hilft beim lernen",
      ],
    },
    {
      slug: "schulungsunterlagen-erstellen",
      title: "Schulungsunterlagen erstellen: Aufbau, Vorlage und Checkliste",
      description:
        "Schulungsunterlagen sind das Material, mit dem eine Schulung tatsächlich durchgeführt wird: Foliensatz, Leitfaden, Arbeitsblatt oder E-Learning-Inhalt.",
      date: "28. Mai 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "schulungsunterlagen",
        "schulungsunterlagen erstellen",
        "aufbau von schulungsunterlagen",
        "schulungsunterlagen vorlage",
        "schulungsunterlage",
      ],
    },
    {
      slug: "sharepoint-als-lms",
      title: "SharePoint als LMS nutzen: Was funktioniert und was fehlt",
      description:
        "SharePoint lässt sich mit Ordnerstrukturen, Seiten und Microsoft-Listen als provisorische Ablage für Schulungsunterlagen nutzen, ist aber kein Lernmanagementsystem.",
      date: "26. Mai 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "sharepoint als lms",
        "sharepoint schulungsplattform",
        "sharepoint mitarbeiterschulung",
      ],
    },
    {
      slug: "slidepresenter-alternative",
      title:
        "SlidePresenter-Alternativen: Videobasiertes Training ohne Individualangebot",
      description:
        "SlidePresenter ist eine deutsche Videoplattform für mitarbeitergeneriertes Lernen: Fachexperten nehmen Wissen direkt als Video auf, statt einen klassischen Foliensatz zu erstellen.",
      date: "24. Mai 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "slidepresenter alternative",
        "slidepresenter ersatz",
        "videobasiertes training tool",
      ],
    },
    {
      slug: "spaced-repetition-praxis",
      title:
        "Spaced Repetition in der Praxis: So baut man verteilte Wiederholung in Schulungen ein",
      description:
        "Spaced Repetition bedeutet, denselben Lerninhalt in wachsenden Zeitabständen zu wiederholen, statt ihn einmal zu lernen und dann nie wieder anzufassen.",
      date: "22. Mai 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "spaced repetition mitarbeiterschulung",
        "verteilte wiederholung lernen",
        "spaced repetition praxis",
      ],
    },
    {
      slug: "sprachlernen-vs-kompetenztransfer",
      title:
        "Warum Mitarbeitende trotz abgeschlossener Schulung das Gelernte im Alltag vergessen",
      description:
        "Sprachlern-Apps wie Duolingo sind ein aufschlussreicher Vergleichsfall für Mitarbeiterschulungen, weil sie ein bekanntes Muster zeigen: Sie sind stark darin, rezeptives Wissen aufzubauen, etwa Vokabeln erkennen oder einfache Sätze verstehen, aber deutlich schwächer darin, situative und pragmatische Kompetenz zu vermitteln, also spontan in einer echten Unterhaltung angemessen zu reagieren.",
      date: "20. Mai 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "warum vergessen mitarbeiter das gelernte",
        "kompetenztransfer training",
        "transfer von schulungswissen in den arbeitsalltag",
      ],
    },
    {
      slug: "vorwissen-schulungsdesign",
      title:
        "Vorwissen im Schulungsdesign: Warum dieselbe Methode nicht für jeden funktioniert",
      description:
        "Vorwissen ist der wichtigste Einzelfaktor dafür, welche Lernmethode für eine Person am besten funktioniert.",
      date: "18. Mai 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "vorwissen lernerfolg",
        "schulung nach erfahrungslevel gestalten",
        "vorwissen schulungsdesign",
      ],
    },
    {
      slug: "was-ist-articulate-360",
      title: "Was ist Articulate 360? Preise, Tools und für wen es sich lohnt",
      description:
        "Articulate 360 ist eine Software-Suite für E-Learning-Erstellung, die im Kern aus zwei Autorentools besteht: Rise 360 für schnelle, responsive Kurse im Baukasten-Prinzip und Storyline 360 für komplexere, freier gestaltbare interaktive Trainings.",
      date: "16. Mai 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "was ist articulate 360",
        "articulate 360 kosten",
        "articulate rise 360 kosten",
        "articulate 360 suite",
        "software articulate",
      ],
    },
    {
      slug: "wissen-von-beratern-skalieren",
      title:
        "Wissen von Beraterinnen und Beratern skalieren, ohne dass es an eine Person gebunden bleibt",
      description:
        "In Beratungen und Agenturen steckt ein großer Teil des eigentlichen Werts im Wissen einzelner erfahrener Beraterinnen und Berater, nicht in Dokumenten.",
      date: "14. Mai 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "proprietäres wissen skalieren beratung",
        "consulting onboarding software",
        "wissen von beratern dokumentieren",
        "knowledge management für agenturen",
      ],
    },
    {
      slug: "worked-examples-schulung",
      title:
        "Worked Examples: Warum vorgerechnete Beispiele oft schneller zum Ziel führen als eigenes Ausprobieren",
      description:
        "Ein Worked Example ist ein vollständig vorgerechnetes Beispiel, bei dem jeder Lösungsschritt sichtbar erklärt wird, statt Lernende die Lösung selbst finden zu lassen.",
      date: "12. Mai 2026",
      readTime: 4,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "worked examples lernen",
        "ausgearbeitete beispiele training",
        "vorgerechnete beispiele schulung",
      ],
    },
    {
      slug: "eu-ai-act-ki-kompetenz-pflicht",
      title:
        "EU AI Act Artikel 4: Was die KI-Kompetenz-Pflicht für dein Unternehmen bedeutet",
      description:
        "Artikel 4 des EU AI Act verlangt seit Februar 2025 KI-Kompetenz von Mitarbeitenden. Was das bedeutet, wer betroffen ist und was ab 2. August 2026 gilt.",
      date: "17. Juli 2026",
      readTime: 11,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "eu ai act artikel 4",
        "ki kompetenz pflicht",
        "ki schulung pflicht unternehmen",
        "ki literacy unternehmen",
        "ai act mitarbeiterschulung",
      ],
    },
    {
      slug: "ki-richtlinie-unternehmen-vorlage",
      title: "KI-Richtlinie für Unternehmen: Vorlage zum direkten Einsatz",
      description:
        "Eine klare KI-Richtlinie ist Teil der KI-Kompetenz-Pflicht aus Artikel 4 des AI Act. Fertige Vorlage zum Anpassen, mit allen wichtigen Abschnitten.",
      date: "17. Juli 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ki richtlinie vorlage",
        "ki guideline unternehmen muster",
        "ki nutzungsrichtlinie unternehmen",
        "ki policy mitarbeiter",
        "ki regeln unternehmen",
      ],
    },
    {
      slug: "eu-ai-act-transparenzpflichten",
      title:
        "EU AI Act Artikel 50: Was die Transparenzpflichten für dein Unternehmen bedeuten",
      description:
        "Artikel 50 des EU AI Act verlangt ab dem 2. August 2026 Kennzeichnungspflichten für Chatbots, KI-generierte Inhalte und Deepfakes. Wer betroffen ist und was konkret zu tun ist.",
      date: "24. Juli 2026",
      readTime: 10,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "eu ai act artikel 50",
        "transparenzpflicht ki",
        "chatbot kennzeichnungspflicht",
        "ki generierte inhalte kennzeichnen",
        "deepfake kennzeichnungspflicht",
      ],
    },
    {
      slug: "schulungsplan-vorlage",
      title:
        "Schulungsplan erstellen: Vorlage und Schritt-für-Schritt-Anleitung",
      description:
        "Ein guter Schulungsplan verhindert, dass Schulungen im Tagesgeschäft untergehen. Vorlage zum Anpassen — plus Schritt-für-Schritt-Anleitung für HR-Teams ohne großes L&D-Budget.",
      date: "14. Juni 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1553484771-371a605b060b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Schulungsplan erstellen",
        "Schulungsplan Vorlage",
        "Jahresschulungsplan HR",
        "Weiterbildungsplan Mitarbeiter",
        "Schulungsplanung",
      ],
    },
    {
      slug: "onboarding-checkliste",
      title: "Onboarding-Checkliste 2026: Vorlage für neue Mitarbeitende",
      description:
        "Eine strukturierte Onboarding-Checkliste verkürzt die Zeit bis zur vollen Produktivität und reduziert Early Turnover. Vorlage für die ersten 90 Tage — kostenlos zum Anpassen.",
      date: "13. Juni 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Onboarding Checkliste",
        "Onboarding Vorlage",
        "neue Mitarbeitende Checkliste",
        "Einarbeitung Checkliste",
        "Onboarding Plan",
      ],
    },
    {
      slug: "ki-lernziele-formulieren",
      title: "Lernziele formulieren mit KI: Schritt für Schritt",
      description:
        "Lernziele zu formulieren kostet Zeit und Denkarbeit — KI kann beides drastisch reduzieren. Konkrete Prompts nach Bloom's Taxonomie, mit Beispielen aus dem L&D-Alltag.",
      date: "12. Juni 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Lernziele formulieren KI",
        "KI Lernziele erstellen",
        "Lernziele Bloom Taxonomie",
        "ChatGPT Lernziele",
        "KI Prompts L&D",
      ],
    },
    {
      slug: "microsoft-teams-lms",
      title: "Microsoft Teams als LMS: Was geht — und was definitiv nicht",
      description:
        "Viele Unternehmen fragen sich, ob Microsoft Teams ein LMS ersetzen kann. Die ehrliche Antwort: Nein — und hier ist warum. Was Teams kann, wo es scheitert, und was stattdessen funktioniert.",
      date: "11. Juni 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Microsoft Teams LMS",
        "Teams als LMS",
        "Teams Lernplattform",
        "Microsoft Teams Schulungen",
        "Teams statt LMS",
      ],
    },
    {
      slug: "beste-ki-tools-ld",
      title:
        "Die besten KI-Tools für L&D-Teams 2026: Eine praktische Übersicht",
      description:
        "Welche KI-Tools machen L&D wirklich schneller und besser? Eine praktische Übersicht zu Kurserstellung, Video, Sprache, Assessment und Übersetzung — mit ehrlichen Urteilen.",
      date: "10. Juni 2026",
      readTime: 10,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "beste KI Tools L&D",
        "KI Tools Personalentwicklung",
        "AI Tools E-Learning",
        "KI Tools HR Training",
        "KI Autorentool Vergleich",
      ],
    },
    {
      slug: "ispring-suite-erfahrungen",
      title:
        "iSpring Suite Erfahrungen 2026: Eine ehrliche Bewertung für L&D-Teams",
      description:
        "iSpring Suite macht aus PowerPoint E-Learning. Aber ist es das richtige Autorentool für dein Team? Preise, Stärken, Schwächen und ehrlicher Vergleich mit Articulate.",
      date: "9. Juni 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "iSpring Suite Erfahrungen",
        "iSpring Suite Bewertung",
        "iSpring Suite Review",
        "iSpring PowerPoint E-Learning",
        "iSpring vs Articulate",
      ],
    },
    {
      slug: "talentlms-erfahrungen",
      title:
        "TalentLMS Erfahrungen 2026: Eine ehrliche Bewertung für KMU-Teams",
      description:
        "TalentLMS gehört zu den meistgenutzten LMS-Plattformen für KMU — aber passt es zu deutschen Mittelstandsteams? Preise, UI, Compliance-Features und ehrliche Schwachstellen.",
      date: "8. Juni 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "TalentLMS Erfahrungen",
        "TalentLMS Bewertung",
        "TalentLMS Review",
        "TalentLMS KMU",
        "TalentLMS Deutsch",
      ],
    },
    {
      slug: "schulungsvideo-ki-erstellen",
      title:
        "Schulungsvideos mit KI erstellen: Synthesia, HeyGen & Co. im Praxistest",
      description:
        "Mit KI-Avatartools wie Synthesia und HeyGen kannst du Schulungsvideos ohne Kamera produzieren. Was funktioniert, was nicht — und welches Tool für welchen Zweck.",
      date: "7. Juni 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Schulungsvideo KI erstellen",
        "Synthesia vs HeyGen",
        "KI Avatarvideo Training",
        "E-Learning Video KI",
        "AI Schulungsvideo Tool",
      ],
    },
    {
      slug: "articulate-storyline-vs-rise",
      title:
        "Articulate Storyline vs. Rise 360: Welches Tool für welchen Kurs?",
      description:
        "Storyline oder Rise 360? Beide sind Teil von Articulate 360 — aber die Wahl macht einen Unterschied. Wann du welches Tool nutzt und warum.",
      date: "6. Juni 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Articulate Storyline vs Rise",
        "Storyline oder Rise 360",
        "Articulate 360 Vergleich",
        "welches Articulate Tool",
        "Rise 360 Storyline Unterschied",
      ],
    },
    {
      slug: "fertige-schulungsinhalte",
      title:
        "Schulungsinhalte kaufen oder selbst erstellen? Ein praktischer Entscheidungsrahmen",
      description:
        "Fertige Schulungsinhalte sparen Zeit, treffen aber oft nicht deinen Kontext. Ein klarer Rahmen für die Entscheidung: kaufen, selbst erstellen — oder beides kombinieren.",
      date: "5. Juni 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Schulungsinhalte kaufen oder erstellen",
        "fertige E-Learning-Kurse",
        "eigene Schulungsinhalte",
        "Training Content Bibliothek",
        "vorgefertigte Kurse",
      ],
    },
    {
      slug: "security-training-kosten-sparen",
      title:
        "Kosten bei Compliance- und Sicherheitsschulungen sparen — ohne Abstriche bei der Qualität",
      description:
        "Pflichtschulungen für Sicherheit und Compliance müssen nicht teuer sein. Wo die meisten Unternehmen zu viel ausgeben — und wie du Kosten senkst, ohne Audit-Sicherheit zu verlieren.",
      date: "4. Juni 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Compliance Training Kosten sparen",
        "Sicherheitsschulung günstiger",
        "Schulungskosten reduzieren",
        "günstige Pflichtschulung",
        "Compliance Training Budget",
      ],
    },
    {
      slug: "ki-schulung-kosten",
      title:
        "Was kostet eine KI-Schulung für Mitarbeiter? Eine realistische Kalkulation",
      description:
        "KI-Upskilling steht auf jeder HR-Agenda – aber was kostet es wirklich? Lizenzen, Inhalte, Durchführung, Produktivitätsverlust. Eine realistische Kalkulation nach Unternehmensgröße.",
      date: "3. Juni 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "KI Schulung Kosten Mitarbeiter",
        "KI Upskilling Kosten",
        "KI Training Preis",
        "Mitarbeiter KI schulen Kosten",
        "KI Weiterbildung Budget",
      ],
    },
    {
      slug: "chatgpt-prompts-ld",
      title: "ChatGPT-Prompts für L&D: 20 Vorlagen, die du heute nutzen kannst",
      description:
        "Copy-paste ChatGPT-Prompts für L&D-Teams: Kursstruktur, Lernziele, Quizfragen, Szenarien, Bedarfsanalyse und mehr — mit echten Beispielen.",
      date: "2. Juni 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "ChatGPT Prompts L&D",
        "ChatGPT E-Learning",
        "KI Prompts Schulung",
        "ChatGPT Kurs erstellen",
        "L&D KI Prompts",
      ],
    },
    {
      slug: "dsgvo-konforme-ki-tools",
      title:
        "DSGVO-konforme KI-Tools für HR und L&D: Was du wirklich einsetzen darfst",
      description:
        "Darf ich ChatGPT für die Kurserstellung nutzen? Welche Daten dürfen in KI-Tools? Ein praktischer Leitfaden für HR und L&D unter der DSGVO.",
      date: "1. Juni 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "DSGVO KI-Tools HR",
        "DSGVO-konforme KI",
        "KI-Tools Datenschutz",
        "ChatGPT DSGVO",
        "KI HR-Tools Deutschland",
      ],
    },
    {
      slug: "autorentools-ratgeber",
      title: "E-Learning Autorentools: Der komplette Ratgeber 2026",
      description:
        "Welches E-Learning Autorentool braucht dein Team wirklich? Ein praktischer Ratgeber mit allen relevanten Tools, Preisen und den richtigen Fragen vor der Entscheidung.",
      date: "31. Mai 2026",
      readTime: 10,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "E-Learning Autorentool",
        "Autorentool Vergleich",
        "bestes Autorentool",
        "Kurserstellungssoftware",
        "SCORM Autorentool",
      ],
    },
    {
      slug: "mitarbeiter-schulung-planen",
      title:
        "Mitarbeiterschulung planen: Der komplette Leitfaden für HR und L&D",
      description:
        "Wie du Mitarbeiterschulungen planst, die wirklich etwas bringen — von der Bedarfsanalyse bis zur Erfolgsmessung. Ein praktischer Leitfaden für HR-Teams ohne großes Budget.",
      date: "30. Mai 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Mitarbeiterschulung planen",
        "Schulungsplan erstellen",
        "Weiterbildung planen",
        "Schulungsbedarf ermitteln",
        "Mitarbeitertraining",
      ],
    },
    {
      slug: "ki-autorentools-ratgeber",
      title: "KI-Autorentools: Der komplette Ratgeber für L&D-Teams",
      description:
        "KI-Autorentools versprechen deutlich kürzere Entwicklungszeiten. Dieser Ratgeber erklärt, wie sie wirklich funktionieren, welche Tools es gibt und wie du die richtige Entscheidung für dein Team triffst.",
      date: "29. Mai 2026",
      readTime: 10,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "KI Autorentool",
        "KI E-Learning Tool",
        "KI Kurserstellung",
        "KI Lerndesign",
        "beste KI-Tools L&D",
      ],
    },
    {
      slug: "lms-mit-zertifikaten",
      title: "LMS mit Zertifikaten: Was du vor dem Kauf prüfen solltest",
      description:
        "Abschlusszertifikate klingen nach Standard – aber die Zertifikatsfunktionen von LMS-Plattformen unterscheiden sich erheblich. Was du prüfen musst, damit sie für Compliance und Audits wirklich taugen.",
      date: "28. Mai 2026",
      readTime: 5,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1589330273594-fade1ee91647?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS mit Zertifikaten",
        "Abschlusszertifikat LMS",
        "Schulungszertifikat",
        "Compliance Zertifikat LMS",
        "LMS Zertifikat Vorlage",
      ],
    },
    {
      slug: "lms-ohne-it-abteilung",
      title:
        "LMS ohne IT-Abteilung: Worauf es ankommt und was du vermeiden solltest",
      description:
        "Die meisten LMS-Plattformen setzen eine IT-Abteilung voraus. Wenn du keine hast: Worauf du bei der Auswahl achten solltest und welche Fallen du vermeidest.",
      date: "27. Mai 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS ohne IT-Abteilung",
        "LMS Mittelstand",
        "LMS einfach einrichten",
        "LMS selbst verwalten",
        "LMS ohne IT",
      ],
    },
    {
      slug: "articulate-alternativen",
      title:
        "Articulate 360 Alternativen: Welches Autorentool passt zu deinem Team",
      description:
        "Articulate 360 dominiert den Markt – aber nicht für jedes Team ist es das richtige Tool. Ein ehrlicher Vergleich der besten Alternativen nach Anwendungsfall, Budget und technischem Niveau.",
      date: "26. Mai 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Articulate 360 Alternativen",
        "E-Learning Autorentool",
        "Articulate Alternative",
        "Rise Alternative",
        "Storyline Alternative",
      ],
    },
    {
      slug: "ki-kurs-erstellen",
      title: "Kurse erstellen mit KI: Was wirklich funktioniert",
      description:
        "KI-Tools versprechen kürzere Kursentwicklungszeiten. Eine ehrliche Einschätzung: Was funktioniert wirklich, wo sind die Grenzen – und wie kommt man schnell zu brauchbaren Ergebnissen.",
      date: "25. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "KI Kurs erstellen",
        "Kurs erstellen mit KI",
        "KI E-Learning",
        "KI Autorentool",
        "Schulung mit KI erstellen",
      ],
    },
    {
      slug: "instructional-design-buecher",
      title: "10 Bücher, die jeder Instructional Designer gelesen haben sollte",
      description:
        "Nicht jedes Buch über Instructional Design ist seine Zeit wert. Diese 10 schon – von evidenzbasierten Klassikern bis zu modernen Ansätzen zu Verhaltensänderung und agilem Design.",
      date: "25. Mai 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Instructional Design Bücher",
        "Bücher Personalentwicklung",
        "E-Learning Bücher",
        "Lerndesign Literatur",
        "Instructional Design Lesen",
      ],
    },
    {
      slug: "instructional-design-youtube",
      title: "10 YouTube-Kanäle für Instructional Designer und L&D-Profis",
      description:
        "Die besten kostenlosen Ressourcen für Instructional Design und E-Learning gibt es auf YouTube. Diese 10 Kanäle decken Tools, Theorie, Karriere und Design ab – ohne Füllmaterial.",
      date: "25. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Instructional Design YouTube",
        "E-Learning YouTube-Kanäle",
        "L&D YouTube",
        "Personalentwicklung YouTube",
        "E-Learning Tutorials",
      ],
    },
    {
      slug: "lnd-podcasts",
      title: "10 Podcasts für L&D-Profis und Instructional Designer",
      description:
        "Der Podcast-Markt für L&D ist groß und unübersichtlich. Diese 10 Shows sind es wirklich wert – zu Design, Strategie, Karriere und Lernwissenschaft.",
      date: "25. Mai 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Instructional Design Podcast",
        "E-Learning Podcast",
        "L&D Podcast",
        "Corporate Learning Podcast",
        "Lerndesign Podcast",
        "The Learning Hack",
        "Hidden Brain",
        "L&D Plus",
      ],
    },
    {
      slug: "personalentwicklung-podcasts",
      title:
        "Die 10 besten deutschsprachigen Podcasts für HR und Personalentwicklung",
      description:
        "Deutschsprachige HR-Podcasts sind unterschätzt – und in den meisten internationalen Empfehlungslisten gar nicht erst vertreten. Hier sind die 10 besten für HR- und PE-Profis im DACH-Raum.",
      date: "25. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Personalentwicklung Podcast",
        "HR Podcast Deutschland",
        "deutschsprachiger HR Podcast",
        "New Work Podcast",
        "Weiterbildung Podcast",
        "HR Podcast DACH",
      ],
    },
    {
      slug: "design-for-how-people-learn",
      title:
        "Design for How People Learn: Dirksen's Standardwerk – Eine Zusammenfassung",
      description:
        "Julie Dirksens Klassiker des Instructional Design stellt die eigentlichen Lernlücken in den Mittelpunkt – nicht die Informationsvermittlung. Was das Buch leistet und warum es unverzichtbar bleibt.",
      date: "25. Mai 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Design for How People Learn",
        "Julie Dirksen",
        "Instructional Design Buch",
        "Lerndesign",
        "E-Learning Design",
        "ID Buchzusammenfassung",
      ],
    },
    {
      slug: "map-it-cathy-moore",
      title:
        "Map It von Cathy Moore: Action Mapping erklärt – Eine Zusammenfassung",
      description:
        "Cathy Moores Action Mapping beginnt mit Geschäftszielen, nicht mit Inhalten – und ist das wirksamste Gegenmittel gegen informationsüberladenes E-Learning.",
      date: "25. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Map It Cathy Moore",
        "Action Mapping",
        "Instructional Design",
        "E-Learning Design",
        "performanceorientiertes Lernen",
        "ID-Methodik",
      ],
    },
    {
      slug: "elearning-science-of-instruction",
      title:
        "E-Learning and the Science of Instruction: Clark & Mayers Designprinzipien – Eine Zusammenfassung",
      description:
        "Clark und Mayers evidenzbasierte Gestaltungsprinzipien sind die rigoroseste Grundlage für E-Learning-Entwicklung – hier, was die 12 Prinzipien tatsächlich besagen.",
      date: "24. Mai 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "E-Learning and the Science of Instruction",
        "Clark Mayer",
        "Multimedia-Lernprinzipien",
        "Cognitive Load Theory",
        "E-Learning Design",
        "Instructional Design Prinzipien",
      ],
    },
    {
      slug: "make-it-stick-buch",
      title:
        "Make It Stick: Wissenschaft des nachhaltigen Lernens – Eine Zusammenfassung für L&D-Profis",
      description:
        "Brown, Roediger & McDaniel entkräften die beliebtesten Lernmethoden mit Forschungsbelegen – und zeigen, was tatsächlich funktioniert.",
      date: "24. Mai 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Make It Stick",
        "Lernwissenschaft",
        "Retrieval Practice",
        "Spaced Repetition",
        "Interleaving",
        "kognitive Psychologie",
        "L&D Buchzusammenfassung",
      ],
    },
    {
      slug: "accidental-instructional-designer",
      title:
        "The Accidental Instructional Designer: Cammy Beans Leitfaden für Quereinsteiger (Zusammenfassung)",
      description:
        "Cammy Beans Praxisleitfaden zeigt, wie du vom Wissen über L&D zum echten Instructional-Design-Alltag kommst: die wichtigsten Prinzipien für Quereinsteiger in 7 Minuten Lesezeit.",
      date: "23. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Accidental Instructional Designer",
        "Cammy Bean",
        "Instructional Design Karriere",
        "Quereinsteiger ID",
        "E-Learning Karriere",
        "Instructional Design für Einsteiger",
      ],
    },
    {
      slug: "soziales-lernen",
      title:
        "Soziales Lernen im Unternehmen: Wie Menschen wirklich voneinander lernen",
      description:
        "Das meiste Lernen am Arbeitsplatz passiert nicht in Kursen. Es passiert durch Beobachtung, Gespräche und Zusammenarbeit. Wie man soziales Lernen bewusst gestaltet.",
      date: "23. Mai 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "soziales Lernen",
        "Peer Learning",
        "kollaboratives Lernen",
        "Bandura",
        "Lernen am Arbeitsplatz",
        "informelles Lernen",
      ],
    },
    {
      slug: "michael-allens-guide-elearning",
      title:
        "Michael Allen's Guide to e-Learning: CCAF und SAM erklärt – Eine Zusammenfassung",
      description:
        "Allens CCAF-Modell und der SAM-Prozess zeigen, warum die meisten E-Learning-Kurse scheitern – und wie besseres Design aussieht.",
      date: "23. Mai 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Michael Allen E-Learning",
        "CCAF-Modell",
        "SAM Instructional Design",
        "Successive Approximation Model",
        "E-Learning-Design",
        "ADDIE Alternative",
      ],
    },
    {
      slug: "training-from-the-back-of-the-room",
      title:
        "Training from the Back of the Room! Bowmans gehirngerechtes Trainingsdesign – Eine Zusammenfassung",
      description:
        "Bowmans 4Cs-Modell überträgt Neurowissenschaft in Trainingsdesign – und erklärt, warum Lerneraktivität der Inhaltsvermittlung durch Trainer konsequent überlegen ist.",
      date: "22. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Sharon Bowman",
        "Training from the Back of the Room",
        "4Cs-Modell",
        "gehirngerechtes Lernen",
        "Instructional Design",
        "aktives Lernen",
      ],
    },
    {
      slug: "ten-steps-complex-learning",
      title:
        "Ten Steps to Complex Learning: Das 4C/ID-Modell erklärt – Eine Zusammenfassung",
      description:
        "Das 4C/ID-Modell von van Merriënboer und Kirschner ist das wissenschaftlich fundierteste Framework für komplexes Lernen – und die vierte Auflage macht es endlich zugänglich.",
      date: "22. Mai 2026",
      readTime: 9,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Ten Steps to Complex Learning",
        "4C/ID-Modell",
        "van Merriënboer",
        "komplexes Lernen",
        "Instructional Design",
        "Curriculum-Design",
      ],
    },
    {
      slug: "soft-skills-training",
      title: "Soft-Skills-Training, das wirklich funktioniert",
      description:
        "Soft-Skills-Training ist eine der meistgefragten – und am wenigsten wirksamen – Kategorien betrieblicher Weiterbildung. Warum die meisten Programme scheitern und wie gutes Design aussieht.",
      date: "21. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Soft-Skills-Training",
        "Kommunikationstraining",
        "Soft-Skills-Entwicklung",
        "soziale Kompetenzen",
        "Führungstraining",
        "Personalentwicklung",
      ],
    },
    {
      slug: "talk-to-the-elephant",
      title:
        "Talk to the Elephant: Verhaltensänderung durch Lerndesign – Eine Zusammenfassung",
      description:
        "Dirksens Folgebuch adressiert die Knowing-Doing-Gap direkt – und gibt Designern ein diagnostisches Framework, um zu verstehen, warum Verhalten sich nicht ändert.",
      date: "21. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Talk to the Elephant",
        "Julie Dirksen",
        "Verhaltensänderung",
        "Knowing-Doing-Gap",
        "COM-B-Modell",
        "Instructional Design",
        "Lerndesign",
      ],
    },
    {
      slug: "leaving-addie-for-sam",
      title:
        "Leaving ADDIE for SAM: Agiles Instructional Design erklärt – Eine Zusammenfassung",
      description:
        "Allen und Sites zeigen präzise, warum ADDIEs lineare Struktur spätes, kostspieliges Nacharbeiten erzeugt – und wie SAMs iterativer Prozess das behebt.",
      date: "21. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Leaving ADDIE for SAM",
        "SAM-Modell",
        "ADDIE Instructional Design",
        "agiles Instructional Design",
        "Michael Allen",
        "iteratives Lerndesign",
      ],
    },
    {
      slug: "lms-kosten",
      title: "LMS Kosten: Was ein Lernmanagementsystem wirklich kostet",
      description:
        "LMS-Preise sind absichtlich undurchsichtig. Eine klare Übersicht: wie Preismodelle funktionieren, welche Folgekosten entstehen und was realistische Budgets je Unternehmensgröße sind.",
      date: "19. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS Kosten",
        "Lernmanagementsystem Kosten",
        "LMS Preis",
        "was kostet ein LMS",
        "LMS Budget",
      ],
    },
    {
      slug: "lxp-vs-lms",
      title:
        "LXP vs. LMS: Was ist der Unterschied – und was brauche ich wirklich?",
      description:
        "Learning Experience Platforms und Learning Management Systems werden oft verwechselt – manchmal absichtlich. Eine klare Erklärung, was jedes System leistet und wer was braucht.",
      date: "16. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LXP vs LMS",
        "Learning Experience Platform",
        "LXP Bedeutung",
        "LMS vs LXP",
        "LXP Definition",
        "was ist eine LXP",
      ],
    },
    {
      slug: "blended-learning",
      title:
        "Blended Learning: Was es wirklich bedeutet – und wie man es gestaltet",
      description:
        "Blended Learning kombiniert Online- und Präsenztraining – aber Formate zu mischen reicht nicht. Was wirksames Blended Learning von teurer Verwirrung unterscheidet.",
      date: "14. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Blended Learning",
        "hybrides Lernen",
        "Online- und Präsenztraining",
        "Lernmix",
        "Schulungsstrategie",
        "betriebliche Weiterbildung",
      ],
    },
    {
      slug: "skills-gap-analyse",
      title:
        "Skills-Gap-Analyse: So findest du heraus, was dein Team wirklich braucht",
      description:
        "Eine Skills-Gap-Analyse zeigt, wo die Fähigkeiten deines Teams hinter den Anforderungen zurückbleiben. Eine praktische Methode, die auch ohne L&D-Abteilung funktioniert.",
      date: "12. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Skills-Gap-Analyse",
        "Kompetenzlücken",
        "Trainingsbedarf ermitteln",
        "Personalentwicklungsplanung",
        "Weiterbildungsplanung",
        "L&D Strategie",
      ],
    },
    {
      slug: "moodle-alternativen",
      title:
        "Moodle Alternativen: Was man nutzt, wenn Moodle aufhört zu helfen",
      description:
        "Moodle ist kostenlos und mächtig – kommt aber mit erheblicher Komplexität. Eine ehrliche Analyse, wann Moodle nicht mehr das Richtige ist und was stattdessen passt.",
      date: "9. Mai 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Moodle Alternativen",
        "Alternative zu Moodle",
        "Moodle Ersatz",
        "Moodle vs andere LMS",
        "beste Moodle Alternative",
      ],
    },
    {
      slug: "lms-auswahl",
      title: "LMS auswählen: Eine Checkliste für HR und L&D",
      description:
        "Die Wahl eines Lernmanagementsystems ist leicht falsch zu treffen. Diese Checkliste hilft HR- und L&D-Teams, Anbieter zu bewerten – ohne sich in Funktionslisten zu verlieren.",
      date: "7. Mai 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS auswählen",
        "LMS Checkliste",
        "Lernmanagementsystem Vergleich",
        "LMS Bewertung",
        "bestes LMS",
        "LMS Auswahl",
      ],
    },
    {
      slug: "70-20-10-modell",
      title:
        "Das 70-20-10-Modell: Was steckt dahinter – und wie setzt man es ein?",
      description:
        "Das 70-20-10-Modell beschreibt, wie Erwachsene bei der Arbeit lernen: 70 % durch Erfahrung, 20 % von anderen, 10 % durch formale Schulungen. Was das für die L&D-Strategie bedeutet.",
      date: "5. Mai 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "70-20-10-Modell",
        "70-20-10 Lernen",
        "informelles Lernen",
        "Erfahrungslernen",
        "L&D Framework",
        "Lernstrategie",
      ],
    },
    {
      slug: "dsgvo-schulung",
      title:
        "DSGVO-Schulung für Mitarbeiter: Was Pflicht ist und wie man es richtig umsetzt",
      description:
        "Die DSGVO macht Datenschutzschulungen zur rechtlichen Verpflichtung – kein Nice-to-have. Was Schulungen abdecken müssen, wie oft sie stattfinden sollen und wie man sie korrekt dokumentiert.",
      date: "2. Mai 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "DSGVO Schulung",
        "Datenschutzschulung Mitarbeiter",
        "DSGVO Mitarbeiter schulen",
        "Datenschutz Pflichtschulung",
        "DSGVO Compliance Training",
      ],
    },
    {
      slug: "digitale-unterweisungen",
      title:
        "Digitale Unterweisungen: Software, Pflichten und rechtssichere Umsetzung",
      description:
        "Unterweisungen am Arbeitsplatz sind gesetzlich vorgeschrieben – und ein Dokumentationsproblem. Wie Sie Unterweisungen digital abwickeln, ohne Compliance-Risiken einzugehen.",
      date: "30. April 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "digitale Unterweisungen",
        "Unterweisung Software",
        "Arbeitsschutzunterweisung",
        "Pflichtunterweisung digital",
        "Unterweisung Mitarbeiter",
        "ArbSchG Unterweisung",
      ],
    },
    {
      slug: "ausbildung-digitalisieren",
      title:
        "Ausbildung digitalisieren: Wie ein LMS die Berufsausbildung modernisiert",
      description:
        "Berufsausbildung bedeutet regulatorische Dokumentation, standortübergreifende Betreuung und strukturierte Kompetenzentwicklung. Wie ein modernes LMS die Ausbildung unterstützt, ohne Verwaltungsaufwand zu schaffen.",
      date: "28. April 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Ausbildung digitalisieren",
        "Azubi Schulung",
        "Ausbildung LMS",
        "digitale Berufsausbildung",
        "Berufsausbildung Software",
        "Ausbildungsmanagement",
      ],
    },
    {
      slug: "betriebsrat-elearning",
      title:
        "Betriebsrat und E-Learning: Was vor der Einführung einer Lernplattform zu klären ist",
      description:
        "In Deutschland hat der Betriebsrat Mitbestimmungsrechte bei der Einführung von Systemen, die Mitarbeitende überwachen. Was HR vor dem Rollout wissen muss.",
      date: "25. April 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Betriebsrat E-Learning",
        "Mitbestimmung Lernplattform",
        "Betriebsrat LMS",
        "Betriebsvereinbarung E-Learning",
        "LMS Betriebsrat",
      ],
    },
    {
      slug: "was-ist-microlearning",
      title: "Was ist Microlearning? Und warum es funktioniert",
      description:
        "Microlearning vermittelt Wissen in fokussierten 3–10-Minuten-Einheiten. Erfahren Sie, was es ist, warum das Gehirn es liebt und wie Sie es in Ihrem Unternehmen einführen.",
      date: "23. April 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Microlearning",
        "E-Learning",
        "Lernmethoden",
        "Mitarbeitertraining",
        "Lernen im Unternehmen",
        "LMS",
      ],
    },
    {
      slug: "lms-vs-authoring-tools",
      title:
        "LMS vs. Authoring-Tools: Was ist der Unterschied – und was brauche ich?",
      description:
        "Ein LMS verwaltet und trackt Ihre Schulungen. Authoring-Tools erstellen die Inhalte. Viele Unternehmen brauchen beides – aber nicht immer. So entscheiden Sie richtig.",
      date: "21. April 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS",
        "Authoring-Tool",
        "E-Learning Software",
        "Lernmanagementsystem",
        "Kurs erstellen",
        "Articulate",
      ],
    },
    {
      slug: "was-ist-agentic-learning",
      title:
        "Was ist Agentic Learning? Vom passiven Konsum zur Eigenverantwortung",
      description:
        "Agentic Learning bedeutet: Lernende steuern ihre Entwicklung selbst, anstatt auf Schulungen zu warten. Was das in der Praxis bedeutet – und wie Sie es fördern.",
      date: "18. April 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Agentic Learning",
        "selbstgesteuertes Lernen",
        "autonomes Lernen",
        "L&D",
        "Lernkultur",
        "Mitarbeiterentwicklung",
      ],
    },
    {
      slug: "die-vergessenskurve",
      title:
        "Die Vergessenskurve: Warum Mitarbeiter 90 % des Trainings vergessen",
      description:
        "Hermann Ebbinghaus hat 1885 gemessen, wie schnell wir vergessen. Seine Erkenntnisse erklären, warum Unternehmensschulungen scheitern – und was dagegen hilft.",
      date: "16. April 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Vergessenskurve",
        "Ebbinghaus",
        "Wissensretention",
        "Spaced Repetition",
        "Unternehmensschulungen",
        "Lernwissenschaft",
      ],
    },
    {
      slug: "learning-in-the-flow-of-work",
      title:
        "Lernen im Arbeitsfluss: Warum Schulungen, die unterbrechen, scheitern",
      description:
        "Josh Bersins Konzept des 'Lernens im Arbeitsfluss' erklärt, warum herausgerissene Schulungen kaum etwas bringen – und was stattdessen funktioniert.",
      date: "14. April 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Lernen im Arbeitsfluss",
        "Josh Bersin",
        "Performance Support",
        "Just-in-time-Lernen",
        "L&D Strategie",
        "Arbeitsplatzlernen",
      ],
    },
    {
      slug: "kontinuierliches-lernen",
      title:
        "Kontinuierliches Lernen: Warum einmalige Schulungen nicht reichen",
      description:
        "Eine einmalige Schulung baut keine dauerhaften Fähigkeiten auf. Kontinuierliches Lernen schon – aber das braucht eine Strategie, nicht nur mehr Kurse.",
      date: "11. April 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "kontinuierliches Lernen",
        "Lernkultur",
        "Mitarbeiterentwicklung",
        "L&D Strategie",
        "Upskilling",
        "Reskilling",
      ],
    },
    {
      slug: "kurse-aktuell-halten",
      title:
        "E-Learning-Kurse aktuell halten: So vermeiden Sie veraltete Inhalte",
      description:
        "Veraltete Schulungsinhalte sind ein Vertrauensproblem, nicht nur ein Inhaltsproblem. So halten Sie Kurse aktuell – ohne jedes Mal neu anzufangen.",
      date: "9. April 2026",
      readTime: 5,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "E-Learning Pflege",
        "Kurs aktualisieren",
        "Content-Governance",
        "veraltete Schulungen",
        "Kursmanagement",
      ],
    },
    {
      slug: "didaktische-grundlagen",
      title: "Didaktische Grundlagen: Was Lernen wirklich wirksam macht",
      description:
        "Gutes instructional Design geht nicht darum, Inhalte hübsch zu machen. Es geht darum, zu verstehen, wie Menschen lernen – und danach zu gestalten.",
      date: "7. April 2026",
      readTime: 8,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Instructional Design",
        "Lerntheorie",
        "ADDIE",
        "Bloom-Taxonomie",
        "Lernziele",
        "E-Learning Gestaltung",
      ],
    },
    {
      slug: "compliance-training-mit-lms",
      title:
        "Compliance-Training mit LMS: Den Nachweis automatisieren, nicht nur den Kurs",
      description:
        "Compliance-Schulungen sind Pflicht – aber auch ein Dokumentationsproblem. So übernimmt ein modernes LMS den gesamten Nachweis, nicht nur die Durchführung.",
      date: "4. April 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Compliance-Schulung",
        "LMS",
        "Nachweispflicht",
        "Pflichtschulung",
        "DSGVO-Schulung",
        "gesetzliche Anforderungen",
      ],
    },
    {
      slug: "ki-im-elearning",
      title: "KI im E-Learning: Was heute schon geht – und was noch Hype ist",
      description:
        "KI verändert, wie Unternehmensschulungen erstellt und vermittelt werden. Was heute wirklich funktioniert – und wo man skeptisch bleiben sollte.",
      date: "2. April 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "KI im E-Learning",
        "Künstliche Intelligenz",
        "Lerntechnologie",
        "KI Kurserstellung",
        "personalisiertes Lernen",
        "EdTech",
      ],
    },
    {
      slug: "onboarding-mit-lms",
      title:
        "Onboarding mit LMS: Schneller produktiv – ohne den menschlichen Faktor zu verlieren",
      description:
        "Digitales Onboarding mit LMS spart Zeit und skaliert. Falsch gemacht, fühlen sich neue Mitarbeiter allein gelassen. So finden Sie die richtige Balance.",
      date: "31. März 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS Onboarding",
        "Mitarbeiter-Onboarding",
        "digitales Onboarding",
        "Einarbeitung neue Mitarbeiter",
        "Onboarding-Software",
      ],
    },
    {
      slug: "lms-fuer-den-mittelstand",
      title: "LMS für den Mittelstand: Einstieg ohne IT-Abteilung",
      description:
        "Kleine Unternehmen brauchen Tools, die sofort funktionieren – keine Corporate-Software mit halbjähriger Einführung. Worauf es wirklich ankommt.",
      date: "28. März 2026",
      readTime: 6,
      category: "product",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS Mittelstand",
        "Lernplattform kleine Unternehmen",
        "Mitarbeiterschulung KMU",
        "Weiterbildung Mittelstand",
      ],
    },
    {
      slug: "lms-anwendungsfaelle",
      title: "LMS-Anwendungsfälle: Wo ein Lernmanagementsystem wirklich hilft",
      description:
        "Von Onboarding bis Compliance bis Produkttraining – ein LMS deckt viele Anwendungsfälle ab. Wo der Nutzen am klarsten ist.",
      date: "26. März 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "LMS Anwendungsfälle",
        "Lernmanagementsystem",
        "Mitarbeiterschulung",
        "betriebliche Weiterbildung",
        "Schulungs-ROI",
      ],
    },
    {
      slug: "gamification-im-elearning",
      title: "Gamification im E-Learning: Mehr als Punkte und Abzeichen",
      description:
        "Gamification funktioniert – wenn sie mit dem Lernziel verbunden ist und nicht einfach draufgeklebt wird. Der Unterschied zwischen Dekoration und wirkungsvollem Design.",
      date: "24. März 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Gamification",
        "E-Learning Motivation",
        "spielbasiertes Lernen",
        "Abzeichen",
        "Ranglisten",
        "Lernmotivation",
      ],
    },
    {
      slug: "lernerfolg-messen",
      title: "Lernerfolg messen: Das Kirkpatrick-Modell einfach erklärt",
      description:
        "Die meisten Unternehmen messen, ob Schulungen stattgefunden haben. Das Kirkpatrick-Modell hilft zu messen, ob sie gewirkt haben – auf vier Ebenen.",
      date: "21. März 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Kirkpatrick-Modell",
        "Trainingseffektivität",
        "Lernevaluation",
        "L&D ROI",
        "Schulungsbewertung",
      ],
    },
    {
      slug: "scorm-vs-xapi",
      title:
        "SCORM vs. xAPI: Was ist der Unterschied – und was brauche ich wirklich?",
      description:
        "SCORM ist seit 25 Jahren der E-Learning-Standard. xAPI soll ihn ablösen. Was beide wirklich können, wo sie scheitern – und wie Sie entscheiden.",
      date: "19. März 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "SCORM",
        "xAPI",
        "Tin Can API",
        "E-Learning Standards",
        "LMS Integration",
        "SCORM Unterschied",
      ],
    },
    {
      slug: "scibly-use-cases",
      title:
        "Wie Unternehmen Scibly nutzen: Onboarding, Compliance und Produktschulung in der Praxis",
      description:
        "Drei echte Anwendungsfälle für Scibly: wie ein Händler saisonal einarbeitet, wie eine Kanzlei Compliance schult, wie ein SaaS-Anbieter Kunden trainiert.",
      date: "17. März 2026",
      readTime: 5,
      category: "product",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Scibly Anwendungsfälle",
        "LMS Beispiele",
        "E-Learning Plattform",
        "Onboarding Software",
        "Compliance Training",
      ],
      featured: true,
    },
    {
      slug: "mitarbeiter-weiterbilden",
      title:
        "Mitarbeiter weiterbilden: Was wirklich funktioniert – und was Budget verbrennt",
      description:
        "Jede HR-Abteilung will Mitarbeiter weiterbilden. Die meisten sehen keine nachhaltigen Ergebnisse. Was wirksame Entwicklung von teurer Theaterkulisse unterscheidet.",
      date: "14. März 2026",
      readTime: 7,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Mitarbeiterentwicklung",
        "Upskilling",
        "Reskilling",
        "Weiterbildung ROI",
        "L&D Effektivität",
        "Personalentwicklung",
      ],
    },
    {
      slug: "elearning-kurs-erstellen",
      title:
        "E-Learning-Kurs erstellen: Was Sie wirklich brauchen, um anzufangen",
      description:
        "Sie brauchen kein Videostudio und keinen Experten für Ihren ersten Kurs. Das ist das Minimum, das funktioniert – und die Fehler, die Sie sich sparen können.",
      date: "12. März 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "E-Learning Kurs erstellen",
        "Kurs erstellen",
        "Online-Schulung erstellen",
        "E-Learning produzieren",
        "LMS Inhalte",
      ],
    },
    {
      slug: "remote-learning",
      title: "Remote Learning: Wie verteilte Teams wirklich gemeinsam lernen",
      description:
        "Remote-Arbeit hat verändert, wie Teams lernen. Was sich aus Präsenztraining nicht übertragen lässt – und was remote sogar besser funktioniert als im Seminarraum.",
      date: "10. März 2026",
      readTime: 6,
      category: "education",
      author: {
        name: "Felix",
        role: "Co-Founder, Scibly",
        avatar:
          "https://scibly-assets.s3.eu-central-1.amazonaws.com/Blog-Authors/felix_linkedin.jpeg",
      },
      thumbnail:
        "https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=1200&h=630&q=80",
      keywords: [
        "Remote Learning",
        "verteilte Teams",
        "Online-Training",
        "Remote Work Weiterbildung",
        "virtuelles Lernen",
      ],
    },
  ],
} satisfies Record<Locale, BlogPost[]>;
