/**
 * nodes/HeadingNode.tsx — Renders an h1–h6 heading, or a RichTextEditor when selected.
 */

import React from 'react'
import type * as Y from 'yjs'
import type { PageNode } from '../../types'
import type { DragHandlers } from '../../hooks/useDragDrop'
import RichTextEditor from '../RichTextEditor'

interface HeadingNodeProps {
  node: PageNode
  doc: Y.Doc
  selected: boolean
  onSelect: () => void
  dragHandlers: DragHandlers
}

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

const HeadingNode: React.FC<HeadingNodeProps> = ({
  node,
  doc,
  selected,
  onSelect,
  dragHandlers,
}) => {
  const level = Math.min(6, Math.max(1, (node.props['level'] as number | undefined) ?? 1))
  const Tag = `h${level}` as HeadingTag

  return (
    <div
      className={`node-heading${selected ? ' node-selected' : ''}`}
      draggable
      onDragStart={dragHandlers.onDragStart(node.id)}
      onDragOver={dragHandlers.onDragOver(node.id)}
      onDrop={dragHandlers.onDrop(node.id, 0)}
      onDragEnd={dragHandlers.onDragEnd}
      data-node-id={node.id}
    >
      {selected ? (
        <RichTextEditor doc={doc} nodeId={node.id} />
      ) : (
        <Tag
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          {(node.props['text'] as string | undefined) ?? ''}
        </Tag>
      )}
    </div>
  )
}

export default HeadingNode
