/**
 * usePageGraph.ts — Derives a plain PageGraph from the live Yjs document.
 *
 * Subscribes to deep changes on the nodes, styles, assets, and meta maps
 * so the React tree re-renders whenever the CRDT document mutates.
 */

import { useState, useEffect } from 'react'
import * as Y from 'yjs'
import type { PageGraph } from '../types'
import { getNodesMap, getStylesMap, getAssetsMap, getMetaMap } from '../crdt/doc'
import { docToPageGraph } from '../crdt/serializer'

export function usePageGraph(doc: Y.Doc): PageGraph | null {
  const [pageGraph, setPageGraph] = useState<PageGraph | null>(null)

  useEffect(() => {
    /** Re-derive the plain PageGraph from the current doc state. */
    const updateGraph = () => {
      try {
        setPageGraph(docToPageGraph(doc))
      } catch {
        // Doc may be partially initialised during initial sync
        setPageGraph(null)
      }
    }

    const nodesMap = getNodesMap(doc)
    const stylesMap = getStylesMap(doc)
    const assetsMap = getAssetsMap(doc)
    const metaMap = getMetaMap(doc)

    // Use wrapper lambdas so updateGraph stays a zero-arg function
    const onNodesChange = () => updateGraph()
    const onStylesChange = () => updateGraph()
    const onAssetsChange = () => updateGraph()
    const onMetaChange = () => updateGraph()

    nodesMap.observeDeep(onNodesChange)
    stylesMap.observeDeep(onStylesChange)
    assetsMap.observeDeep(onAssetsChange)
    metaMap.observeDeep(onMetaChange)

    // Compute initial value
    updateGraph()

    return () => {
      nodesMap.unobserveDeep(onNodesChange)
      stylesMap.unobserveDeep(onStylesChange)
      assetsMap.unobserveDeep(onAssetsChange)
      metaMap.unobserveDeep(onMetaChange)
    }
  }, [doc])

  return pageGraph
}
