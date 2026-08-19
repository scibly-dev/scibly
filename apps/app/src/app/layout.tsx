import { defaultLocale } from "@scibly/i18n/constants";
import { constructMetadata } from "@scibly/lib";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Hanken_Grotesk, Instrument_Serif } from "next/font/google";

import "@scibly/ui/styles.css";

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

export default function RootLayout(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  return (
    <html
      lang={defaultLocale}
      className={`${GeistSans.variable} ${hankenGrotesk.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="font-display text-ink" suppressHydrationWarning>
        {props.children}
      </body>
    </html>
  );
}
