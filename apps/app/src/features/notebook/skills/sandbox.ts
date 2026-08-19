import type { SkillSandbox } from "./types";

import fs from "node:fs/promises";

export const nodeSandbox: SkillSandbox = {
  readFile: (path, encoding) => fs.readFile(path, encoding),
  readdir: (path, opts) => fs.readdir(path, opts),
  realpath: (path) => fs.realpath(path),
};
