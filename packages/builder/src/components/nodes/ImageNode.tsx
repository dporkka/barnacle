/**
 * nodes/ImageNode.tsx — Renders an image or a placeholder when no src is set.
 */

import React from 'react'
import type { PageNode } from '../../types'
import type { DragHandlers } from '../../hooks/useDragDrop'

interface ImageNodeProps {
  node: PageNode
  selected: boolean
  onSelect: () => void
  dragHandlers: DragHandlers
}

const ImageNode: React.FC<ImageNodeProps> = ({
  node,
  selected,
  onSelect,
  dragHandlers,
}) => {
  const src = node.props['src'] as string | undefined
  const alt = (node.props['alt'] as string | undefined) ?? ''

  return (
    <div
      className={`node-image${selected ? ' node-selected' : ''}`}
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
      {src ? (
        <img src={src} alt={alt} className="node-image-img" />
      ) : (
        <div className="node-image-placeholder" aria-label="Image placeholder">
          <span>🖼 No image selected</span>
        </div>
      )}
    </div>
  )
}

export default ImageNode
