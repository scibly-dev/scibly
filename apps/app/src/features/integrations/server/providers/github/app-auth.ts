import { routes } from "@scibly/routes";
import crypto from "crypto";
import { z } from "zod";

import { env } from "@/env";

// GitHub rejects a JWT issued ahead of its own clock and caps the lifetime at ten minutes.
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

export function readGitHubAppConfig(): GitHubAppConfig {
  return {
    appSlug: env.GITHUB_APP_SLUG,
    appId: env.GITHUB_APP_ID,
    // A PEM survives a .env file only with its newlines escaped, so both spellings are normalised to the one OpenSSL will parse.
    privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientId: env.GITHUB_APP_CLIENT_ID,
    clientSecret: env.GITHUB_APP_CLIENT_SECRET,
  };
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

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
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
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

const graphqlEnvelope = z.object({
  data: z.unknown().nullable().optional(),
  errors: z
    .array(z.object({ type: z.string().optional(), message: z.string() }))
    .optional(),
});

export async function githubGraphQL<T>(
  token: string,
  query: string,
  variables: Record<string, string | number | null>,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(routes.external.integrations.github.graphql, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new GitHubRequestError(
      `GitHub GraphQL failed: ${response.status}`,
      response.status,
    );
  }

  const body = graphqlEnvelope.parse(await response.json());
  const [failure] = body.errors ?? [];
  if (failure) {
    // GraphQL answers 200 with an `errors` array; `type` is mapped onto a status so the REST callers' 404-means-unreachable rule still holds.
    const status =
      failure.type === "NOT_FOUND"
        ? 404
        : failure.type === "FORBIDDEN"
          ? 403
          : failure.type === "RATE_LIMITED"
            ? 429
            : 502;
    throw new GitHubRequestError(
      `GitHub GraphQL failed: ${failure.message}`,
      status,
    );
  }
  return schema.parse(body.data);
}

const installationResponse = z.object({
  id: z.number(),
  account: z.object({ id: z.number(), login: z.string() }).nullable(),
});

const mintedTokenResponse = z.object({ token: z.string() });

const installationRepositorySchema = z.object({
  id: z.number(),
  full_name: z.string(),
  html_url: z.string(),
});

export type GitHubRepository = z.infer<typeof installationRepositorySchema>;

const repositoriesResponse = z.object({
  total_count: z.number(),
  repositories: z.array(installationRepositorySchema).optional(),
});

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

// Asked as the user, not as the app: the app sees every installation it has, so only the user's own answer says whether they reach this one.
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

// A large organisation can reach thousands of repositories, and listing them is a settings-page nicety, so it stops early and says that it did.
const MAX_REPOSITORY_PAGES = 10;

export interface GitHubRepositoryList {
  repositories: GitHubRepository[];
  totalCount: number;
}

const repositoryResponse = z.object({
  full_name: z.string(),
  default_branch: z.string(),
});

const treeResponse = z.object({
  tree: z
    .array(z.object({ path: z.string(), type: z.string(), sha: z.string() }))
    .optional(),
});

const MAX_FOLDER_DEPTH = 2;
const MAX_FOLDERS = 200;
// A level costs one request per folder on the level above it, and a monorepo's
// root can hold hundreds.
const MAX_TREE_REQUESTS = 32;

export async function fetchRepositoryFolders(
  token: string,
  repositoryId: string,
): Promise<string[]> {
  const authorization = `Bearer ${token}`;
  // Asked by id, not by name: a rename must not turn a scoped topic into a 404.
  const repository = await githubRequest(
    `/repositories/${encodeURIComponent(repositoryId)}`,
    { method: "GET", authorization },
    repositoryResponse,
  );

  const readSubtrees = async (parent: { path: string; sha: string }) => {
    const { tree } = await githubRequest(
      `/repos/${repository.full_name}/git/trees/${encodeURIComponent(parent.sha)}`,
      { method: "GET", authorization },
      treeResponse,
    );
    return (tree ?? [])
      .filter((entry) => entry.type === "tree")
      .map((entry) => ({
        path: parent.path ? `${parent.path}/${entry.path}` : entry.path,
        sha: entry.sha,
      }));
  };

  const folders: string[] = [];
  let level = [{ path: "", sha: repository.default_branch }];
  let budget = MAX_TREE_REQUESTS;

  for (let depth = 0; depth < MAX_FOLDER_DEPTH; depth += 1) {
    const asked = level.slice(0, budget);
    if (asked.length === 0 || folders.length >= MAX_FOLDERS) break;
    budget -= asked.length;
    level = (await Promise.all(asked.map(readSubtrees))).flat();
    folders.push(...level.map((folder) => folder.path));
  }

  // Cut in the order they were walked, so a repository too wide to list keeps
  // its top-level folders rather than everything up to the letter c.
  return folders.slice(0, MAX_FOLDERS).sort();
}

// A repository the installation does not reach answers 404, so this settles reachability as well as the name.
export async function fetchInstallationRepository(
  token: string,
  repositoryId: string,
): Promise<GitHubRepository | null> {
  try {
    return await githubRequest(
      `/repositories/${encodeURIComponent(repositoryId)}`,
      { method: "GET", authorization: `Bearer ${token}` },
      installationRepositorySchema,
    );
  } catch (error) {
    if (error instanceof GitHubRequestError && error.status === 404)
      return null;
    throw error;
  }
}

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
    if (returned.length < REPOS_PER_PAGE) break;
    if (repositories.length >= totalCount) break;
  }

  return {
    repositories,
    totalCount: Math.max(totalCount, repositories.length),
  };
}
