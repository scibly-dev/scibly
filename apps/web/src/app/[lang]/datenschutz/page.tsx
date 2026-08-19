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
  const { canonicalUrl, languages } = buildLocaleAlternates(
    "/datenschutz",
    lang,
  );

  return {
    ...constructMetadata({
      title: dict.legal.metadata.datenschutzTitle,
      description: dict.legal.metadata.datenschutzDesc,
      url: canonicalUrl,
      noIndex: true,
      locale: lang,
    }),
    alternates: { canonical: canonicalUrl, languages },
  };
}

const DatenschutzPage = async (_props: {
  params: Promise<{ lang: Locale }>;
}) => {
  return (
    <LegalPage title="Datenschutzerklärung">
      <div>
        <h2 className={legalHeadingClass}>1. Datenschutz auf einen Blick</h2>
        <h3 className={legalSubheadingClass}>Allgemeine Hinweise</h3>
        <p className="mb-4">
          Die folgenden Hinweise geben einen einfachen Überblick darüber, was
          mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website
          besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
          persönlich identifiziert werden können. Ausführliche Informationen zum
          Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten
          Datenschutzerklärung.
        </p>

        <h3 className={legalSubheadingClass}>
          Datenerfassung auf dieser Website
        </h3>
        <p className="mb-2 font-semibold text-[#3c477a]">
          Wer ist verantwortlich für die Datenerfassung auf dieser Website?
        </p>
        <p className="mb-4">
          Die Datenverarbeitung auf dieser Website erfolgt durch den
          Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt
          &ldquo;Hinweis zur Verantwortlichen Stelle&rdquo; in dieser
          Datenschutzerklärung entnehmen.
        </p>

        <p className="mb-2 font-semibold text-[#3c477a]">
          Wie erfassen wir Ihre Daten?
        </p>
        <p className="mb-4">
          Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese
          mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein
          Kontaktformular eingeben. Andere Daten werden automatisch oder nach
          Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme
          erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser,
          Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser
          Daten erfolgt automatisch, sobald Sie diese Website betreten.
        </p>

        <p className="mb-2 font-semibold text-[#3c477a]">
          Wofür nutzen wir Ihre Daten?
        </p>
        <p className="mb-4">
          Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung
          der Website zu gewährleisten. Andere Daten können zur Analyse Ihres
          Nutzerverhaltens verwendet werden. Sofern über die Website Verträge
          geschlossen oder angebahnt werden können, werden die übermittelten
          Daten auch für Vertragsangebote, Bestellungen oder sonstige
          Auftragsanfragen verarbeitet.
        </p>

        <p className="mb-2 font-semibold text-[#3c477a]">
          Welche Rechte haben Sie bezüglich Ihrer Daten?
        </p>
        <p>
          Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft,
          Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu
          erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung
          dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur
          Datenverarbeitung erteilt haben, können Sie diese Einwilligung
          jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht,
          unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer
          personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein
          Beschwerderecht bei der zuständigen Aufsichtsbehörde zu. Hierzu sowie
          zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an
          uns wenden.
        </p>
      </div>

      <div>
        <h2 className={legalHeadingClass}>2. Hosting</h2>
        <p className="mb-4">
          Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
        </p>

        <h3 className={legalSubheadingClass}>Amazon Web Services (AWS)</h3>
        <p className="mb-4">
          Anbieter ist die Amazon Web Services EMEA SARL, 38 Avenue John F.
          Kennedy, 1855 Luxemburg (nachfolgend AWS). Wenn Sie unsere Website
          besuchen, werden Ihre personenbezogenen Daten auf den Servern von AWS
          verarbeitet. Hierbei können auch personenbezogene Daten an das
          Mutterunternehmen von AWS in die USA übermittelt werden. Die
          Datenübertragung in die USA wird auf die EU-Standardvertragsklauseln
          gestützt. Details finden Sie hier:{" "}
          <a
            href="https://aws.amazon.com/de/blogs/security/aws-gdpr-data-processing-addendum/"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            aws.amazon.com
          </a>
          . Weitere Informationen entnehmen Sie der Datenschutzerklärung von
          AWS:{" "}
          <a
            href="https://aws.amazon.com/de/privacy/?nc1=f_pr"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            aws.amazon.com/de/privacy
          </a>
          .
        </p>
        <p className="mb-4">
          Die Verwendung von AWS erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f
          DSGVO. Wir haben ein berechtigtes Interesse an einer möglichst
          zuverlässigen Darstellung unserer Website. Sofern eine entsprechende
          Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich
          auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG.
          Die Einwilligung ist jederzeit widerrufbar.
        </p>
        <p className="mb-4">
          Das Unternehmen verfügt über eine Zertifizierung nach dem &ldquo;EU-US
          Data Privacy Framework&rdquo; (DPF). Weitere Informationen hierzu
          erhalten Sie vom Anbieter unter:{" "}
          <a
            href="https://www.dataprivacyframework.gov/participant/5776"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            dataprivacyframework.gov
          </a>
          .
        </p>

        <h3 className={legalSubheadingClass}>Auftragsverarbeitung</h3>
        <p>
          Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung
          des oben genannten Dienstes geschlossen. Hierbei handelt es sich um
          einen datenschutzrechtlich vorgeschriebenen Vertrag, der
          gewährleistet, dass dieser die personenbezogenen Daten unserer
          Websitebesucher nur nach unseren Weisungen und unter Einhaltung der
          DSGVO verarbeitet.
        </p>
      </div>

      <div>
        <h2 className={legalHeadingClass}>
          3. Allgemeine Hinweise und Pflichtinformationen
        </h2>

        <h3 className={legalSubheadingClass}>Datenschutz</h3>
        <p className="mb-4">
          Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten
          sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und
          entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser
          Datenschutzerklärung. Wir weisen darauf hin, dass die Datenübertragung
          im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken
          aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch
          Dritte ist nicht möglich.
        </p>

        <h3 className={legalSubheadingClass}>
          Hinweis zur verantwortlichen Stelle
        </h3>
        <p className="mb-2">
          Die verantwortliche Stelle für die Datenverarbeitung auf dieser
          Website ist:
        </p>
        <p className="mb-1">
          <LegalContactValue
            text="Niclas Gregor & Felix Künnecke"
            className="text-ink font-semibold"
          />
        </p>
        <p className="mb-1">
          Telefon: <LegalContactValue text="017697672464" />
        </p>
        <p className="mb-4">
          E-Mail:{" "}
          <a href="mailto:team@scibly.com" className={linkClass}>
            team@scibly.com
          </a>
        </p>
        <p className="mb-4">
          Verantwortliche Stelle ist die natürliche oder juristische Person, die
          allein oder gemeinsam mit anderen über die Zwecke und Mittel der
          Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen
          o. Ä.) entscheidet.
        </p>

        <h3 className={legalSubheadingClass}>Speicherdauer</h3>
        <p className="mb-4">
          Soweit innerhalb dieser Datenschutzerklärung keine speziellere
          Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten
          bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie
          ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung
          zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern
          wir keine anderen rechtlich zulässigen Gründe für die Speicherung
          Ihrer personenbezogenen Daten haben (z. B. steuer- oder
          handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall
          erfolgt die Löschung nach Fortfall dieser Gründe.
        </p>

        <h3 className={legalSubheadingClass}>
          Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf
          dieser Website
        </h3>
        <p className="mb-4">
          Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten
          wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit.
          a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO, sofern besondere
          Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet werden. Sind Ihre
          Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher
          Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des
          Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten,
          sofern diese zur Erfüllung einer rechtlichen Verpflichtung
          erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die
          Datenverarbeitung kann ferner auf Grundlage unseres berechtigten
          Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen.
        </p>

        <h3 className={legalSubheadingClass}>
          Empfänger von personenbezogenen Daten
        </h3>
        <p className="mb-4">
          Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit verschiedenen
          externen Stellen zusammen. Dabei ist teilweise auch eine Übermittlung
          von personenbezogenen Daten an diese externen Stellen erforderlich.
          Wir geben personenbezogene Daten nur dann an externe Stellen weiter,
          wenn dies im Rahmen einer Vertragserfüllung erforderlich ist, wenn wir
          gesetzlich hierzu verpflichtet sind (z. B. Weitergabe von Daten an
          Steuerbehörden), wenn wir ein berechtigtes Interesse nach Art. 6 Abs.
          1 lit. f DSGVO an der Weitergabe haben oder wenn eine sonstige
          Rechtsgrundlage die Datenweitergabe erlaubt.
        </p>

        <h3 className={legalSubheadingClass}>
          Widerruf Ihrer Einwilligung zur Datenverarbeitung
        </h3>
        <p className="mb-4">
          Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen
          Einwilligung möglich. Sie können eine bereits erteilte Einwilligung
          jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf
          erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
        </p>

        <h3 className={legalSubheadingClass}>
          Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie
          gegen Direktwerbung (Art. 21 DSGVO)
        </h3>
        {/*
          Art. 21 Abs. 4 DSGVO requires this notice to stand out from the
          surrounding text, so it stays at reading size and full ink.
        */}
        <p className="text-ink mb-4 font-semibold">
          Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder
          f DSGVO erfolgt, haben Sie jederzeit das Recht, aus Gründen, die sich
          aus Ihrer besonderen Situation ergeben, gegen die Verarbeitung Ihrer
          personenbezogenen Daten Widerspruch einzulegen; dies gilt auch für ein
          auf diese Bestimmungen gestütztes Profiling. Die jeweilige
          Rechtsgrundlage, auf denen eine Verarbeitung beruht, entnehmen Sie
          dieser Datenschutzerklärung. Wenn Sie Widerspruch einlegen, werden wir
          Ihre betroffenen personenbezogenen Daten nicht mehr verarbeiten, es
          sei denn, wir können zwingende schutzwürdige Gründe für die
          Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten
          überwiegen oder die Verarbeitung dient der Geltendmachung, Ausübung
          oder Verteidigung von Rechtsansprüchen (Widerspruch nach Art. 21 Abs.
          1 DSGVO). Werden Ihre personenbezogenen Daten verarbeitet, um
          Direktwerbung zu betreiben, so haben Sie das Recht, jederzeit
          Widerspruch gegen die Verarbeitung Sie betreffender personenbezogener
          Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für das
          Profiling, soweit es mit solcher Direktwerbung in Verbindung steht.
          Wenn Sie widersprechen, werden Ihre personenbezogenen Daten
          anschließend nicht mehr zum Zwecke der Direktwerbung verwendet
          (Widerspruch nach Art. 21 Abs. 2 DSGVO).
        </p>

        <h3 className={legalSubheadingClass}>
          Beschwerderecht bei der zuständigen Aufsichtsbehörde
        </h3>
        <p className="mb-4">
          Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein
          Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem
          Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes
          oder des Orts des mutmaßlichen Verstoßes zu. Das Beschwerderecht
          besteht unbeschadet anderweitiger verwaltungsrechtlicher oder
          gerichtlicher Rechtsbehelfe.
        </p>

        <h3 className={legalSubheadingClass}>Recht auf Datenübertragbarkeit</h3>
        <p className="mb-4">
          Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung
          oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich
          oder an einen Dritten in einem gängigen, maschinenlesbaren Format
          aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an
          einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es
          technisch machbar ist.
        </p>

        <h3 className={legalSubheadingClass}>
          Auskunft, Berichtigung und Löschung
        </h3>
        <p className="mb-4">
          Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit
          das Recht auf unentgeltliche Auskunft über Ihre gespeicherten
          personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck
          der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder
          Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema
          personenbezogene Daten können Sie sich jederzeit an uns wenden.
        </p>

        <h3 className={legalSubheadingClass}>
          Recht auf Einschränkung der Verarbeitung
        </h3>
        <p className="mb-2">
          Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer
          personenbezogenen Daten zu verlangen. Hierzu können Sie sich jederzeit
          an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in
          folgenden Fällen:
        </p>
        <ul className="mb-4 list-disc space-y-1.5 pl-5 marker:text-[#b9c3dc]">
          <li>
            Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten
            personenbezogenen Daten bestreiten, benötigen wir in der Regel Zeit,
            um dies zu überprüfen. Für die Dauer der Prüfung haben Sie das
            Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen
            Daten zu verlangen.
          </li>
          <li>
            Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig
            geschah/geschieht, können Sie statt der Löschung die Einschränkung
            der Datenverarbeitung verlangen.
          </li>
          <li>
            Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie
            jedoch zur Ausübung, Verteidigung oder Geltendmachung von
            Rechtsansprüchen benötigen, haben Sie das Recht, statt der Löschung
            die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu
            verlangen.
          </li>
          <li>
            Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt
            haben, muss eine Abwägung zwischen Ihren und unseren Interessen
            vorgenommen werden. Solange noch nicht feststeht, wessen Interessen
            überwiegen, haben Sie das Recht, die Einschränkung der Verarbeitung
            Ihrer personenbezogenen Daten zu verlangen.
          </li>
        </ul>
        <p className="mb-4">
          Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt
          haben, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit
          Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung
          von Rechtsansprüchen oder zum Schutz der Rechte einer anderen
          natürlichen oder juristischen Person oder aus Gründen eines wichtigen
          öffentlichen Interesses der Europäischen Union oder eines
          Mitgliedstaats verarbeitet werden.
        </p>

        <h3 className={legalSubheadingClass}>SSL- bzw. TLS-Verschlüsselung</h3>
        <p className="mb-4">
          Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der
          Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung.
          Eine verschlüsselte Verbindung erkennen Sie daran, dass die
          Adresszeile des Browsers von &ldquo;http://&rdquo; auf
          &ldquo;https://&rdquo; wechselt und an dem Schloss-Symbol in Ihrer
          Browserzeile. Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist,
          können die Daten, die Sie an uns übermitteln, nicht von Dritten
          mitgelesen werden.
        </p>

        <h3 className={legalSubheadingClass}>
          Widerspruch gegen Werbe-E-Mails
        </h3>
        <p>
          Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten
          Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter
          Werbung und Informationsmaterialien wird hiermit widersprochen. Die
          Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im
          Falle der unverlangten Zusendung von Werbeinformationen, etwa durch
          Spam-E-Mails, vor.
        </p>
      </div>

      <div>
        <h2 className={legalHeadingClass}>
          4. Datenerfassung auf dieser Website
        </h2>

        <h3 className={legalSubheadingClass}>Cookies</h3>
        <p className="mb-4">
          Unsere Internetseiten verwenden so genannte &ldquo;Cookies&rdquo;.
          Cookies sind kleine Datenpakete und richten auf Ihrem Endgerät keinen
          Schaden an. Sie werden entweder vorübergehend für die Dauer einer
          Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf
          Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres
          Besuchs automatisch gelöscht. Permanente Cookies bleiben auf Ihrem
          Endgerät gespeichert, bis Sie diese selbst löschen oder eine
          automatische Löschung durch Ihren Webbrowser erfolgt.
        </p>
        <p className="mb-4">
          Cookies können von uns (First-Party-Cookies) oder von Drittunternehmen
          stammen (sog. Third-Party-Cookies). Third-Party-Cookies ermöglichen
          die Einbindung bestimmter Dienstleistungen von Drittunternehmen
          innerhalb von Webseiten (z. B. Cookies zur Abwicklung von
          Zahlungsdienstleistungen).
        </p>
        <p className="mb-4">
          Cookies haben verschiedene Funktionen. Zahlreiche Cookies sind
          technisch notwendig, da bestimmte Webseitenfunktionen ohne diese nicht
          funktionieren würden (z. B. die Warenkorbfunktion oder die Anzeige von
          Videos). Andere Cookies können zur Auswertung des Nutzerverhaltens
          oder zu Werbezwecken verwendet werden.
        </p>
        <p className="mb-4">
          Cookies, die zur Durchführung des elektronischen
          Kommunikationsvorgangs, zur Bereitstellung bestimmter, von Ihnen
          erwünschter Funktionen oder zur Optimierung der Website erforderlich
          sind (notwendige Cookies), werden auf Grundlage von Art. 6 Abs. 1 lit.
          f DSGVO gespeichert, sofern keine andere Rechtsgrundlage angegeben
          wird. Der Websitebetreiber hat ein berechtigtes Interesse an der
          Speicherung von notwendigen Cookies zur technisch fehlerfreien und
          optimierten Bereitstellung seiner Dienste. Sofern eine Einwilligung
          zur Speicherung von Cookies abgefragt wurde, erfolgt die Verarbeitung
          ausschließlich auf Grundlage dieser Einwilligung (Art. 6 Abs. 1 lit. a
          DSGVO und § 25 Abs. 1 TDDDG); die Einwilligung ist jederzeit
          widerrufbar.
        </p>
        <p>
          Sie können Ihren Browser so einstellen, dass Sie über das Setzen von
          Cookies informiert werden und Cookies nur im Einzelfall erlauben, die
          Annahme von Cookies für bestimmte Fälle oder generell ausschließen
          sowie das automatische Löschen der Cookies beim Schließen des Browsers
          aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität
          dieser Website eingeschränkt sein.
        </p>
      </div>

      <p className="text-ink-faint pt-4 text-[12.5px]">
        Quelle: e-recht24.de — Stand: April 2025
      </p>
    </LegalPage>
  );
};

export default DatenschutzPage;
