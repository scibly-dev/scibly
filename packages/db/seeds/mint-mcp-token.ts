import { randomBytes, randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { loadPackageEnv } from "@scibly/lib/internal";

import "dotenv/config";

import { PrismaClient } from "../schema/generated/prisma/client.js";

const DEV_CLIENT_ID = "scibly-dev-cli";
const OPT_IN = "SCIBLY_ALLOW_DEV_TOKEN";
const TOKEN_LIFETIME_DAYS = 30;

const env = loadPackageEnv("@scibly/db", {
  DATABASE_URL: process.env.DATABASE_URL,
});

const RUN_COMMAND = `${OPT_IN}=1 pnpm --filter @scibly/db mcp:token`;

// Not a hostname check: docker-compose calls the database `postgres` in
// self-hosted deployments too, so the gate is an opt-in nothing sets by accident.
function assertDevelopmentDatabase() {
  if (process.env.NODE_ENV === "production" || process.env[OPT_IN] !== "1") {
    throw new Error(
      `Refusing to mint a token. This script is for development databases only.\n` +
        `Re-run it deliberately, with NODE_ENV unset or non-production:\n\n  ${RUN_COMMAND}`,
    );
  }
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function resolveUser(email: string | undefined) {
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`No user with email ${email}.`);
    return user;
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
    take: 11,
    orderBy: { createdAt: "asc" },
  });
  if (users.length === 0) throw new Error("No users. Seed the database first.");
  if (users.length > 1) {
    throw new Error(
      `More than one user — say which:\n${users
        .map((user) => `  ${RUN_COMMAND} ${user.email}`)
        .join("\n")}`,
    );
  }
  return users[0]!;
}

async function mint() {
  assertDevelopmentDatabase();

  const user = await resolveUser(process.argv[2]);
  const now = new Date();

  await prisma.oauthApplication.upsert({
    where: { clientId: DEV_CLIENT_ID },
    update: {},
    create: {
      id: randomUUID(),
      name: "Scibly dev CLI",
      clientId: DEV_CLIENT_ID,
      clientSecret: null,
      redirectUrls: "http://localhost:3001/api/auth/mcp/callback",
      type: "public",
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.oauthAccessToken.deleteMany({
    where: { clientId: DEV_CLIENT_ID, userId: user.id },
  });

  const accessToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    now.getTime() + TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.oauthAccessToken.create({
    data: {
      id: randomUUID(),
      accessToken,
      refreshToken: randomBytes(32).toString("hex"),
      accessTokenExpiresAt: expiresAt,
      refreshTokenExpiresAt: expiresAt,
      clientId: DEV_CLIENT_ID,
      userId: user.id,
      scopes: "openid profile email",
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`\nMinted an MCP token for ${user.email}`);
  console.log(`Expires ${expiresAt.toDateString()}\n`);
  console.log(accessToken);
  // Not interpolated into the command below: that would put it in shell history too.
  console.log(`\nPoint a client at it, with the token above:\n`);
  console.log(`  claude mcp remove scibly`);
  console.log(
    `  claude mcp add --transport http scibly http://localhost:3001/api/mcp --header "Authorization: Bearer <token>"\n`,
  );
}

mint()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
