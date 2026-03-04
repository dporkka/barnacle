export interface Env {
  MEDIA_BUCKET: R2Bucket
  MEDIA_BASE_URL: string
  ALLOWED_ORIGINS: string
  MAX_FILE_SIZE_BYTES: string
  UPLOAD_SECRET: string
}

export interface SignedUploadRequest {
  filename: string       // original filename (for extension extraction)
  mimeType: string       // validated MIME type
  contentLength: number  // bytes, must be <= MAX_FILE_SIZE_BYTES
  pageId: string         // which page this asset belongs to
}

export interface SignedUploadResponse {
  uploadUrl: string     // The URL the client should PUT to (with pre-auth)
  assetId: string       // UUID for this asset
  key: string           // R2 object key (hash-based)
  publicUrl: string     // The final public URL after upload
}

export interface AssetMetadata {
  assetId: string
  pageId: string
  mimeType: string
  originalFilename: string
  uploadedAt: string
  contentLength: number
  key: string
}
