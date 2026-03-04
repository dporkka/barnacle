import { Env, Session } from './types'
import { requireAuth, getSessionFromRequest, sessionCookie, clearSessionCookie } from './middleware'
import { createSession, deleteSession } from './session'
import { getOAuthUrl, exchangeCode, getGitHubUser, isAllowedUser } from './auth'
import { renderPage, renderPageList, renderError } from './html'
import { listPages, createPage, deletePage } from './pages-api'
import ADMIN_CSS from './admin-css'

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

function html(body: string, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...extraHeaders },
  })
}

function redirect(location: string, headers: Record<string, string> = {}): Response {
  return new Response(null, { status: 302, headers: { Location: location, ...headers } })
}

// ── /login ────────────────────────────────────────────────────────────────────

function handleLoginPage(request: Request, env: Env): Response {
  const state = crypto.randomUUID()
  const redirectUri = new URL('/auth/callback', request.url).toString()
  const oauthUrl = getOAuthUrl(env.GITHUB_OAUTH_CLIENT_ID, redirectUri, state)
  const body = `
  <div class="auth-box">
    <h1>🪸 barnacle CMS</h1>
    <p>Sign in with your GitHub account to access the admin panel.</p>
    <a class="btn btn-primary btn-lg" href="${oauthUrl}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57
          0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695
          -.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99
          .105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225
          -.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405
          c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225
          0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3
          0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      Sign in with GitHub
    </a>
  </div>`
  return html(renderPage('Login', body))
}

// ── /auth/callback ────────────────────────────────────────────────────────────

async function handleAuthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error || !code) {
    const body = renderError('GitHub OAuth failed: ' + (error ?? 'missing code'))
    return html(renderPage('Login Error', body), 400)
  }

  try {
    const redirectUri = new URL('/auth/callback', request.url).toString()
    const tokenData = await exchangeCode(code, env.GITHUB_OAUTH_CLIENT_ID, env.GITHUB_OAUTH_CLIENT_SECRET, redirectUri)
    const githubUser = await getGitHubUser(tokenData.access_token)

    if (!isAllowedUser(githubUser.email, env.ADMIN_ALLOWED_EMAILS)) {
      const body = renderError(`Access denied: ${githubUser.email} is not an authorized admin.`)
      return html(renderPage('Access Denied', body), 403)
    }

    const token = await createSession(env, {
      userId: githubUser.id,
      email: githubUser.email,
      name: githubUser.name,
      avatarUrl: githubUser.avatar_url,
      githubToken: tokenData.access_token,
    })

    return redirect('/pages', { 'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const body = renderError('Authentication error: ' + msg)
    return html(renderPage('Auth Error', body), 500)
  }
}

// ── /logout ───────────────────────────────────────────────────────────────────

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const session = await getSessionFromRequest(request, env)
  if (session) {
    const { getSessionFromCookie } = await import('./middleware')
    const token = getSessionFromCookie(request)
    if (token) await deleteSession(env, token)
  }
  return redirect('/login', { 'Set-Cookie': clearSessionCookie() })
}

// ── /pages ────────────────────────────────────────────────────────────────────

async function handlePageList(_request: Request, env: Env, session: Session): Promise<Response> {
  let pagesHtml: string
  try {
    const pages = await listPages(session.githubToken, env.GIT_INTEGRATION_URL)
    pagesHtml = renderPageList(pages)
  } catch {
    pagesHtml = renderError('Failed to load pages. Check git-integration connectivity.')
  }

  const body = `
  <div class="page-header">
    <h1>Pages</h1>
    <a class="btn btn-primary" href="/pages/new">+ New Page</a>
  </div>
  <div id="page-list"
    hx-get="/pages"
    hx-trigger="every 30s"
    hx-swap="innerHTML"
    hx-target="#page-list"
    hx-indicator="#htmx-indicator">
    ${pagesHtml}
  </div>`

  return html(renderPage('Pages', body, { name: session.name, avatarUrl: session.avatarUrl }))
}

// ── /pages/new ────────────────────────────────────────────────────────────────

function handleNewPageForm(_request: Request, _env: Env, session: Session): Response {
  const body = `
  <div class="form-container">
    <h1>New Page</h1>
    <form method="POST" action="/pages" class="form">
      <div class="form-group">
        <label for="title">Page Title</label>
        <input
          id="title"
          name="title"
          type="text"
          class="input"
          placeholder="My Awesome Page"
          required
          maxlength="200"
        />
      </div>
      <div class="form-group">
        <label for="slug">URL Slug</label>
        <div class="input-prefix-group">
          <span class="input-prefix">/</span>
          <input
            id="slug"
            name="slug"
            type="text"
            class="input"
            placeholder="my-awesome-page"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            maxlength="100"
          />
        </div>
        <small class="form-hint">Lowercase letters, numbers, and hyphens only.</small>
      </div>
      <div class="form-actions">
        <a class="btn" href="/pages">Cancel</a>
        <button class="btn btn-primary" type="submit">Create Page</button>
      </div>
    </form>
  </div>`
  return html(renderPage('New Page', body, { name: session.name, avatarUrl: session.avatarUrl }))
}

// ── POST /pages ───────────────────────────────────────────────────────────────

async function handleCreatePage(request: Request, env: Env, session: Session): Promise<Response> {
  const formData = await request.formData()
  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const slug = (formData.get('slug') as string | null)?.trim() ?? ''

  if (!title || !slug) {
    const body = renderError('Title and slug are required.')
    return html(renderPage('New Page', body, { name: session.name, avatarUrl: session.avatarUrl }), 400)
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    const body = renderError('Slug must contain only lowercase letters, numbers, and hyphens.')
    return html(renderPage('New Page', body, { name: session.name, avatarUrl: session.avatarUrl }), 400)
  }

  const pageId = crypto.randomUUID()

  try {
    await createPage(session.githubToken, env.GIT_INTEGRATION_URL, pageId, slug, title)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    const body = renderError('Failed to create page: ' + msg)
    return html(renderPage('New Page', body, { name: session.name, avatarUrl: session.avatarUrl }), 500)
  }

  return redirect('/pages')
}

// ── /pages/:pageId ────────────────────────────────────────────────────────────

async function handlePageDetail(
  _request: Request,
  env: Env,
  session: Session,
  pageId: string,
): Promise<Response> {
  let pages: Awaited<ReturnType<typeof listPages>> = []
  try {
    pages = await listPages(session.githubToken, env.GIT_INTEGRATION_URL)
  } catch {
    // ignore
  }

  const page = pages.find((p) => p.id === pageId)
  if (!page) {
    const body = renderError('Page not found.')
    return html(renderPage('Not Found', body, { name: session.name, avatarUrl: session.avatarUrl }), 404)
  }

  const builderUrl = `${env.BUILDER_URL}?pageId=${encodeURIComponent(pageId)}`
  const statusClass = page.status === 'published' ? 'badge-published' : 'badge-draft'

  const body = `
  <div class="page-header">
    <div>
      <a class="breadcrumb" href="/pages">← Pages</a>
      <h1>${page.title} <span class="badge ${statusClass}">${page.status}</span></h1>
      <p class="text-muted">/<span>${page.slug}</span> &mdash; updated ${page.updatedAt}</p>
    </div>
    <div class="page-header-actions">
      <a class="btn btn-primary" href="${builderUrl}" target="_blank" rel="noopener">
        Open in Builder ↗
      </a>
      <button
        class="btn btn-danger"
        hx-delete="/pages/${pageId}"
        hx-confirm="Delete '${page.title}'? This cannot be undone."
        hx-push-url="/pages"
        hx-target="body"
        hx-swap="outerHTML"
      >Delete</button>
    </div>
  </div>
  <div class="detail-card">
    <dl class="dl">
      <dt>Page ID</dt><dd><code>${pageId}</code></dd>
      <dt>Slug</dt><dd>/${page.slug}</dd>
      <dt>Status</dt><dd><span class="badge ${statusClass}">${page.status}</span></dd>
      <dt>Last Updated</dt><dd>${page.updatedAt}</dd>
    </dl>
  </div>`

  return html(renderPage(page.title, body, { name: session.name, avatarUrl: session.avatarUrl }))
}

// ── DELETE /pages/:pageId ─────────────────────────────────────────────────────

async function handleDeletePage(
  _request: Request,
  env: Env,
  session: Session,
  pageId: string,
): Promise<Response> {
  try {
    await deletePage(session.githubToken, env.GIT_INTEGRATION_URL, pageId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(renderError('Failed to delete page: ' + msg), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  // HTMX swaps outerHTML with empty string to remove the card
  return new Response('', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

// ── /settings ─────────────────────────────────────────────────────────────────

function handleSettings(_request: Request, _env: Env, session: Session): Response {
  const body = `
  <h1>Settings</h1>
  <div class="detail-card">
    <dl class="dl">
      <dt>Name</dt><dd>${session.name}</dd>
      <dt>Email</dt><dd>${session.email}</dd>
      <dt>GitHub User ID</dt><dd>${session.userId}</dd>
      <dt>Session Expires</dt><dd>${new Date(session.expiresAt).toLocaleString()}</dd>
    </dl>
  </div>`
  return html(renderPage('Settings', body, { name: session.name, avatarUrl: session.avatarUrl }))
}

// ── /build-logs ───────────────────────────────────────────────────────────────

function handleBuildLogs(_request: Request, _env: Env, session: Session): Response {
  const body = `
  <h1>Build Logs</h1>
  <p>Build logs are powered by GitHub Actions. View recent workflow runs below.</p>
  <div class="detail-card">
    <p>
      <a class="btn btn-primary" href="https://github.com" target="_blank" rel="noopener">
        View on GitHub Actions ↗
      </a>
    </p>
    <p class="text-muted">
      Each publish triggers a Hugo build and deploys to your hosting provider.
      Workflow files live in <code>.github/workflows/</code>.
    </p>
  </div>
  <div
    hx-get="/build-logs/fragment"
    hx-trigger="load"
    hx-indicator="#htmx-indicator">
    <p class="text-muted">Loading recent runs…</p>
  </div>`
  return html(renderPage('Build Logs', body, { name: session.name, avatarUrl: session.avatarUrl }))
}

// ── /admin.css ────────────────────────────────────────────────────────────────

function handleStaticCss(): Response {
  return new Response(ADMIN_CSS, {
    headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}

// ── Router ────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url
    const method = request.method.toUpperCase()

    // Public routes
    if (pathname === '/login' && method === 'GET') return handleLoginPage(request, env)
    if (pathname === '/auth/callback' && method === 'GET') return handleAuthCallback(request, env)
    if (pathname === '/logout') return handleLogout(request, env)

    // CSS (served from this worker)
    if (pathname === '/admin.css' && method === 'GET') return handleStaticCss()

    // Root redirect
    if (pathname === '/') return redirect('/pages')

    // Protected routes — resolve session first
    const sessionOrRedirect = await requireAuth(request, env)
    if (sessionOrRedirect instanceof Response) return sessionOrRedirect
    const session = sessionOrRedirect

    if (pathname === '/pages' && method === 'GET') return handlePageList(request, env, session)
    if (pathname === '/pages/new' && method === 'GET') return handleNewPageForm(request, env, session)
    if (pathname === '/pages' && method === 'POST') return handleCreatePage(request, env, session)

    const pageDetailMatch = pathname.match(/^\/pages\/([^/]+)$/)
    if (pageDetailMatch) {
      const pageId = pageDetailMatch[1]
      if (method === 'GET') return handlePageDetail(request, env, session, pageId)
      if (method === 'DELETE') return handleDeletePage(request, env, session, pageId)
    }

    const pageEditMatch = pathname.match(/^\/pages\/([^/]+)\/edit$/)
    if (pageEditMatch && method === 'GET') {
      const pageId = pageEditMatch[1]
      const builderUrl = `${env.BUILDER_URL}?pageId=${encodeURIComponent(pageId)}`
      return redirect(builderUrl)
    }

    if (pathname === '/settings' && method === 'GET') return handleSettings(request, env, session)
    if (pathname === '/build-logs' && method === 'GET') return handleBuildLogs(request, env, session)

    return html(renderPage('Not Found', '<h1>404 — Not Found</h1>', { name: session.name, avatarUrl: session.avatarUrl }), 404)
  },
}
