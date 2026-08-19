import path from "node:path";

const PUBLIC_FEATURE_ENTRIES = new Set(["client", "contracts", "server"]);

// Plain, dependency-free generated constants (no @prisma/client, pg, or
// better-auth runtime) — safe to ship in a client bundle unlike the rest of the package.
const CLIENT_SAFE_DB_SUBPATHS = new Set([
  "@scibly/db/enums",
  "@scibly/db/plan-catalogue",
  "@scibly/db/topup-catalogue",
  "@scibly/db/types",
]);

const normalizePath = (filePath) => filePath.split(path.sep).join("/");

const sourceRelativePath = (filePath) =>
  normalizePath(filePath).match(/(?:^|\/)src\/(.+)$/u)?.[1] ?? "";

const topLevelFeature = (filePath) =>
  sourceRelativePath(filePath).match(/^features\/([^/]+)(?:\/|$)/u)?.[1];

const hasUseClientDirective = (sourceCode) =>
  sourceCode.ast.body.some(
    (statement) =>
      statement.type === "ExpressionStatement" &&
      statement.directive === "use client",
  );

const isTypeOnlyImport = (node) =>
  node.importKind === "type" ||
  (node.specifiers.length > 0 &&
    node.specifiers.every((specifier) => specifier.importKind === "type"));

const isContractsFile = (filePath) =>
  /\/contracts\.[cm]?[jt]sx?$/u.test(normalizePath(filePath)) ||
  normalizePath(filePath).includes("/contracts/");

const isPublicFeatureImport = (specifier) =>
  PUBLIC_FEATURE_ENTRIES.has(specifier.split("/").at(-1));

const isLegacyProductRouterPath = (filePath) =>
  sourceRelativePath(filePath).startsWith("server/api/routers/");

const resolvesToLegacyProductRouter = (filePath, specifier) => {
  if (specifier.startsWith("@/server/api/routers")) return true;
  if (!specifier.startsWith(".")) return false;
  return isLegacyProductRouterPath(
    path.resolve(path.dirname(filePath), specifier),
  );
};

const upwardDependencyMessage = (filePath, specifier) => {
  const relativePath = sourceRelativePath(filePath);
  if (
    relativePath.startsWith("shared/") &&
    specifier.startsWith("@/features/")
  ) {
    return "Shared capabilities may not import product features.";
  }
  if (
    relativePath.startsWith("lib/") &&
    /^@\/(?:features|shared)\//u.test(specifier)
  ) {
    return "Generic lib code may not import features or shared LMS capabilities.";
  }
  return null;
};

const crossFeatureMessage = (filePath, specifier) => {
  const importerFeature = topLevelFeature(filePath);
  const targetFeature = specifier.match(/^@\/features\/([^/]+)(?:\/|$)/u)?.[1];
  if (
    importerFeature &&
    targetFeature &&
    importerFeature !== targetFeature &&
    !isPublicFeatureImport(specifier)
  ) {
    return "Cross-feature imports must use an explicit client, contracts, or server entry.";
  }
  return null;
};

const relativeBoundaryMessage = (filePath, specifier) => {
  if (!specifier.startsWith(".")) return null;
  const importerFeature = topLevelFeature(filePath);
  if (!importerFeature) return null;
  const targetPath = path.resolve(path.dirname(filePath), specifier);
  const targetFeature = topLevelFeature(targetPath);
  return targetFeature && targetFeature !== importerFeature
    ? "Relative imports may not cross top-level feature owners."
    : null;
};

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce feature ownership, downward dependencies, and runtime boundaries.",
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const filePath = context.filename;
    const clientFile = hasUseClientDirective(sourceCode);
    const contractsFile = isContractsFile(filePath);

    return {
      Program(node) {
        if (isLegacyProductRouterPath(filePath)) {
          context.report({
            node,
            message:
              "Product routers must live in their recursive feature owner.",
          });
        }
      },
      ImportDeclaration(node) {
        const specifier = node.source.value;
        if (typeof specifier !== "string") return;
        const typeOnly = isTypeOnlyImport(node);

        if (resolvesToLegacyProductRouter(filePath, specifier)) {
          context.report({
            node: node.source,
            message:
              "Imports from server/api/routers are forbidden; use the feature-owned API.",
          });
          return;
        }

        if (
          /^@\/(?:modules|platform|editor)\//u.test(specifier) ||
          specifier.startsWith("@/shared/content-documents")
        ) {
          context.report({
            node: node.source,
            message:
              "Legacy modules, platform, editor, and content-document imports are forbidden.",
          });
          return;
        }

        const architectureMessage =
          upwardDependencyMessage(filePath, specifier) ??
          crossFeatureMessage(filePath, specifier) ??
          relativeBoundaryMessage(filePath, specifier);
        if (architectureMessage) {
          context.report({ node: node.source, message: architectureMessage });
          return;
        }

        if (
          contractsFile &&
          !typeOnly &&
          (specifier === "react" ||
            specifier.startsWith("react/") ||
            specifier === "next" ||
            specifier.startsWith("next/") ||
            specifier === "@scibly/db" ||
            specifier.startsWith("@scibly/db/") ||
            specifier.startsWith("@/server/"))
        ) {
          context.report({
            node: node.source,
            message:
              "Contracts may depend only on transport-agnostic types and schemas.",
          });
          return;
        }

        if (
          clientFile &&
          !typeOnly &&
          (specifier === "server-only" ||
            specifier === "next/headers" ||
            specifier === "next/server" ||
            specifier === "@scibly/db" ||
            (specifier.startsWith("@scibly/db/") &&
              !CLIENT_SAFE_DB_SUBPATHS.has(specifier)) ||
            specifier === "@scibly/auth/session" ||
            specifier.startsWith("@/server/") ||
            /^@\/(?:features|shared)\/.+\/server(?:\/|$)/u.test(specifier))
        ) {
          context.report({
            node: node.source,
            message: "Client code may not import server-only dependencies.",
          });
        }
      },
    };
  },
};

const architectureBoundaries = {
  rules: {
    boundaries: rule,
  },
};

export default architectureBoundaries;
