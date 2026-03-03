/**
 * nodes/DividerNode.tsx — Renders a horizontal rule divider.
 */

import React from 'react'
import type { PageNode } from '../../types'
import type { DragHandlers } from '../../hooks/useDragDrop'

interface DividerNodeProps {
  node: PageNode
  selected: boolean
  onSelect: () => void
  dragHandlers: DragHandlers
}

const DividerNode: React.FC<DividerNodeProps> = ({
  node,
  selected,
  onSelect,
  dragHandlers,
}) => (
  <div
    className={`node-divider-wrapper${selected ? ' node-selected' : ''}`}
    draggable
    onClick={(e) => {
      e.stopPropagation()
      onSelect()
    }}
    onDragStart={dragHandlers.onDragStart(node.id)}
    onDragOver={dragHandlers.onDragOver(node.id)}
    onDrop={dragHandlers.onDrop(node.id, 0)}
    onDragEnd={dragHandlers.onDragEnd}
    data-node-id={node.id}
  >
    <hr className="node-divider" />
  </div>
)

export default DividerNode
