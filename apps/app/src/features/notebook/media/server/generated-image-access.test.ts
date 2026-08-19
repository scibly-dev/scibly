import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  notebookGeneratedImage: { findFirst: vi.fn() },
}));

vi.mock("@scibly/db", () => ({ db }));

const { assertGeneratedImageS3KeyInScope, getGeneratedImageById } =
  await import("./notebook-generated-image");

const ORG = "org-a";
const NOTEBOOK = "nb-1";

const IMAGE_NOT_FOUND = {
  code: "NOT_FOUND",
  applicationCode: "api.not_found",
  message: "Generated image not found.",
};

async function refusal(call: () => Promise<unknown>) {
  try {
    await call();
  } catch (error) {
    if (error instanceof AppError) {
      return {
        code: error.code,
        applicationCode: error.applicationCode,
        message: error.message,
      };
    }
    throw error;
  }
  throw new Error("expected the call to be refused, but it resolved");
}

function syncRefusal(call: () => void) {
  try {
    call();
  } catch (error) {
    if (error instanceof AppError) {
      return { code: error.code, applicationCode: error.applicationCode };
    }
    throw error;
  }
  throw new Error("expected the check to refuse, but it passed");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("reaching a generated image by its id", () => {
  it("NC2: looks the image up inside the notebook, never by id alone", async () => {
    db.notebookGeneratedImage.findFirst.mockResolvedValueOnce({
      id: "img-1",
      s3Key: `notebook-media/${ORG}/${NOTEBOOK}/a.webp`,
    });

    await getGeneratedImageById("img-1", NOTEBOOK);

    expect(db.notebookGeneratedImage.findFirst).toHaveBeenCalledWith({
      where: { id: "img-1", notebookId: NOTEBOOK },
    });
  });

  it("NC2/NC5: an image belonging to another notebook is refused as one that does not exist", async () => {
    db.notebookGeneratedImage.findFirst.mockResolvedValueOnce(null);

    expect(
      await refusal(() =>
        getGeneratedImageById("img-of-another-notebook", NOTEBOOK),
      ),
    ).toEqual(IMAGE_NOT_FOUND);
  });
});

describe("the key a download URL may be issued for", () => {
  const outOfScope = [
    {
      case: "another notebook in the same organization",
      s3Key: `notebook-media/${ORG}/nb-other/diagram.webp`,
    },
    {
      case: "the same notebook id under another organization",
      s3Key: `notebook-media/org-b/${NOTEBOOK}/diagram.webp`,
    },
    {
      case: "a key that only mentions the prefix further along",
      s3Key: `notebook-media/org-b/nb-other/notebook-media/${ORG}/${NOTEBOOK}/diagram.webp`,
    },
    {
      case: "a source upload rather than generated media",
      s3Key: `notebook-sources/${ORG}/${NOTEBOOK}/src-1/report.pdf`,
    },
  ];

  it.each(outOfScope)(
    "NC4: refuses to presign a key pointing at $case",
    ({ s3Key }) => {
      expect(
        syncRefusal(() =>
          assertGeneratedImageS3KeyInScope(s3Key, ORG, NOTEBOOK),
        ),
      ).toEqual({
        code: "BAD_REQUEST",
        applicationCode: "api.bad_request",
      });
    },
  );

  it("NC4: accepts a key inside the caller's own organization and notebook", () => {
    expect(() =>
      assertGeneratedImageS3KeyInScope(
        `notebook-media/${ORG}/${NOTEBOOK}/diagram.webp`,
        ORG,
        NOTEBOOK,
      ),
    ).not.toThrow();
  });
});
