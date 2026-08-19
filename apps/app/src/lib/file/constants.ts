export const MEDIA_PATH_PREFIX = {
  editor: "editor",
  users: "users",
} as const;

export const getMediaPathPrefix = (useEditorBucket: boolean) =>
  useEditorBucket ? MEDIA_PATH_PREFIX.editor : MEDIA_PATH_PREFIX.users;

const SOURCE_UPLOAD_PREFIX = "notebook-sources";

const NOTEBOOK_MEDIA_PREFIX = "notebook-media";

function getNotebookMediaUploadPrefix(
  orgId: string,
  notebookId: string,
): string {
  return `${NOTEBOOK_MEDIA_PREFIX}/${orgId}/${notebookId}/`;
}

export function getNotebookMediaS3Key(
  orgId: string,
  notebookId: string,
  fileName: string,
): string {
  return `${getNotebookMediaUploadPrefix(orgId, notebookId)}${fileName}`;
}

export function isNotebookMediaS3KeyInScope(
  s3Key: string,
  orgId: string,
  notebookId: string,
): boolean {
  return s3Key.startsWith(getNotebookMediaUploadPrefix(orgId, notebookId));
}

function getNotebookSourceUploadPrefix(
  orgId: string,
  notebookId: string,
): string {
  return `${SOURCE_UPLOAD_PREFIX}/${orgId}/${notebookId}/`;
}

export function isNotebookSourceS3KeyInScope(
  s3Key: string,
  orgId: string,
  notebookId: string,
): boolean {
  return s3Key.startsWith(getNotebookSourceUploadPrefix(orgId, notebookId));
}

export function getSourceS3Key(
  orgId: string,
  notebookId: string,
  sourceId: string,
  fileName: string,
): string {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${getNotebookSourceUploadPrefix(orgId, notebookId)}${sourceId}/${sanitizedName}`;
}

export function getExpectedSourceS3KeyOrNull(
  claimedKey: string,
  orgId: string,
  notebookId: string,
  sourceId: string,
  fileName: string,
): string | null {
  const expectedKey = getSourceS3Key(orgId, notebookId, sourceId, fileName);
  return claimedKey === expectedKey ? expectedKey : null;
}
