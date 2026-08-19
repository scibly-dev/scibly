import type { GroundTruthCourse, GroundTruthDemoMeta } from "./types";

export const CYBER_SAFETY_COURSE_ID = "course_cyber_safety_at_work" as const;

export const CYBER_SAFETY_IMAGE_URL =
  "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80";

export function courseEntityIds(course: GroundTruthCourse) {
  const courseId = `course_${course.key}`;
  return {
    courseId,
    lessonId: (lessonKey: string) => `lesson_${course.key}_${lessonKey}`,
    sceneId: (lessonKey: string, sceneKey: string) =>
      `scene_${course.key}_${lessonKey}_${sceneKey}`,
  };
}

export const cyberSafetyCourse: GroundTruthCourse = {
  key: "cyber_safety_at_work",
  title: "Cyber safety at work",
  description:
    "A short, plain-language course for office teams: spot phishing, pause before you click, and protect your work login.",
  category: "Compliance",
  tags: ["security", "phishing", "onboarding", "beginner"],
  thumbnail: CYBER_SAFETY_IMAGE_URL,
  lessons: [
    {
      key: "spot_emails",
      title: "Spot suspicious emails",
      description:
        "Learn the common phishing red flags and what to do before you click.",
      order: 0,
      estimatedTimeToCompleteMinutes: 7,
      scenes: [
        {
          key: "urgent_email",
          title: "An urgent email arrives",
          order: 0,
          html: `<div>
  <div data-type="custom-guide-character" data-character="buddy" data-layout="left">
    <p>📧 An email just landed. Read it once, then we decide together. 👀</p>
  </div>
  <blockquote>
    <p><strong>Subject:</strong> Your mailbox is full</p>
    <p>Confirm your password <em>now</em> or it will be locked within one hour.</p>
  </blockquote>
  <p>Sounds urgent, right? That rush feeling is often the trap.</p>
</div>`,
        },
        {
          key: "pause_before_click",
          title: "Pause before you click",
          order: 1,
          html: `<div>
  <div data-type="columns" class="layout-two-column">
    <div data-type="column" data-position="left">
      <div style="display: flex; justify-content: center; align-items: center; max-width: 100%; position: relative; padding: 0.5rem 0;">
        <img src="${CYBER_SAFETY_IMAGE_URL}" alt="Padlock illustrating everyday account safety at work" style="border-radius: 0.75rem; max-width: 100%; max-height: 100%; width: 800px; height: 450px;" />
      </div>
    </div>
    <div data-type="column" data-position="right">
      <p>🔒 Before you click, check:</p>
      <ul>
        <li>Is the sender address a little <em>off</em>?</li>
        <li>Does it push you to act in minutes?</li>
        <li>Did you expect this message at all?</li>
      </ul>
      <p><custom-inline-hint content="Pause first. Urgency is often the trap." isrevealed="false" learnerrevealed="false"></custom-inline-hint></p>
    </div>
  </div>
</div>`,
        },
        {
          key: "what_is_phishing",
          title: "What is phishing?",
          order: 2,
          html: `<div>
  <div data-type="custom-guide-character" data-character="buddy" data-layout="top">
    <p>Quick flip card. Think of that urgent mailbox email. 🧠</p>
  </div>
  <div data-type="flashcard" data-theme="blue">
    <div data-type="flashcard-face" data-position="front"><p>What do we call a <strong>fake message</strong> that tries to steal a password or push a risky link?</p></div>
    <div data-type="flashcard-face" data-position="back"><p>🎣 <strong>Phishing</strong>: a fake message meant to trick you into sharing a login or opening a bad link.</p></div>
  </div>
</div>`,
        },
        {
          key: "what_first",
          title: "What do you do first?",
          order: 3,
          html: `<div>
  <p>You get an email that <em>looks</em> like it is from IT. It says your account will be closed in one hour unless you click a link and sign in.</p>
  <p>✅ What do you do <strong>first</strong>?</p>
  <div data-type="custom-multiple-choice" questionblock-data='{"optional":false,"questionData":{"choices":[{"id":"c1","text":"Click the link quickly so your account stays open"},{"id":"c2","text":"Contact IT using a known phone number or ticket system"},{"id":"c3","text":"Reply with your password so they can fix it"},{"id":"c4","text":"Forward the email to a teammate and ask them to try first"}],"correctChoiceIds":["c2"],"allowMultiple":false},"sp":15}'></div>
</div>`,
        },
        {
          key: "name_the_threat",
          title: "Name the threat",
          order: 4,
          html: `<div>
  <div data-type="custom-guide-character" data-character="buddy" data-layout="right">
    <p>Type the everyday name for that trick. Spelling can be lowercase. ✍️</p>
  </div>
  <p>A colleague forwards you a rushed message that asks people to confirm their work password on a strange website.</p>
  <ul>
    <li>It creates fear of losing access</li>
    <li>It wants a secret login detail</li>
    <li>It does not come from a channel you already trust</li>
  </ul>
  <p>The everyday name for this kind of fake, urgent message is <span data-type="custom-input-field" questionblock-data='{"optional":false,"questionData":{"answer":"phishing","caseSensitive":false},"sp":10}'></span>.</p>
</div>`,
        },
        {
          key: "match_warnings",
          title: "Match the warning signs",
          order: 5,
          html: `<div>
  <p>🔗 Match each <strong>warning sign</strong> to what it usually means in a work inbox.</p>
  <div data-type="custom-matching-pairs" questionblock-data='{"optional":false,"questionData":{"pairs":[{"pairId":"p1","leftItemId":"l1","rightItemId":"r1"},{"pairId":"p2","leftItemId":"l2","rightItemId":"r2"},{"pairId":"p3","leftItemId":"l3","rightItemId":"r3"}],"rightColumnOrder":["r2","r3","r1"]},"sp":15}'>
    <div data-type="matching-pair" data-pair-id="p1">
      <div data-type="matching-pair-side" data-side="left" data-item-id="l1"><p>Odd sender address</p></div>
      <div data-type="matching-pair-side" data-side="right" data-item-id="r1"><p>May not be the real IT or HR team</p></div>
    </div>
    <div data-type="matching-pair" data-pair-id="p2">
      <div data-type="matching-pair-side" data-side="left" data-item-id="l2"><p>Act in the next 10 minutes</p></div>
      <div data-type="matching-pair-side" data-side="right" data-item-id="r2"><p>Urgency used to stop you from checking</p></div>
    </div>
    <div data-type="matching-pair" data-pair-id="p3">
      <div data-type="matching-pair-side" data-side="left" data-item-id="l3"><p>Unexpected attachment</p></div>
      <div data-type="matching-pair-side" data-side="right" data-item-id="r3"><p>File you did not ask for and should not open</p></div>
    </div>
  </div>
</div>`,
        },
      ],
    },
    {
      key: "protect_login",
      title: "Protect your login",
      description:
        "Practice keeping passwords private and knowing when to ask IT for help.",
      order: 1,
      estimatedTimeToCompleteMinutes: 5,
      scenes: [
        {
          key: "keep_login_safe",
          title: "Keep your login safe",
          order: 0,
          html: `<div>
  <div data-type="custom-guide-character" data-character="buddy" data-layout="inline">
    <p>Nice spotting. 🙌 Next up: keep your login safe and know when to call for help.</p>
  </div>
  <blockquote>
    <p>IT will never ask you to send your work password by email or chat.</p>
  </blockquote>
  <p>Ready for a quick practice round?</p>
</div>`,
        },
        {
          key: "never_share_password",
          title: "Never share your password",
          order: 1,
          html: `<div>
  <p>🔐 Finish the sentence using the word bank. Both gaps matter.</p>
  <div data-type="custom-cloze-text" questionblock-data='{"optional":false,"questionData":{"segments":[{"type":"text","id":"s1","content":"If someone asks for your work password by email, you should "},{"type":"gap","id":"g1","correctItemId":"i1"},{"type":"text","id":"s2","content":" and then "},{"type":"gap","id":"g2","correctItemId":"i4"},{"type":"text","id":"s3","content":" using a phone number or ticket system you already trust."}],"items":[{"id":"i1","label":"refuse"},{"id":"i2","label":"send it"},{"id":"i3","label":"share it with your manager"},{"id":"i4","label":"report it"},{"id":"i5","label":"ignore the whole company"}]},"sp":15}'></div>
</div>`,
        },
        {
          key: "sort_situations",
          title: "Sort the situations",
          order: 2,
          html: `<div>
  <p>🗂️ Sort each inbox situation into the right response.</p>
  <ol>
    <li>Read the situation</li>
    <li>Drop it into the best action</li>
  </ol>
  <div data-type="custom-drag-and-drop" questionblock-data='{"optional":false,"questionData":{"items":[{"id":"item-1","label":"Email says reset your password in 15 minutes via a new link"},{"id":"item-2","label":"Random message offers a free phone if you open an attachment"},{"id":"item-3","label":"Your manager sends a calendar invite you already discussed"},{"id":"item-4","label":"Invoice from an unknown vendor asks you to log in and pay today"}],"zones":[{"id":"zone-1","label":"Report to IT"},{"id":"zone-2","label":"Delete or ignore"},{"id":"zone-3","label":"Safe to open"}],"correctMappings":{"item-1":"zone-1","item-2":"zone-2","item-3":"zone-3","item-4":"zone-1"}},"sp":15}'></div>
</div>`,
        },
        {
          key: "when_to_ask_it",
          title: "When to ask IT",
          order: 3,
          html: `<div>
  <div data-type="custom-guide-character" data-character="buddy" data-layout="top">
    <p>Last beat. Write in your own words, then name the team that can help. 💬</p>
  </div>
  <blockquote>
    <p>When a message feels rushed, unexpected, or asks for a secret, pause.</p>
  </blockquote>
  <p>In two or three sentences, when would you pause and ask for help before clicking a link?</p>
  <div data-type="custom-free-form-input" questionblock-data='{"optional":false,"questionData":{"minLength":40,"maxLength":280},"sp":10}'></div>
  <p>Which team should you contact through a channel you already trust? <span data-type="custom-input-field" questionblock-data='{"optional":false,"questionData":{"answer":"IT","caseSensitive":false},"sp":10}'></span></p>
</div>`,
        },
      ],
    },
  ],
};

export const cyberSafetyDemoMeta: GroundTruthDemoMeta = {
  notebookTitle: "Cyber safety at work",
  sources: [
    {
      key: "handbook",
      name: "Employee IT security handbook.pdf",
      type: "PDF",
      fileSize: 312_000,
      pageCount: 18,
    },
    {
      key: "hr_briefing",
      name: "Phishing red flags - HR briefing",
      type: "TEXT",
    },
  ],
  promptOptions: [
    {
      label: "Build a security course",
      prompt:
        "Create a short, non-technical course from my sources about spotting phishing and protecting work logins. Use interactive practice throughout.",
    },
    {
      label: "Explain with a visual",
      prompt:
        "Turn the handbook into a visual lesson about pausing before you click suspicious links.",
    },
    {
      label: "Quiz the team",
      prompt:
        "Draft a practice lesson with cloze and sorting checkpoints for everyday cyber safety.",
    },
  ],
  image: {
    key: "padlock",
    url: CYBER_SAFETY_IMAGE_URL,
    prompt:
      "Simple padlock on a clean desk, soft daylight, calm workplace security illustration",
    alt: "Padlock illustrating everyday account safety at work",
    aspectRatio: "16:9",
    width: 800,
    height: 450,
    byteSize: 120_000,
  },
  searchExcerpt: {
    query: "phishing email urgency password request report to IT",
    results: [
      {
        sourceKey: "handbook",
        excerpt:
          "Never share your work password by email or chat. IT will never ask you to send it. Report suspicious messages through the known IT channel.",
      },
      {
        sourceKey: "hr_briefing",
        excerpt:
          "Common red flags: unexpected urgency, odd sender addresses, and links that ask you to sign in again. Pause and verify before you click.",
      },
    ],
  },
};
