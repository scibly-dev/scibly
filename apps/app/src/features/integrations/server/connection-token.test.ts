import type { ConnectionCredential } from "./connection-token";

import { beforeEach, describe, expect, it, vi } from "vitest";

// `$transaction` hands the same doubled client back, so the two writes are
// still observed individually — what is under test is that both happen, and
// that they happen through the transaction.
const db: {
  integrationConnection: { deleteMany: ReturnType<typeof vi.fn> };
  notebookSource: { updateMany: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
} = vi.hoisted(() => {
  const client = {
    integrationConnection: { deleteMany: vi.fn() },
    notebookSource: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  };
  client.$transaction.mockImplementation((run: (tx: unknown) => unknown) =>
    run(client),
  );
  return client;
});
const registry = vi.hoisted(() => ({ getProvider: vi.fn() }));
const crypto = vi.hoisted(() => ({ decryptApiKey: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("./registry", () => registry);
vi.mock("@/lib/crypto/api-key", () => crypto);

const { resolveConnectionToken } = await import("./connection-token");
const { IntegrationRevokedError } = await import("./base-provider");

const INSTALLED: ConnectionCredential = {
  id: "conn_1",
  provider: "GITHUB",
  accessTokenEncrypted: null,
  installationId: "42",
};

function installationProvider(mintAccessToken: () => Promise<string>) {
  return {
    providerId: "GITHUB",
    credential: "app_installation",
    mintAccessToken,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.$transaction.mockImplementation((run: (tx: unknown) => unknown) =>
    run(db),
  );
});

describe("K1 the credential a connection turns into", () => {
  it("K1 mints a fresh token for an installation rather than reading one", async () => {
    registry.getProvider.mockReturnValue(
      installationProvider(() => Promise.resolve("ghs_minted")),
    );

    await expect(resolveConnectionToken(INSTALLED)).resolves.toBe("ghs_minted");
    expect(crypto.decryptApiKey).not.toHaveBeenCalled();
  });

  it("K1 decrypts what an OAuth connection stored", async () => {
    registry.getProvider.mockReturnValue({
      providerId: "NOTION",
      credential: "oauth_tokens",
    });
    crypto.decryptApiKey.mockReturnValue("secret_notion");

    await expect(
      resolveConnectionToken({
        id: "conn_2",
        provider: "NOTION",
        accessTokenEncrypted: "cipher",
        installationId: null,
      }),
    ).resolves.toBe("secret_notion");
  });
});

describe("K2 a connection revoked on the provider's side", () => {
  beforeEach(() => {
    registry.getProvider.mockReturnValue(
      installationProvider(() =>
        Promise.reject(new IntegrationRevokedError("GITHUB")),
      ),
    );
  });

  it("K2 deletes the connection it can no longer stand for", async () => {
    await expect(resolveConnectionToken(INSTALLED)).rejects.toThrow();

    expect(db.integrationConnection.deleteMany).toHaveBeenCalledWith({
      where: { id: "conn_1" },
    });
  });

  it("K2 detaches its sources first, exactly as a disconnect does", async () => {
    await expect(resolveConnectionToken(INSTALLED)).rejects.toThrow();

    const [args] = db.notebookSource.updateMany.mock.calls[0] as [
      { where: { integrationId: string }; data: { warning: string } },
    ];
    expect(args.where.integrationId).toBe("conn_1");
    expect(args.data.warning).toMatch(/GITHUB integration was disconnected/);
  });

  it("K2 gives up both halves together if either fails", async () => {
    db.$transaction.mockRejectedValue(new Error("deadlock"));

    await expect(resolveConnectionToken(INSTALLED)).rejects.toThrow("deadlock");
    expect(db.notebookSource.updateMany).not.toHaveBeenCalled();
    expect(db.integrationConnection.deleteMany).not.toHaveBeenCalled();
  });

  it("K2 says so in its own application code, so the client can explain", async () => {
    await expect(resolveConnectionToken(INSTALLED)).rejects.toMatchObject({
      applicationCode: "integration.revoked",
      code: "NOT_FOUND",
    });
  });

  it("K2 leaves an ordinary minting failure alone", async () => {
    registry.getProvider.mockReturnValue(
      installationProvider(() => Promise.reject(new Error("GitHub is down"))),
    );

    await expect(resolveConnectionToken(INSTALLED)).rejects.toThrow(
      "GitHub is down",
    );
    expect(db.integrationConnection.deleteMany).not.toHaveBeenCalled();
  });
});
