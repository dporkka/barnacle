/**
 * nodes/SectionNode.tsx — Renders a page section with drag handle and selection outline.
 */

import React from 'react'
import type { PageNode } from '../../types'
import type { DragHandlers } from '../../hooks/useDragDrop'

interface SectionNodeProps {
  node: PageNode
  selected: boolean
  onSelect: () => void
  dragHandlers: DragHandlers
  children?: React.ReactNode
}

const SectionNode: React.FC<SectionNodeProps> = ({
  node,
  selected,
  onSelect,
  dragHandlers,
  children,
}) => (
  <section
    className={`node-section${selected ? ' node-selected' : ''}`}
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
    aria-selected={selected}
  >
    <span className="drag-handle" aria-hidden="true">⠿</span>
    {children}
  </section>
)

export default SectionNode
