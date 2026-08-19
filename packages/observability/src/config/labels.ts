import type { Locale } from "@scibly/i18n/constants";
import type { ConsentLabels } from "./types";

import { getLocale } from "@scibly/i18n";

import deConsent from "../consent/de.json";
import enConsent from "../consent/en.json";

const consentByLocale = {
  en: enConsent,
  de: deConsent,
} satisfies Record<Locale, ConsentLabels>;

export function getConsentLabels(locale: Locale): ConsentLabels {
  return consentByLocale[getLocale(locale, true)] ?? enConsent;
}
