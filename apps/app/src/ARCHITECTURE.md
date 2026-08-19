# Recursive feature architecture

Application code follows this target:

```text
src/
├── app/                    # URL map and Next.js boundaries only
├── features/               # Product behavior, recursively grouped
│   ├── auth/
│   ├── organizations/
│   ├── course-authoring/
│   ├── learning/
│   ├── notebook/
│   └── integrations/
├── shared/                 # LMS-specific capabilities used by top-level features
└── lib/                    # Low-level helpers with no LMS vocabulary
```

Do not create empty target folders in advance. A folder appears only when its
first owned implementation moves.

## Find the lowest common owner

Place code at the narrowest folder that owns all of its callers:

1. Code used by one leaf stays in that leaf.
2. Code used by sibling leaves moves only to their closest common parent.
3. LMS-specific code used by multiple top-level features moves to
   `shared/<capability>`.
4. Domain-agnostic code moves to `lib/<capability>`.
5. Calling another feature's public operation does not transfer ownership of
   that operation.

For example, a Notebook source parser used only by ingestion belongs in
`features/notebook/sources/ingestion`. Shared source-list UI belongs at
`features/notebook/sources`. Content grading rules used by Course Authoring and
Learning belong in `shared/content`. A generic retry helper belongs in
`lib/retry`.

The editor follows the same ownership rule. Authoring chrome, menus, AI
insertion, and background document mutations belong to
`features/course-authoring/scenes/editor`. Notebook may invoke those operations
through `features/course-authoring/client`; doing so does not transfer their
ownership to Notebook or Shared. Rendering, assessment state, document
encoding, and block primitives used by both Course Authoring and Learning live
under the focused `shared/content/editor` capability. The retired root
`src/editor` and sibling `shared/content-documents` capability must not return.
Mounted editor and session behavior lives under
`shared/content/editor/runtime`: editor orchestration, mounted command
contracts, capability and store contexts, runtime hooks, render helpers, and
theme integration remain one cohesive runtime owner. Blocks, extensions,
assessment, documents, `html-schema`, collaboration, media, styles, and `lib`
are direct peer capabilities under `shared/content/editor`; the retired
`shared/content/editor/core`, `blocks/shared-components`, `blocks/schema`,
`editor/schema`, and `editor/registry` layers must not return.
Shared block chrome (settings UI, React block wrapper, QA celebration tokens)
lives under `blocks/ui`, not inside individual block owners.
Course structure validation, lesson icons, scene/course sync hooks, and shared
course UI belong under `shared/content/course`. The retired
`shared/content/hooks`, `shared/content/components`, and `shared/content/internal`
dump folders must not return.

Each editor block owns its schema, TipTap node factory, client view, markdown
adapter, grading parser, tests, and block-specific metadata in a colocated
`definition.ts`. Question, media, and math block categories live under
`blocks/questions`, `blocks/media`, and `blocks/math`, respectively. Question
blocks keep both markdown and grading implementations under their local
`parser/` directory. `blocks/registry/shared.ts` is the only
ordered schema catalog and remains free of React, CSS, DOM, and browser imports.
It registers owner-local definitions and derives document groups, scene
classification, media ordering, and stable-ID membership from them.
Owner-local `use client` binding modules materialize React or DOM NodeViews by
node name. `blocks/registry/client.ts` aggregates those bindings and validates
them against the shared schema catalog. Shared and server registry code never
imports client modules; server code consumes raw extensions and question
definitions directly from the shared registry, so there is no server registry.
Adding a custom block requires its owner-local `definition.ts`, one shared
catalog entry, and one owner-local client NodeView binding when the block has a
custom view.
Upload API, upload UI, and reusable media service utilities live under
`shared/content/editor/media`, outside block ownership. Concrete image, audio,
and video blocks remain under `shared/content/editor/blocks/media`.
Framework schema belongs to focused block owners too: `text-schema` owns the
schema-aware text and formatting packs, while `document`, `markdown`, and
`stable-id` own their configured extensions. Document content and stable-ID
targets are materialized from context derived from the single shared catalog;
question contracts and localized slash-command groups are projections of that
same catalog, not secondary registration lists. Every active slash command is
declared by its owning `definition.ts`; only the five structural group titles
live centrally beside the registry. The slash extension applies cross-cutting
visibility and AI-credit filtering without owning command copy or actions.
Client-only editor behavior follows the same ownership rule under
`extensions`: runtime extensions and blocks are peer concepts directly below
the editor capability. Each runtime concern exposes an owner-local
`definition.ts` with its canonical name, owner path, factory, and placement
before a schema anchor or in the end phase. `extensions/registry/client.ts` is
the ordered runtime catalog. Its finalized registry merges those definitions
into the one complete list returned by `getClientSchemaExtensions()`,
preserving schema order without extracting or rebuilding schema packs in the
entry point. `extensions/index.ts` only joins those two registries and retains
the public configuration types.
Cross-block grading, publish artifacts, learner-state stripping, publish
validation, and the content pipeline characterization tests belong to
`shared/content/editor/assessment`, grouped by concern: `parsing/` (parser
registry, base parser types, block traversal helpers, char-limit validation),
`grading/` (submission grading, QA block store, inject-student-answers,
document block order), `publish/` (strip-yxml, publish artifacts, publish
validation), and `learner/` (authoring-field stripping). Question parser
characterization tests colocate under each owner's
`blocks/questions/*/parser/` directory; the retired `assessment/qa-block-parser`
folder must not return. Product features
import the `shared/content/client` or `shared/content/server` facade; code
inside the editor capability imports its recursive owner directly.

Parent folders are not implementation dump sites. When `product-card` and
`product-preview` have separate behavior, they remain separate recursive
features:

```text
features/products/
├── product-card/
│   ├── components/
│   ├── hooks/
│   ├── i18n/
│   └── product-card.test.tsx
└── product-preview/
    ├── components/
    └── i18n/
```

Local `components`, `hooks`, `api`, `server`, `schemas`, `utils`, `i18n`, and
test folders are optional. Create one only when the owner needs it. Avoid
generic product folders named `helpers` or `services`; choose the business
capability or technical primitive they actually contain.

Translations obey the same rule. A leaf owns its strings, siblings share only
at their closest parent, and strings used across top-level features belong in
`shared/<capability>/i18n`. The i18n merge script scans `src` recursively, so
moving a fragment does not require a central re-export.

## Dependency direction

Dependencies point downward:

```text
app → features → shared → lib
```

- A feature may use relative imports anywhere inside its own top-level owner.
- A consumer outside that owner imports a small explicit entry file such as
  `client.ts`, `server.ts`, or `contracts.ts`.
- A feature may call another feature through such an entry file, but may not
  import its internal `components`, `hooks`, `api`, `schemas`, or `utils`.
- `shared` may depend on other `shared` capabilities and `lib`, never on
  `features` or `app`.
- `lib` may not depend on `features`, `shared`, `modules`, `platform`, `server`,
  or `app`. It must not contain course, scene, learner, notebook, organization,
  or other LMS business knowledge.

Entry files are optional. Do not add pass-through wrappers, schema aliases,
whole-subtree barrels, or folders containing only a re-export.

## Keep routes thin

App Router files preserve the URL and adapt framework input:

- `page.tsx` unwraps route parameters and renders one feature-owned screen.
- `layout.tsx` defines a URL-scoped boundary and composes a feature-owned shell.
- `loading.tsx`, `error.tsx`, and `not-found.tsx` render feature-owned states.
- `route.ts` validates transport input, invokes one feature operation, and maps
  the response.

Feature components, hooks, schemas, queries, and workflows do not live below
`app`. Root layouts and global error boundaries may retain genuinely global
Next.js setup.

## Readability budget

Rewritten production code targets functions of at most 80 lines, cyclomatic
complexity of at most 12, and files of at most 300 lines. Reviewed exceptions
are limited to static or generated data. Split large tests by behavior instead
of exempting them wholesale.

The structural architecture tests cover recursive ownership, dependency
direction, route thinness, public feature boundaries, and the absence of the
retired `modules` and `platform` roots.
