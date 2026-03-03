import { Env, Session } from './types'

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

export async function createSession(
  env: Env,
  userData: Omit<Session, 'createdAt' | 'expiresAt'>,
): Promise<string> {
  const token = crypto.randomUUID()
  const now = Date.now()
  const session: Session = {
    ...userData,
    createdAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  }
  await env.SESSIONS.put(`session:${token}`, JSON.stringify(session), {
    expirationTtl: SESSION_TTL_SECONDS,
  })
  return token
}

export async function getSession(env: Env, token: string): Promise<Session | null> {
  const raw = await env.SESSIONS.get(`session:${token}`)
  if (!raw) return null
  const session: Session = JSON.parse(raw)
  if (Date.now() > session.expiresAt) {
    await env.SESSIONS.delete(`session:${token}`)
    return null
  }
  return session
}

export async function deleteSession(env: Env, token: string): Promise<void> {
  await env.SESSIONS.delete(`session:${token}`)
}
