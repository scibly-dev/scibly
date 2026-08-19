import type { PrismaClient } from "../../schema/generated/prisma/client.js";

import { hashCredentialPassword } from "../hash-credential-password.js";

export type SeedCredentialUser = {
  id: string;
  accountId: string;
  name: string;
  email: string;
  password: string;
  username: string;
  image: string;
};

export const seedCredentialUsers = async (
  prisma: PrismaClient,
  users: readonly SeedCredentialUser[],
) => {
  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (existingUser) {
      console.log(`✓ User already exists: ${user.email}`);
      continue;
    }

    const hashedPassword = await hashCredentialPassword(user.password);

    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: true,
        image: user.image,
        username: user.username,
        marketingNotifications: true,
        emailNotifications: true,
        accounts: {
          create: {
            id: user.accountId,
            accountId: user.id,
            providerId: "credential",
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    });

    console.log(`✓ User seeded: ${user.email}`);
  }
};
