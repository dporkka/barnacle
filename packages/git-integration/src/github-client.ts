import { Octokit } from 'octokit'

export interface CommitPageGraphOptions {
  owner: string
  repo: string
  branch: string
  pageId: string
  pageGraph: unknown
  commitMessage: string
  token: string
}

export interface DraftBranchOptions {
  owner: string
  repo: string
  pageId: string
  token: string
}

export interface PublishOptions {
  owner: string
  repo: string
  pageId: string
  branch: string
  title: string
  token: string
}

/** Creates a `draft/page/{pageId}` branch off the latest commit on main. */
export async function createDraftBranch(
  opts: DraftBranchOptions,
): Promise<{ branch: string }> {
  const { owner, repo, pageId, token } = opts
  const octokit = new Octokit({ auth: token })
  const branchName = `draft/page/${pageId}`

  // Get the SHA of the latest commit on main
  const { data: ref } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: 'heads/main',
  })

  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: ref.object.sha,
  })

  return { branch: branchName }
}

/**
 * Commits a PageGraph JSON to `content/pagegraphs/{pageId}.json` on the
 * given branch. Keys are sorted for deterministic output.
 */
export async function commitPageGraph(
  opts: CommitPageGraphOptions,
): Promise<{ sha: string }> {
  const { owner, repo, branch, pageId, pageGraph, commitMessage, token } = opts
  const octokit = new Octokit({ auth: token })
  const path = `content/pagegraphs/${pageId}.json`
  const content = deterministicJSON(pageGraph)
  const contentBase64 = btoa(unescape(encodeURIComponent(content)))

  // Check if file already exists so we can pass its SHA for updates
  let fileSha: string | undefined
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path, ref: branch })
    if (!Array.isArray(data) && data.type === 'file') {
      fileSha = data.sha
    }
  } catch {
    // File doesn't exist yet — that's fine
  }

  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: commitMessage,
    content: contentBase64,
    branch,
    sha: fileSha,
  })

  return { sha: data.commit.sha ?? '' }
}

/** Creates a PR from the draft branch to main. */
export async function createPublishPR(
  opts: PublishOptions,
): Promise<{ prUrl: string; prNumber: number }> {
  const { owner, repo, pageId, branch, title, token } = opts
  const octokit = new Octokit({ auth: token })

  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head: branch,
    base: 'main',
    body: `Publishing page \`${pageId}\` from branch \`${branch}\`.`,
  })

  return { prUrl: data.html_url, prNumber: data.number }
}

/** Serializes a value to JSON with sorted keys for determinism. */
function deterministicJSON(value: unknown): string {
  return JSON.stringify(value, sortedReplacer, 2)
}

function sortedReplacer(_key: string, val: unknown): unknown {
  if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
    const sorted: Record<string, unknown> = {}
    for (const k of Object.keys(val as Record<string, unknown>).sort()) {
      sorted[k] = (val as Record<string, unknown>)[k]
    }
    return sorted
  }
  return val
}
