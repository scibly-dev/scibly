---
name: create-blog-post
description: Create a new blog post in Scibly LMS. Generates localized MDX pages (English and German), wires up metadata, appends/prepends to posts index, and formats changes. Use when creating or staging a new blog entry.
---

# Creating Blog Posts

This skill contains instructions and automation for adding new blog posts to Scibly LMS. Blog posts are fully localized (English and German) and powered by Next.js and MDX.

---

## Blog Directory Structure

Each blog post resides in its own folder under `apps/web/src/app/[lang]/blog/<slug>/` containing only the localized MDX files:
```
apps/web/src/app/[lang]/blog/<slug>/
├── en.mdx        # English content
└── de.mdx        # German content
```

Routing is handled dynamically by a single page file at:
- `apps/web/src/app/[lang]/blog/[slug]/page.tsx`

Furthermore, the post must be registered in the central registry:
- `apps/web/src/app/[lang]/blog/components/posts.ts`

---

## Author

**Felix is the author on all Scibly blog articles.** Always use:
```
--authorName "Felix"
--authorRole "Co-Founder, Scibly"
--authorRoleDe "Co-Founder, Scibly"
--authorAvatar "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80"
```

---

## Reader Persona Framework

Every article targets exactly one primary persona. Writing tone, examples, and CTA must be calibrated to that persona.

| ID | Persona | Profile | Core concern |
|----|---------|---------|--------------|
| **P1** | Lena, L&D Managerin | 35, Unternehmen 200–500 MA, koordiniert Schulungen | Praktische Umsetzbarkeit, Zeitersparnis |
| **P2** | Thomas, HR-Direktor | 45, Konzern, verantwortet Compliance & Reporting | ROI, Nachweisbarkeit, DSGVO-Konformität |
| **P3** | Maria, Geschäftsführerin | 50, Mittelstand 20–80 MA, kein L&D-Team | Einfachheit, Kosten, schneller Einstieg |
| **P4** | Alex, Instructional Designer | 30, Freelancer / Agentur | Methodik, Didaktik, Tool-Vergleiche |

### Persona Review Checklist

Before finalizing any article, answer all 5 questions for the assigned persona. If any answer is "no", revise before writing the final MDX.

1. **Hook** — Does the opening paragraph name a real pain point this persona feels daily?
2. **Actionability** — Does every `##` section leave the reader with something to *do*, not just *know*?
3. **Tone fit** — Is the language calibrated to the persona's seniority and technical depth?
4. **Examples** — Are examples drawn from the persona's company size and industry context?
5. **CTA** — Does the article end with a clear next step (try Scibly, link to related article, etc.)?

---

## Article Creation Workflow

### Step 1 — Scaffold with CLI

```bash
pnpx tsx .agents/skills/create-blog-post/scripts/create-post.ts \
  --slug "<slug>" \
  --title "<EN title>" \
  --titleDe "<DE title>" \
  --description "<EN meta description, 140-160 chars>" \
  --descriptionDe "<DE meta description, 140-160 chars>" \
  --category "education" \
  --readTime <N> \
  --authorName "Felix" \
  --authorRole "Co-Founder, Scibly" \
  --authorRoleDe "Co-Founder, Scibly" \
  --authorAvatar "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80" \
  --thumbnail "https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=1200&h=630&q=80" \
  --keywords "<kw1, kw2, kw3, kw4, kw5>" \
  --keywordsDe "<kw1, kw2, kw3, kw4, kw5>"
```

### Step 2 — Draft DE content first

German is the primary market. Write `de.mdx` before `en.mdx`.

Structure:
- **Intro (no heading):** ~2 paragraphs, opens with persona pain point
- **3–5 `##` sections:** each delivers one concrete insight or action
- **`###` sub-sections** where needed for TOC clarity
- **1–2 `<Callout>` blocks** (`tip`, `info`, or `warning`) for key takeaways
- **Closing CTA** linking to Scibly trial or a related article
- Target length: 1200–1800 words (5–7 min read time)

**German articles use "du" (informal), not "Sie" (formal).** Every pronoun, verb conjugation, and imperative must be in du-Form.

### Step 3 — Persona Review

Run the 5-point checklist above. Revise until all 5 pass.

### Step 4 — Translate to EN

Write `en.mdx` — not a literal translation, but a fluent EN version adapted for tone (US/UK L&D audiences expect slightly more direct, less formal copy).

### Step 5 — Verify

```bash
pnpm check
pnpm --filter @scibly/web build
# Test: /de/blog/<slug> and /en/blog/<slug>
```

---

## CLI Arguments Reference

- `--title` (Required): English title.
- `--description` (Required): English meta description (140–160 chars).
- `--category` (Required): `education`, `product`, `engineering`, `design`, or `company`.
- `--thumbnail` (Required): Unsplash URL, `fit=crop&w=1200&h=630&q=80`.
- `--titleDe` (Required): German title.
- `--descriptionDe` (Required): German meta description.
- `--slug` (Required): URL path slug.
- `--authorName` (Required): Author's name.
- `--authorRole` (Required): English role.
- `--authorRoleDe` (Required): German role.
- `--authorAvatar` (Required): Avatar URL, `fit=crop&w=256&h=256&q=80`.
- `--readTime` (Required): Reading time in minutes (number).
- `--keywords` (Required): Comma-separated English SEO keywords.
- `--keywordsDe` (Required): Comma-separated German SEO keywords.
- `--date` (Optional): Publication date. Defaults to today. German date is derived automatically.
- `--featured` (Optional): `true` to make this the hero post. Only one post should be featured.

---

## Writing Style Guide

### Tone of Voice
- Direct and specific. Name real tools, real numbers, real consequences.
- Conversational, not corporate. Write like a practitioner talking to a peer.
- No preamble. Start with the point.

### Structure
- No top-level `#` heading — the layout generates the `<h1>` from metadata.
- Use `##` for major sections, `###` for sub-topics.
- Short paragraphs. One idea per paragraph.
- Use `<Callout>` for key insights or warnings, not for decoration.

### What to Avoid

**Em dashes:** Don't use em dashes (`—`) as a stylistic crutch. If you need to set off a clause, use a comma or rewrite the sentence. Em dashes are acceptable for genuine parenthetical interruptions (rare), not as a general pause mechanism.

**Fake dialectic / "not just X, it's Y" pattern:** Never write sentences in this form:
- "X is not just a Y; it's a Z."
- "It's not just a tool — it's a mindset."
- "This is not just about training; it's about culture."

This pattern is ubiquitous in corporate marketing copy and press releases. It signals empty rhetoric. Make the actual claim instead: what specifically makes it valuable? Say that.

❌ `"E-Learning ist nicht nur ein Tool — es ist eine Transformation."`
✅ `"E-Learning verkürzt die Zeit bis zur ersten selbstständigen Aufgabe von Wochen auf Tage."`

**AI clichés to avoid:**
- "In der heutigen schnelllebigen Welt..." / "In today's fast-paced world..."
- "Es ist wichtiger denn je..." / "More important than ever..."
- "Nahtlos", "revolutionär", "transformativ" used vaguely
- Vague rhetorical questions as section openers

**Lists for everything:** Not every point needs a bullet. Use prose when ideas connect. Use bullets when items are genuinely enumerable and parallel.

### Callout Usage
```mdx
<Callout type="tip">
  Specific, actionable takeaway. Not a restatement of what was just said.
</Callout>
```
Types: `tip` (actionable advice), `info` (contextual fact), `warning` (common mistake to avoid), `danger` (serious risk).

---

## Verification Checklist

Before publishing any new blog post:
1. `pnpm check` — type safety and linter pass
2. `pnpm --filter @scibly/web build` — static generation completes
3. Test `/en/blog/<slug>` and `/de/blog/<slug>` in browser
4. `<title>` tag includes post title + "| Scibly Blog"
5. OG image is the Unsplash thumbnail
6. Sitemap includes the new slug at both locales
7. Blog index shows the new card under correct category filter
8. Table of Contents correctly reflects `##` / `###` headings
9. DE version uses "du" throughout (no "Sie", "Ihnen", "Ihr")
