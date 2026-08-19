import esbuild from "esbuild";
import fs from "fs";
import { JSDOM } from "jsdom";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost",
});
// SAFETY: jsdom's window is not Node's, but ProseMirror only reaches for the
// DOM pieces jsdom does implement, and this runs in a build script.
global.window = dom.window as any;
global.document = dom.window.document;

Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  writable: true,
  configurable: true,
});

process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3001";
process.env.NEXT_PUBLIC_ENV = "test";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
process.env.SKIP_ENV_VALIDATION = "true";
Object.assign(process.env, {
  NODE_ENV: process.env.NODE_ENV ?? "production",
});

if (typeof global.structuredClone === "undefined") {
  global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));
}

const requireFn = createRequire(import.meta.url);

async function main() {
  console.log("Generating editor schema...");

  const appDir = path.join(__dirname, "..");
  const entryPoint = path.join(appDir, "scripts/editor-schema-extractor.ts");
  const tempFile = path.join(appDir, "scripts/tmp-editor-schema.cjs");
  const outputFile = path.join(
    appDir,
    "src/shared/content/editor/html-schema/generated/schema.ts",
  );

  try {
    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      write: false,
      platform: "node",
      format: "cjs",
      loader: {
        ".css": "empty",
      },
      external: ["jsdom"],
    });

    fs.writeFileSync(tempFile, result.outputFiles[0].text);

    const { getEditorSchema } = requireFn(tempFile);
    const schema = getEditorSchema();

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(
      outputFile,
      `export const EDITOR_SCHEMA = ${JSON.stringify(schema)};\n`,
    );

    console.log("✓ Editor schema generated successfully!");
  } catch (err: any) {
    console.error("✗ Failed to generate editor schema:", err.message || err);
    process.exitCode = 1;
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

main();
