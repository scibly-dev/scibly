# Learning

Where a learner takes a published course: what they are shown, what they may
open next, what their answers earn, and what they keep afterwards. Nothing here
edits a course — it reads one version and records what happened against it.

## Language

### Who is taking it, and how it is recorded

**Learner**:
Defined in [course authoring](../course-authoring/CONTEXT.md). The word for the
person however they arrived — signed in or not. _Member_ is not a synonym for
one: that word belongs to
[organizations](../organizations/CONTEXT.md) and says nothing about taking a
course.

**Visitor**:
A learner taking a public or embedded course without signing in, known only by
the cookie they arrived with. Spends no seat, and counts instead against the
anonymous-session ceiling
[entitlement](../../../../../packages/api/src/entitlement/CONTEXT.md) sets.
_Avoid_: anonymous user, guest, public learner

**Enrollment**:
Defined in [course authoring](../course-authoring/CONTEXT.md). A signed-in
learner's run at one version, and where their attempts and everything their
answers earned are held. Being enrolled in anything at all is what spends the
organization's seat, however many courses the learner goes on to take.

**Session**:
A visitor's run at one version — the enrollment they do not have. Always
qualified as an _anonymous session_ where a signed-in session could be meant;
never the word for a learner's time in the player.
_Avoid_: guest session, visit

### Taking it

**Attempt**:
One run at finishing a course, from its first scene to its last. The word
everywhere a person can see it — an author caps them, a learner is told how many
remain.
_Avoid_: try, tries, retry, run

**Completion policy**:
The two things an author fixes about finishing: the score needed to pass, and
how many attempts are allowed. Both may be left open, and an open policy is the
default.
_Avoid_: rules, grading settings, requirements

**Unlocked**:
A scene is unlocked once every scene before it in the course is complete.
Ordering runs the whole course, not each lesson separately — the last scene of
one lesson gates the first of the next.
_Avoid_: available, accessible, gated

**Complete**:
Said of a scene the learner has finished and had graded, or of an attempt in
which every scene is. Completing is not passing — an attempt can be complete and
still fall short.
_Avoid_: done, finished

**Pass**:
Completing an attempt with a score at or above the course's passing score. A
course with no passing score is passed by completing it.
_Avoid_: succeed, achieve

**Score**:
What one attempt was worth, as a percentage of the SP the course had to give.
Fixed when the attempt completes and never recomputed afterwards — a later
publish cannot move a score already earned.
_Avoid_: grade, result, percentage, SP (a count, not a ratio)

**Scibly Points (SP)**:
Defined in [course authoring](../course-authoring/CONTEXT.md). Earned scene by
scene as an attempt runs, and summed into that attempt's score.

**Restart**:
Beginning a fresh attempt after one that fell short. It spends an attempt, puts
the previous attempt's answers out of the learner's reach, and leaves any
certificate already earned untouched.
_Avoid_: retry, reset, redo

**Version move**:
Being carried to the current version because the one being taken was superseded.
Progress is cleared as with a restart, but no attempt is spent — the learner did
not choose this.
_Avoid_: upgrade, migration

### What is kept

**Scene progress**:
What an enrollment's attempt did at one scene: that it was completed, what it
earned, how long it took. A restart clears it.
_Avoid_: progress record, completion record

**Answer record**:
What was submitted at a scene and what grading made of it, block by block. It is
what a learner sees on returning to a scene they have already done, and what the
author's reporting is built from.
_Avoid_: analytics, submission, response

**Certificate**:
Proof that a named person passed a named course at a named version, on a date.
Issued once, at the moment an attempt passes, and written to stand on its own —
it keeps the names it was issued with and outlives the enrollment, the version,
and the account it came from.
_Avoid_: award, badge, diploma

### How it is reached

**Public course**:
A course an author has opened to anyone with the link, taken without signing in.
_Avoid_: shared course, open course

**Embed**:
A public course taken inside someone else's website rather than on its own page.
The same course and the same session — only the surface differs. Unrelated to an
[integration](../integrations/CONTEXT.md), which is a source provider.
_Avoid_: iframe, widget

**Player**:
The surface a learner takes a course in, one scene at a time.
_Avoid_: viewer, runner, course view

**Pitch scene**:
Scibly's own scene, placed among a public course's scenes when the publishing
organization's plan does not include ad-free public courses. Never authored,
never part of a version, worth nothing — passed on the way through, earning and
recording nothing.
_Avoid_: ad scene, promo scene, sales scene, interstitial
