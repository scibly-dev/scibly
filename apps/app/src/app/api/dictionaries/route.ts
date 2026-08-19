import { getLocale } from "@scibly/i18n";
import { DICTIONARY_LOCALE_QUERY_PARAM } from "@scibly/routes";
import { NextResponse } from "next/server";

import { getFullDictionary } from "@/i18n/dictionaries";

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const requestUrl = baseUrl
    ? new URL(request.url, baseUrl)
    : new URL(request.url);
  const { searchParams } = requestUrl;
  const locale = getLocale(
    searchParams.get(DICTIONARY_LOCALE_QUERY_PARAM),
    true,
  );

  try {
    const dictionary = await getFullDictionary(locale);
    return NextResponse.json(dictionary);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load dictionary" },
      { status: 500 },
    );
  }
}
