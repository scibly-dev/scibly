import { LocalizedLoadingOverlay } from "@/components/localized-loading-overlay";

export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <LocalizedLoadingOverlay variant="loadingPage" />
    </div>
  );
}
