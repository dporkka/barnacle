import { Env, SignedUploadRequest, SignedUploadResponse, AssetMetadata } from './types'
import { validateMimeType, getExtension } from './mime'
import { generateUploadToken, verifyUploadToken } from './upload-token'

const CACHE_MAX_AGE = 31536000 // 1 year

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS,
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}

function error(message: string, status: number, extraHeaders: Record<string, string> = {}): Response {
  return json({ error: message }, status, extraHeaders)
}

function requireBearer(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization') ?? ''
  return auth === `Bearer ${env.UPLOAD_SECRET}`
}

async function hashKey(assetId: string): Promise<string> {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(assetId))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function handleSignedUrl(request: Request, env: Env, workerUrl: string): Promise<Response> {
  const cors = corsHeaders(env)

  if (!requireBearer(request, env)) {
    return error('Unauthorized', 401, cors)
  }

  let body: SignedUploadRequest
  try {
    body = await request.json() as SignedUploadRequest
  } catch {
    return error('Invalid JSON body', 400, cors)
  }

  const { filename, mimeType, contentLength, pageId } = body

  if (!validateMimeType(mimeType)) {
    return error(`MIME type not allowed: ${mimeType}`, 400, cors)
  }

  const maxSize = parseInt(env.MAX_FILE_SIZE_BYTES, 10)
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > maxSize) {
    return error(`contentLength must be between 1 and ${maxSize}`, 400, cors)
  }

  if (!pageId || typeof pageId !== 'string') {
    return error('pageId is required', 400, cors)
  }

  const assetId = crypto.randomUUID()
  const hash = await hashKey(assetId)
  const ext = getExtension(mimeType)
  const key = `assets/${hash}.${ext}`

  const metadata: AssetMetadata = {
    assetId,
    pageId,
    mimeType,
    originalFilename: filename,
    uploadedAt: new Date().toISOString(),
    contentLength,
    key,
  }

  await env.MEDIA_BUCKET.put(`meta/${assetId}.json`, JSON.stringify(metadata), {
    httpMetadata: { contentType: 'application/json' },
  })

  const token = await generateUploadToken(assetId, env.UPLOAD_SECRET)
  const uploadUrl = `${workerUrl}/upload/${assetId}?token=${token}`
  const publicUrl = `${env.MEDIA_BASE_URL}/${key}`

  const resp: SignedUploadResponse = { uploadUrl, assetId, key, publicUrl }
  return json(resp, 200, cors)
}

async function handleUpload(
  request: Request,
  env: Env,
  assetId: string,
  token: string,
): Promise<Response> {
  const cors = corsHeaders(env)

  const valid = await verifyUploadToken(assetId, token, env.UPLOAD_SECRET)
  if (!valid) {
    return error('Invalid or expired upload token', 403, cors)
  }

  const metaObj = await env.MEDIA_BUCKET.get(`meta/${assetId}.json`)
  if (!metaObj) {
    return error('Asset metadata not found', 404, cors)
  }

  const metadata: AssetMetadata = await metaObj.json()

  const contentType = request.headers.get('Content-Type') ?? ''
  if (contentType && contentType.split(';')[0].trim() !== metadata.mimeType) {
    return error(
      `Content-Type mismatch: expected ${metadata.mimeType}, got ${contentType}`,
      400,
      cors,
    )
  }

  const body = request.body
  if (!body) {
    return error('Request body is required', 400, cors)
  }

  await env.MEDIA_BUCKET.put(metadata.key, body, {
    httpMetadata: { contentType: metadata.mimeType },
    customMetadata: {
      assetId: metadata.assetId,
      pageId: metadata.pageId,
      originalFilename: metadata.originalFilename,
    },
  })

  const publicUrl = `${env.MEDIA_BASE_URL}/${metadata.key}`
  return json({ publicUrl, assetId, key: metadata.key }, 200, cors)
}

async function handleGetAsset(request: Request, env: Env, key: string): Promise<Response> {
  const obj = await env.MEDIA_BUCKET.get(key)
  if (!obj) {
    return new Response('Not found', { status: 404 })
  }

  // Support conditional requests
  const ifNoneMatch = request.headers.get('If-None-Match')
  const etag = obj.httpEtag
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } })
  }

  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, immutable`)
  headers.set('ETag', etag)

  return new Response(obj.body, { headers })
}

async function handleDeleteAsset(request: Request, env: Env, assetId: string): Promise<Response> {
  const cors = corsHeaders(env)

  if (!requireBearer(request, env)) {
    return error('Unauthorized', 401, cors)
  }

  const metaObj = await env.MEDIA_BUCKET.get(`meta/${assetId}.json`)
  if (!metaObj) {
    return error('Asset not found', 404, cors)
  }

  const metadata: AssetMetadata = await metaObj.json()

  await Promise.all([
    env.MEDIA_BUCKET.delete(metadata.key),
    env.MEDIA_BUCKET.delete(`meta/${assetId}.json`),
  ])

  return json({ deleted: true, assetId }, 200, cors)
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url
    const method = request.method.toUpperCase()
    const cors = corsHeaders(env)

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    // POST /signed-url
    if (method === 'POST' && pathname === '/signed-url') {
      const workerUrl = `${url.protocol}//${url.host}`
      return handleSignedUrl(request, env, workerUrl)
    }

    // PUT /upload/:assetId
    const uploadMatch = pathname.match(/^\/upload\/([^/]+)$/)
    if (method === 'PUT' && uploadMatch) {
      const assetId = uploadMatch[1]
      const token = url.searchParams.get('token') ?? ''
      return handleUpload(request, env, assetId, token)
    }

    // GET /asset/*key (key may contain slashes, e.g. assets/abc123.jpg)
    const assetGetMatch = pathname.match(/^\/asset\/(.+)$/)
    if (method === 'GET' && assetGetMatch) {
      return handleGetAsset(request, env, assetGetMatch[1])
    }

    // DELETE /asset/:assetId
    const assetDeleteMatch = pathname.match(/^\/asset\/([^/]+)$/)
    if (method === 'DELETE' && assetDeleteMatch) {
      return handleDeleteAsset(request, env, assetDeleteMatch[1])
    }

    return new Response('Not found', { status: 404, headers: cors })
  },
}
