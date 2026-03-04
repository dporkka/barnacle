/**
 * doc.ts — Yjs document model for the barnacle builder.
 *
 * The CRDT document is organised into five top-level Y.Maps:
 *
 *  • "nodes"    — Y.Map<Y.Map<unknown>>: one entry per PageNode, keyed by node ID.
 *                 Each node map holds: id, type, parentId, props (plain object),
 *                 children (Y.Array<string> of child IDs), styleRefs (Y.Array<string>).
 *
 *  • "styles"   — Y.Map<Y.Map<unknown>>: one entry per StyleDef, keyed by style ID.
 *                 Each style map holds: id, className, css (plain object).
 *
 *  • "assets"   — Y.Map<Y.Map<unknown>>: one entry per AssetDef, keyed by asset ID.
 *                 Each asset map holds: id, url, mimeType, hash, and optional
 *                 width, height, alt.
 *
 *  • "richtext" — Y.Map<Y.XmlFragment>: one Y.XmlFragment per richtext node,
 *                 keyed by node ID. Used by the Tiptap Collaboration extension.
 *
 *  • "meta"     — Y.Map<unknown>: flat map of PageMeta fields plus the doc "id".
 */

import * as Y from 'yjs'

/** Creates a fresh Yjs document for a builder session. */
export function createDoc(): Y.Doc {
  return new Y.Doc()
}

/**
 * Returns the nodes sub-map from the document.
 * Keys are node IDs; values are Y.Maps holding the node's fields.
 */
export function getNodesMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap<Y.Map<unknown>>('nodes')
}

/**
 * Returns the styles sub-map from the document.
 * Keys are style IDs; values are Y.Maps holding the StyleDef fields.
 */
export function getStylesMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap<Y.Map<unknown>>('styles')
}

/**
 * Returns the assets sub-map from the document.
 * Keys are asset IDs; values are Y.Maps holding the AssetDef fields.
 */
export function getAssetsMap(doc: Y.Doc): Y.Map<Y.Map<unknown>> {
  return doc.getMap<Y.Map<unknown>>('assets')
}

/**
 * Returns the richtext sub-map from the document.
 * Keys are node IDs; values are Y.XmlFragments used by Tiptap's Collaboration extension.
 */
export function getRichtextMap(doc: Y.Doc): Y.Map<Y.XmlFragment> {
  return doc.getMap<Y.XmlFragment>('richtext')
}

/**
 * Returns the meta sub-map from the document.
 * Stores flat PageMeta fields (title, slug, lang, …) plus the doc "id".
 */
export function getMetaMap(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap<unknown>('meta')
}
