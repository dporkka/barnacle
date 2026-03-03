export interface Env {
  SESSIONS: KVNamespace
  GITHUB_OAUTH_CLIENT_ID: string
  GITHUB_OAUTH_CLIENT_SECRET: string
  SESSION_SECRET: string
  GIT_INTEGRATION_URL: string
  BUILDER_URL: string
  ADMIN_ALLOWED_EMAILS: string
}

export interface Session {
  userId: string
  email: string
  name: string
  avatarUrl: string
  githubToken: string
  createdAt: number
  expiresAt: number
}

export interface PageListItem {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  updatedAt: string
}
