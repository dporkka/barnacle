import { Env } from './types'
export { PageSession } from './page-session'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const wsMatch = url.pathname.match(/^\/ws\/([^/]+)$/)

    if (wsMatch) {
      const pageId = wsMatch[1]
      if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 400 })
      }
      const id = env.PAGE_SESSION.idFromName(pageId)
      const stub = env.PAGE_SESSION.get(id)
      return stub.fetch(request)
    }

    return new Response('Not Found', { status: 404 })
  },
}
