import type { Locale } from "@scibly/i18n/constants";

import { constructMetadata } from "@scibly/lib";
import { linkClass } from "@scibly/ui/design-language";

import { getFullDictionary } from "@/i18n/dictionaries";
import { buildLocaleAlternates } from "@/lib/metadata";

import {
  LegalContactValue,
  legalHeadingClass,
  LegalPage,
  legalSubheadingClass,
} from "../components/legal-page-content";

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const dict = await getFullDictionary(lang);
  const { canonicalUrl, languages } = buildLocaleAlternates("/impressum", lang);

  return {
    ...constructMetadata({
      title: dict.legal.metadata.impressumTitle,
      description: dict.legal.metadata.impressumDesc,
      url: canonicalUrl,
      noIndex: true,
      locale: lang,
    }),
    alternates: { canonical: canonicalUrl, languages },
  };
}

const ImpressumPage = async (_props: { params: Promise<{ lang: Locale }> }) => {
  return (
    <LegalPage title="Impressum">
      <div>
        <h2 className={legalHeadingClass}>Angaben gemäß § 5 TMG</h2>
      </div>
      <div>
        <p>
          <LegalContactValue text="Niclas Gregor & Felix Künnecke" />
        </p>
        <p>
          <LegalContactValue text="Bahnhofstr. 1" className="block" />
          <LegalContactValue text="68526 Ladenburg" className="block" />
        </p>
      </div>

      <div>
        <h2 className={legalHeadingClass}>Kontakt</h2>
        <p>
          E-Mail:{" "}
          <a href="mailto:team@scibly.com" className={linkClass}>
            team@scibly.com
          </a>
          <LegalContactValue text="0176 97672464" className="block" />
        </p>
      </div>

      <div>
        <h2 className={legalHeadingClass}>Haftungsausschluss</h2>
        <h3 className={legalSubheadingClass}>Haftung für Inhalte</h3>
        <p className="mb-4">
          Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für
          die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir
          jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7
          Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen
          Gesetzen verantwortlich.
        </p>
        <h3 className={legalSubheadingClass}>Haftung für Links</h3>
        <p>
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
          fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
          verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
          Seiten verantwortlich.
        </p>
      </div>

      <div>
        <h2 className={legalHeadingClass}>Urheberrecht</h2>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
          Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
          Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
          jeweiligen Autors bzw. Erstellers.
        </p>
      </div>
    </LegalPage>
  );
};

export default ImpressumPage;
