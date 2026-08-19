import { constructMetadata } from "@scibly/lib";
import { type Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "Registrieren",
  description:
    "Erstelle dein Scibly-Konto und starte mit interaktiven Kursen für dein Team.",
  keywords: [
    "Registrieren",
    "Scibly Konto erstellen",
    "Corporate Learning",
    "Kurse erstellen",
  ],
});

export default function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
