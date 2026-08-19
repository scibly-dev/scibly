import { hashPassword } from "better-auth/crypto";

export const hashCredentialPassword = (password: string) =>
  hashPassword(password);
