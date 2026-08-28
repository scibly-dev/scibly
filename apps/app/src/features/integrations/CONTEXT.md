# Integrations

How an organization's own material, living in someone else's system, becomes
reachable from here — and how a change made over there is noticed back here.
Mostly that material is documents a notebook can read, but a provider is worth
connecting even when it offers none. Nothing in this context writes a course; it
only supplies and re-checks what a source was made from.

## Language

### The connection

**Provider**:
An outside system an organization connects to — Notion, GitHub.
Either its material is pages a notebook can import, or it is only read from
elsewhere; a provider is worth connecting either way, and only the first kind is
ever shown to a notebook. Adding one is adding a provider, not an integration.
_Avoid_: service, vendor, app

**Connection**:
One organization's authorised link to one provider, and the credential behind
it. At most one per provider per organization, made by the person who authorised
it. The credential comes in one of two shapes — stored OAuth tokens, or an
installation — and a connection is only ever one of them.
_Avoid_: integration (the context, not the record), account, credential

**Installation**:
What a provider connected by letting an app in, rather than by granting tokens,
leaves behind: an id standing for what the app was let onto. It is not a token —
the token it stands for is minted from the app's own key for the one call that
needs it and never written down.
_Avoid_: token, app, integration

**Grant**:
A named piece of a workspace an installation was let at — a GitHub repository.
Only a provider that hands access out piece by piece has any; a workspace given
whole grants nothing to list.
_Avoid_: repository (GitHub's word for one), scope, permission, resource

**Workspace**:
The container on the provider's side that a connection can reach — a Notion
workspace, the GitHub account an app was installed on.
Reconnecting to a different one does not carry the old one's pages across.
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
stored credentials — content is never refreshed, it is synced, and an
installation never is either: its token is minted afresh each time.
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

**Chain**:
The sequence of hops that carries one sync through, handing off rather than
running past the time it is allowed.
_Avoid_: batch, queue

**Hop**:
One slice of a chain: a fixed number of connections, or as many as fit before
the deadline, whichever comes first.
_Avoid_: run, iteration, tick

**Lease**:
The single permit that lets one chain run at a time. Two chains would ask the
provider twice for the same thing and race each other's watermarks.
_Avoid_: lock, mutex, semaphore
