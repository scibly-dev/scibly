import type { UseCasePage } from "./types";

import { useCase as ai_enablement } from "./content/ai-enablement";
import { useCase as healthcare } from "./content/healthcare";
import { useCase as hospitality } from "./content/hospitality";
import { useCase as it_companies } from "./content/it-companies";
import { useCase as logistics } from "./content/logistics";
import { useCase as retail } from "./content/retail";
import { useCase as trades_and_construction } from "./content/trades-and-construction";

export type { UseCaseContent, UseCasePage } from "./types";

export const USE_CASES: UseCasePage[] = [
  it_companies,
  ai_enablement,
  trades_and_construction,
  hospitality,
  healthcare,
  logistics,
  retail,
];

export function getUseCaseCanonicalKey(useCase: UseCasePage): string {
  return useCase.slugEn;
}

export function getUseCaseBySlug(slug: string): UseCasePage | undefined {
  return USE_CASES.find((uc) => uc.slugDe === slug || uc.slugEn === slug);
}
