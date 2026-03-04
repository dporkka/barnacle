import { Env, Session } from './types'
import { getSession } from './session'

const COOKIE_NAME = 'barnacle_session'

export function getSessionFromCookie(request: Request): string | null {
  const cookie = request.headers.get('Cookie') ?? ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

export async function getSessionFromRequest(request: Request, env: Env): Promise<Session | null> {
  const token = getSessionFromCookie(request)
  if (!token) return null
  return getSession(env, token)
}

export function sessionCookie(token: string, maxAge: number): string {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

/** Returns the Session or a redirect Response to /login. */
export async function requireAuth(request: Request, env: Env): Promise<Session | Response> {
  const session = await getSessionFromRequest(request, env)
  if (!session) {
    return Response.redirect(new URL('/login', request.url).toString(), 302)
  }
  return session
}
