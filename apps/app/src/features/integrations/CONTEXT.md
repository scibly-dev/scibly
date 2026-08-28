# Integrations

How an organization's own documents, living in someone else's system, become
material a notebook can read — and how a change made over there is noticed back
here. Nothing in this context writes a course; it only supplies and re-checks
what a source was made from.

## Language

### The connection

**Provider**:
An outside system pages can be pulled from — Notion, Confluence, SharePoint.
Adding one is adding a provider, not an integration.
_Avoid_: service, vendor, app

**Connection**:
One organization's authorised link to one provider, and the credential behind
it. At most one per provider per organization, made by the person who authorised
it.
_Avoid_: integration (the context, not the record), account, credential

**Workspace**:
The container on the provider's side that a connection can reach — a Notion
workspace, a Confluence site. Reconnecting to a different one does not carry the
old one's pages across.
_Avoid_: site, tenant, organization (ours, and never theirs)

**Page**:
The unit a provider offers: what an author picks, and what becomes a
[source](../notebook/CONTEXT.md) once its text is pulled across. Some hold
others, and picking one never picks its children.
_Avoid_: document, file, node

**Revision**:
The cheap marker of when a page was last edited, asked for on its own so an
unchanged page costs nothing to check.
_Avoid_: version (course authoring's word, and about publishing), hash, etag

**Detach**:
Cutting a source's tie to the connection that created it, when that connection
goes away or comes back pointing at a different workspace. The source, its text,
and everything built from it stay — only the automatic re-checking stops, and
the author is told why.
_Avoid_: delete, unlink, disconnect (what happens to the connection, not the
source)

### Noticing a change

**Sync**:
The whole scheduled run that works through the organization's connections
looking for pages that changed. The only way a change is ever noticed — no
provider tells us.
_Avoid_: refresh, job, cron

**Poll**:
One connection's turn inside a sync: ask the provider what changed since last
time, and mark the affected sources. A sync is many polls.
_Avoid_: fetch, check, sync (the run, not the turn)

**Refresh**:
Getting a new access token for a connection whose old one expired. Said only of
credentials — content is never refreshed, it is synced.
_Avoid_: renew, re-sync

**Watermark**:
How far a connection's polling has got. It moves only when a poll actually
succeeded, so a failed run costs delay rather than the changes it would have
seen — the next success covers the whole gap.
_Avoid_: cursor, checkpoint, last run

**Backoff**:
The growing delay a repeatedly failing connection is held off for, so a broken
one is retried less and less. Any success clears it.
_Avoid_: retry delay, cooldown

**Stale**:
Defined in [notebook](../notebook/CONTEXT.md). What a poll marks a source when
the provider says the page behind it moved on. Marking it is this context's last
act — what a stale source then does to a course is the notebook's.

### Running the sync

**Due**:
What a connection is when its backoff has passed and its organization still
pays. The sync's whole decision is which connections are due; each one then gets
a poll of its own.
_Avoid_: owed, pending, queued

**Attempt**:
One try at a poll. Several may be spent on one poll — a provider that times out
is tried again — and only the last one that fails counts against the backoff.
The watermark moves for the one that succeeds; nothing moves for the rest.
_Avoid_: retry (the platform's word for what it does between attempts)
