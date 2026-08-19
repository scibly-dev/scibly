import { DemoQueryProvider } from "@/shared/api/provider/demo-query-provider";

/**
 * The demo route runs on its own query client and without analytics, so it is the
 * one subtree that does not mount `SciblyPostHogProvider`.
 */
export default function DemoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <DemoQueryProvider>{children}</DemoQueryProvider>;
}
