/**
 * BuilderShell.tsx — Top-level builder layout: toolbar + canvas + properties panel.
 *
 * Manages the WebSocket connection (via useYjs), derives the current PageGraph
 * (via usePageGraph), tracks selection/mode state, and wires everything together.
 * Shows a ConnectingOverlay until the WebSocket connection is established.
 */

import React, { useState, useEffect } from 'react'
import * as Y from 'yjs'
import type { BuilderMode, PageNode } from '../types'
import { useYjs } from '../hooks/useYjs'
import { usePageGraph } from '../hooks/usePageGraph'
import { initAwareness, setLocalUser } from '../crdt/awareness'
import { serializePageGraph } from '@barnacle/schema'
import ConnectingOverlay from './ConnectingOverlay'
import Toolbar from './Toolbar'
import Canvas from './Canvas'
import PropertiesPanel from './PropertiesPanel'

interface BuilderShellProps {
  pageId: string
  wsUrl: string
}

/** Derive a random hex colour for the local user's presence cursor. */
function randomColor(): string {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
}

const BuilderShell: React.FC<BuilderShellProps> = ({ pageId, wsUrl }) => {
  const { doc, provider, connected, synced } = useYjs(wsUrl, pageId)
  const pageGraph = usePageGraph(doc)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [mode, setMode] = useState<BuilderMode>('editing')

  // Register the local user in Yjs Awareness so remote peers see their cursor
  useEffect(() => {
    if (!provider) return
    const awareness = initAwareness(provider)
    setLocalUser(awareness, {
      clientId: doc.clientID,
      name: 'User',
      color: randomColor(),
    })
  }, [provider, doc])

  // Derive the full PageNode object for the currently-selected node ID
  const selectedNode: PageNode | null =
    selectedNodeId && pageGraph
      ? (pageGraph.nodes.find((n) => n.id === selectedNodeId) ?? null)
      : null

  const handleSelect = (id: string) => {
    setSelectedNodeId(id || null)
  }

  const handleSaveDraft = () => {
    if (!pageGraph) return
    setMode('saving')
    // Serialize and log — replace with an API call in production
    const json = serializePageGraph(pageGraph)
    console.log('[barnacle] save draft', json)
    setTimeout(() => setMode('editing'), 500)
  }

  const handlePublish = () => {
    if (!pageGraph) return
    setMode('saving')
    const json = serializePageGraph(pageGraph)
    console.log('[barnacle] publish', json)
    setTimeout(() => setMode('editing'), 500)
  }

  if (!connected) {
    return <ConnectingOverlay />
  }

  return (
    <div className="builder-shell">
      <Toolbar
        doc={doc as Y.Doc}
        mode={mode}
        onModeChange={setMode}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        connected={connected}
        synced={synced}
      />
      <div className="builder-main">
        <Canvas
          doc={doc as Y.Doc}
          pageGraph={pageGraph}
          selectedNodeId={selectedNodeId}
          onSelect={handleSelect}
        />
        <PropertiesPanel doc={doc as Y.Doc} node={selectedNode} />
      </div>
    </div>
  )
}

export { BuilderShell }
