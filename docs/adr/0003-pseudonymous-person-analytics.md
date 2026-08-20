# Analytics identifies the user and says nothing else about them

Every event is attributed to a PostHog person keyed by `User.id`, from a bare
`identify()` that sets no person properties. Organization, role, and whether the
user was acting inside an organization or on their own travel on the event
instead. PostHog's onboarding suggests a person profile carrying name and email.
We don't do that.

## Why

A user belongs to several organizations at once and holds a different role in
each, so a role or an organization written onto the person is last-write-wins.
It records where they were last and mislabels everything before that. With role,
organization and plan ruled out, nothing that remains answers a question we have.

Name and email are out for a different reason. Anyone can delete their own
account from user settings, and GDPR gives them erasure of the copies our
processors hold, PostHog included. If PostHog held name or email, honoring that
means deleting the person and their events there, and every funnel, retention
curve and conversion rate they were part of loses the data. A bare `User.id`
means nothing without the user row, so deleting the row cuts the link instead.
The events stop being attributable to anyone and the aggregate history survives.
Deleting the account is the erasure, as long as nothing identifying rides along
on the events.

## Consequences

- The Persons list shows opaque cuids. Mapping one back to a human takes a query
  against our own database.
- `area`, `org_id`, `org_name` and `role` are named once and stay that way.
  Renaming a shipped property means dual-writing and rewriting every saved
  insight. `area` avoids `workspace`, which already means three other things
  here.
- Group analytics stays off. It is a paid add-on billed on every identified
  event in the project, not only the grouped ones.
- Identified events cost up to 4x anonymous ones, and the flag that marks a
  browser identified is sticky. `posthog.reset()` on sign-out returns a browser
  to the cheap rate and keeps two people out of one profile.
- Only users who accept the banner become people. Rejecting it leaves the
  browser cookieless, so the identified population is the consenting one.
- Adding any identifying property later is an ADR-level decision. The
  Datenschutzerklärung and the consent copy change first, and account deletion
  grows a step it does not have today.
