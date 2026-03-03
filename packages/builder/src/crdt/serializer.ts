/**
 * serializer.ts — Convert between Yjs document state and plain PageGraph JSON.
 *
 * docToPageGraph reads all Y.Maps and reconstructs a PageGraph value object.
 * pageGraphToDoc populates Y.Maps from a PageGraph (used for initial load).
 */

import * as Y from 'yjs'
import type { PageGraph, PageMeta, PageNode, StyleDef, AssetDef, NodeType } from '../types'
import { getNodesMap, getStylesMap, getAssetsMap, getMetaMap } from './doc'

/**
 * Converts the current Yjs document state to a plain PageGraph object.
 * If meta is not provided, it is derived from the document's meta Y.Map.
 */
export function docToPageGraph(doc: Y.Doc, meta?: PageMeta): PageGraph {
  const nodesMap = getNodesMap(doc)
  const stylesMap = getStylesMap(doc)
  const assetsMap = getAssetsMap(doc)
  const metaMap = getMetaMap(doc)

  // Resolve page metadata from the Y.Map if not passed explicitly
  const resolvedMeta: PageMeta = meta ?? {
    title: (metaMap.get('title') as string | undefined) ?? 'Untitled',
    slug: (metaMap.get('slug') as string | undefined) ?? 'untitled',
    description: metaMap.get('description') as string | undefined,
    lang: (metaMap.get('lang') as string | undefined) ?? 'en',
    publishedAt: metaMap.get('publishedAt') as string | undefined,
    updatedAt: metaMap.get('updatedAt') as string | undefined,
  }

  // Convert the nodes Y.Map to a PageNode array
  const nodes: PageNode[] = []
  nodesMap.forEach((nodeMap) => {
    const children = nodeMap.get('children')
    const styleRefs = nodeMap.get('styleRefs')
    nodes.push({
      id: nodeMap.get('id') as string,
      type: nodeMap.get('type') as NodeType,
      parentId: nodeMap.get('parentId') as string | null,
      props: (nodeMap.get('props') as Record<string, unknown>) ?? {},
      children: children instanceof Y.Array ? (children as Y.Array<string>).toArray() : [],
      styleRefs: styleRefs instanceof Y.Array ? (styleRefs as Y.Array<string>).toArray() : [],
    })
  })

  // Convert the styles Y.Map to Record<string, StyleDef>
  const styles: Record<string, StyleDef> = {}
  stylesMap.forEach((styleMap, id) => {
    styles[id] = {
      id: styleMap.get('id') as string,
      className: styleMap.get('className') as string,
      css: (styleMap.get('css') as Record<string, string>) ?? {},
    }
  })

  // Convert the assets Y.Map to Record<string, AssetDef>
  const assets: Record<string, AssetDef> = {}
  assetsMap.forEach((assetMap, id) => {
    assets[id] = {
      id: assetMap.get('id') as string,
      url: assetMap.get('url') as string,
      mimeType: assetMap.get('mimeType') as string,
      hash: assetMap.get('hash') as string,
      width: assetMap.get('width') as number | undefined,
      height: assetMap.get('height') as number | undefined,
      alt: assetMap.get('alt') as string | undefined,
    }
  })

  const docId = (metaMap.get('id') as string | undefined) ?? crypto.randomUUID()

  return {
    id: docId,
    version: '1',
    meta: resolvedMeta,
    nodes,
    styles,
    assets,
  }
}

/**
 * Populates Yjs Y.Maps from a PageGraph object in a single transaction.
 * Intended for initial load — clears and rewrites all maps.
 */
export function pageGraphToDoc(doc: Y.Doc, graph: PageGraph): void {
  const nodesMap = getNodesMap(doc)
  const stylesMap = getStylesMap(doc)
  const assetsMap = getAssetsMap(doc)
  const metaMap = getMetaMap(doc)

  doc.transact(() => {
    // Write meta fields into the meta Y.Map
    metaMap.set('id', graph.id)
    metaMap.set('title', graph.meta.title)
    metaMap.set('slug', graph.meta.slug)
    if (graph.meta.description !== undefined) metaMap.set('description', graph.meta.description)
    if (graph.meta.lang !== undefined) metaMap.set('lang', graph.meta.lang)
    if (graph.meta.publishedAt !== undefined) metaMap.set('publishedAt', graph.meta.publishedAt)
    if (graph.meta.updatedAt !== undefined) metaMap.set('updatedAt', graph.meta.updatedAt)

    // Write each PageNode into the nodes Y.Map
    for (const node of graph.nodes) {
      const nodeMap = new Y.Map<unknown>()
      nodeMap.set('id', node.id)
      nodeMap.set('type', node.type)
      nodeMap.set('parentId', node.parentId)
      nodeMap.set('props', node.props)

      const children = new Y.Array<string>()
      if (node.children.length > 0) children.push(node.children)
      nodeMap.set('children', children)

      const styleRefs = new Y.Array<string>()
      if (node.styleRefs.length > 0) styleRefs.push(node.styleRefs)
      nodeMap.set('styleRefs', styleRefs)

      nodesMap.set(node.id, nodeMap)
    }

    // Write each StyleDef into the styles Y.Map
    for (const [id, style] of Object.entries(graph.styles)) {
      const styleMap = new Y.Map<unknown>()
      styleMap.set('id', style.id)
      styleMap.set('className', style.className)
      styleMap.set('css', style.css)
      stylesMap.set(id, styleMap)
    }

    // Write each AssetDef into the assets Y.Map
    for (const [id, asset] of Object.entries(graph.assets)) {
      const assetMap = new Y.Map<unknown>()
      assetMap.set('id', asset.id)
      assetMap.set('url', asset.url)
      assetMap.set('mimeType', asset.mimeType)
      assetMap.set('hash', asset.hash)
      if (asset.width !== undefined) assetMap.set('width', asset.width)
      if (asset.height !== undefined) assetMap.set('height', asset.height)
      if (asset.alt !== undefined) assetMap.set('alt', asset.alt)
      assetsMap.set(id, assetMap)
    }
  })
}
