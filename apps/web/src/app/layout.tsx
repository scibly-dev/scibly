import { constructMetadata } from "@scibly/lib";
import { DeferredSciblyPostHogProvider } from "@scibly/observability/provider/deferred";
import { Toaster } from "@scibly/ui/components/sonner";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Hanken_Grotesk, Instrument_Serif } from "next/font/google";

import "@scibly/ui/styles.css";
import "@/styles/marketing-base.css";
import "@/styles/marketing-motion.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

export const metadata: Metadata = constructMetadata();

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "de" }];
}

export default async function RootLayout(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  const { children } = props;

  return (
    <html
      className={`${GeistSans.variable} ${hankenGrotesk.variable} ${instrumentSerif.variable} relative`}
      /* Browser extensions (e.g. remote-desktop tooling) inject attributes on <html> before hydration. */
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <DeferredSciblyPostHogProvider surface="web">
          <Toaster richColors />
          {children}
        </DeferredSciblyPostHogProvider>
      </body>
    </html>
  );
}
