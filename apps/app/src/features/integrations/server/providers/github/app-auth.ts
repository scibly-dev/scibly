import crypto from "crypto";
import { z } from "zod";

import { env } from "@/env";

// The app's private key never leaves this module: every call a connection
// makes carries an installation access token minted here for that call and
// dropped afterwards, which is why none is ever written down.

const GITHUB_API = "https://api.github.com";

// GitHub rejects a JWT issued ahead of its own clock and caps the lifetime at
// ten minutes; both bounds are taken with room to spare.
const JWT_BACKDATE_SECONDS = 60;
const JWT_LIFETIME_SECONDS = 8 * 60;

export interface GitHubAppConfig {
  appSlug: string;
  appId: string;
  privateKey: string;
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
  const response = await fetch(`${GITHUB_API}${path}`, {
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
  });

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

/** The repositories the installation was given. */
export async function fetchInstallationRepositories(
  token: string,
): Promise<GitHubRepository[]> {
  const { repositories } = await githubRequest(
    "/installation/repositories?per_page=100",
    { method: "GET", authorization: `Bearer ${token}` },
    repositoriesResponse,
  );
  return repositories ?? [];
}
