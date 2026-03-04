/**
 * nodes/ParagraphNode.tsx — Renders a paragraph, or a RichTextEditor when selected.
 */

import React from 'react'
import type * as Y from 'yjs'
import type { PageNode } from '../../types'
import type { DragHandlers } from '../../hooks/useDragDrop'
import RichTextEditor from '../RichTextEditor'

interface ParagraphNodeProps {
  node: PageNode
  doc: Y.Doc
  selected: boolean
  onSelect: () => void
  dragHandlers: DragHandlers
}

const ParagraphNode: React.FC<ParagraphNodeProps> = ({
  node,
  doc,
  selected,
  onSelect,
  dragHandlers,
}) => (
  <div
    className={`node-paragraph${selected ? ' node-selected' : ''}`}
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
      <p
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        {(node.props['text'] as string | undefined) ?? ''}
      </p>
    )}
  </div>
)

export default ParagraphNode
