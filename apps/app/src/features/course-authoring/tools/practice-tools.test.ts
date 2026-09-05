import type { NotebookRuntimeContext } from "@/features/notebook/server";

import { describe, expect, it } from "vitest";

import { buildPracticeTools } from "./practice-tools";

describe("the practice contract the agent is handed", () => {
  it("comes back frontmatter-free, carrying the SDK, the self-test hook and the CDN", async () => {
    // execute() reads a file and never touches the caller.
    const tools = buildPracticeTools({} as NotebookRuntimeContext);

    const result = await tools.getPracticeContract.execute!(
      {},
      { toolCallId: "t1", messages: [], context: {} },
    );
    if (!("contract" in result)) throw new Error("expected a contract");

    expect(result.contract.startsWith("# Practice scene contract")).toBe(true);
    expect(result.contract).toContain("window.scibly.submit(work)");
    expect(result.contract).toContain("window.__sciblySelfTest");
    expect(result.contract).toContain("cdnjs.cloudflare.com");
  });
});
