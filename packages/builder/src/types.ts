/**
 * types.ts — Re-exports PageGraph schema types and defines builder-specific state types.
 */

export type {
  NodeType,
  PageNode,
  PageGraph,
  PageMeta,
  StyleDef,
  AssetDef,
} from '@barnacle/schema'

/** Drag-and-drop state for the canvas. */
export interface DragState {
  dragging: boolean
  nodeId: string | null
  overNodeId: string | null
}

/** Currently selected node state. */
export interface SelectionState {
  selectedNodeId: string | null
}

/** Builder interaction mode. */
export type BuilderMode = 'editing' | 'preview' | 'saving'

/** A collaborating user visible via Yjs Awareness. */
export interface CollabUser {
  clientId: number
  name: string
  color: string
}
