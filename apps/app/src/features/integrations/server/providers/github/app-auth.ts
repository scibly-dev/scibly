import { routes } from "@scibly/routes";
import crypto from "crypto";
import { z } from "zod";

import { env } from "@/env";

// The app's private key never leaves this module: every call a connection
// makes carries an installation access token minted here for that call and
// dropped afterwards, which is why none is ever written down.

// GitHub rejects a JWT issued ahead of its own clock and caps the lifetime at
// ten minutes; both bounds are taken with room to spare.
const JWT_BACKDATE_SECONDS = 60;
const JWT_LIFETIME_SECONDS = 8 * 60;

export interface GitHubAppConfig {
  appSlug: string;
  appId: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
}

export interface GitHubInstallation {
  installationId: string;
  accountId: string;
  accountLogin: string;
}

export interface GitHubRepository {
  id: number;
  full_name: string;
  html_url: string;
}

export function readGitHubAppConfig(): GitHubAppConfig {
  return {
    appSlug: env.GITHUB_APP_SLUG,
    appId: env.GITHUB_APP_ID,
    // A PEM survives a .env file only with its newlines escaped, so both
    // spellings are normalised to the one OpenSSL will parse.
    privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientId: env.GITHUB_APP_CLIENT_ID,
    clientSecret: env.GITHUB_APP_CLIENT_SECRET,
  };
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

/** A short-lived assertion that this is the app — never an installation. */
export function signAppJwt(config: GitHubAppConfig, now = new Date()): string {
  const issuedAt = Math.floor(now.getTime() / 1000) - JWT_BACKDATE_SECONDS;
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iat: issuedAt,
      exp: issuedAt + JWT_LIFETIME_SECONDS,
      iss: config.appId,
    }),
  );
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign(config.privateKey);

  return `${header}.${payload}.${base64url(signature)}`;
}

/** Carries GitHub's status out, so a caller can tell a gone installation
 * apart from a network or permission failure. */
export class GitHubRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubRequestError";
  }
}

const GITHUB_TIMEOUT_MS = 30_000;

// The schema is a parameter rather than a type argument: a cast would describe
// the body GitHub is documented to send, which is not the same claim as the
// body it did send — an unexpected shape belongs in a thrown error here, not in
// an undefined three call frames away.
async function githubRequest<T>(
  path: string,
  init: { method: "GET" | "POST"; authorization: string },
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(
    `${routes.external.integrations.github.api}${path}`,
    {
      method: init.method,
      headers: {
        accept: "application/vnd.github+json",
        authorization: init.authorization,
        "x-github-api-version": "2022-11-28",
      },
      cache: "no-store",
      // `fetch` waits forever by default. A sync hop polls up to ten connections
      // inside a four-minute deadline, so one hung request must not be able to
      // spend the whole hop and strand the rest of the batch unpolled.
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    // Only GitHub's status and message are carried out: the request was
    // authorised with a JWT or a minted token, and neither belongs in an error
    // a caller may log.
    const message = await response
      .json()
      .then((body: { message?: string }) => body.message)
      .catch(() => undefined);
    throw new GitHubRequestError(
      `GitHub ${init.method} ${path} failed: ${response.status}${message ? ` ${message}` : ""}`,
      response.status,
    );
  }
  return schema.parse(await response.json());
}

const installationResponse = z.object({
  id: z.number(),
  account: z.object({ id: z.number(), login: z.string() }).nullable(),
});

const mintedTokenResponse = z.object({ token: z.string() });

const repositoriesResponse = z.object({
  total_count: z.number(),
  repositories: z
    .array(
      z.object({
        id: z.number(),
        full_name: z.string(),
        html_url: z.string(),
      }),
    )
    .optional(),
});

/** Who the app was installed on, asked as the app itself. */
export async function fetchInstallation(
  config: GitHubAppConfig,
  installationId: string,
): Promise<GitHubInstallation> {
  const installation = await githubRequest(
    `/app/installations/${encodeURIComponent(installationId)}`,
    { method: "GET", authorization: `Bearer ${signAppJwt(config)}` },
    installationResponse,
  );
  if (!installation.account) {
    throw new Error(
      `GitHub installation ${installationId} names no account to connect to.`,
    );
  }
  return {
    installationId: String(installation.id),
    accountId: String(installation.account.id),
    accountLogin: installation.account.login,
  };
}

/** Mint the hour-long token this installation stands for. Never stored. */
export async function mintInstallationToken(
  config: GitHubAppConfig,
  installationId: string,
): Promise<string> {
  const minted = await githubRequest(
    `/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
    { method: "POST", authorization: `Bearer ${signAppJwt(config)}` },
    mintedTokenResponse,
  );
  return minted.token;
}

const userTokenResponse = z.union([
  z.object({ access_token: z.string() }),
  z.object({ error: z.string() }),
]);

/** Redeem the code the install redirect carried for a token that speaks as the
 * user who installed — never stored, only used to check what they can reach. */
export async function exchangeUserToken(
  config: GitHubAppConfig,
  code: string,
): Promise<string> {
  const response = await fetch(routes.external.integrations.github.oauthToken, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new GitHubRequestError(
      `GitHub POST ${routes.external.integrations.github.oauthToken} failed: ${response.status}`,
      response.status,
    );
  }
  const body = userTokenResponse.parse(await response.json());
  // A refused or spent code comes back as a 200 with an error in the body.
  if (!("access_token" in body)) {
    throw new Error(`GitHub refused the user authorization: ${body.error}`);
  }
  return body.access_token;
}

// Asked as the user rather than as the app: the app can see every installation
// it has, so its own answer would say nothing about who is standing at the
// callback. GitHub answers 403 or 404 for an installation the user has no
// access to, which is the whole question — anything else is a failure to
// answer it, and is thrown rather than read as a no.
export async function userCanAccessInstallation(
  userToken: string,
  installationId: string,
): Promise<boolean> {
  try {
    await githubRequest(
      `/user/installations/${encodeURIComponent(installationId)}/repositories?per_page=1`,
      { method: "GET", authorization: `Bearer ${userToken}` },
      z.object({ total_count: z.number() }),
    );
    return true;
  } catch (error) {
    if (
      error instanceof GitHubRequestError &&
      (error.status === 403 || error.status === 404)
    ) {
      return false;
    }
    throw error;
  }
}

const REPOS_PER_PAGE = 100;

// An installation on a large organisation can reach thousands of repositories.
// Listing them is a settings-page nicety, so it walks a bounded number of pages
// and says when it stopped early rather than spending a request per hundred
// until GitHub runs out.
const MAX_REPOSITORY_PAGES = 10;

export interface GitHubRepositoryList {
  repositories: GitHubRepository[];
  /** What GitHub says the installation reaches, listed or not. */
  totalCount: number;
}

/** The repositories the installation was given. */
export async function fetchInstallationRepositories(
  token: string,
): Promise<GitHubRepositoryList> {
  const repositories: GitHubRepository[] = [];
  let totalCount = 0;

  for (let page = 1; page <= MAX_REPOSITORY_PAGES; page += 1) {
    const body = await githubRequest(
      `/installation/repositories?per_page=${REPOS_PER_PAGE}&page=${page}`,
      { method: "GET", authorization: `Bearer ${token}` },
      repositoriesResponse,
    );
    totalCount = body.total_count;
    const returned = body.repositories ?? [];
    repositories.push(...returned);
    // A short page is the last page, whatever the count claims.
    if (returned.length < REPOS_PER_PAGE) break;
    if (repositories.length >= totalCount) break;
  }

  return {
    repositories,
    totalCount: Math.max(totalCount, repositories.length),
  };
}
