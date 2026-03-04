# 🪸 barnacle — Static-First Visual CMS

A fully serverless, static-first visual CMS built on Cloudflare Workers, GitHub, and Hugo.
Content is stored as structured JSON in Git. The canonical source of truth is always a GitHub
repository. Pages are built into static HTML by Hugo and deployed to any CDN.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Browser                                     │
│                                                                          │
│  ┌─────────────────┐   ┌────────────────────┐   ┌──────────────────┐   │
│  │  Admin Shell    │   │  Canvas Builder    │   │  Published Site  │   │
│  │  (HTMX + SSR)  │   │  (React + Yjs)     │   │  (Hugo static)   │   │
│  └────────┬────────┘   └────────┬───────────┘   └──────────────────┘   │
└───────────┼─────────────────────┼──────────────────────────────────────-┘
            │                     │
            ▼                     ▼
┌───────────────────┐   ┌─────────────────────┐
│  @barnacle/admin  │   │ @barnacle/builder   │
│  Cloudflare Worker│   │ Vite + React SPA    │
│  KV Sessions      │   │ Yjs CRDT state      │
└─────────┬─────────┘   └──────────┬──────────┘
          │                        │
          │              ┌─────────▼──────────────┐
          │              │ @barnacle/collaboration │
          │              │ Cloudflare Durable Obj  │
          │              │ Yjs WebSocket relay     │
          │              └─────────┬───────────────┘
          │                        │
          ▼                        ▼
┌────────────────────────────────────────────────┐
│           @barnacle/git-integration            │
│           Cloudflare Worker                    │
│           GitHub App — REST API                │
│  - List/create/delete pages (branches)         │
│  - Read/write PageGraph JSON                   │
│  - Trigger publish (merge PR → main)           │
└──────────────────────┬─────────────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │   GitHub Repo    │
            │  pages/*.json    │  ◄── PageGraph JSON (source of truth)
            │  .github/        │
            │  workflows/      │
            └──────────┬───────┘
                       │  push to main
                       ▼
            ┌──────────────────┐
            │  GitHub Actions  │
            │  Hugo build      │
            │  Deploy to CDN   │
            └──────────────────┘

                    ┌──────────────────────┐
                    │   @barnacle/media    │
                    │   Cloudflare Worker  │
                    │   R2 object storage  │
                    └──────────────────────┘
                    ┌──────────────────────┐
                    │   @barnacle/schema   │
                    │   JSON Schema + TS   │
                    └──────────────────────┘
```

---

## Packages

| Package | Phase | Technology | Purpose |
|---|---|---|---|
| `packages/schema` | 1 | TypeScript / JSON Schema | PageGraph types & validation schema |
| `packages/builder` | 2–3 | React + Yjs + Vite | Visual canvas editor |
| `packages/collaboration` | 4 | Cloudflare Durable Objects | Real-time Yjs WebSocket relay |
| `packages/git-integration` | 5 | Cloudflare Workers + GitHub App | Git read/write API |
| `packages/media` | 6 | Cloudflare Workers + R2 | Media upload & serving |
| `packages/admin` | 7 | Cloudflare Workers + HTMX | Server-rendered admin shell |
| `packages/hugo-site` | — | Hugo | Static site generator |

---

## Architectural Rules

1. **Git is the source of truth.** All page content is stored as JSON in a GitHub repository.
   No database. No CMS-specific storage layer.
2. **Static output.** Hugo builds the site into plain HTML/CSS/JS. No server-side rendering
   at request time for the public site.
3. **Workers for everything serverless.** All dynamic functionality runs in Cloudflare Workers
   (edge compute). No Node.js server.
4. **CRDT collaboration via Yjs.** The builder uses Yjs for conflict-free real-time editing.
   The Durable Object relay synchronises Yjs updates across browser tabs/users.
5. **No CMS lock-in.** Content in Git means you can migrate away by simply using the JSON files.
6. **Admin is server-rendered.** The admin shell uses HTMX and server-rendered HTML. No React
   in the admin. Fast, accessible, simple.
7. **Media is hash-addressed.** Uploaded files are stored at content-hash–based keys in R2.
   Cache headers are set to immutable.

---

## Phase Details

### Phase 1 — Schema (`packages/schema`)

Defines the **PageGraph** data format:

```json
{
  "version": "1",
  "pageId": "uuid",
  "title": "My Page",
  "slug": "my-page",
  "nodes": {
    "node-1": { "type": "section", "props": {}, "children": ["node-2"] }
  },
  "root": "node-1"
}
```

- JSON Schema for validation (used in CI)
- TypeScript types for all packages

### Phase 2–3 — Builder (`packages/builder`)

- React SPA built with Vite
- Canvas component tree driven by PageGraph
- Yjs `Y.Doc` holds the live CRDT state
- Yjs awareness for multi-user cursor presence
- Connects to the Collaboration Durable Object via WebSocket

### Phase 4 — Collaboration (`packages/collaboration`)

- Cloudflare Durable Object: one instance per `pageId`
- Relays Yjs binary updates between connected WebSocket clients
- Persists Yjs document state in Durable Object storage
- Endpoint: `wss://barnacle-collaboration.workers.dev/room/{pageId}`

### Phase 5 — Git Integration (`packages/git-integration`)

- GitHub App with `contents:write` and `pull_requests:write` permissions
- Endpoints:
  - `GET /pages` — list draft branches + merged pages
  - `POST /pages` — create draft branch + initial PageGraph JSON
  - `GET /pages/:pageId` — read PageGraph JSON from branch
  - `PUT /pages/:pageId` — write PageGraph JSON to branch
  - `DELETE /pages/:pageId` — delete draft branch
  - `POST /pages/:pageId/publish` — open a PR / merge to main

### Phase 6 — Media (`packages/media`)

Cloudflare Worker + R2 for media uploads.

**Upload flow:**

```
Builder ──POST /signed-url──► media worker ──stores meta/{assetId}.json──► R2
         ◄── { uploadUrl, assetId, key, publicUrl } ──────────────────────────
Builder ──PUT {uploadUrl}──►  media worker ──PUT assets/{hash}.{ext}──────► R2
         ◄── { publicUrl, assetId, key } ─────────────────────────────────────
```

1. Client calls `POST /signed-url` with `{ filename, mimeType, contentLength, pageId }` and `Authorization: Bearer <UPLOAD_SECRET>`
2. Worker validates MIME type and file size, generates `assetId` (UUID) and a hash-based R2 key
3. Worker stores metadata at `meta/{assetId}.json` in R2
4. Worker returns `{ uploadUrl, assetId, key, publicUrl }` — `uploadUrl` contains an HMAC token
5. Client PUTs the file body to `uploadUrl`
6. Worker verifies the HMAC token, loads metadata, stores file at the hash key in R2
7. Assets are served at `GET /asset/{key}` with `Cache-Control: public, max-age=31536000, immutable`

**Allowed MIME types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`,
`image/avif`, `video/mp4`, `video/webm`, `application/pdf`

### Phase 7 — Admin Shell (`packages/admin`)

Server-rendered admin panel using HTMX for dynamic updates.

**Routes:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/login` | GitHub OAuth login page |
| `GET` | `/auth/callback` | OAuth callback, creates session |
| `GET` | `/logout` | Clears session cookie |
| `GET` | `/pages` | Page list (auto-refreshes via HTMX) |
| `GET` | `/pages/new` | New page form |
| `POST` | `/pages` | Create page (calls git-integration) |
| `GET` | `/pages/:id` | Page detail |
| `GET` | `/pages/:id/edit` | Redirects to builder |
| `DELETE` | `/pages/:id` | Delete page |
| `GET` | `/settings` | User settings |
| `GET` | `/build-logs` | Links to GitHub Actions |

Sessions are stored in Cloudflare KV with a 7-day TTL. Session token lives in an `HttpOnly`
cookie. Only emails listed in `ADMIN_ALLOWED_EMAILS` can log in.

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- `wrangler` CLI: `npm install -g wrangler`
- Cloudflare account (for remote bindings) or use local simulation

### Builder

```bash
cd packages/builder
npm install
npm run dev
# Opens at http://localhost:5173
```

### Collaboration

```bash
cd packages/collaboration
npm install
wrangler dev
# Local DO simulation at http://localhost:8787
```

### Git Integration

```bash
cd packages/git-integration
npm install
# Copy wrangler.toml and set secrets:
wrangler secret put GITHUB_APP_PRIVATE_KEY
wrangler secret put GITHUB_WEBHOOK_SECRET
wrangler dev
```

### Media

```bash
cd packages/media
npm install
# Set secrets:
wrangler secret put UPLOAD_SECRET
wrangler dev
# API at http://localhost:8787
```

### Admin

```bash
cd packages/admin
npm install
# Set secrets:
wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
wrangler secret put SESSION_SECRET
wrangler secret put ADMIN_ALLOWED_EMAILS   # comma-separated emails
wrangler dev
# Admin panel at http://localhost:8787
```

---

## Deployment

Each package deploys independently as a Cloudflare Worker:

```bash
# Deploy all workers
cd packages/collaboration && wrangler deploy
cd packages/git-integration && wrangler deploy
cd packages/media && wrangler deploy
cd packages/admin && wrangler deploy
```

The builder is a static SPA and can be deployed to Cloudflare Pages:

```bash
cd packages/builder
npm run build
wrangler pages deploy dist
```

The Hugo site is built and deployed via GitHub Actions on push to `main`.

---

## Git Workflow

1. **Create page** → Admin calls git-integration → creates branch `draft/{pageId}`
   and commits initial `pages/{pageId}.json`.
2. **Edit page** → Builder saves Yjs document → git-integration writes updated
   PageGraph JSON to the draft branch.
3. **Publish** → Admin triggers publish → git-integration opens a PR from
   `draft/{pageId}` → `main` and auto-merges it.
4. **Build** → GitHub Actions detects push to `main`, runs Hugo, deploys static site.
5. **Delete** → Admin deletes page → git-integration deletes the draft branch.

---

## PageGraph JSON Format

PageGraph is a tree of nodes stored as a flat map with a root pointer:

```json
{
  "version": "1",
  "pageId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "About Us",
  "slug": "about",
  "nodes": {
    "root": {
      "type": "page",
      "props": { "backgroundColor": "#ffffff" },
      "children": ["hero", "content"]
    },
    "hero": {
      "type": "section",
      "props": { "padding": "4rem" },
      "children": ["headline"]
    },
    "headline": {
      "type": "text",
      "props": { "content": "About Us", "tag": "h1" },
      "children": []
    },
    "content": {
      "type": "richtext",
      "props": { "html": "<p>Our story…</p>" },
      "children": []
    }
  },
  "root": "root"
}
```

Node types are defined in `packages/schema/src/types.ts` and validated with
`packages/schema/schema.json`.

---

## Collaboration (Yjs + Durable Objects)

The builder loads the PageGraph JSON from git-integration into a `Y.Doc`. Changes made in the
canvas are applied as Yjs transactions. The Yjs binary update messages are relayed through the
Collaboration Durable Object to all connected clients in real-time.

When the user saves, the builder serialises the current `Y.Doc` state back to PageGraph JSON
and writes it to the draft branch via git-integration.

```
Builder A ──Yjs update──► Durable Object ──Yjs update──► Builder B
Builder B ──Yjs update──► Durable Object ──Yjs update──► Builder A
                               │
                          persists state
                          in DO storage
```

---

## CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| `typecheck.yml` | PR / push | Runs `tsc --noEmit` on all Worker packages |
| `validate-pagegraph.yml` | PR / push | Validates `pages/*.json` against JSON Schema |
| `build.yml` | Push to `main` | Hugo build + deploy to hosting |
