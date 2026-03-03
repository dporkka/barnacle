import { PageListItem } from './types'

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderNav(user?: { name: string; avatarUrl: string }): string {
  return `
  <nav class="nav">
    <a class="nav-brand" href="/pages">🪸 barnacle</a>
    <ul class="nav-links">
      <li><a href="/pages">Pages</a></li>
      <li><a href="/settings">Settings</a></li>
      <li><a href="/build-logs">Build Logs</a></li>
    </ul>
    ${
      user
        ? `<div class="nav-user">
        <img class="nav-avatar" src="${escape(user.avatarUrl)}" alt="${escape(user.name)}" width="32" height="32" />
        <span class="nav-name">${escape(user.name)}</span>
        <a class="btn btn-sm btn-ghost" href="/logout">Logout</a>
      </div>`
        : '<a class="btn btn-sm" href="/login">Login</a>'
    }
  </nav>`
}

export function renderPage(
  title: string,
  body: string,
  user?: { name: string; avatarUrl: string },
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escape(title)} — barnacle CMS</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><text y='1em' font-size='16'>🪸</text></svg>" />
  <link rel="stylesheet" href="/admin.css" />
  <script src="https://unpkg.com/htmx.org@1.9.10" defer></script>
</head>
<body>
  ${renderNav(user)}
  <main class="main">
    ${body}
  </main>
  <div id="htmx-indicator" class="htmx-indicator">Loading…</div>
</body>
</html>`
}

export function renderPageCard(page: PageListItem): string {
  const statusClass = page.status === 'published' ? 'badge-published' : 'badge-draft'
  const statusLabel = page.status === 'published' ? 'Published' : 'Draft'
  return `
  <div class="card" id="page-${escape(page.id)}">
    <div class="card-header">
      <h3 class="card-title"><a href="/pages/${escape(page.id)}">${escape(page.title)}</a></h3>
      <span class="badge ${statusClass}">${statusLabel}</span>
    </div>
    <p class="card-meta">/<span>${escape(page.slug)}</span> &mdash; updated ${escape(page.updatedAt)}</p>
    <div class="card-actions">
      <a class="btn btn-sm" href="/pages/${escape(page.id)}/edit">Edit in Builder</a>
      <button
        class="btn btn-sm btn-danger"
        hx-delete="/pages/${escape(page.id)}"
        hx-target="#page-${escape(page.id)}"
        hx-swap="outerHTML"
        hx-confirm="Delete '${escape(page.title)}'? This cannot be undone."
      >Delete</button>
    </div>
  </div>`
}

export function renderPageList(pages: PageListItem[]): string {
  if (pages.length === 0) {
    return `<p class="empty-state">No pages yet. <a href="/pages/new">Create your first page</a>.</p>`
  }
  return `<div class="card-grid">${pages.map(renderPageCard).join('')}</div>`
}

export function renderError(message: string): string {
  return `<div class="alert alert-error" role="alert">⚠️ ${escape(message)}</div>`
}

export function renderSuccess(message: string): string {
  return `<div class="alert alert-success" role="status">✓ ${escape(message)}</div>`
}
