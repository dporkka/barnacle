/**
 * transactions.ts — All builder mutations as atomic Yjs transactions.
 *
 * Every exported function wraps its changes in doc.transact() so that
 * remote peers receive a single logical operation rather than a stream
 * of individual Y.Map mutations.
 */

import * as Y from 'yjs'
import { getNodesMap } from './doc'
import type { NodeType } from '../types'

/** Add a new node to the document and optionally attach it to a parent. */
export function addNode(
  doc: Y.Doc,
  type: NodeType,
  parentId: string | null,
  props: Record<string, unknown> = {},
): string {
  const id = crypto.randomUUID()

  doc.transact(() => {
    const nodes = getNodesMap(doc)

    const node = new Y.Map<unknown>()
    node.set('id', id)
    node.set('type', type)
    node.set('parentId', parentId)
    node.set('props', props)
    node.set('children', new Y.Array<string>())
    node.set('styleRefs', new Y.Array<string>())
    nodes.set(id, node)

    // Append this node's ID to the parent's children array
    if (parentId) {
      const parent = nodes.get(parentId)
      if (parent) {
        const children = parent.get('children') as Y.Array<string>
        children.push([id])
      }
    }
  })

  return id
}

/**
 * Move a node to a new parent, inserting it at the given index.
 * Removes the node from its current parent first.
 */
export function moveNode(
  doc: Y.Doc,
  nodeId: string,
  newParentId: string,
  newIndex: number,
): void {
  doc.transact(() => {
    const nodes = getNodesMap(doc)
    const node = nodes.get(nodeId)
    if (!node) return

    const oldParentId = node.get('parentId') as string | null

    // Remove from old parent's children array
    if (oldParentId) {
      const oldParent = nodes.get(oldParentId)
      if (oldParent) {
        const children = oldParent.get('children') as Y.Array<string>
        const arr = children.toArray()
        const idx = arr.indexOf(nodeId)
        if (idx !== -1) children.delete(idx, 1)
      }
    }

    // Insert into new parent's children array at the requested position
    const newParent = nodes.get(newParentId)
    if (newParent) {
      const children = newParent.get('children') as Y.Array<string>
      const clampedIndex = Math.min(newIndex, children.length)
      children.insert(clampedIndex, [nodeId])
    }

    // Update the node's parentId reference
    node.set('parentId', newParentId)
  })
}

/**
 * Delete a node and all of its descendants from the document.
 * Also removes the node from its parent's children array.
 */
export function deleteNode(doc: Y.Doc, nodeId: string): void {
  doc.transact(() => {
    const nodes = getNodesMap(doc)

    /** Collect the node and all descendant IDs depth-first. */
    function collectIds(id: string): string[] {
      const n = nodes.get(id)
      if (!n) return []
      const children = n.get('children') as Y.Array<string>
      const childIds = children.toArray()
      return [id, ...childIds.flatMap((childId) => collectIds(childId))]
    }

    const toDelete = collectIds(nodeId)

    // Detach from parent first
    const nodeToDelete = nodes.get(nodeId)
    if (nodeToDelete) {
      const parentId = nodeToDelete.get('parentId') as string | null
      if (parentId) {
        const parent = nodes.get(parentId)
        if (parent) {
          const children = parent.get('children') as Y.Array<string>
          const arr = children.toArray()
          const idx = arr.indexOf(nodeId)
          if (idx !== -1) children.delete(idx, 1)
        }
      }
    }

    // Delete every collected node
    for (const id of toDelete) {
      nodes.delete(id)
    }
  })
}

/** Merge new props into a node's existing props object. */
export function editNodeProps(
  doc: Y.Doc,
  nodeId: string,
  props: Record<string, unknown>,
): void {
  doc.transact(() => {
    const nodes = getNodesMap(doc)
    const node = nodes.get(nodeId)
    if (!node) return
    // Replace the props entry with the merged object
    const existing = (node.get('props') as Record<string, unknown>) ?? {}
    node.set('props', { ...existing, ...props })
  })
}

/** Add a style reference to a node if it is not already present. */
export function applyStyle(
  doc: Y.Doc,
  nodeId: string,
  styleId: string,
): void {
  doc.transact(() => {
    const nodes = getNodesMap(doc)
    const node = nodes.get(nodeId)
    if (!node) return
    const styleRefs = node.get('styleRefs') as Y.Array<string>
    if (!styleRefs.toArray().includes(styleId)) {
      styleRefs.push([styleId])
    }
  })
}

/** Remove a style reference from a node. */
export function removeStyle(
  doc: Y.Doc,
  nodeId: string,
  styleId: string,
): void {
  doc.transact(() => {
    const nodes = getNodesMap(doc)
    const node = nodes.get(nodeId)
    if (!node) return
    const styleRefs = node.get('styleRefs') as Y.Array<string>
    const arr = styleRefs.toArray()
    const idx = arr.indexOf(styleId)
    if (idx !== -1) styleRefs.delete(idx, 1)
  })
}
