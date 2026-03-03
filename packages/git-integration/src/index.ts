import { Env, DraftRequest, CommitRequest, PublishRequest } from './types'
import { generateJWT, getInstallationToken } from './auth'
import { verifyWebhookSignature, parseWebhookEvent } from './webhook'
import { createDraftBranch, commitPageGraph, createPublishPR } from './github-client'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'POST') {
      switch (url.pathname) {
        case '/draft':
          return handleDraft(request, env)
        case '/commit':
          return handleCommit(request, env)
        case '/publish':
          return handlePublish(request, env)
        case '/webhook':
          return handleWebhook(request, env)
      }
    }

    return jsonResponse({ error: 'Not Found' }, 404)
  },
}

async function getToken(env: Env): Promise<string> {
  const jwt = await generateJWT(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY)
  return getInstallationToken(jwt, env.GITHUB_INSTALLATION_ID)
}

async function handleDraft(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as DraftRequest
    const token = await getToken(env)
    const result = await createDraftBranch({
      owner: env.REPO_OWNER,
      repo: env.REPO_NAME,
      pageId: body.pageId,
      token,
    })
    return jsonResponse(result, 201)
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
}

async function handleCommit(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as CommitRequest
    const token = await getToken(env)
    const result = await commitPageGraph({
      owner: env.REPO_OWNER,
      repo: env.REPO_NAME,
      branch: body.branch,
      pageId: body.pageId,
      pageGraph: body.pageGraph,
      commitMessage: body.commitMessage ?? `Update page ${body.pageId}`,
      token,
    })
    return jsonResponse(result, 200)
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
}

async function handlePublish(request: Request, env: Env): Promise<Response> {
  try {
    const body = (await request.json()) as PublishRequest
    const token = await getToken(env)
    const result = await createPublishPR({
      owner: env.REPO_OWNER,
      repo: env.REPO_NAME,
      pageId: body.pageId,
      branch: body.branch,
      title: body.title ?? `Publish page ${body.pageId}`,
      token,
    })
    return jsonResponse(result, 201)
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500)
  }
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('X-Hub-Signature-256') ?? ''
  const eventType = request.headers.get('X-GitHub-Event') ?? ''
  const body = await request.text()

  const valid = await verifyWebhookSignature(body, signature, env.GITHUB_WEBHOOK_SECRET)
  if (!valid) {
    return jsonResponse({ error: 'Invalid signature' }, 401)
  }

  const event = parseWebhookEvent(body, eventType)
  if (!event) {
    return jsonResponse({ received: true }, 200)
  }

  // Trigger build on push to main or merged PR
  if (
    (event.type === 'push' && event.ref === 'refs/heads/main') ||
    (event.type === 'pull_request' && event.action === 'closed' && event.merged)
  ) {
    console.log('Build trigger event received:', event)
  }

  return jsonResponse({ received: true, event }, 200)
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
