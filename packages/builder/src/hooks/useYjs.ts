/**
 * useYjs.ts — Creates a Yjs document and WebSocket provider for a builder session.
 *
 * Manages connection lifecycle: creates the doc and provider on mount,
 * tracks connected/synced status, and tears everything down on unmount.
 */

import { useState, useEffect } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { createDoc } from '../crdt/doc'

export interface UseYjsResult {
  doc: Y.Doc
  provider: WebsocketProvider | null
  connected: boolean
  synced: boolean
}

export function useYjs(wsUrl: string, pageId: string): UseYjsResult {
  // The doc is stable for the lifetime of the component
  const [doc] = useState<Y.Doc>(() => createDoc())
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    const p = new WebsocketProvider(wsUrl, pageId, doc)

    p.on('status', ({ status }: { status: string }) => {
      setConnected(status === 'connected')
    })

    p.on('sync', (isSynced: boolean) => {
      setSynced(isSynced)
    })

    setProvider(p)

    return () => {
      p.destroy()
      setConnected(false)
      setSynced(false)
    }
  }, [wsUrl, pageId, doc])

  return { doc, provider, connected, synced }
}
