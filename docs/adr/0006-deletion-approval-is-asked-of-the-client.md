# Deletion approval is asked of the client, not enforced by Scibly

External agents may delete draft scenes and lessons. The author's approval is
collected as an MCP elicitation that the calling client renders, not as a
pending deletion the author confirms inside Scibly. We chose the client-side
gate because what we are guarding against is the model getting it wrong, not a
hostile client. A client willing to forge an approval can equally skip asking
for one, so enforcing it on our side buys no real protection while costing a
pending-deletion store, an inbox to work it, and a delete tool that answers
"ask your author" instead of a result. Courses are deliberately excluded.
Deleting one cascades through published versions and enrollments, and an
unenforceable gate has no business standing in front of that.

## Consequences

- The approval is a user-interaction model, not a boundary. Anything that must
  actually be prevented has to be refused server-side, on its own merits.
- The approval binds to a specific deletion through the ids the server mints
  into `requestState` and compares on retry. A model that re-plans between
  asking and being answered is refused rather than deleting a set nobody saw.
  The state is unsigned on purpose. Signing only raises the cost of an attack
  this gate already concedes.
- Clients that cannot elicit confirm over two calls instead. The amendment
  below covers that path. Neither path is ever an ungated delete.

## Not claimed: single use

The approval state carries no nonce and no expiry. A delete can return without
deleting: a last scene, a published scene, a serialization conflict. The same
state still opens the gate afterwards, so an agent may retry within the session
without asking again. That is accepted. The author approved this exact item
set, for this tool, in this course, and the window is one MCP session.

The SDK's `createRequestStateCodec` TTL is where an expiry would go if that
ever stops being true. Written down so nobody re-files it as a bug.

## Amendment: clients that cannot elicit confirm over two calls

Originally these tools refused any client that could not be elicited. That
refused every client there is. We serve `legacy: 'stateless'` alongside the
2026-07-28 path, and a 2025-era request is a single exchange with no session,
so `elicitation/create` cannot be sent on it at all. The capability envelope
never arrives either. Claude, ChatGPT and everything else land there, and all
four gated tools were dead on arrival.

Such a client now confirms over two calls. The first returns
`success: false, needsConfirmation: true` with the same summary the dialog
would have shown, plus the `confirmationToken` that opens it. The caller puts
that summary in front of the author and calls again with the token. The token
is the same `approvalToken` value, so the binding is unchanged: it pins the
tool, the course and the sorted id set, and a token minted for a different set
is refused. Elicitation stays preferred wherever the capability is present.

This concedes nothing the ADR had not already conceded. A model can pass a
token it never showed anyone, but a model can equally skip asking before
elicitation. The gate was never a boundary, and a fabricated token still
requires having enumerated the exact ids it is about to delete. What the author
actually sees is the client's own destructive-tool approval on the second call,
which `destructiveHint: true` already asks for.

The gate becomes a boundary only if we drop the two-call path for a sessionful
2025 transport, or once clients speak 2026-07-28. Neither is worth doing for
this.
