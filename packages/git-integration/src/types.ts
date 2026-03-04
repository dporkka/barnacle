export interface Env {
  GITHUB_APP_ID: string
  REPO_OWNER: string
  REPO_NAME: string
  GITHUB_APP_PRIVATE_KEY: string
  GITHUB_WEBHOOK_SECRET: string
  GITHUB_INSTALLATION_ID: string
}

export interface DraftRequest {
  pageId: string
}

export interface CommitRequest {
  pageId: string
  branch: string
  pageGraph: unknown
  commitMessage?: string
}

export interface PublishRequest {
  pageId: string
  branch: string
  title?: string
}

export interface WebhookEvent {
  type: 'push' | 'pull_request'
  ref?: string
  action?: string
  merged?: boolean
  prNumber?: number
  branch?: string
}
