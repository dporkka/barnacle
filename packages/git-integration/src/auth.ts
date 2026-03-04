/**
 * Generates a GitHub App JWT using Web Crypto API (RS256).
 * The private key must be a PEM-encoded PKCS#8 RSA private key.
 */
export async function generateJWT(appId: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iat: now - 60, // issued 60 seconds in the past to allow for clock drift
    exp: now + 600, // expires in 10 minutes (GitHub max)
    iss: appId,
  }

  const header = { alg: 'RS256', typ: 'JWT' }

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const signingInput = `${encode(header)}.${encode(payload)}`

  const keyData = pemToArrayBuffer(privateKey)
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )

  const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${signingInput}.${encodedSig}`
}

/**
 * Exchanges a GitHub App JWT for an installation access token.
 */
export async function getInstallationToken(
  jwt: string,
  installationId: string,
): Promise<string> {
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'barnacle-git-integration/1.0',
      },
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to get installation token: ${response.status} ${text}`)
  }

  const data = (await response.json()) as { token: string }
  return data.token
}

/** Strips PEM headers/footers and decodes base64 to ArrayBuffer. */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
