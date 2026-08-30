# Knowledge

What an organization wants written down about its own code, and kept true as
that code moves. A topic states the intent — this document, about this much of
these repositories — and names who is trusted to judge what the sync later
proposes for it. This context decides scope and stewardship only; noticing a
change, drafting a suggestion, and metering the cost belong to the tickets that
follow.

## Language

**Topic**:
One living document: its name, the [grants](../integrations/CONTEXT.md) it
watches, how far into them it looks, and who reviews what is proposed for it.
The topic is the definition, never the prose — a topic has no text of its own
yet, and creating one changes nothing outside this context.
_Avoid_: document, page, article, doc

**Scope**:
The part of the world a topic is about: at least one repository, optionally
narrowed by paths. Stated by an admin, but
settled by the server against the live installation — a repository the
installation cannot reach is not in scope no matter what was submitted.
_Avoid_: filter, selection, config

**Path glob**:
A repository-relative pattern narrowing a topic inside the repositories it
watches. None means the whole repository. It may not climb out of one.
_Avoid_: path, pattern, include

**Folder**:
A repository-relative directory the installation offers back, so a
path glob can be picked instead of typed. Picking one stores the
glob it means (`folder + "/**"`), never the folder itself — nothing downstream
knows a scope was narrowed from a list rather than by hand.
_Avoid_: directory, tree, dir

**Maintainer**:
A [member](../organizations/CONTEXT.md) who reviews what the sync suggests for a
topic. Held as a member, not a user: leaving the organization ends
maintainership, and a topic with none is unreviewed rather than broken.
_Avoid_: owner (organizations' word for a role), reviewer, author

**Language**:
Which of the app's locales a topic's document is written in. A property of the
document, not of the reader — someone reading the app in English still edits a
German topic.
_Avoid_: locale (the app's word for what a reader sees)

**Health**:
What a topic looks like at a glance — when it last synced, how much is waiting
on a maintainer. Every value is a placeholder until the syncing tickets land;
the surface says "never" rather than inventing a number.
_Avoid_: status, state
