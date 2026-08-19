import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { parseArgs } from "util";

function parseAndFormatDate(inputDate?: string): { en: string; de: string } {
  const monthsEn = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthsDe = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  let dateObj: Date;
  if (inputDate) {
    dateObj = new Date(inputDate);
    if (isNaN(dateObj.getTime())) {
      console.error(
        `Error: Invalid date format passed to --date: "${inputDate}"`,
      );
      process.exit(1);
    }
  } else {
    dateObj = new Date();
  }

  const year = dateObj.getFullYear();
  const day = dateObj.getDate();
  const monthEn = monthsEn[dateObj.getMonth()];
  const monthDe = monthsDe[dateObj.getMonth()];

  return {
    en: `${monthEn} ${day}, ${year}`,
    de: `${day}. ${monthDe} ${year}`,
  };
}

function formatObjectForTS(obj: any): string {
  const lines = JSON.stringify(obj, null, 2).split("\n");
  return lines.map((line) => line.replace(/"([^"]+)":/g, "$1:")).join("\n");
}

function indent(str: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return str
    .split("\n")
    .map((line) => (line ? pad + line : ""))
    .join("\n");
}

function main() {
  const { values: params } = parseArgs({
    options: {
      title: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
      thumbnail: { type: "string" },
      titleDe: { type: "string" },
      descriptionDe: { type: "string" },
      slug: { type: "string" },
      authorName: { type: "string" },
      authorRole: { type: "string" },
      authorRoleDe: { type: "string" },
      authorAvatar: { type: "string" },
      date: { type: "string" },
      readTime: { type: "string" },
      keywords: { type: "string" },
      keywordsDe: { type: "string" },
      featured: { type: "boolean" },
    },
  });

  const requiredStringParams: Array<keyof typeof params> = [
    "title",
    "description",
    "category",
    "thumbnail",
    "titleDe",
    "descriptionDe",
    "slug",
    "authorName",
    "authorRole",
    "authorRoleDe",
    "authorAvatar",
    "readTime",
    "keywords",
    "keywordsDe",
  ];

  for (const param of requiredStringParams) {
    if (!params[param]) {
      console.error(`Error: --${param} is required`);
      process.exit(1);
    }
  }

  const allowedCategories = [
    "education",
    "product",
    "engineering",
    "design",
    "company",
  ];
  if (!allowedCategories.includes(params.category as string)) {
    console.error(
      `Error: --category must be one of: ${allowedCategories.join(", ")}`,
    );
    process.exit(1);
  }

  const slug = params.slug as string;
  const titleDe = params.titleDe as string;
  const descriptionDe = params.descriptionDe as string;

  const formattedDates = parseAndFormatDate(params.date as string | undefined);
  const date = formattedDates.en;
  const dateDe = formattedDates.de;

  const readTime = Number(params.readTime);
  if (isNaN(readTime) || readTime <= 0) {
    console.error("Error: --readTime must be a positive number");
    process.exit(1);
  }

  const authorName = params.authorName as string;
  const authorRole = params.authorRole as string;
  const authorRoleDe = params.authorRoleDe as string;
  const authorAvatar = params.authorAvatar as string;

  const keywords = (params.keywords as string)
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const keywordsDe = (params.keywordsDe as string)
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const featured = !!params.featured;

  const rootDir = process.cwd();
  const blogDir = path.join(
    rootDir,
    "apps",
    "web",
    "src",
    "app",
    "[lang]",
    "blog",
    slug,
  );
  const postsFilePath = path.join(
    rootDir,
    "apps",
    "web",
    "src",
    "app",
    "[lang]",
    "blog",
    "components",
    "posts.ts",
  );

  console.log(`\nCreating blog post: ${params.title} (slug: ${slug})`);
  console.log(`Target directory: ${blogDir}`);

  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  } else {
    console.warn(`Warning: Directory for slug '${slug}' already exists.`);
  }

  const enMdxContent = `import { PostLayout } from "../components/post-layout";

export const metadata = {
  title: "${params.title}",
  description: "${params.description}",
  date: "${date}",
  readTime: ${readTime},
  category: "${params.category}",
  author: {
    name: "${authorName}",
    role: "${authorRole}",
    avatar: "${authorAvatar}"
  },
  thumbnail: "${params.thumbnail}",
  keywords: ${JSON.stringify(keywords)}
};

<PostLayout metadata={metadata} lang="en">

Write your English content here...

## Section Title

Example paragraph explaining a cool concept.

<Callout type="tip">
  This is a useful writing tip callout.
</Callout>

</PostLayout>
`;

  fs.writeFileSync(path.join(blogDir, "en.mdx"), enMdxContent, "utf8");
  console.log("✓ Created en.mdx");

  const deMdxContent = `import { PostLayout } from "../components/post-layout";

export const metadata = {
  title: "${titleDe}",
  description: "${descriptionDe}",
  date: "${dateDe}",
  readTime: ${readTime},
  category: "${params.category}",
  author: {
    name: "${authorName}",
    role: "${authorRoleDe}",
    avatar: "${authorAvatar}"
  },
  thumbnail: "${params.thumbnail}",
  keywords: ${JSON.stringify(keywordsDe)}
};

<PostLayout metadata={metadata} lang="de">

Schreiben Sie Ihren deutschen Inhalt hier...

## Abschnitts-Titel

Ein Absatz zur Erklärung eines tollen Konzepts.

<Callout type="tip">
  Dies ist ein nützlicher Tipp-Hinweis.
</Callout>

</PostLayout>
`;

  fs.writeFileSync(path.join(blogDir, "de.mdx"), deMdxContent, "utf8");
  console.log("✓ Created de.mdx");

  if (fs.existsSync(postsFilePath)) {
    let postsContent = fs.readFileSync(postsFilePath, "utf8");

    const enPostObj: any = {
      slug,
      title: params.title,
      description: params.description,
      date,
      readTime,
      category: params.category,
      author: {
        name: authorName,
        role: authorRole,
        avatar: authorAvatar,
      },
      thumbnail: params.thumbnail,
      keywords,
    };
    if (featured) {
      enPostObj.featured = true;
    }

    const dePostObj: any = {
      slug,
      title: titleDe,
      description: descriptionDe,
      date: dateDe,
      readTime,
      category: params.category,
      author: {
        name: authorName,
        role: authorRoleDe,
        avatar: authorAvatar,
      },
      thumbnail: params.thumbnail,
      keywords: keywordsDe,
    };
    if (featured) {
      dePostObj.featured = true;
    }

    const formattedEn = formatObjectForTS(enPostObj);
    const formattedDe = formatObjectForTS(dePostObj);

    postsContent = postsContent.replace(
      /en:\s*\[/,
      `en: [\n${indent(formattedEn, 4)},`,
    );
    postsContent = postsContent.replace(
      /de:\s*\[/,
      `de: [\n${indent(formattedDe, 4)},`,
    );

    fs.writeFileSync(postsFilePath, postsContent, "utf8");
    console.log("✓ Registered in posts.ts");

    try {
      console.log("Formatting files with Prettier...");
      execSync(`npx prettier --write "${blogDir}/*" "${postsFilePath}"`, {
        stdio: "ignore",
      });
      console.log("✓ Formatted files");
    } catch {
      console.warn("Warning: Failed to auto-format files with Prettier.");
    }
  } else {
    console.error(
      `Error: Registration registry not found at '${postsFilePath}'`,
    );
  }

  console.log("\nSuccess! Blog post scaffolded successfully.");
}

main();
