import { SciblyPostHogProvider } from "@scibly/observability/provider";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SciblyPostHogProvider surface="app">{children}</SciblyPostHogProvider>
  );
}
