/**
 * Canvas.tsx — The main page canvas where nodes are rendered and rearranged.
 *
 * Renders root-level nodes (parentId === null) using NodeRenderer.
 * Wires up drag-and-drop via useDragDrop and highlights the drag target.
 */

import React from 'react'
import * as Y from 'yjs'
import type { PageGraph, PageNode } from '../types'
import { useDragDrop } from '../hooks/useDragDrop'
import NodeRenderer from './NodeRenderer'

interface CanvasProps {
  doc: Y.Doc
  pageGraph: PageGraph | null
  selectedNodeId: string | null
  onSelect: (id: string) => void
}

const Canvas: React.FC<CanvasProps> = ({ doc, pageGraph, selectedNodeId, onSelect }) => {
  const { dragState, dragHandlers } = useDragDrop(doc)

  if (!pageGraph || pageGraph.nodes.length === 0) {
    return (
      <div className="canvas canvas-empty">
        <p>Empty page — add a section to get started.</p>
      </div>
    )
  }

  const allNodes = new Map<string, PageNode>(
    pageGraph.nodes.map((n) => [n.id, n]),
  )
  const rootNodes = pageGraph.nodes.filter((n) => n.parentId === null)

  return (
    <div
      className={`canvas${dragState.dragging ? ' canvas-dragging' : ''}`}
      onClick={() => onSelect('')}
    >
      {rootNodes.map((node) => (
        <NodeRenderer
          key={node.id}
          node={node}
          doc={doc}
          allNodes={allNodes}
          selectedNodeId={selectedNodeId}
          onSelect={onSelect}
          dragHandlers={dragHandlers}
        />
      ))}
    </div>
  )
}

export default Canvas
