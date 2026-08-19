import { env } from "@/env";

const URL_REGEX =
  /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/g;

export const isUrl = (str: string) => {
  const regex = new RegExp(URL_REGEX);
  return regex.test(str);
};

export const resolveBlockDocUrl = (
  blockCategorie: "media" | "advanced" | "interactive" | "question",
  blockType: string,
  lang: "de" = "de",
) => {
  return `${env.NEXT_PUBLIC_DOCS_URL}/editor-guide/${lang}/blocks/${blockCategorie}#${blockType}`;
};

export const isNullOrUndefined = (value?: any) => value == null;

export const cleanTitleText = (text: string, maxLength = 60): string => {
  const singleLine = text.replace(/[\r\n]+/g, " ");
  const clean = singleLine.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength).trim() + "...";
};
