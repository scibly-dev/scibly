import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Nothing of GitHub is mocked but the network: the app JWT is really signed, and
// really verified against a key generated for this file.

const mockEnv = vi.hoisted(() => ({}) as Record<string, string>);

vi.mock("@/env", () => ({ env: mockEnv }));

const { createVerify, generateKeyPairSync } = await import("crypto");

const KEYS = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const CONFIGURED = {
  GITHUB_APP_SLUG: "scibly-dev",
  GITHUB_APP_ID: "123456",
  GITHUB_APP_PRIVATE_KEY: KEYS.privateKey,
  GITHUB_APP_CLIENT_ID: "Iv23client",
  GITHUB_APP_CLIENT_SECRET: "client-secret",
};

const { GitHubProvider } = await import("./provider");
const { readGitHubAppConfig, signAppJwt } = await import("./app-auth");
const { IntegrationRevokedError, PageIntegrationProvider } =
  await import("../../base-provider");

const NOW = new Date("2026-08-28T12:00:00.000Z");

const fetchMock = vi.fn();

function ok(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) };
}

function failed(status: number, body: unknown) {
  return { ok: false, status, json: () => Promise.resolve(body) };
}

function lastRequest() {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error("nothing was fetched");
  return {
    url: String(call[0]),
    init: call[1] as {
      method: string;
      headers: Record<string, string>;
      body?: string;
      signal?: AbortSignal;
    },
  };
}

function requestTo(fragment: string) {
  const call = fetchMock.mock.calls.find((one) =>
    String(one[0]).includes(fragment),
  );
  if (!call) throw new Error(`nothing was fetched for ${fragment}`);
  return {
    url: String(call[0]),
    init: call[1] as { method: string; body?: string },
  };
}

function authorizes() {
  fetchMock
    .mockResolvedValueOnce(ok({ access_token: "gho_user" }))
    .mockResolvedValueOnce(ok({ total_count: 1 }));
}

function decodeJwt(token: string) {
  const [header, payload] = token.split(".");
  return {
    header: JSON.parse(
      Buffer.from(String(header), "base64url").toString(),
    ) as Record<string, string>,
    payload: JSON.parse(
      Buffer.from(String(payload), "base64url").toString(),
    ) as Record<string, string | number>,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  for (const key of Object.keys(mockEnv)) delete mockEnv[key];
  Object.assign(mockEnv, CONFIGURED);
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("GH1 the app's own assertion", () => {
  it("GH1 signs an RS256 JWT that verifies against the app's public key", () => {
    const token = signAppJwt(readGitHubAppConfig());
    const [header, payload, signature] = token.split(".");

    expect(decodeJwt(token).header).toEqual({ alg: "RS256", typ: "JWT" });
    expect(
      createVerify("RSA-SHA256")
        .update(`${header}.${payload}`)
        .verify(KEYS.publicKey, Buffer.from(String(signature), "base64url")),
    ).toBe(true);
  });

  it("GH1 claims the app id, backdated and inside GitHub's ten-minute cap", () => {
    const { payload } = decodeJwt(signAppJwt(readGitHubAppConfig()));
    const nowSeconds = Math.floor(NOW.getTime() / 1000);

    expect(payload.iss).toBe("123456");
    expect(Number(payload.iat)).toBeLessThan(nowSeconds);
    expect(Number(payload.exp) - nowSeconds).toBeLessThanOrEqual(600);
    expect(Number(payload.exp)).toBeGreaterThan(nowSeconds);
  });

  it("GH1 signs with a key whose newlines were escaped to survive a .env file", () => {
    mockEnv.GITHUB_APP_PRIVATE_KEY = KEYS.privateKey.replace(/\n/g, "\\n");

    expect(() => signAppJwt(readGitHubAppConfig())).not.toThrow();
  });
});

describe("GH3 starting the install", () => {
  it("GH3 sends the admin to the app's install page carrying the state", () => {
    const url = new URL(new GitHubProvider().getAuthUrl("state-1", "unused"));

    expect(url.origin + url.pathname).toBe(
      "https://github.com/apps/scibly-dev/installations/new",
    );
    expect(url.searchParams.get("state")).toBe("state-1");
  });
});

describe("GH4 what the callback becomes", () => {
  it("GH4 turns an installation id into the account it was installed on", async () => {
    authorizes();
    fetchMock.mockResolvedValueOnce(
      ok({ id: 42, account: { id: 777, login: "acme-inc" } }),
    );

    const credential = await new GitHubProvider().completeConnect({
      code: "auth-code",
      installationId: "42",
    });

    expect(credential).toEqual({
      kind: "app_installation",
      installationId: "42",
      workspaceId: "777",
      workspaceName: "acme-inc",
    });
  });

  it("GH4 asks about the installation as the app itself, with a signed JWT", async () => {
    authorizes();
    fetchMock.mockResolvedValueOnce(
      ok({ id: 42, account: { id: 777, login: "acme-inc" } }),
    );

    await new GitHubProvider().completeConnect({
      code: "auth-code",
      installationId: "42",
    });
    const { url, init } = lastRequest();

    expect(url).toBe("https://api.github.com/app/installations/42");
    expect(init.method).toBe("GET");
    expect(
      decodeJwt(init.headers.authorization.split(" ")[1] ?? "").payload,
    ).toMatchObject({ iss: "123456" });
  });

  it("GH4 redeems the code as the app's OAuth client before trusting anything", async () => {
    authorizes();
    fetchMock.mockResolvedValueOnce(
      ok({ id: 42, account: { id: 777, login: "acme-inc" } }),
    );

    await new GitHubProvider().completeConnect({
      code: "auth-code",
      installationId: "42",
    });
    const { url, init } = requestTo("login/oauth/access_token");

    expect(url).toBe("https://github.com/login/oauth/access_token");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      client_id: "Iv23client",
      client_secret: "client-secret",
      code: "auth-code",
    });
  });

  it("GH4 refuses a callback that names no installation", async () => {
    await expect(
      new GitHubProvider().completeConnect({
        code: "auth-code",
        installationId: null,
      }),
    ).rejects.toThrow(/no installation/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GH4 refuses a callback that carries no user authorization to check", async () => {
    await expect(
      new GitHubProvider().completeConnect({
        code: null,
        installationId: "42",
      }),
    ).rejects.toThrow(/no user authorization/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("GH4 refuses an installation the authorizing user cannot reach", async () => {
    fetchMock
      .mockResolvedValueOnce(ok({ access_token: "gho_user" }))
      .mockResolvedValueOnce(failed(404, { message: "Not Found" }));

    await expect(
      new GitHubProvider().completeConnect({
        code: "auth-code",
        // Someone else's installation, submitted by an admin of their own org.
        installationId: "999",
      }),
    ).rejects.toThrow(/not one this user can reach/i);
    expect(
      fetchMock.mock.calls.some((one) =>
        String(one[0]).includes("/app/installations/"),
      ),
    ).toBe(false);
  });

  it("GH4 refuses a code GitHub will not redeem", async () => {
    fetchMock.mockResolvedValueOnce(ok({ error: "bad_verification_code" }));

    await expect(
      new GitHubProvider().completeConnect({
        code: "replayed",
        installationId: "42",
      }),
    ).rejects.toThrow(/bad_verification_code/);
  });

  it("GH4 refuses an installation GitHub gives no account for", async () => {
    authorizes();
    fetchMock.mockResolvedValueOnce(ok({ id: 42, account: null }));

    await expect(
      new GitHubProvider().completeConnect({
        code: "auth-code",
        installationId: "42",
      }),
    ).rejects.toThrow(/names no account/i);
  });
});

describe("GH5 the minted token", () => {
  it("GH5 mints against the installation and hands back only the token", async () => {
    fetchMock.mockResolvedValue(
      ok({ token: "ghs_minted", expires_at: "2026-08-28T13:00:00Z" }),
    );

    const token = await new GitHubProvider().mintAccessToken("42");
    const { url, init } = lastRequest();

    expect(token).toBe("ghs_minted");
    expect(url).toBe(
      "https://api.github.com/app/installations/42/access_tokens",
    );
    expect(init.method).toBe("POST");
  });

  it("GH5 gives up on a request that hangs rather than eating a whole sync hop", async () => {
    fetchMock.mockResolvedValue(ok({ token: "ghs_minted" }));

    await new GitHubProvider().mintAccessToken("42");

    expect(lastRequest().init.signal).toBeInstanceOf(AbortSignal);
  });

  it("GH5 refuses a body that is not the shape it asked for", async () => {
    fetchMock.mockResolvedValue(ok({ token: 12345 }));

    // A cast would have handed a number down as the access token and failed
    // somewhere with no GitHub in the stack trace.
    await expect(new GitHubProvider().mintAccessToken("42")).rejects.toThrow();
  });

  it("GH5 keeps the private key out of every request it makes", async () => {
    fetchMock.mockResolvedValue(ok({ token: "ghs_minted" }));

    await new GitHubProvider().mintAccessToken("42");

    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("PRIVATE KEY");
  });

  it("GH5 carries GitHub's own complaint out, and no credential with it", async () => {
    fetchMock.mockResolvedValue(failed(500, { message: "Server Error" }));

    await expect(new GitHubProvider().mintAccessToken("42")).rejects.toThrow(
      /500 Server Error/,
    );
    await expect(
      new GitHubProvider().mintAccessToken("42"),
    ).rejects.not.toThrow(/PRIVATE KEY|eyJ/);
  });

  it("GH5 reads a 404 as the installation being gone, not as a failed call", async () => {
    fetchMock.mockResolvedValue(failed(404, { message: "Not Found" }));

    await expect(
      new GitHubProvider().mintAccessToken("42"),
    ).rejects.toBeInstanceOf(IntegrationRevokedError);
  });

  it("GH5 asks the app whether the installation is really gone before saying so", async () => {
    fetchMock
      .mockResolvedValueOnce(failed(404, { message: "Not Found" }))
      .mockResolvedValueOnce(ok({ id: 42, account: { id: 7, login: "acme" } }));

    await expect(
      new GitHubProvider().mintAccessToken("42"),
    ).rejects.not.toBeInstanceOf(IntegrationRevokedError);
    expect(lastRequest().url).toBe(
      "https://api.github.com/app/installations/42",
    );
  });

  it("GH5 leaves every other refusal to the caller as an ordinary failure", async () => {
    fetchMock.mockResolvedValue(failed(403, { message: "Forbidden" }));

    await expect(
      new GitHubProvider().mintAccessToken("42"),
    ).rejects.not.toBeInstanceOf(IntegrationRevokedError);
  });
});

describe("GH6 what the installation reaches", () => {
  it("GH6 lists each repository as a grant, asked for with the minted token", async () => {
    fetchMock.mockResolvedValue(
      ok({
        total_count: 2,
        repositories: [
          {
            id: 1,
            full_name: "acme-inc/api",
            html_url: "https://github.com/acme-inc/api",
          },
          {
            id: 2,
            full_name: "acme-inc/web",
            html_url: "https://github.com/acme-inc/web",
          },
        ],
      }),
    );

    const { grants, totalCount } = await new GitHubProvider().listGrants(
      "ghs_minted",
    );

    expect(grants).toEqual([
      { id: "1", name: "acme-inc/api", url: "https://github.com/acme-inc/api" },
      { id: "2", name: "acme-inc/web", url: "https://github.com/acme-inc/web" },
    ]);
    expect(totalCount).toBe(2);
    expect(lastRequest().init.headers.authorization).toBe("Bearer ghs_minted");
    // A page that came back short is the last page; no second request for it.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("GH6 walks past the first hundred, and says so when it stops early", async () => {
    const page = Array.from({ length: 100 }, (_, index) => ({
      id: index,
      full_name: `acme-inc/repo-${index}`,
      html_url: `https://github.com/acme-inc/repo-${index}`,
    }));
    fetchMock.mockResolvedValue(ok({ total_count: 1500, repositories: page }));

    const { grants, totalCount } = await new GitHubProvider().listGrants(
      "ghs_minted",
    );

    // Ten pages is the budget: the settings strip stops there and admits it
    // rather than spending fifteen requests to render a list nobody reads.
    expect(fetchMock).toHaveBeenCalledTimes(10);
    // Fewer than the count: the settings page reads that as "showing a prefix".
    expect(grants).toHaveLength(1000);
    expect(totalCount).toBe(1500);
    expect(lastRequest().url).toContain("page=10");
  });

  it("GH6 says the connection reaches nothing rather than failing", async () => {
    fetchMock.mockResolvedValue(ok({ total_count: 0, repositories: [] }));

    await expect(
      new GitHubProvider().listGrants("ghs_minted"),
    ).resolves.toEqual({ grants: [], totalCount: 0 });
  });
});

describe("GH7 what GitHub is not asked for", () => {
  it("GH7 is not a provider a notebook can import pages from", () => {
    const provider = new GitHubProvider();

    expect(provider).not.toBeInstanceOf(PageIntegrationProvider);
  });
});
