// Stamps the surface attribute here (not the root layout, which stays static and
// prerendered) and skips `SciblyPostHogProvider`, since an embed must not set cookies
// on a customer's visitors.
export default function EmbedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.dataset.sciblySurface="embed"`,
        }}
      />
      {children}
    </>
  );
}
