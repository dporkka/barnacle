import { WebhookEvent } from './types'

/**
 * Verifies a GitHub webhook HMAC-SHA256 signature using Web Crypto API.
 * The signature header is in the format "sha256=<hex>".
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!signature.startsWith('sha256=')) {
    return false
  }
  const receivedHex = signature.slice('sha256='.length)

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))

  const computedHex = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison
  if (computedHex.length !== receivedHex.length) return false
  let diff = 0
  for (let i = 0; i < computedHex.length; i++) {
    diff |= computedHex.charCodeAt(i) ^ receivedHex.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Parses a GitHub webhook payload into a typed WebhookEvent.
 */
export function parseWebhookEvent(body: string, eventType: string): WebhookEvent | null {
  try {
    const payload = JSON.parse(body) as Record<string, unknown>

    if (eventType === 'push') {
      return {
        type: 'push',
        ref: payload['ref'] as string | undefined,
      }
    }

    if (eventType === 'pull_request') {
      const pr = payload['pull_request'] as Record<string, unknown> | undefined
      return {
        type: 'pull_request',
        action: payload['action'] as string | undefined,
        merged: pr?.['merged'] as boolean | undefined,
        prNumber: payload['number'] as number | undefined,
        branch: (pr?.['head'] as Record<string, unknown> | undefined)?.[
          'ref'
        ] as string | undefined,
      }
    }

    return null
  } catch {
    return null
  }
}
