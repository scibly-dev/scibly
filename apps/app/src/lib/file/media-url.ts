export const getPublicS3MediaUrlFromKey = (
  objectKey: string,
  bucketName: string,
  awsRegion: string,
) => {
  const normalizedObjectKey = objectKey.replace(/^\/+/, "");
  return `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${normalizedObjectKey}`;
};
