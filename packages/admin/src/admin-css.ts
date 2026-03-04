/* barnacle admin — inline CSS */
const CSS = `
:root {
  --color-bg: #f8f9fa;
  --color-surface: #ffffff;
  --color-border: #dee2e6;
  --color-text: #212529;
  --color-text-muted: #6c757d;
  --color-accent: #0d6efd;
  --color-accent-hover: #0b5ed7;
  --color-danger: #dc3545;
  --color-danger-hover: #bb2d3b;
  --color-success: #198754;
  --color-published: #0f5132;
  --color-published-bg: #d1e7dd;
  --color-draft-bg: #fff3cd;
  --color-draft: #664d03;
  --radius: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
}

*, *::before, *::after { box-sizing: border-box; }

html { font-size: 16px; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
}

/* ── Nav ── */
.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1.5rem;
  height: 56px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  font-size: 1.2rem;
  font-weight: 700;
  text-decoration: none;
  color: var(--color-text);
  margin-right: auto;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: var(--color-text-muted);
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.nav-links a:hover { background: var(--color-bg); color: var(--color-text); }

.nav-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
}

.nav-avatar {
  border-radius: 50%;
  width: 32px;
  height: 32px;
  object-fit: cover;
}

.nav-name {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* ── Main ── */
.main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;
}

.btn:hover { background: var(--color-bg); }

.btn-sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; }
.btn-lg { padding: 0.65rem 1.4rem; font-size: 1rem; }

.btn-primary {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: #fff;
}
.btn-primary:hover { background: var(--color-accent-hover); border-color: var(--color-accent-hover); }

.btn-danger {
  background: var(--color-danger);
  border-color: var(--color-danger);
  color: #fff;
}
.btn-danger:hover { background: var(--color-danger-hover); border-color: var(--color-danger-hover); }

.btn-ghost { background: transparent; border-color: transparent; }
.btn-ghost:hover { background: var(--color-bg); }

/* ── Cards ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.25rem;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.card-title a { color: var(--color-text); text-decoration: none; }
.card-title a:hover { text-decoration: underline; }

.card-meta { margin: 0; font-size: 0.8rem; color: var(--color-text-muted); }

.card-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }

/* ── Badges ── */
.badge {
  display: inline-block;
  padding: 0.2em 0.55em;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-published {
  background: var(--color-published-bg);
  color: var(--color-published);
}

.badge-draft {
  background: var(--color-draft-bg);
  color: var(--color-draft);
}

/* ── Alerts ── */
.alert {
  padding: 0.85rem 1rem;
  border-radius: var(--radius);
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.alert-error {
  background: #f8d7da;
  color: #842029;
  border: 1px solid #f5c2c7;
}

.alert-success {
  background: #d1e7dd;
  color: var(--color-published);
  border: 1px solid #badbcc;
}

/* ── Page header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header h1 { margin: 0; font-size: 1.6rem; }
.page-header-actions { display: flex; gap: 0.5rem; }

.breadcrumb {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-decoration: none;
  display: inline-block;
  margin-bottom: 0.4rem;
}
.breadcrumb:hover { color: var(--color-text); }

/* ── Detail card / dl ── */
.detail-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 1rem;
}

.dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1.5rem;
  margin: 0;
}

.dl dt { font-weight: 600; color: var(--color-text-muted); font-size: 0.875rem; }
.dl dd { margin: 0; word-break: break-all; }

/* ── Forms ── */
.form-container {
  max-width: 540px;
}

.form { display: flex; flex-direction: column; gap: 1.25rem; }

.form-group { display: flex; flex-direction: column; gap: 0.35rem; }

.form-group label { font-weight: 600; font-size: 0.9rem; }

.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.95rem;
  background: var(--color-surface);
  color: var(--color-text);
  width: 100%;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13,110,253,.25);
}

.input-prefix-group { display: flex; align-items: center; }

.input-prefix {
  padding: 0.5rem 0.75rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-right: none;
  border-radius: var(--radius) 0 0 var(--radius);
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.input-prefix + .input { border-radius: 0 var(--radius) var(--radius) 0; }

.form-hint { color: var(--color-text-muted); font-size: 0.8rem; }

.form-actions { display: flex; gap: 0.75rem; }

/* ── Auth box ── */
.auth-box {
  max-width: 400px;
  margin: 5rem auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 2.5rem;
  box-shadow: var(--shadow);
  text-align: center;
}

.auth-box h1 { margin: 0 0 0.5rem; font-size: 1.8rem; }
.auth-box p { color: var(--color-text-muted); margin-bottom: 1.5rem; }

/* ── Misc ── */
.text-muted { color: var(--color-text-muted); }
.empty-state { color: var(--color-text-muted); font-size: 1rem; padding: 2rem 0; }

code {
  background: var(--color-bg);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.875em;
}

/* ── HTMX indicator ── */
.htmx-indicator {
  display: none;
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  background: var(--color-accent);
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius);
  font-size: 0.85rem;
  box-shadow: var(--shadow);
}

.htmx-request .htmx-indicator { display: block; }
.htmx-request.htmx-indicator { display: block; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .nav { padding: 0 1rem; }
  .nav-name { display: none; }
  .main { padding: 1rem; }
  .card-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .dl { grid-template-columns: 1fr; }
}
`

export default CSS
