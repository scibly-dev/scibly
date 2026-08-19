import { constructMetadata } from "@scibly/lib";
import { type Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "Dashboard",
  description: "Your Scibly organization dashboard.",
  category: "App",
});

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
