# Context Map

## Contexts

- [Organizations](./apps/app/src/features/organizations/CONTEXT.md) — who the
  customer is, who belongs to them, and what each of those people may do
- [Integrations](./apps/app/src/features/integrations/CONTEXT.md) — how
  documents living in someone else's system become material, and how a change
  made over there is noticed back here
- [Knowledge](./apps/app/src/features/knowledge/CONTEXT.md) — what an
  organization wants written down about its own code, and kept true as that code
  moves
- [Notebook](./apps/app/src/features/notebook/CONTEXT.md) — where an author
  turns their own documents into a course, with the AI learning designer
- [Course authoring](./apps/app/src/features/course-authoring/CONTEXT.md) —
  where a course is assembled and made takeable
- [Learning](./apps/app/src/features/learning/CONTEXT.md) — where a learner
  takes a published course, and what they keep afterwards
- [Entitlement](./packages/api/src/entitlement/CONTEXT.md) — what an
  organization's subscription lets it do, and what it owes when it can't

## Relationships

- **Organizations → everything**: the organization is the boundary every other
  context sits inside — a course, a notebook, a connection, a certificate
  belongs to exactly one, and nothing is shared between two. _Member_ is
  organizations' word and says only that a person belongs; it never means
  someone taking a course.
- **Integrations → Notebook**: a picked page becomes a source, and a poll that
  finds it changed marks that source _stale_. Marking is where integrations
  stops — what a stale source then does to a course is the notebook's.
- **Knowledge → Integrations**: a topic's scope is stated as repository ids but
  settled against the live installation, so _grant_ is integrations' word used
  unchanged — knowledge stores the id and the name the installation gave, and
  never decides for itself what a repository is called.
- **Knowledge → Integrations**: a topic's document is projected onto a Notion
  _page_ through the same connection notebook sources are picked from, so
  knowledge needs that connection to write, not only to read. Where the page
  goes is knowledge's (_destination_); reaching Notion at all is integrations'.
- **Knowledge → Organizations**: a maintainer is a _member_, so leaving the
  organization ends maintainership without knowledge being told.
- **Knowledge → Entitlement**: creating, editing, or deleting a topic is
  entitlement's to permit against the plan. Reading the list never is — the gate
  decides what the area offers, not whether it renders.
- **Notebook → Course authoring**: the notebook's agent writes into the draft
  and nothing else, and records which sources each scene came from. That
  lineage is what later turns a changed source into an outdated scene, so the
  two contexts share _lesson_, _scene_, and _outdated_ — defined in course
  authoring, deferred to by the notebook.
- **Course authoring → Learning**: learning only ever reads, and only ever a
  version — the draft an author edits is not takeable. _Learner_, _lesson_,
  _scene_, _enrollment_, and _SP_ are course authoring's words, used unchanged;
  learning adds what happens to them once someone is taking the thing.
- **Course authoring → Entitlement**: publishing a course and enrolling a
  learner are both entitlement's to permit — one against the plan, the other
  against seats bought.
- **Learning → Entitlement**: an enrollment is what a seat is spent on, and a
  visitor's anonymous session is what the ceiling counts. The ceiling is the one
  refusal with nothing to sell behind it — a stranger cannot buy their way past
  it.
- **Notebook → Entitlement**: every metered call a notebook makes — a turn, an
  ingestion's digest, an image — is funded through entitlement, which decides
  whether it may happen and what it costs. Entitlement stays surface-agnostic;
  the notebook restates its refusals in the chat's own vocabulary.
