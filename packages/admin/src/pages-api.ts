import { PageListItem } from './types'

export async function listPages(
  token: string,
  gitIntegrationUrl: string,
): Promise<PageListItem[]> {
  const res = await fetch(`${gitIntegrationUrl}/pages`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'barnacle-admin',
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to list pages: ${res.status}`)
  }
  return res.json() as Promise<PageListItem[]>
}

export async function createPage(
  token: string,
  gitIntegrationUrl: string,
  pageId: string,
  slug: string,
  title: string,
): Promise<void> {
  const res = await fetch(`${gitIntegrationUrl}/pages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'barnacle-admin',
    },
    body: JSON.stringify({ pageId, slug, title }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create page: ${res.status} ${body}`)
  }
}

export async function deletePage(
  token: string,
  gitIntegrationUrl: string,
  pageId: string,
): Promise<void> {
  const res = await fetch(`${gitIntegrationUrl}/pages/${pageId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'barnacle-admin',
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to delete page: ${res.status} ${body}`)
  }
}
