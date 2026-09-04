// HTML collapses whitespace runs, so retyped indentation must not restart the
// preview. ponytail: a whitespace-only change inside a string literal shows one edit late.
export function sameApp(a: string, b: string) {
  return a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();
}
