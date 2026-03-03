export function getOAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ access_token: string }> {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status}`)
  }
  return res.json() as Promise<{ access_token: string }>
}

export async function getGitHubUser(
  token: string,
): Promise<{ id: string; email: string; name: string; avatar_url: string }> {
  const [userRes, emailsRes] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'barnacle-admin' },
    }),
    fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'barnacle-admin' },
    }),
  ])

  if (!userRes.ok) throw new Error(`GitHub user fetch failed: ${userRes.status}`)

  const user = (await userRes.json()) as {
    id: number
    name: string | null
    email: string | null
    avatar_url: string
    login: string
  }

  let email = user.email ?? ''
  if (!email && emailsRes.ok) {
    const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>
    const primary = emails.find((e) => e.primary && e.verified)
    email = primary?.email ?? emails[0]?.email ?? ''
  }

  return {
    id: String(user.id),
    email,
    name: user.name ?? user.login,
    avatar_url: user.avatar_url,
  }
}

export function isAllowedUser(email: string, allowedEmails: string): boolean {
  if (!allowedEmails.trim()) return false
  const allowed = allowedEmails.split(',').map((e) => e.trim().toLowerCase())
  return allowed.includes(email.toLowerCase())
}
