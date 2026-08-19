function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function downloadRemoteFile(
  url: string,
  filename: string,
): Promise<void> {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, filename);
}

export function triggerNavigationDownload(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

export function buildGeneratedImageFilename(alt: string): string {
  if (alt.trim().length > 0) {
    return `${alt.trim().replace(/\s+/g, "-").slice(0, 80)}.webp`;
  }
  return "generated-image.webp";
}
