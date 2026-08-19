export const formatCount =
  (lang: string) =>
  (value: number): string =>
    value.toLocaleString(lang);
