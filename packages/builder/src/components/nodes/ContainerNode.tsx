/**
 * nodes/ContainerNode.tsx — Generic container div that renders its children.
 */

import React from 'react'
import type { PageNode } from '../../types'
import type { DragHandlers } from '../../hooks/useDragDrop'

interface ContainerNodeProps {
  node: PageNode
  selected: boolean
  onSelect: () => void
  dragHandlers: DragHandlers
  children?: React.ReactNode
}

const ContainerNode: React.FC<ContainerNodeProps> = ({
  node,
  selected,
  onSelect,
  dragHandlers,
  children,
}) => (
  <div
    className={`node-container${selected ? ' node-selected' : ''}`}
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
    {children}
  </div>
)

export default ContainerNode
