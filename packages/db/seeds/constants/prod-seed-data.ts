import type { SeedCredentialUser } from "../helpers/seed-credential-users.js";

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type SeedProdUserOrg = {
  id: string;
  name: string;
  slug: string;
};

export type SeedProdUser = Omit<SeedCredentialUser, "password"> & {
  org?: SeedProdUserOrg;
};

type LocalProdSeedData = {
  password: string;
  users: SeedProdUser[];
};

// Real beta-tester accounts/credentials live in this gitignored file, not in
// git history — see prod-seed-data.local.example.json for the shape. Absent
// on any other checkout (fresh clones, CI), so this seeds nothing there.
const LOCAL_DATA_PATH = fileURLToPath(
  new URL("./prod-seed-data.local.json", import.meta.url),
);

function loadLocalData(): LocalProdSeedData {
  if (!existsSync(LOCAL_DATA_PATH)) {
    return { password: "", users: [] };
  }
  return JSON.parse(readFileSync(LOCAL_DATA_PATH, "utf-8"));
}

const localData = loadLocalData();

export const PROD_SEED_PASSWORD = localData.password;

export const PROD_SEED_USERS: SeedProdUser[] = localData.users;
