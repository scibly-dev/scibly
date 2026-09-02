# Course authoring

Where a course is assembled and made takeable. An author edits one draft; each
publish freezes a copy of it, and nothing frozen is ever edited again.

## Language

### The shape of a course

**Course**:
What an organization publishes and enrolls learners in. Either a run of lessons,
or a single lesson that opens straight into itself — the unit an author embeds
when a whole course is too much to ask.
_Avoid_: training, program, module

**Lesson**:
The smallest repeatable unit of learning: an ordered run of scenes that only
means anything together. Every scene in it wears its palette.
_Avoid_: module, chapter, section

**Scene**:
One task. Not a page and not a section — a single interaction, guide beat, or
media nugget, met on its own.
_Avoid_: slide, card, step, page

**Question block**:
A block inside a scene that asks the learner something and holds the answer to
it. The only thing that is graded, and what makes a scene worth points.
_Avoid_: QA block, quiz, exercise, assessment item

**Guide character**:
Who a scene speaks as. Explanation, encouragement, and correction are put in the
guide's mouth and react to how the learner is doing, rather than addressing them
from nowhere.
_Avoid_: mascot, avatar, persona

**Vibe**:
The tone a scene is pitched at — calm, urgent, playful. One word the author
picks, not a theme they assemble.
_Avoid_: theme, style, mood

### Draft and published

**Draft**:
The one living copy of a course, and the only thing an author can edit. Every
lesson and scene belonging to no version is part of it.
_Avoid_: working copy, unpublished version

**Version**:
A publication of a course, numbered and frozen at the moment it was made. A
learner is always taking a version, never the draft.
_Avoid_: release, revision, snapshot

**Publish**:
Copying the draft whole into a new version, and compiling every scene in it into
what a learner will be served. Refused when nothing in the draft has changed —
a version always marks a difference.
_Avoid_: release, deploy, ship

**Superseded**:
A version a later publish retired. Superseding is something the author asks for
at publish time, not what publishing does on its own — versions otherwise stay
takeable alongside each other. A learner on a superseded version is stopped
where they stand and sent to the current one.
_Avoid_: invalidated, archived, deprecated, outdated

**Enrollment**:
A learner joined to one version of a course. What fixes which version they take,
and what a seat is spent on.
_Avoid_: registration, signup, assignment

**Outdated**:
A draft scene whose source moved on beneath it, defined in
[notebook](../notebook/CONTEXT.md). Never said of a version — a version that is
no longer current is _superseded_.

**External agent**:
An AI agent outside Scibly working the draft on an author's behalf, with the
author's own permissions and nothing more. It edits the way a second author
would — never anything published, never the notebook's conversation — and what
it writes cites no sources, so freshness never watches it.
_Avoid_: MCP client, bot, integration, service account

**Approval**:
The author's yes that stands between an agent asking to delete and the deletion
happening. Asked one act at a time, never given by the agent, and never implied
by the instruction that led to it — an author who said "tidy this up" has not
approved whatever tidying turns out to mean. Said only of deletion.
_Avoid_: confirmation, consent, permission (organizations' word, and about what
a role may do at all rather than about this one act)

### What a published scene is made of

**Author document**:
The live, shared state of a scene while it is being written. Two authors work in
the same one at once, and no learner is ever served it.
_Avoid_: document state, editor state, draft content

**Learner content**:
The copy of a scene a learner is served, cut from the author document at publish
with every answer taken out. Never edited — a correction means publishing again.
_Avoid_: student content, published content

**Grading manifest**:
Where a published scene's correct answers went, cut from the same document at the
same moment as the learner content. Grading reads this and never what the learner
was sent.
_Avoid_: answer key, solutions, rubric

**Scibly Points (SP)**:
What a learner earns for work done. A scene awards its own and each of its
question blocks awards its own; the two summed are the most that scene can be
worth, fixed at publish. Written SP wherever a learner sees it.
_Avoid_: score, XP, marks, credits (entitlement's word, and about money)

**Learner**:
The person taking the course. The only word for them, in prose and in a name,
with no exceptions left anywhere — including inside documents already written.
_Avoid_: student, participant, user
