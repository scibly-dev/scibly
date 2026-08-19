# Organizations

Who a customer is, who belongs to them, and what each of those people may do.
Every course, notebook, certificate, and connection in the product belongs to
exactly one organization, and nothing is ever shared between two.

## Language

### The customer

**Organization**:
The customer, and the boundary everything else sits inside. It owns the courses
authored in it, the learners enrolled in them, and the subscription that pays
for both.
_Avoid_: company, team, tenant, workspace (an integration's word for the
provider's own container)

**User**:
A person's login, which is theirs alone and can belong to several organizations
at once. Says nothing on its own about what they may do — that is the
membership's to say.
_Avoid_: account, profile

### Who belongs to it

**Member**:
A user's place in one organization, and the role they hold there. The word for
belonging, never a word for taking a course — a learner in the middle of a
course is a _learner_, whether or not they are also a member.
_Avoid_: membership, seat (entitlement's word, and about what is paid for),
teammate

**Role**:
What a member may do: owner, admin, or member. One per membership, and a role
the product does not recognise grants the least a role can.
_Avoid_: permission, access level

**Owner**:
The role that holds the money. Billing, the plan, top-ups, and the warnings that
come with them are the owner's alone, and notices about the subscription go to
them.
_Avoid_: admin, billing contact

**Admin**:
The role that runs the organization's work without touching its money — building
courses, publishing them, enrolling learners, managing connections and models.
_Avoid_: manager, editor

**Invitation**:
An offer of membership sent to an email address, which stands until it is
accepted or runs out of time. It names the role the person will hold when they
accept.
_Avoid_: invite link, request

### What it configures

**BYOAI model**:
A model endpoint an organization brings itself, for chat or for images, used in
place of the one the product provides. What a plan must allow before it can be
set up belongs to
[entitlement](../../../../../packages/api/src/entitlement/CONTEXT.md).
_Avoid_: custom model, self-hosted model, own model

**Scibly AI**:
The model the product provides, used by any organization that has not brought
its own. The default, not a fallback.
_Avoid_: default model, built-in AI

### Borrowed words

**Seat**, **Plan**, **Allowance**, **Credits**, **Lapse**:
All defined in
[entitlement](../../../../../packages/api/src/entitlement/CONTEXT.md). An
organization is what they are counted and charged against, but what they mean is
settled there.
