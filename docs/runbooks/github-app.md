# Runbook: registering the GitHub App

Scibly connects a GitHub organization by having it **install a GitHub App**,
not by an OAuth grant. What gets stored on the org's connection is the
installation id; the token it stands for is minted from the app's private key
for each call and never written down. So before anyone can press *Connect* on
GitHub in an organization's integration settings, the app itself has to exist —
once for development, once for production.

This is a one-time task per environment. You need admin rights on the GitHub
account or organization that will own the app.

## 1. Create the app

Go to **Settings → Developer settings → GitHub Apps → New GitHub App**, on your
personal account (dev) or on the organization that should own it (prod).

| Field | Development | Production |
| --- | --- | --- |
| **GitHub App name** | `Scibly (dev)` — names are globally unique, so add your own suffix if it's taken | `Scibly` |
| **Homepage URL** | `http://localhost:3001` | your app URL |
| **Setup URL** (under *Post installation*) | `http://localhost:3001/api/integrations/github/callback` | `${NEXT_PUBLIC_APP_URL}/api/integrations/github/callback` |
| **Redirect on update** | checked | checked |
| **Callback URL** (under *Identifying and authorizing users*) | leave blank | leave blank |
| **Request user authorization (OAuth) during installation** | **unchecked** | **unchecked** |
| **Webhook → Active** | unchecked | unchecked |
| **Where can this GitHub App be installed?** | *Only on this account* | *Any account* |

The **Setup URL is the one that matters**: when someone finishes installing the
app, GitHub sends their browser there with `installation_id`, `setup_action`,
and the signed `state` scibly put on the install link. That route
([callback/route.ts](../../apps/app/src/app/api/integrations/[provider]/callback/route.ts))
is what turns the installation into a connection. Leave the OAuth callback
blank and the user-authorization box unchecked — scibly never asks GitHub for a
user token, only for the installation.

*Redirect on update* is checked so that changing which repositories the
installation can reach comes back through the same route and refreshes the
connection, rather than dead-ending on GitHub.

**Webhooks are off** because scibly has no receiver for them yet. When one
lands, turn *Active* on, point the webhook URL at it, generate a secret with
`openssl rand -hex 32`, and add it to the app's env — this runbook and
`apps/app/src/env.js` should gain the variable in the same change.

## 2. Permissions

Under **Permissions → Repository permissions**, grant read-only and nothing
more:

| Permission | Access | Why |
| --- | --- | --- |
| **Metadata** | Read-only | mandatory; lists the repositories the installation reaches |
| **Contents** | Read-only | reading files in a repository |
| **Pull requests** | Read-only | reading pull requests and their discussion |
| **Issues** | Read-only | reading issues and their discussion |

Leave every organization and account permission at *No access*. Scibly never
writes to GitHub, so a write permission here is a liability with no upside.

If you add a permission later, GitHub does **not** grant it to existing
installations — each installing organization has to approve the new permission
before it takes effect.

## 3. Collect the credentials

On the app's settings page:

- **App ID** — shown at the top → `GITHUB_APP_ID`
- **Public link** at the bottom, `https://github.com/apps/<slug>` — the last
  segment is the slug → `GITHUB_APP_SLUG`
- **Private keys → Generate a private key** — downloads a `.pem` **once**;
  GitHub keeps no copy → `GITHUB_APP_PRIVATE_KEY`

The private key is the app's whole identity: anyone holding it can mint tokens
for every installation. Keep it out of the repository and out of the database —
scibly reads it from the environment only, and it never leaves
[app-auth.ts](../../apps/app/src/features/integrations/server/providers/github/app-auth.ts).

A PEM is multi-line and a `.env` file is not, so escape its newlines:

```bash
awk 'BEGIN{ORS="\\n"} {print}' scibly.private-key.pem
```

Paste the result into `apps/app/.env` (both spellings are accepted — a real
multi-line value in a secret manager works too):

```
GITHUB_APP_SLUG="scibly-dev"
GITHUB_APP_ID="123456"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEow...\n-----END RSA PRIVATE KEY-----\n"
```

All three are required by the env schema, like Notion's: the app refuses to
boot without them rather than failing at the moment someone presses *Connect*.

## 4. Verify

1. Restart `pnpm dev` so the new variables are picked up.
2. Open an organization's settings as an owner or admin → **Integrations** →
   *Connect* on GitHub.
3. GitHub asks which account to install on and which repositories to give it.
   Pick a couple rather than *All repositories* — it makes the next step
   readable.
4. You land back on the settings page with GitHub connected, showing the
   account it was installed on and the repositories the installation reaches.
5. *Disconnect* removes the connection on scibly's side. It does **not**
   uninstall the app on GitHub — that is the org's own call, under
   **Settings → Applications → Installed GitHub Apps**. Reconnecting an
   installation that is still in place goes through without a second install.
6. Uninstalling on GitHub instead settles itself the other way. Nothing is
   pushed to scibly — there is no webhook — so the connection stands until the
   next call needs a token, at which point GitHub answers 404 for an
   installation that is gone. That is read as a revoked connection rather than
   a failed call: the sources are detached, the connection is deleted, and the
   settings page says so. Uninstall the app, reload the page, and the row
   should go back to *Not connected*.

Installing on a *different* GitHub account is a workspace change: the sources
the old account's connection created are detached, exactly as reconnecting a
different Notion workspace behaves.

## Troubleshooting

- **`Invalid environment variables: GITHUB_APP_…`** at boot — the variable is
  unset or empty. Restart dev after editing `.env`.
- **`error:1E08010C:DECODER routines::unsupported`** on connect — the PEM
  didn't survive the `.env` file. Its newlines have to be real or escaped as
  `\n`; a key pasted as one unbroken line cannot be parsed.
- **`GitHub GET /app/installations/... failed: 404`** *during connect* — the
  installation id belongs to a different app than `GITHUB_APP_ID`. Usual cause:
  dev credentials against a production install, or the other way round. The
  same 404 *after* connect means the app was uninstalled, and is handled rather
  than reported: the connection is deleted.
- **`401 'Issued at' is in the future`** — the machine's clock is ahead of
  GitHub's by more than the minute the signing already backdates. Fix the clock.
