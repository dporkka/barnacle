/**
 * NodeRenderer.tsx — Recursive node renderer that dispatches to type-specific components.
 *
 * Renders every PageNode in the tree by mapping NodeType to the appropriate
 * component, and recursively renders child nodes. Shows a blue selection
 * outline when the node's ID matches selectedNodeId.
 */

import React from 'react'
import * as Y from 'yjs'
import type { PageNode } from '../types'
import type { DragHandlers } from '../hooks/useDragDrop'
import SectionNode from './nodes/SectionNode'
import HeadingNode from './nodes/HeadingNode'
import ParagraphNode from './nodes/ParagraphNode'
import ImageNode from './nodes/ImageNode'
import ButtonNode from './nodes/ButtonNode'
import DividerNode from './nodes/DividerNode'
import ContainerNode from './nodes/ContainerNode'

export interface NodeRendererProps {
  node: PageNode
  doc: Y.Doc
  allNodes: Map<string, PageNode>
  selectedNodeId: string | null
  onSelect: (id: string) => void
  dragHandlers: DragHandlers
}

const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  doc,
  allNodes,
  selectedNodeId,
  onSelect,
  dragHandlers,
}) => {
  const selected = node.id === selectedNodeId

  /** Render all direct children by recursing into NodeRenderer. */
  const renderedChildren = node.children.map((childId) => {
    const child = allNodes.get(childId)
    if (!child) return null
    return (
      <NodeRenderer
        key={childId}
        node={child}
        doc={doc}
        allNodes={allNodes}
        selectedNodeId={selectedNodeId}
        onSelect={onSelect}
        dragHandlers={dragHandlers}
      />
    )
  })

  const commonProps = {
    node,
    selected,
    onSelect: () => onSelect(node.id),
    dragHandlers,
  }

  switch (node.type) {
    case 'section':
      return <SectionNode {...commonProps}>{renderedChildren}</SectionNode>

    case 'container':
    case 'columns':
      return <ContainerNode {...commonProps}>{renderedChildren}</ContainerNode>

    case 'heading':
      return <HeadingNode {...commonProps} doc={doc} />

    case 'paragraph':
    case 'richtext':
      return <ParagraphNode {...commonProps} doc={doc} />

    case 'image':
    case 'video':
      return <ImageNode {...commonProps} />

    case 'button':
      return <ButtonNode {...commonProps} />

    case 'divider':
      return <DividerNode {...commonProps} />

    default: {
      // Exhaustive fallback — should never be reached with valid NodeType
      const _exhaustive: never = node.type
      return (
        <div className="node-unknown" data-type={_exhaustive}>
          Unknown node type
        </div>
      )
    }
  }
}

export default NodeRenderer
