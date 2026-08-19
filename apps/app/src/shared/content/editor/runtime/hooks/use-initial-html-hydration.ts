import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor } from "@tiptap/core";

import { COLLAB_INITIAL_HTML_KEY, COLLAB_METADATA_MAP_NAME } from "@scibly/lib";
import { useEffect } from "react";

// The collab server wraps HTML content in a Y.Doc metadata map on scene
// creation (see `wrapRawHtmlState`); this hydrates the editor from it once, then
// deletes the key so later syncs skip it.
export function useInitialHtmlHydration(
  editor: Editor | null,
  provider: HocuspocusProvider | null,
): void {
  useEffect(() => {
    if (!editor || !provider) return;

    const metadata = provider.document.getMap<string>(COLLAB_METADATA_MAP_NAME);
    const initialHtml = metadata.get(COLLAB_INITIAL_HTML_KEY);
    const xmlFragment = provider.document.getXmlFragment("default");

    if (initialHtml && xmlFragment.length === 0) {
      editor.commands.setContent(initialHtml);
      metadata.delete(COLLAB_INITIAL_HTML_KEY);
    }
  }, [editor, provider]);
}
