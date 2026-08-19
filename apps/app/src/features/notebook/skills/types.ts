export interface SkillMetadata {
  name: string;
  description: string;
  path: string;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
}

export interface SkillSandbox {
  readFile(path: string, encoding: "utf-8"): Promise<string>;
  readdir(
    path: string,
    opts: { withFileTypes: true },
  ): Promise<{ name: string; isDirectory(): boolean }[]>;

  realpath(path: string): Promise<string>;
}
