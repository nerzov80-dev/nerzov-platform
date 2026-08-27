export interface R2Env {
  IMAGES_BUCKET: R2Bucket;
}

export function getImagesBucket(
  env: R2Env,
): R2Bucket {
  return env.IMAGES_BUCKET;
}
