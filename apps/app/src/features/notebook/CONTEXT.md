# Notebook

Where an author turns their own documents into a course, with an AI learning
designer in the conversation beside them. Everything here exists to get the
author's material in front of that agent, and the agent's output into scenes.

## Language

### The workspace

**Notebook**:
The workspace an author builds courses in — its sources, its conversation, its
generated images. One author, one organization, and as many courses as the
author cares to draw out of the same material.
_Avoid_: project, chat

**Author**:
The person using the notebook, whose documents and expertise the course is built
out of. The agent's own prompt calls them a subject matter expert.
_Avoid_: user, creator, SME

**Learner**:
The person who takes the published course. Never present in a notebook — the
audience the author designs for.
_Avoid_: student, user

**Source**:
A document the author put in the notebook: an upload, or a page pulled from a
connected integration. Its extracted text is the notebook's ground truth.
_Avoid_: document, file, attachment, reference

**Ingestion**:
Turning a source into text the agent can read — extract, store, digest. A source
is not readable until it finishes.
_Avoid_: indexing, processing, parsing

### The conversation

**Conversation**:
The single exchange between author and agent inside a notebook. A notebook has
exactly one, and it never loses a message.
_Avoid_: chat, thread, session

**Message**:
One stored utterance in the conversation, by the author or the agent, with all
its parts.

**Turn**:
One request — the author sends something, the agent answers, however many tool
calls that takes.
_Avoid_: round, exchange, request

**Continuation**:
A turn in which the author is answering a card the agent left in the
conversation — a multiple choice, a plan to confirm — rather than writing a new
message. The stored conversation decides whether a turn is one; the client's
claim never does.
_Avoid_: reply, follow-up

**Compaction**: Folding the older part of the conversation into a rolling summary so the rest still fits in the model context. Only what the model reads shrinks. _Avoid_: truncation, pruning, trimming

**Summary**:
Always qualified by whose it is. A notebook's summary is what compaction folded
its conversation into; a source's summary is one half of that source's digest.
Never write "the summary" where both could be meant.

**Context**:
The system prompt assembled for a turn: core instructions, loaded skills, the
notebook's source material, the author's focus, and course freshness. Nothing
else is bare "context" — the model's token budget is the _context window_, and
the environment a tool executes in is the _runtime context_.

**Context window**:
How many tokens the turn's model will accept. It bounds the context and the
conversation together, and is what both tiering and compaction answer to.

**Focus**:
What the author has open in the workspace — course, lesson, scene — told to the
agent so its tool calls land where the author is looking.
_Avoid_: selection, current course

### Source material

**Tier**:
How much of the notebook's source material the context can hold. Tier 1 quotes
every source in full; Tier 2 describes them instead, and turns on the tools that
reach the text.
_Avoid_: mode, strategy, level

**Digest**:
A description of one source, written at ingestion in that source's own language:
what it covers, and a flat list of what is in it. Tier 2 shows this in place of
the text.
_Avoid_: abstract, description

**Passage**:
Quoted text wrapped in a tag that marks it as material rather than instruction.
Every untrusted string crosses into the prompt as one — source text, a search
fragment, a folded summary, a fetched web page.
_Avoid_: chunk, snippet, excerpt, block

**Search**:
Keyword lookup across a notebook's readable sources, returning passages and
where each sits in its source. Exists for Tier 2, where the text is not already
in the prompt.
_Avoid_: retrieval, semantic search, RAG

### Freshness

**Stale**:
A source whose provider says the original changed since it was last ingested.
Said only of a source.
_Avoid_: outdated, dirty, out of date

**Outdated**:
A draft scene whose grounding source has changed or gone. Said only of a scene —
a published one cannot become outdated, and a version a later publish retired is
_superseded_.
_Avoid_: stale, invalid, superseded

**Invalidation**:
The cascade from a changed or removed source to the scenes grounded in it. It is
what makes a stale source produce outdated scenes.

**Lineage**:
Which sources a scene was written from. What invalidation walks, and what the
agent records whenever it writes scene content.
_Avoid_: provenance, citation, attribution

### Authoring

**Course**:
Defined in [course authoring](../course-authoring/CONTEXT.md). A notebook works
on one at a time and moves to another the moment the author creates or picks
one; the courses it has already produced stay in the organization, which is what
holds them.

**Lesson**, **Scene**:
Defined in [course authoring](../course-authoring/CONTEXT.md). A notebook only
ever writes into the draft of one — never into anything published.

**Skill**:
An instruction packet the agent loads on demand before work it must not
improvise, such as authoring scene content or clearing outdated scenes. Distinct
from the skills this repository's own development agents use, and from a stored
prompt template.
_Avoid_: playbook, guide, prompt template

**Generation**:
One metered AI call — a turn, an ingestion's digest, an image. Whether an
organization may make one, and what it costs, belongs to
[entitlement](../../../../../packages/api/src/entitlement/CONTEXT.md).
