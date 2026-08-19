import { constructMetadata } from "@scibly/lib";
import { type Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "Anmelden",
  description:
    "Melde dich bei Scibly an und greife auf deine Kurse und Analytics zu.",
  keywords: ["Anmelden", "Login", "Scibly Konto", "Learning Plattform"],
});

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
