# Deletion approval is asked of the client, not enforced by Scibly

External agents may delete draft scenes and lessons, and the author's approval
is collected as an MCP elicitation the calling client renders — not as a pending
deletion the author confirms inside Scibly. We chose the client-side gate
because the failure being guarded against is the model getting it wrong rather
than a hostile client: a client willing to forge an approval can equally skip
asking for one, so enforcing it on our side buys no real protection while
costing a pending-deletion store, an inbox to work it, and a delete tool that
answers "ask your author" instead of a result. Courses are deliberately
excluded — deleting one cascades through published versions and enrollments,
and an unenforceable gate is not what should stand in front of that.

## Consequences

- The approval is a user-interaction model, not a boundary. Anything that must
  actually be prevented has to be refused server-side, on its own merits.
- The approval binds to a specific deletion through the ids the server mints
  into `requestState` and compares on retry, so a model that re-plans between
  asking and being answered is refused rather than deleting a set nobody saw.
  The state is unsigned on purpose: signing only raises the cost of an attack
  this gate already concedes.
- Clients that cannot elicit are refused, not served an ungated delete.

## Not claimed: single use

The approval state carries no nonce and no expiry. A delete can return without
deleting — a last scene, a published scene, a serialization conflict — and the
same state still opens the gate afterwards, so an agent may retry within the
session without asking again. That is accepted: the author approved this exact
item set, for this tool, in this course, and the window is one MCP session.

The SDK's `createRequestStateCodec` TTL is the seam if that ever stops being
true. Recorded here so it is not re-found as a defect.
