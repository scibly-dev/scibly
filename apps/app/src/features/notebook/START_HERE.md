# Notebook: Start Here

Notebook owns source ingestion, retrieval-grounded chat, and AI-assisted course
editing. Start with these files:

1. `workspace/components/notebook-workspace.tsx` — composes the production
   provider and workspace.
2. `chat/runtime/use-chat-instance.ts` — owns the AI SDK chat lifecycle.
3. `chat/server/stream-chat.ts` — creates notebooks, builds model context,
   registers tools, streams responses, and persists messages.
4. `sources/ingestion/ingest-source.ts` — extracts, chunks, embeds, and
   invalidates source-backed scenes.
5. `tools/insert-content/client.ts` — applies AI scene reads and writes in the
   mounted or background collaborative editor.

## Happy path: grounded scene insertion

1. `[lang]/profile/org/[orgSlug]/notebooks/[notebookId]/page.tsx` renders
   `ProductionNotebookWorkspace`.
2. `NotebookProvider` reaches `use-chat-instance.ts`; its transport posts the
   user turn and active course context to `/api/chat`.
3. `app/api/chat/route.ts` authenticates, validates, rate-limits, then calls
   `streamNotebookChat`.
4. `stream-chat.ts` ensures the notebook, loads history and skills, builds the
   grounded prompt and tool registry, then streams the notebook agent.
5. When the agent calls `insertContent`, `use-editor-client-tools.ts` dispatches
   to `tools/insert-content/client.ts`.
6. The client updates the active editor (or a background collaboration
   document), records source lineage through `scene.setSceneLineage`, and sends
   the tool result back to the stream.
7. `stream-chat.ts` persists the completed turn; source refreshes later use
   `ingest-source.ts` and the recorded lineage to mark affected scenes outdated.

Tests closest to this path: `chat/continuation.test.ts`,
`tools/insert-content/editor-tools.test.ts`, and
`sources/ingestion/ingest-source.integration.test.ts`.
