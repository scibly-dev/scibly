# Knowledge

What an organization wants written down about its own code, and kept true as
that code moves. A topic states the intent — this document, about this much of
these repositories — and names who is trusted to judge what the sync later
proposes for it. A topic also has a document: markdown held here, projected onto
a Notion page the organization can read and edit. The sync now collects and
reads too: a merged pull request worth learning from becomes a bundle, and a
bundle worth documenting becomes cited insights. This context decides scope,
stewardship, where the projection lands, what is worth keeping, and what was
learned; drafting a suggestion into a document belongs to the ticket that
follows.

## Language

**Topic**:
One living document: its name, the [grants](../integrations/CONTEXT.md) it
watches, how far into them it looks, and who reviews what is proposed for it.
The topic is the definition, not the prose — the prose is its _document_.
_Avoid_: page, article, doc

**Document**:
A topic's markdown, held here. This side is canonical: the Notion page is a
projection of it, never a source read back. A new topic's document is the
_skeleton_ — the five headings and nothing under them.
_Avoid_: content, body, text

**Destination**:
The one Notion page an organization's documents are filed under, called
"Scibly Knowledge". Notion cannot create a page at the workspace root, so an
admin picks a granted page to put it beneath; until they do, the organization
has nowhere to put a document and cannot create a topic.
_Avoid_: root, folder (a repository directory here), workspace

**Externally edited**:
Someone changed the Notion page since this side last wrote it — the page's
revision is not the one we left. A document in that state is flagged and never
overwritten; the page keeps whatever they wrote.
_Avoid_: conflict, dirty, out of sync

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
What a topic looks like at a glance — when it last collected, and how much is
waiting on a maintainer. The collection half is real; how much waits on a
maintainer stays a placeholder until suggestions land.
_Avoid_: status, state

## What the sync collects

**Bundle**:
One merged pull request kept whole, because the argument in it is worth
learning from: its title, description, labels, file paths, linked issues, and
every review thread with the diff it hangs off. Held for the organization
against the repository it came from, never for one topic — the same pull
request feeds every topic watching that repository.
_Avoid_: knowledge event, snapshot, record, PR (GitHub's word for the thing a
bundle is made from)

**Discarded**:
What a pull request is when the filter refuses it. Nothing of it is kept but
what proves it was already judged — its id, when GitHub last saw it move, and
the reason. A discarded pull request is judged again only if it moves on
GitHub, so an argument that arrives after the merge still has its chance.
_Avoid_: rejected, filtered, skipped, deleted

**Structural filter**:
The judgement made before anything is fetched in full or stored, and made
without a model: a bot's pull request, or a chore with nothing said on it, is
refused outright, and the rest are ranked on how much was argued. It costs
nothing but the listing, which is the point — the model stages downstream are
what the funnel is narrow for.
_Avoid_: triage (the model stage below), heuristic, rules

**Collection run**:
One repository's turn at collecting, for one organization. It says how far it
got, what it kept, what it refused, and whether it stopped early on a budget
rather than on running out. A run is the only thing that moves a watermark, and
only a run that succeeded moves it.
_Avoid_: sync (integrations' word for a whole scheduled pass), job, poll

**Watermark**:
Defined in [integrations](../integrations/CONTEXT.md). Here it is per
repository rather than per connection, and it marks how recently a pull request
was touched, not when it merged — GitHub will not order by the merge, and a
merged pull request that is argued over afterwards should come back.

**Activity feed**:
What a topic can show for itself: its recent collection runs, the bundles they
kept from the repositories it watches, narrowed to its path globs, and the
insights read out of them. The runs and bundles are read, not stored — only an
insight is actually bound to a topic. A finished run is not a finished sync: a
collected bundle with no outcome yet is still in the funnel, and the feed says
so rather than letting a succeeded run read as the end of the work.
_Avoid_: history, log, timeline

## What the sync reads

**Triage**:
The cheap model pass that sorts a batch of bundles at once: which topics cover
each one, and how worth documenting its discussion is. It reads summaries, not
arguments, and it may only route to topics the structural scope already
allowed — a topic the model names but the globs never matched is not a
candidate. What it refuses is settled, never surfaced.
_Avoid_: classification, routing, filter (the structural one above)

**Extraction**:
The capable model pass that reads one bundle whole and re-authors its argument
into insights. One extraction is one bundle, one generation, and one charge —
which is what makes the cost of a night's sync countable.
_Avoid_: summarization, mining, analysis

**Insight**:
One durable claim, in prose this side wrote, filed against the topic it belongs
to. Deliberately untyped: a decision, a convention and a gotcha are all just
claims that cite where they came from. A claim that only makes sense next to
the diff is not one.
_Avoid_: finding, fact, note, suggestion (the reviewed thing in the ticket that
follows), quote

**Citation**:
A link on an insight back to the pull request or comment the claim was read
from. Checked against the bundle before it is stored, so a model cannot invent
one — a claim left with no citation it can prove is dropped rather than filed.
_Avoid_: source (notebooks' word), reference, link

**Confidence**:
How sure the extraction is that a claim is true, durable, and worth keeping.
Below the floor nothing is written and nothing is shown; the floor and every
other number the funnel judges by live in one place.
_Avoid_: score (the structural filter's word for discussion density), rating

**Outcome**:
Where the funnel left a bundle — off topic, low value, extracted, nothing
found, or unfunded. Written with the moment the funnel finished, and the raw
content is pruned in the same write: what proves a bundle was judged survives,
the conversation does not. Unfunded is the exception and not terminal, so an
organization that tops up gets its bundles read.
_Avoid_: status, result, verdict
