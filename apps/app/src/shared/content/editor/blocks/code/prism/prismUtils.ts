import { objectKeys } from "@/lib/object-keys";
import Prism from "@/shared/content/editor/blocks/code/prism/prism";

export const defaultLanguage = "Python";

const internalLanguageOptions = Object.keys(Prism.languages).filter(
  (language) => !["extend", "insertBefore", "DFS", "clike"].includes(language),
);

const languageOptionMap = {
  JavaScript: ["js", "javascript"],
  TypeScript: ["ts", "typescript"],
  Python: ["py", "python"],
  "Plain Text": ["plaintext", "plain"],
  Text: ["text", "txt"],
  Java: "java",
  "C++": "cpp",
  "C#": ["csharp", "cs", "dotnet"],
  Ruby: ["ruby", "rb"],
  C: "c",
  CSS: "css",
  Docker: ["docker", "dockerfile"],
  Erlang: "erlang",
  Git: "git",
  Go: "go",
  Haskell: ["haskell", "hs"],
  HTML: ["markup", "html"],
  XML: ["markup", "xml"],
  SSML: ["markup", "ssml"],
  "Atom Feed": ["markup", "atom"],
  RSS: ["markup", "rss"],
  MathML: ["markup", "mathml"],
  SVG: ["markup", "svg"],
  JavaDoc: "javadoclike",
  LaTeX: ["latex", "tex", "context"],
  Lisp: ["lisp", "elisp", "emacs", "emacs-lisp"],
  Lua: "lua",
  "Markup Templating": "markup-templating",
  MATLAB: "matlab",
  Mermaid: "mermaid",
  Pascal: ["pascal", "objectpascal"],
  Perl: "perl",
  PHP: "php",
  PowerShell: "powershell",
  R: "r",
  Rust: "rust",
  Scala: "scala",
  SQL: "sql",
  YAML: ["yaml", "yml"],
  Zig: "zig",
};

export type LanguageOptions = keyof typeof languageOptionMap;

export const languageOptions = objectKeys(languageOptionMap);

export const getGrammar = (language: LanguageOptions) => {
  if (!languageOptionMap[language]) {
    throw Error(`${language} is not in languageOptionMap`);
  }
  const aliases = languageOptionMap[language];
  const grammarName = Array.isArray(aliases) ? aliases[0] : aliases;
  // SAFETY: `Prism.languages` is typed as its declared grammars rather than a

  return Prism.languages[grammarName as keyof typeof Prism.languages];
};

Object.values(languageOptionMap).every((value) => {
  let missingValue = null;
  if (Array.isArray(value)) {
    const isEveryValueInLanguageOptions = value.every((v) =>
      internalLanguageOptions.includes(v),
    );
    if (!isEveryValueInLanguageOptions) {
      missingValue = value;
    }
  } else {
    const isValueInLanguageOptions = internalLanguageOptions.includes(value);
    if (!isValueInLanguageOptions) {
      missingValue = value;
    }
    return isValueInLanguageOptions;
  }
  if (missingValue) {
    throw Error(`${missingValue} is not in internalLanguageOptions`);
  }
  return value;
});
