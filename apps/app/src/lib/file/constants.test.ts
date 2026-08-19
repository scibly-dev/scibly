import { describe, expect, it } from "vitest";

import {
  getExpectedSourceS3KeyOrNull,
  getNotebookMediaS3Key,
  getSourceS3Key,
  isNotebookMediaS3KeyInScope,
  isNotebookSourceS3KeyInScope,
} from "./constants";

const ORG = "org_1";
const NOTEBOOK = "nb_1";
const SOURCE = "src_1";

const FOLDER = `notebook-sources/${ORG}/${NOTEBOOK}/${SOURCE}/`;

const granted = (fileName: string) =>
  getSourceS3Key(ORG, NOTEBOOK, SOURCE, fileName);

const confirmed = (claimedKey: string, fileName: string) =>
  getExpectedSourceS3KeyOrNull(claimedKey, ORG, NOTEBOOK, SOURCE, fileName);

describe("granting a browser somewhere to write", () => {
  it("K1: a file name carrying a separator cannot leave the source folder", () => {
    const key = granted("../../org_2/nb_2/src_2/stolen.pdf");

    expect(key.startsWith(FOLDER)).toBe(true);
    expect(key.slice(FOLDER.length)).not.toContain("/");
  });

  it("K2: a name that reads as a parent directory is still just a name", () => {
    expect(granted("..")).toBe(`${FOLDER}..`);
    expect(granted("../secrets")).toBe(`${FOLDER}.._secrets`);
  });
});

describe("believing the key a browser reports back", () => {
  const name = "Zellbiologie.pdf";

  it("K4: a key that merely starts like the granted one is refused", () => {
    const key = granted(name);

    expect(confirmed(key.slice(0, -4), name)).toBeNull();
    expect(confirmed(`${key}.exe`, name)).toBeNull();
  });

  it("K5: a key naming another source in the same notebook is refused", () => {
    const otherSource = getSourceS3Key(ORG, NOTEBOOK, "src_2", name);

    expect(confirmed(otherSource, name)).toBeNull();
  });

  it("K6: a key naming another organization is refused", () => {
    const otherOrg = getSourceS3Key("org_2", NOTEBOOK, SOURCE, name);

    expect(confirmed(otherOrg, name)).toBeNull();
  });

  it("K7: a key carrying the name as the author typed it is refused", () => {
    const typed = "Zellbiologie Kapitel 1.pdf";

    expect(confirmed(`${FOLDER}${typed}`, typed)).toBeNull();
  });
});

describe("deciding whether a stored key may be presigned", () => {
  it("K8: a notebook whose id merely begins with this one's is out of scope", () => {
    const sibling = getSourceS3Key(ORG, "nb_10", SOURCE, "notes.pdf");

    expect(isNotebookSourceS3KeyInScope(sibling, ORG, "nb_10")).toBe(true);
    expect(isNotebookSourceS3KeyInScope(sibling, ORG, NOTEBOOK)).toBe(false);
  });

  it("K9: an organization whose id merely begins with this one's is out of scope", () => {
    const sibling = getSourceS3Key("org_12", NOTEBOOK, SOURCE, "notes.pdf");

    expect(isNotebookSourceS3KeyInScope(sibling, "org_12", NOTEBOOK)).toBe(
      true,
    );
    expect(isNotebookSourceS3KeyInScope(sibling, ORG, NOTEBOOK)).toBe(false);
  });

  it("K10: source files and generated images are not in each other's scope", () => {
    const upload = getSourceS3Key(ORG, NOTEBOOK, SOURCE, "notes.pdf");
    const image = getNotebookMediaS3Key(ORG, NOTEBOOK, "diagram.webp");

    expect(isNotebookMediaS3KeyInScope(upload, ORG, NOTEBOOK)).toBe(false);
    expect(isNotebookSourceS3KeyInScope(image, ORG, NOTEBOOK)).toBe(false);
  });
});
