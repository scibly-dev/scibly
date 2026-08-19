import { type Locale } from "@scibly/i18n/constants";

export interface GlossaryTerm {
  slug: string;
  title: string;
  definition: string;
  keywords: string[];
  relatedTerms?: string[];
  relatedPost?: string;
}

export const GLOSSARY_TERMS = {
  en: [
    {
      slug: "70-20-10",
      title: "70-20-10 Model",
      definition:
        "A framework describing how workplace learning occurs: 70% through on-the-job experience, 20% from social interaction and feedback, and 10% from formal training.",
      keywords: [
        "70-20-10 model",
        "70 20 10 learning",
        "informal learning",
        "experiential learning",
        "L&D framework",
      ],
      relatedTerms: [
        "instructional-design",
        "blended-learning",
        "social-learning",
      ],
      relatedPost: "70-20-10-modell",
    },
    {
      slug: "4c-id-model",
      title: "4C/ID Model",
      definition:
        "Four-Component Instructional Design — a curriculum framework for designing complex learning environments around whole-task practice, supportive information, procedural guidance, and part-task training.",
      keywords: [
        "4C/ID model",
        "four component instructional design",
        "van Merriënboer",
        "complex learning",
        "curriculum design",
      ],
      relatedTerms: ["instructional-design", "addie", "cognitive-load-theory"],
      relatedPost: "ten-steps-complex-learning",
    },
    {
      slug: "action-mapping",
      title: "Action Mapping",
      definition:
        "A visual instructional design method by Cathy Moore that starts with a measurable business goal, identifies required on-the-job actions, diagnoses causes of inaction, and designs practice activities targeting those gaps.",
      keywords: [
        "action mapping",
        "Cathy Moore",
        "instructional design method",
        "performance-focused learning",
        "Map It",
      ],
      relatedTerms: ["instructional-design", "addie", "sam"],
      relatedPost: "map-it-cathy-moore",
    },
    {
      slug: "addie",
      title: "ADDIE Model",
      definition:
        "A five-phase instructional design process: Analysis, Design, Development, Implementation, and Evaluation — the most widely used framework for creating training programs.",
      keywords: [
        "ADDIE model",
        "ADDIE instructional design",
        "ADDIE framework",
        "instructional design process",
        "training development",
      ],
      relatedTerms: ["sam", "instructional-design", "action-mapping"],
      relatedPost: "leaving-addie-for-sam",
    },
    {
      slug: "blended-learning",
      title: "Blended Learning",
      definition:
        "A training approach that combines online digital instruction with in-person learning activities, designed so each format complements the other rather than simply co-existing.",
      keywords: [
        "blended learning",
        "hybrid learning",
        "online and in-person training",
        "learning mix",
        "corporate training",
      ],
      relatedTerms: [
        "microlearning",
        "social-learning",
        "learning-in-the-flow-of-work",
      ],
      relatedPost: "blended-learning",
    },
    {
      slug: "cognitive-load-theory",
      title: "Cognitive Load Theory",
      definition:
        "A learning science theory by John Sweller describing how working memory has limited capacity, and how instructional design can reduce unnecessary load to support better learning.",
      keywords: [
        "cognitive load theory",
        "Sweller",
        "working memory",
        "instructional design",
        "multimedia learning",
      ],
      relatedTerms: [
        "spaced-repetition",
        "retrieval-practice",
        "instructional-design",
        "worked-examples",
        "productive-failure",
      ],
      relatedPost: "elearning-science-of-instruction",
    },
    {
      slug: "com-b-model",
      title: "COM-B Model",
      definition:
        "A behavior change framework identifying three conditions required for behavior: Capability (physical and psychological), Opportunity (physical and social environment), and Motivation (reflective and automatic).",
      keywords: [
        "COM-B model",
        "behavior change model",
        "Capability Opportunity Motivation",
        "behavior design",
        "instructional design",
      ],
      relatedTerms: ["instructional-design", "action-mapping"],
      relatedPost: "talk-to-the-elephant",
    },
    {
      slug: "forgetting-curve",
      title: "Forgetting Curve",
      definition:
        "Hermann Ebbinghaus's 1885 finding that memory of new information declines exponentially over time without reinforcement — typically losing 50–80% within a week.",
      keywords: [
        "forgetting curve",
        "Ebbinghaus",
        "memory retention",
        "spaced repetition",
        "learning science",
      ],
      relatedTerms: [
        "spaced-repetition",
        "retrieval-practice",
        "microlearning",
      ],
      relatedPost: "die-vergessenskurve",
    },
    {
      slug: "instructional-design",
      title: "Instructional Design",
      definition:
        "The systematic process of creating effective learning experiences — analyzing learner needs, defining objectives, designing activities, and evaluating outcomes to produce measurable behavior change.",
      keywords: [
        "instructional design",
        "ID",
        "learning design",
        "e-learning design",
        "training design",
      ],
      relatedTerms: ["addie", "action-mapping", "cognitive-load-theory"],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "kirkpatrick-model",
      title: "Kirkpatrick Model",
      definition:
        "A four-level framework for evaluating training effectiveness: Reaction (learner satisfaction), Learning (knowledge gain), Behavior (on-the-job application), and Results (business impact).",
      keywords: [
        "Kirkpatrick model",
        "training evaluation",
        "learning effectiveness",
        "L&D ROI",
        "training assessment",
      ],
      relatedTerms: ["instructional-design", "action-mapping"],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "learning-in-the-flow-of-work",
      title: "Learning in the Flow of Work",
      definition:
        "Josh Bersin's concept that the most effective learning happens embedded in the work itself — short, relevant, and available at the moment of need — rather than in scheduled training events.",
      keywords: [
        "learning in the flow of work",
        "Josh Bersin",
        "just-in-time learning",
        "performance support",
        "workplace learning",
      ],
      relatedTerms: ["microlearning", "70-20-10", "blended-learning"],
      relatedPost: "learning-in-the-flow-of-work",
    },
    {
      slug: "lms",
      title: "Learning Management System (LMS)",
      definition:
        "A software platform for creating, delivering, tracking, and reporting on training programs — used by organizations to manage employee learning at scale.",
      keywords: [
        "LMS",
        "learning management system",
        "e-learning platform",
        "training software",
        "corporate learning",
      ],
      relatedTerms: ["lxp", "scorm", "xapi"],
      relatedPost: "lms-anwendungsfaelle",
    },
    {
      slug: "lxp",
      title: "Learning Experience Platform (LXP)",
      definition:
        "A learner-driven platform that aggregates content from multiple sources and uses AI to surface personalized recommendations — contrasted with an LMS, which is primarily admin-driven and compliance-focused.",
      keywords: [
        "LXP",
        "learning experience platform",
        "LXP vs LMS",
        "personalized learning",
        "content aggregation",
      ],
      relatedTerms: ["lms", "microlearning", "social-learning"],
      relatedPost: "lxp-vs-lms",
    },
    {
      slug: "microlearning",
      title: "Microlearning",
      definition:
        "A training format that delivers focused learning content in short, discrete units — typically 3–10 minutes — designed to match a specific learning objective or performance need.",
      keywords: [
        "microlearning",
        "micro learning",
        "short-form learning",
        "bite-sized learning",
        "e-learning format",
      ],
      relatedTerms: [
        "blended-learning",
        "learning-in-the-flow-of-work",
        "spaced-repetition",
      ],
      relatedPost: "was-ist-microlearning",
    },
    {
      slug: "retrieval-practice",
      title: "Retrieval Practice",
      definition:
        "A learning strategy where recalling information from memory — through testing, quizzing, or free recall — strengthens long-term retention more effectively than re-reading or reviewing notes.",
      keywords: [
        "retrieval practice",
        "testing effect",
        "spaced retrieval",
        "active recall",
        "learning science",
      ],
      relatedTerms: [
        "spaced-repetition",
        "forgetting-curve",
        "desirable-difficulties",
        "interleaving",
      ],
      relatedPost: "make-it-stick-buch",
    },
    {
      slug: "sam",
      title: "Successive Approximation Model (SAM)",
      definition:
        "An agile instructional design process developed by Michael Allen that replaces ADDIE's linear phases with iterative cycles of design, prototype, and review — enabling faster feedback and lower rework costs.",
      keywords: [
        "SAM model",
        "Successive Approximation Model",
        "agile instructional design",
        "Michael Allen",
        "ADDIE alternative",
      ],
      relatedTerms: ["addie", "instructional-design", "action-mapping"],
      relatedPost: "leaving-addie-for-sam",
    },
    {
      slug: "scorm",
      title: "SCORM",
      definition:
        "Sharable Content Object Reference Model — the dominant e-learning technical standard since 2001, defining how courses and LMS platforms communicate completion, score, and progress data.",
      keywords: [
        "SCORM",
        "e-learning standard",
        "SCORM 1.2",
        "SCORM 2004",
        "LMS standard",
      ],
      relatedTerms: ["xapi", "lms"],
      relatedPost: "scorm-vs-xapi",
    },
    {
      slug: "social-learning",
      title: "Social Learning",
      definition:
        "Learning that occurs through observation, interaction, and collaboration with others — based on Albert Bandura's social learning theory and accounting for an estimated 20% of workplace learning.",
      keywords: [
        "social learning",
        "Bandura",
        "peer learning",
        "collaborative learning",
        "informal learning",
      ],
      relatedTerms: ["70-20-10", "blended-learning", "lxp"],
      relatedPost: "soziales-lernen",
    },
    {
      slug: "spaced-repetition",
      title: "Spaced Repetition",
      definition:
        "A learning technique that schedules review of material at increasing intervals over time, exploiting the spacing effect to maximize long-term retention with minimal study time.",
      keywords: [
        "spaced repetition",
        "spacing effect",
        "spaced practice",
        "memory retention",
        "learning science",
      ],
      relatedTerms: [
        "retrieval-practice",
        "forgetting-curve",
        "microlearning",
        "interleaving",
        "desirable-difficulties",
      ],
      relatedPost: "die-vergessenskurve",
    },
    {
      slug: "xapi",
      title: "xAPI (Tin Can API)",
      definition:
        "Experience API — an e-learning standard that tracks any learning activity (mobile, simulation, real-world performance) as structured statements, overcoming SCORM's browser-only, completion-focused limitations.",
      keywords: [
        "xAPI",
        "Tin Can API",
        "Experience API",
        "e-learning standard",
        "learning data",
      ],
      relatedTerms: ["scorm", "lms"],
      relatedPost: "scorm-vs-xapi",
    },
    {
      slug: "andragogy",
      title: "Andragogy",
      definition:
        "Malcolm Knowles' theory of adult learning, based on the premise that adults learn differently from children — being self-directed, experience-rich, problem-oriented, and internally motivated rather than dependent on external direction.",
      keywords: [
        "andragogy",
        "Malcolm Knowles",
        "adult learning theory",
        "self-directed learning",
        "L&D theory",
      ],
      relatedTerms: [
        "instructional-design",
        "learning-theories",
        "kolb-experiential-learning",
      ],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "blooms-taxonomy",
      title: "Bloom's Taxonomy",
      definition:
        "A hierarchical framework for classifying learning objectives by cognitive complexity — from Remember and Understand at the lower end through Apply, Analyze, Evaluate, and Create at the higher end.",
      keywords: [
        "Bloom's taxonomy",
        "learning objectives",
        "cognitive levels",
        "instructional design",
        "Anderson Krathwohl",
      ],
      relatedTerms: [
        "instructional-design",
        "mager-objectives",
        "formative-summative-assessment",
      ],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "gagnes-nine-events",
      title: "Gagné's Nine Events of Instruction",
      definition:
        "Robert Gagné's framework of nine instructional events — from gaining attention to enhancing retention and transfer — each supporting a specific internal cognitive process required for learning.",
      keywords: [
        "Gagné nine events",
        "nine events of instruction",
        "Gagné",
        "instructional design",
        "course design",
      ],
      relatedTerms: [
        "instructional-design",
        "addie",
        "merrills-first-principles",
      ],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "kolb-experiential-learning",
      title: "Kolb's Experiential Learning Cycle",
      definition:
        "David Kolb's four-stage model in which learning proceeds from Concrete Experience through Reflective Observation and Abstract Conceptualization to Active Experimentation — emphasizing that experience, not content delivery, is the source of learning.",
      keywords: [
        "Kolb experiential learning",
        "experiential learning cycle",
        "Kolb model",
        "learning styles",
        "adult learning",
      ],
      relatedTerms: ["andragogy", "learning-theories", "70-20-10"],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "arcs-model",
      title: "ARCS Model",
      definition:
        "John Keller's motivational design framework identifying four conditions for engaging learners: Attention (capturing interest), Relevance (connecting to learner goals), Confidence (enabling belief in success), and Satisfaction (making outcomes feel worthwhile).",
      keywords: [
        "ARCS model",
        "Keller ARCS",
        "motivational design",
        "learner motivation",
        "instructional design",
      ],
      relatedTerms: [
        "instructional-design",
        "learning-theories",
        "scenario-based-learning",
        "self-determination-theory",
      ],
      relatedPost: "accidental-instructional-designer",
    },
    {
      slug: "merrills-first-principles",
      title: "Merrill's First Principles of Instruction",
      definition:
        "M. David Merrill's five evidence-based principles for effective instruction: problem-centred learning, activation of prior knowledge, demonstration of new knowledge, application with feedback, and integration into real-world context.",
      keywords: [
        "Merrill's first principles",
        "first principles of instruction",
        "instructional design",
        "M. David Merrill",
        "learning principles",
      ],
      relatedTerms: ["instructional-design", "addie", "gagnes-nine-events"],
      relatedPost: "accidental-instructional-designer",
    },
    {
      slug: "learning-transfer",
      title: "Learning Transfer",
      definition:
        "The degree to which knowledge or skills acquired in training are applied and maintained on the job — the central challenge in L&D, since training that does not transfer produces no business value regardless of in-course performance.",
      keywords: [
        "learning transfer",
        "transfer of training",
        "Baldwin Ford",
        "behavior change",
        "training effectiveness",
      ],
      relatedTerms: [
        "kirkpatrick-model",
        "action-mapping",
        "70-20-10",
        "near-far-transfer",
      ],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "scenario-based-learning",
      title: "Scenario-Based Learning",
      definition:
        "An instructional strategy that places learners in realistic job situations requiring decisions, using the consequences of those choices — rather than information delivery — as the primary learning mechanism.",
      keywords: [
        "scenario-based learning",
        "SBL",
        "branching scenarios",
        "decision-making training",
        "instructional design",
      ],
      relatedTerms: [
        "instructional-design",
        "action-mapping",
        "merrills-first-principles",
      ],
      relatedPost: "map-it-cathy-moore",
    },
    {
      slug: "mager-objectives",
      title: "Mager's Performance-Based Objectives",
      definition:
        "Robert Mager's framework for writing precise learning objectives with three components: Performance (the observable behavior), Conditions (the circumstances under which it occurs), and Criterion (the standard for acceptable performance).",
      keywords: [
        "Mager objectives",
        "performance-based objectives",
        "learning objectives",
        "Robert Mager",
        "instructional design",
      ],
      relatedTerms: [
        "action-mapping",
        "blooms-taxonomy",
        "instructional-design",
      ],
      relatedPost: "map-it-cathy-moore",
    },
    {
      slug: "formative-summative-assessment",
      title: "Formative vs. Summative Assessment",
      definition:
        "The distinction between assessment during learning (formative — used to guide and redirect) and assessment after learning (summative — used to measure whether objectives were achieved), each serving a different purpose in instructional design.",
      keywords: [
        "formative assessment",
        "summative assessment",
        "learning assessment",
        "knowledge check",
        "quiz design",
      ],
      relatedTerms: [
        "kirkpatrick-model",
        "blooms-taxonomy",
        "retrieval-practice",
      ],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "learning-theories",
      title: "Learning Theories",
      definition:
        "The three foundational frameworks for understanding how learning occurs: Behaviorism (learning as conditioned response to stimuli), Cognitivism (learning as internal information processing), and Constructivism (learning as active knowledge construction from experience).",
      keywords: [
        "learning theories",
        "behaviorism",
        "cognitivism",
        "constructivism",
        "educational psychology",
      ],
      relatedTerms: ["andragogy", "cognitive-load-theory", "social-learning"],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "ltem",
      title: "LTEM",
      definition:
        "Will Thalheimer's Learning-Transfer Evaluation Model — an eight-tier evidence-based alternative to Kirkpatrick that distinguishes between attention, memory, decision-making, task competence, and actual transfer to real work performance.",
      keywords: [
        "LTEM",
        "learning transfer evaluation model",
        "Thalheimer",
        "training evaluation",
        "Kirkpatrick alternative",
      ],
      relatedTerms: [
        "kirkpatrick-model",
        "learning-transfer",
        "action-mapping",
      ],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "productive-failure",
      title: "Productive Failure",
      definition:
        "An instructional design approach where learners attempt to solve a problem before receiving instruction on the underlying concept — the resulting failure activates prior knowledge and prepares learners for a more effective explanation.",
      keywords: [
        "productive failure",
        "problem solving before instruction",
        "PS-I",
        "Kapur",
        "instructional sequencing",
      ],
      relatedTerms: [
        "worked-examples",
        "cognitive-load-theory",
        "guided-discovery-learning",
      ],
      relatedPost: "productive-failure-methode",
    },
    {
      slug: "worked-examples",
      title: "Worked Examples",
      definition:
        "Step-by-step demonstrations of how to solve a problem, shown before learners attempt one themselves — a technique that reduces cognitive load for novices and supports schema acquisition, especially for complex or unfamiliar procedures.",
      keywords: [
        "worked examples",
        "example-based learning",
        "Sweller",
        "cognitive load",
        "subgoal labeling",
      ],
      relatedTerms: [
        "cognitive-load-theory",
        "productive-failure",
        "deliberate-practice",
      ],
      relatedPost: "erst-theorie-oder-erst-uebung",
    },
    {
      slug: "desirable-difficulties",
      title: "Desirable Difficulties",
      definition:
        "Robert Bjork's concept describing learning conditions — such as retrieval practice, spacing, interleaving, or variability — that make learning feel harder in the moment but produce stronger, more durable, and more transferable long-term retention.",
      keywords: [
        "desirable difficulties",
        "Bjork",
        "retrieval practice",
        "interleaving",
        "spacing effect",
      ],
      relatedTerms: ["retrieval-practice", "interleaving", "spaced-repetition"],
      relatedPost: "retrieval-practice-mitarbeiterschulung",
    },
    {
      slug: "interleaving",
      title: "Interleaving",
      definition:
        "A practice strategy that mixes different topics or problem types within a single study session instead of practicing one type in a block — improving learners' ability to discriminate between similar concepts and apply the right approach in new situations.",
      keywords: [
        "interleaving",
        "interleaved practice",
        "blocked vs interleaved",
        "discrimination learning",
        "practice scheduling",
      ],
      relatedTerms: [
        "spaced-repetition",
        "desirable-difficulties",
        "retrieval-practice",
      ],
      relatedPost: "retrieval-practice-mitarbeiterschulung",
    },
    {
      slug: "guided-discovery-learning",
      title: "Guided Discovery Learning",
      definition:
        "An instructional approach where learners explore problems or content with structured support — clear goals, scaffolding, and feedback — balancing unassisted discovery, which research shows often underperforms explicit instruction, against pure direct instruction, which offers no exploration at all.",
      keywords: [
        "guided discovery learning",
        "inquiry-based learning",
        "scaffolding",
        "Alfieri",
        "discovery learning",
      ],
      relatedTerms: [
        "productive-failure",
        "instructional-design",
        "scenario-based-learning",
      ],
      relatedPost: "erst-theorie-oder-erst-uebung",
    },
    {
      slug: "deliberate-practice",
      title: "Deliberate Practice",
      definition:
        "K. Anders Ericsson's concept of highly structured, effortful practice that targets specific weaknesses just beyond a learner's current ability, paired with immediate, expert feedback — distinct from mere repetition or years of unfocused experience.",
      keywords: [
        "deliberate practice",
        "Ericsson",
        "expert performance",
        "skill acquisition",
        "feedback loops",
      ],
      relatedTerms: [
        "worked-examples",
        "formative-summative-assessment",
        "learning-transfer",
      ],
      relatedPost: "erst-theorie-oder-erst-uebung",
    },
    {
      slug: "self-determination-theory",
      title: "Self-Determination Theory (SDT)",
      definition:
        "Edward Deci and Richard Ryan's motivation theory, which identifies three basic psychological needs — autonomy, competence, and relatedness — that must be met for intrinsic motivation to develop and be sustained.",
      keywords: [
        "self-determination theory",
        "SDT",
        "Deci Ryan",
        "intrinsic motivation",
        "autonomy competence relatedness",
      ],
      relatedTerms: ["arcs-model", "com-b-model", "learning-theories"],
      relatedPost: "duolingo-prinzip-mitarbeiterschulung",
    },
    {
      slug: "near-far-transfer",
      title: "Near Transfer vs. Far Transfer",
      definition:
        "A distinction within learning transfer research: near transfer applies learned skills to situations very similar to the training context, while far transfer applies them to substantially different, novel situations — far transfer is harder to achieve and requires deeper conceptual understanding.",
      keywords: [
        "near transfer",
        "far transfer",
        "learning transfer",
        "transfer of training",
        "conceptual understanding",
      ],
      relatedTerms: [
        "learning-transfer",
        "productive-failure",
        "kirkpatrick-model",
      ],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "progressionssteuerung",
      title: "Recognition-to-Production Progression",
      definition:
        "A course design pattern that gradually increases task difficulty from simply recognizing a correct answer to actively recalling and producing knowledge unprompted — matching the sequence in which memory strength actually develops.",
      keywords: [
        "recognition to recall progression",
        "task progression",
        "multiple choice vs free recall",
        "skill progression",
        "course design",
      ],
      relatedTerms: [
        "retrieval-practice",
        "blooms-taxonomy",
        "formative-summative-assessment",
      ],
      relatedPost: "recognition-vs-recall-e-learning",
    },
    {
      slug: "varied-practice",
      title: "Varied Practice",
      definition:
        "Practicing a single concept or skill across multiple different examples and application contexts, so learners extract the underlying principle rather than memorizing one specific instance — improving the ability to transfer that principle to novel situations.",
      keywords: [
        "varied practice",
        "variability in practice",
        "example variability",
        "principle learning",
        "transfer of training",
      ],
      relatedTerms: ["near-far-transfer", "interleaving", "learning-transfer"],
      relatedPost: "erst-theorie-oder-erst-uebung",
    },
  ],
  de: [
    {
      slug: "70-20-10",
      title: "70-20-10-Modell",
      definition:
        "Ein Framework, das beschreibt, wie Lernen am Arbeitsplatz stattfindet: 70 % durch praktische Erfahrung, 20 % durch soziale Interaktion und Feedback, 10 % durch formale Schulungen.",
      keywords: [
        "70-20-10-Modell",
        "informelles Lernen",
        "Erfahrungslernen",
        "L&D Framework",
        "Lernstrategie",
      ],
      relatedTerms: [
        "instructional-design",
        "blended-learning",
        "social-learning",
      ],
      relatedPost: "70-20-10-modell",
    },
    {
      slug: "4c-id-model",
      title: "4C/ID-Modell",
      definition:
        "Four-Component Instructional Design – ein Curriculum-Framework für komplexe Lernumgebungen, das auf Ganzaufgaben-Praxis, unterstützender Information, prozeduraler Anleitung und Teilaufgaben-Training basiert.",
      keywords: [
        "4C/ID-Modell",
        "van Merriënboer",
        "komplexes Lernen",
        "Curriculum-Design",
        "Instructional Design",
      ],
      relatedTerms: ["instructional-design", "addie", "cognitive-load-theory"],
      relatedPost: "ten-steps-complex-learning",
    },
    {
      slug: "action-mapping",
      title: "Action Mapping",
      definition:
        "Eine visuelle Instructional-Design-Methode von Cathy Moore, die mit einem messbaren Geschäftsziel beginnt, benötigte Handlungen identifiziert, Ursachen für Nichthandeln analysiert und gezielte Übungsaktivitäten entwickelt.",
      keywords: [
        "Action Mapping",
        "Cathy Moore",
        "Instructional Design Methode",
        "performanceorientiertes Lernen",
        "Map It",
      ],
      relatedTerms: ["instructional-design", "addie", "sam"],
      relatedPost: "map-it-cathy-moore",
    },
    {
      slug: "addie",
      title: "ADDIE-Modell",
      definition:
        "Ein fünfphasiger Instructional-Design-Prozess: Analyse, Design, Entwicklung, Implementierung und Evaluation – das am weitesten verbreitete Framework für die Entwicklung von Trainings.",
      keywords: [
        "ADDIE-Modell",
        "ADDIE Instructional Design",
        "Trainingsentwicklung",
        "Lerndesign-Prozess",
      ],
      relatedTerms: ["sam", "instructional-design", "action-mapping"],
      relatedPost: "leaving-addie-for-sam",
    },
    {
      slug: "blended-learning",
      title: "Blended Learning",
      definition:
        "Ein Trainingsansatz, der digitales Online-Lernen mit Präsenzlerneinheiten kombiniert – so gestaltet, dass sich beide Formate ergänzen statt nur nebeneinander zu existieren.",
      keywords: [
        "Blended Learning",
        "hybrides Lernen",
        "Online- und Präsenztraining",
        "Lernmix",
        "betriebliche Weiterbildung",
      ],
      relatedTerms: [
        "microlearning",
        "social-learning",
        "learning-in-the-flow-of-work",
      ],
      relatedPost: "blended-learning",
    },
    {
      slug: "cognitive-load-theory",
      title: "Cognitive Load Theory",
      definition:
        "Eine Lerntheorie von John Sweller, die besagt, dass das Arbeitsgedächtnis begrenzte Kapazität hat – und wie Instructional Design überflüssige kognitive Belastung reduzieren kann, um besseres Lernen zu ermöglichen.",
      keywords: [
        "Cognitive Load Theory",
        "kognitive Belastungstheorie",
        "Sweller",
        "Arbeitsgedächtnis",
        "Instructional Design",
      ],
      relatedTerms: [
        "spaced-repetition",
        "retrieval-practice",
        "instructional-design",
        "worked-examples",
        "productive-failure",
      ],
      relatedPost: "elearning-science-of-instruction",
    },
    {
      slug: "com-b-model",
      title: "COM-B-Modell",
      definition:
        "Ein Verhaltensänderungs-Framework, das drei Bedingungen für Verhalten identifiziert: Capability (Fähigkeit), Opportunity (Gelegenheit) und Motivation – alle drei müssen vorhanden sein, damit Verhalten entsteht.",
      keywords: [
        "COM-B-Modell",
        "Verhaltensänderung",
        "Capability Opportunity Motivation",
        "Verhaltensdesign",
      ],
      relatedTerms: ["instructional-design", "action-mapping"],
      relatedPost: "talk-to-the-elephant",
    },
    {
      slug: "forgetting-curve",
      title: "Vergessenskurve",
      definition:
        "Hermann Ebbinghaus' Befund von 1885, dass neue Informationen ohne Wiederholung exponentiell vergessen werden – typischerweise gehen innerhalb einer Woche 50–80 % verloren.",
      keywords: [
        "Vergessenskurve",
        "Ebbinghaus",
        "Wissensretention",
        "Gedächtnis",
        "Lernwissenschaft",
      ],
      relatedTerms: [
        "spaced-repetition",
        "retrieval-practice",
        "microlearning",
      ],
      relatedPost: "die-vergessenskurve",
    },
    {
      slug: "instructional-design",
      title: "Instructional Design",
      definition:
        "Der systematische Prozess der Entwicklung wirksamer Lernumgebungen – von der Bedarfsanalyse über die Zieldefinition und Aktivitätsgestaltung bis zur Evaluation messbarer Verhaltensänderungen.",
      keywords: [
        "Instructional Design",
        "Lerndesign",
        "E-Learning-Gestaltung",
        "Trainingsdesign",
      ],
      relatedTerms: ["addie", "action-mapping", "cognitive-load-theory"],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "kirkpatrick-model",
      title: "Kirkpatrick-Modell",
      definition:
        "Ein vierstufiges Framework zur Bewertung von Trainingswirksamkeit: Reaktion (Zufriedenheit), Lernen (Wissenszuwachs), Verhalten (Anwendung am Arbeitsplatz) und Ergebnisse (Geschäftswirkung).",
      keywords: [
        "Kirkpatrick-Modell",
        "Trainingsevaluation",
        "Lerneffektivität",
        "L&D ROI",
        "Schulungsbewertung",
      ],
      relatedTerms: ["instructional-design", "action-mapping"],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "learning-in-the-flow-of-work",
      title: "Lernen im Arbeitsfluss",
      definition:
        "Josh Bersins Konzept, dass effektives Lernen in den Arbeitsablauf eingebettet stattfindet – kurz, relevant und zum Zeitpunkt des Bedarfs abrufbar – statt in geplanten Schulungsveranstaltungen.",
      keywords: [
        "Lernen im Arbeitsfluss",
        "Josh Bersin",
        "Just-in-time-Lernen",
        "Performance Support",
        "Arbeitsplatzlernen",
      ],
      relatedTerms: ["microlearning", "70-20-10", "blended-learning"],
      relatedPost: "learning-in-the-flow-of-work",
    },
    {
      slug: "lms",
      title: "Lernmanagementsystem (LMS)",
      definition:
        "Eine Softwareplattform zum Erstellen, Bereitstellen, Verfolgen und Auswerten von Schulungsprogrammen – eingesetzt von Unternehmen, um Mitarbeiterlernen in großem Maßstab zu verwalten.",
      keywords: [
        "LMS",
        "Lernmanagementsystem",
        "E-Learning-Plattform",
        "Schulungssoftware",
        "betriebliches Lernen",
      ],
      relatedTerms: ["lxp", "scorm", "xapi"],
      relatedPost: "lms-anwendungsfaelle",
    },
    {
      slug: "lxp",
      title: "Learning Experience Platform (LXP)",
      definition:
        "Eine lernerzentrierte Plattform, die Inhalte aus verschiedenen Quellen aggregiert und KI nutzt, um personalisierte Empfehlungen zu liefern – im Gegensatz zum LMS, das primär admin-gesteuert und compliance-orientiert ist.",
      keywords: [
        "LXP",
        "Learning Experience Platform",
        "LXP vs LMS",
        "personalisiertes Lernen",
        "Content-Aggregation",
      ],
      relatedTerms: ["lms", "microlearning", "social-learning"],
      relatedPost: "lxp-vs-lms",
    },
    {
      slug: "microlearning",
      title: "Microlearning",
      definition:
        "Ein Lernformat, das fokussierte Lerninhalte in kurzen, abgeschlossenen Einheiten – typischerweise 3–10 Minuten – bereitstellt, die auf ein spezifisches Lernziel oder einen Performancebedarf ausgerichtet sind.",
      keywords: [
        "Microlearning",
        "Mikro-Lernen",
        "Kurzformat-Lernen",
        "E-Learning-Format",
        "Lerneinheiten",
      ],
      relatedTerms: [
        "blended-learning",
        "learning-in-the-flow-of-work",
        "spaced-repetition",
      ],
      relatedPost: "was-ist-microlearning",
    },
    {
      slug: "retrieval-practice",
      title: "Retrieval Practice",
      definition:
        "Eine Lernstrategie, bei der das aktive Abrufen von Informationen aus dem Gedächtnis – durch Tests, Quiz oder freies Erinnern – die Langzeitretention stärker verbessert als erneutes Lesen oder Wiederholen.",
      keywords: [
        "Retrieval Practice",
        "Testeffekt",
        "Active Recall",
        "Abrufübung",
        "Lernwissenschaft",
      ],
      relatedTerms: [
        "spaced-repetition",
        "forgetting-curve",
        "desirable-difficulties",
        "interleaving",
      ],
      relatedPost: "make-it-stick-buch",
    },
    {
      slug: "sam",
      title: "Successive Approximation Model (SAM)",
      definition:
        "Ein agiles Instructional-Design-Prozessmodell von Michael Allen, das ADDIEs lineare Phasen durch iterative Zyklen aus Design, Prototyp und Review ersetzt – für schnelleres Feedback und geringere Nacharbeitskosten.",
      keywords: [
        "SAM-Modell",
        "Successive Approximation Model",
        "agiles Instructional Design",
        "Michael Allen",
        "ADDIE Alternative",
      ],
      relatedTerms: ["addie", "instructional-design", "action-mapping"],
      relatedPost: "leaving-addie-for-sam",
    },
    {
      slug: "scorm",
      title: "SCORM",
      definition:
        "Sharable Content Object Reference Model – der dominierende E-Learning-Standard seit 2001, der definiert, wie Kurse und LMS-Plattformen Abschluss-, Bewertungs- und Fortschrittsdaten austauschen.",
      keywords: [
        "SCORM",
        "E-Learning-Standard",
        "SCORM 1.2",
        "SCORM 2004",
        "LMS-Standard",
      ],
      relatedTerms: ["xapi", "lms"],
      relatedPost: "scorm-vs-xapi",
    },
    {
      slug: "social-learning",
      title: "Soziales Lernen",
      definition:
        "Lernen, das durch Beobachtung, Interaktion und Zusammenarbeit mit anderen stattfindet – basierend auf Albert Banduras Theorie und verantwortlich für schätzungsweise 20 % des Lernens am Arbeitsplatz.",
      keywords: [
        "soziales Lernen",
        "Bandura",
        "Peer Learning",
        "kollaboratives Lernen",
        "informelles Lernen",
      ],
      relatedTerms: ["70-20-10", "blended-learning", "lxp"],
      relatedPost: "soziales-lernen",
    },
    {
      slug: "spaced-repetition",
      title: "Spaced Repetition",
      definition:
        "Eine Lerntechnik, bei der Lernmaterial in zunehmenden Zeitabständen wiederholt wird, um durch den Spacing-Effekt die Langzeitretention bei minimalem Aufwand zu maximieren.",
      keywords: [
        "Spaced Repetition",
        "Spacing-Effekt",
        "verteiltes Lernen",
        "Wissensretention",
        "Lernwissenschaft",
      ],
      relatedTerms: [
        "retrieval-practice",
        "forgetting-curve",
        "microlearning",
        "interleaving",
        "desirable-difficulties",
      ],
      relatedPost: "die-vergessenskurve",
    },
    {
      slug: "xapi",
      title: "xAPI (Tin Can API)",
      definition:
        "Experience API – ein E-Learning-Standard, der beliebige Lernaktivitäten (mobil, Simulation, reale Performance) als strukturierte Aussagen erfasst und SCORMs Browser-gebundene, abschlussorientierte Einschränkungen überwindet.",
      keywords: [
        "xAPI",
        "Tin Can API",
        "Experience API",
        "E-Learning-Standard",
        "Lerndaten",
      ],
      relatedTerms: ["scorm", "lms"],
      relatedPost: "scorm-vs-xapi",
    },
    {
      slug: "andragogy",
      title: "Andragogik",
      definition:
        "Malcolm Knowles' Theorie des Erwachsenenlernens, die davon ausgeht, dass Erwachsene anders lernen als Kinder – selbstgesteuert, erfahrungsbasiert, problemorientiert und intrinsisch motiviert statt fremdgeleitet.",
      keywords: [
        "Andragogik",
        "Malcolm Knowles",
        "Erwachsenenlernen",
        "selbstgesteuertes Lernen",
        "L&D-Theorie",
      ],
      relatedTerms: [
        "instructional-design",
        "learning-theories",
        "kolb-experiential-learning",
      ],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "blooms-taxonomy",
      title: "Bloom'sche Taxonomie",
      definition:
        "Ein hierarchisches Framework zur Klassifizierung von Lernzielen nach kognitiver Komplexität – von Erinnern und Verstehen auf der unteren Ebene über Anwenden, Analysieren, Bewerten bis hin zu Erschaffen auf der oberen Ebene.",
      keywords: [
        "Bloom'sche Taxonomie",
        "Bloomsche Taxonomie",
        "Lernziele",
        "kognitive Niveaus",
        "Anderson Krathwohl",
      ],
      relatedTerms: [
        "instructional-design",
        "mager-objectives",
        "formative-summative-assessment",
      ],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "gagnes-nine-events",
      title: "Gagné's Neun Unterrichtsereignisse",
      definition:
        "Robert Gagnés Framework aus neun Unterrichtsereignissen – vom Gewinnen der Aufmerksamkeit bis zur Förderung von Retention und Transfer – die jeweils einen bestimmten kognitiven Lernprozess unterstützen.",
      keywords: [
        "Gagné Neun Ereignisse",
        "Unterrichtsereignisse",
        "Gagné",
        "Instructional Design",
        "Kursgestaltung",
      ],
      relatedTerms: [
        "instructional-design",
        "addie",
        "merrills-first-principles",
      ],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "kolb-experiential-learning",
      title: "Kolbs Experiential Learning Cycle",
      definition:
        "David Kolbs vierstufiges Modell, bei dem Lernen von konkreter Erfahrung über reflektierendes Beobachten und abstraktes Konzeptualisieren zur aktiven Experimentation führt – mit der These, dass Erfahrung, nicht Inhaltsvermittlung, die Quelle des Lernens ist.",
      keywords: [
        "Kolb Erfahrungslernen",
        "Experiential Learning Cycle",
        "Kolb-Modell",
        "Lernstile",
        "Erwachsenenlernen",
      ],
      relatedTerms: ["andragogy", "learning-theories", "70-20-10"],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "arcs-model",
      title: "ARCS-Modell",
      definition:
        "John Kellers motivationsbasiertes Design-Framework mit vier Bedingungen für lernende Engagement: Attention (Aufmerksamkeit wecken), Relevance (Verbindung zu Lernzielen), Confidence (Erfolgszuversicht fördern) und Satisfaction (Ergebnisse als lohnenswert erleben).",
      keywords: [
        "ARCS-Modell",
        "Keller ARCS",
        "Motivationsdesign",
        "Lernmotivation",
        "Instructional Design",
      ],
      relatedTerms: [
        "instructional-design",
        "learning-theories",
        "scenario-based-learning",
        "self-determination-theory",
      ],
      relatedPost: "accidental-instructional-designer",
    },
    {
      slug: "merrills-first-principles",
      title: "Merrills First Principles of Instruction",
      definition:
        "M. David Merrills fünf evidenzbasierte Prinzipien für wirksamen Unterricht: problemzentriertes Lernen, Aktivierung von Vorwissen, Demonstration neuen Wissens, Anwendung mit Feedback und Integration in den realen Kontext.",
      keywords: [
        "Merrills First Principles",
        "First Principles of Instruction",
        "Instructional Design",
        "M. David Merrill",
        "Lernprinzipien",
      ],
      relatedTerms: ["instructional-design", "addie", "gagnes-nine-events"],
      relatedPost: "accidental-instructional-designer",
    },
    {
      slug: "learning-transfer",
      title: "Lerntransfer",
      definition:
        "Das Ausmaß, in dem im Training erworbenes Wissen oder Fähigkeiten tatsächlich am Arbeitsplatz angewendet und aufrechterhalten werden – die zentrale Herausforderung in L&D, da Training ohne Transfer keinen Geschäftswert erzeugt.",
      keywords: [
        "Lerntransfer",
        "Transfer of Training",
        "Baldwin Ford",
        "Verhaltensänderung",
        "Trainingseffektivität",
      ],
      relatedTerms: [
        "kirkpatrick-model",
        "action-mapping",
        "70-20-10",
        "near-far-transfer",
      ],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "scenario-based-learning",
      title: "Szenariobasiertes Lernen",
      definition:
        "Eine Lernstrategie, bei der Lernende in realistische Arbeitssituationen versetzt werden, die Entscheidungen erfordern – wobei die Konsequenzen dieser Entscheidungen, nicht die Inhaltsvermittlung, den zentralen Lernmechanismus bilden.",
      keywords: [
        "szenariobasiertes Lernen",
        "Branching Scenarios",
        "Entscheidungstraining",
        "Instructional Design",
        "Fallbasiertes Lernen",
      ],
      relatedTerms: [
        "instructional-design",
        "action-mapping",
        "merrills-first-principles",
      ],
      relatedPost: "map-it-cathy-moore",
    },
    {
      slug: "mager-objectives",
      title: "Magers Performance-Based Objectives",
      definition:
        "Robert Magers Framework für präzise Lernzielformulierung mit drei Komponenten: Performance (das beobachtbare Verhalten), Conditions (die Umstände, unter denen es auftritt) und Criterion (der Standard für akzeptable Leistung).",
      keywords: [
        "Mager Lernziele",
        "Performance-Based Objectives",
        "Lernzielformulierung",
        "Robert Mager",
        "Instructional Design",
      ],
      relatedTerms: [
        "action-mapping",
        "blooms-taxonomy",
        "instructional-design",
      ],
      relatedPost: "map-it-cathy-moore",
    },
    {
      slug: "formative-summative-assessment",
      title: "Formative vs. summative Lernzielkontrolle",
      definition:
        "Der Unterschied zwischen Lernkontrolle während des Lernens (formativ – zur Steuerung und Korrektur) und nach dem Lernen (summativ – zur Messung der Zielerreichung): beide erfüllen unterschiedliche Funktionen im Instructional Design.",
      keywords: [
        "formative Beurteilung",
        "summative Beurteilung",
        "Lernkontrolle",
        "Wissenscheck",
        "Quizgestaltung",
      ],
      relatedTerms: [
        "kirkpatrick-model",
        "blooms-taxonomy",
        "retrieval-practice",
      ],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "learning-theories",
      title: "Lerntheorien",
      definition:
        "Die drei grundlegenden Frameworks zum Verständnis, wie Lernen stattfindet: Behaviorismus (Lernen als konditionierte Reaktion), Kognitivismus (Lernen als interne Informationsverarbeitung) und Konstruktivismus (Lernen als aktiver Wissensaufbau aus Erfahrung).",
      keywords: [
        "Lerntheorien",
        "Behaviorismus",
        "Kognitivismus",
        "Konstruktivismus",
        "Lernpsychologie",
      ],
      relatedTerms: ["andragogy", "cognitive-load-theory", "social-learning"],
      relatedPost: "didaktische-grundlagen",
    },
    {
      slug: "ltem",
      title: "LTEM",
      definition:
        "Will Thalheimers Learning-Transfer Evaluation Model – ein achtstufiges, evidenzbasiertes Alternativmodell zum Kirkpatrick-Modell, das zwischen Aufmerksamkeit, Gedächtnis, Entscheidungsfähigkeit, Aufgabenkompetenz und tatsächlichem Transfer in die Arbeitspraxis unterscheidet.",
      keywords: [
        "LTEM",
        "Learning-Transfer Evaluation Model",
        "Thalheimer",
        "Trainingsevaluation",
        "Kirkpatrick-Alternative",
      ],
      relatedTerms: [
        "kirkpatrick-model",
        "learning-transfer",
        "action-mapping",
      ],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "productive-failure",
      title: "Productive Failure",
      definition:
        "Ein Instructional-Design-Ansatz, bei dem Lernende ein Problem bearbeiten, bevor sie die zugehörige Erklärung erhalten – das dabei entstehende Scheitern aktiviert Vorwissen und bereitet auf eine wirksamere anschließende Erklärung vor.",
      keywords: [
        "Productive Failure",
        "Problemlösen vor Instruktion",
        "PS-I",
        "Kapur",
        "Instruktionssequenzierung",
      ],
      relatedTerms: [
        "worked-examples",
        "cognitive-load-theory",
        "guided-discovery-learning",
      ],
      relatedPost: "productive-failure-methode",
    },
    {
      slug: "worked-examples",
      title: "Worked Examples",
      definition:
        "Schritt-für-Schritt-Demonstrationen einer Problemlösung, die Lernenden gezeigt werden, bevor sie selbst ein Problem bearbeiten – reduziert die kognitive Last bei Novizen und unterstützt den Aufbau mentaler Schemata, besonders bei komplexen oder neuen Verfahren.",
      keywords: [
        "Worked Examples",
        "ausgearbeitete Beispiele",
        "Sweller",
        "kognitive Belastung",
        "Subgoal Labeling",
      ],
      relatedTerms: [
        "cognitive-load-theory",
        "productive-failure",
        "deliberate-practice",
      ],
      relatedPost: "erst-theorie-oder-erst-uebung",
    },
    {
      slug: "desirable-difficulties",
      title: "Desirable Difficulties",
      definition:
        "Robert Bjorks Konzept für Lernbedingungen – etwa Abrufübungen, Spacing, Interleaving oder Variabilität –, die das Lernen im Moment schwerer erscheinen lassen, aber zu stabilerem, dauerhafterem und besser übertragbarem Wissen führen.",
      keywords: [
        "Desirable Difficulties",
        "wünschenswerte Erschwernisse",
        "Bjork",
        "Retrieval Practice",
        "Spacing-Effekt",
      ],
      relatedTerms: ["retrieval-practice", "interleaving", "spaced-repetition"],
      relatedPost: "retrieval-practice-mitarbeiterschulung",
    },
    {
      slug: "interleaving",
      title: "Interleaving",
      definition:
        "Eine Übungsstrategie, bei der unterschiedliche Themen oder Aufgabentypen innerhalb einer Lerneinheit gemischt statt blockweise geübt werden – verbessert die Fähigkeit, ähnliche Konzepte zu unterscheiden und die richtige Vorgehensweise in neuen Situationen anzuwenden.",
      keywords: [
        "Interleaving",
        "verschachteltes Üben",
        "geblocktes vs. verschachteltes Üben",
        "Unterscheidungslernen",
        "Übungsplanung",
      ],
      relatedTerms: [
        "spaced-repetition",
        "desirable-difficulties",
        "retrieval-practice",
      ],
      relatedPost: "retrieval-practice-mitarbeiterschulung",
    },
    {
      slug: "guided-discovery-learning",
      title: "Geleitetes Entdeckendes Lernen",
      definition:
        "Ein Instruktionsansatz, bei dem Lernende Probleme oder Inhalte mit strukturierter Unterstützung erkunden – klare Ziele, Scaffolding, Feedback – als Mittelweg zwischen ungestützter Entdeckung, die in Studien oft schlechter abschneidet als klare Instruktion, und reiner Frontalinstruktion ohne jede Exploration.",
      keywords: [
        "geleitetes entdeckendes Lernen",
        "Inquiry-Based Learning",
        "Scaffolding",
        "Alfieri",
        "entdeckendes Lernen",
      ],
      relatedTerms: [
        "productive-failure",
        "instructional-design",
        "scenario-based-learning",
      ],
      relatedPost: "erst-theorie-oder-erst-uebung",
    },
    {
      slug: "deliberate-practice",
      title: "Deliberate Practice",
      definition:
        "K. Anders Ericssons Konzept hochstrukturierter, anstrengender Übung, die gezielt auf spezifische Schwächen knapp oberhalb des aktuellen Fähigkeitsniveaus zielt und mit unmittelbarem Expertenfeedback kombiniert wird – im Unterschied zu bloßer Wiederholung oder jahrelanger unfokussierter Erfahrung.",
      keywords: [
        "Deliberate Practice",
        "gezielte Übung",
        "Ericsson",
        "Expertenleistung",
        "Kompetenzerwerb",
      ],
      relatedTerms: [
        "worked-examples",
        "formative-summative-assessment",
        "learning-transfer",
      ],
      relatedPost: "erst-theorie-oder-erst-uebung",
    },
    {
      slug: "self-determination-theory",
      title: "Selbstbestimmungstheorie (SDT)",
      definition:
        "Edward Decis und Richard Ryans Motivationstheorie, die drei psychologische Grundbedürfnisse benennt – Autonomie, Kompetenzerleben und soziale Eingebundenheit –, die erfüllt sein müssen, damit intrinsische Motivation entsteht und bestehen bleibt.",
      keywords: [
        "Selbstbestimmungstheorie",
        "SDT",
        "Deci Ryan",
        "intrinsische Motivation",
        "Autonomie Kompetenz Eingebundenheit",
      ],
      relatedTerms: ["arcs-model", "com-b-model", "learning-theories"],
      relatedPost: "duolingo-prinzip-mitarbeiterschulung",
    },
    {
      slug: "near-far-transfer",
      title: "Naher vs. Weiter Transfer",
      definition:
        "Eine Unterscheidung innerhalb der Lerntransfer-Forschung: naher Transfer überträgt Gelerntes auf Situationen, die dem Trainingskontext sehr ähnlich sind, weiter Transfer überträgt es auf deutlich andere, neuartige Situationen – weiter Transfer ist schwerer zu erreichen und erfordert tieferes konzeptuelles Verständnis.",
      keywords: [
        "naher Transfer",
        "weiter Transfer",
        "Lerntransfer",
        "Transfer of Training",
        "konzeptuelles Verständnis",
      ],
      relatedTerms: [
        "learning-transfer",
        "productive-failure",
        "kirkpatrick-model",
      ],
      relatedPost: "lernerfolg-messen",
    },
    {
      slug: "progressionssteuerung",
      title: "Progressionssteuerung",
      definition:
        "Progressionssteuerung bedeutet, Lernaufgaben schrittweise vom bloßen Erkennen einer richtigen Antwort hin zum selbstständigen Abrufen und Produzieren des Wissens zu steigern.",
      keywords: [
        "Progressionssteuerung",
        "Recognition to Recall",
        "Aufgabenprogression",
        "Multiple Choice vs. freie Antwort",
        "Kursdesign",
      ],
      relatedTerms: [
        "retrieval-practice",
        "blooms-taxonomy",
        "formative-summative-assessment",
      ],
      relatedPost: "recognition-vs-recall-e-learning",
    },
    {
      slug: "varied-practice",
      title: "Varied Practice",
      definition:
        "Varied Practice bezeichnet das Üben eines Lerninhalts anhand unterschiedlicher Beispiele und Anwendungssituationen, damit das zugrunde liegende Prinzip erkannt und auf neue Kontexte übertragen werden kann.",
      keywords: [
        "Varied Practice",
        "variables Üben",
        "Beispielvielfalt",
        "Prinzipienlernen",
        "Transferförderung",
      ],
      relatedTerms: ["near-far-transfer", "interleaving", "learning-transfer"],
      relatedPost: "erst-theorie-oder-erst-uebung",
    },
  ],
} satisfies Record<Locale, GlossaryTerm[]>;
