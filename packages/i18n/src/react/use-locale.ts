import { useParams } from "next/navigation";

import { getLocale } from "../locale-helpers";

export const useLocale = () => {
  const { lang } = useParams();
  return getLocale(Array.isArray(lang) ? lang[0] : lang, true);
};
