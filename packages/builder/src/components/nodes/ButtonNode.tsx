/**
 * nodes/ButtonNode.tsx — Renders a button with a label prop.
 */

import React from 'react'
import type { PageNode } from '../../types'
import type { DragHandlers } from '../../hooks/useDragDrop'

interface ButtonNodeProps {
  node: PageNode
  selected: boolean
  onSelect: () => void
  dragHandlers: DragHandlers
}

const ButtonNode: React.FC<ButtonNodeProps> = ({
  node,
  selected,
  onSelect,
  dragHandlers,
}) => {
  const label = (node.props['label'] as string | undefined) ?? 'Button'

  return (
    <div
      className={`node-button-wrapper${selected ? ' node-selected' : ''}`}
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
      <button type="button" className="node-button" tabIndex={-1}>
        {label}
      </button>
    </div>
  )
}

export default ButtonNode
