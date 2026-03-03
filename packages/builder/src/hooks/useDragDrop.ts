/**
 * useDragDrop.ts — Native HTML5 drag-and-drop for canvas node reordering.
 *
 * Returns curried event handlers that bind the node ID at the call site,
 * plus the current DragState so components can apply visual feedback.
 * Commits the move via the moveNode transaction on drop.
 */

import { useState } from 'react'
import * as Y from 'yjs'
import type { DragState } from '../types'
import { moveNode } from '../crdt/transactions'

export interface DragHandlers {
  onDragStart: (nodeId: string) => React.DragEventHandler
  onDragOver: (nodeId: string) => React.DragEventHandler
  onDrop: (targetParentId: string, targetIndex: number) => React.DragEventHandler
  onDragEnd: React.DragEventHandler
}

export interface UseDragDropResult {
  dragState: DragState
  dragHandlers: DragHandlers
}

export function useDragDrop(doc: Y.Doc): UseDragDropResult {
  const [dragState, setDragState] = useState<DragState>({
    dragging: false,
    nodeId: null,
    overNodeId: null,
  })

  const onDragStart = (nodeId: string): React.DragEventHandler =>
    (e) => {
      e.dataTransfer.effectAllowed = 'move'
      setDragState({ dragging: true, nodeId, overNodeId: null })
    }

  const onDragOver = (nodeId: string): React.DragEventHandler =>
    (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragState((prev) => ({ ...prev, overNodeId: nodeId }))
    }

  const onDrop = (targetParentId: string, targetIndex: number): React.DragEventHandler =>
    (e) => {
      e.preventDefault()
      if (dragState.nodeId && dragState.nodeId !== targetParentId) {
        moveNode(doc, dragState.nodeId, targetParentId, targetIndex)
      }
      setDragState({ dragging: false, nodeId: null, overNodeId: null })
    }

  const onDragEnd: React.DragEventHandler = () => {
    setDragState({ dragging: false, nodeId: null, overNodeId: null })
  }

  return {
    dragState,
    dragHandlers: { onDragStart, onDragOver, onDrop, onDragEnd },
  }
}
