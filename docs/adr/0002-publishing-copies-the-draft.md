# Publishing copies the draft

Publishing deep-copies every draft lesson and scene into a new numbered version,
and compiles each scene's collaborative document into two immutable artifacts:
what a learner is served, and the answer key that grades them. Nothing published
is ever edited — a correction is another version. The alternative was a version
that references the draft and stores only what changed.

## Why

A learner part-way through a course must not have it move underneath them, and
an answer must be gradeable against exactly what was on screen when they gave
it. Both fall out of a copy for nothing, and both need deliberate machinery under
any referencing scheme. Compiling at publish rather than on read also puts the
answer key somewhere other than the learner's copy, which makes removing the
solutions a step that either happened or didn't — rather than a filter that has
to be correct on every read for the rest of the course's life.

## Consequences

- Content is duplicated once per version. Accepted: a course is small beside the
  media it points at.
- A published scene can never go outdated. Freshness is a draft-only concern,
  which is why the invalidation cascade from a changed source stops at the draft.
- Fixing a typo in a published course costs a version. Whether that version
  retires the previous one is a separate choice, made per publish.
