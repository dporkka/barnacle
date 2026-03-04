/**
 * PropertiesPanel.tsx — Sidebar for editing the selected node's props.
 *
 * Displays the node type/ID and renders a text input for each string prop.
 * Changes are debounced (300 ms) before being committed as a Yjs transaction.
 */

import React, { useRef, useEffect, useState } from 'react'
import * as Y from 'yjs'
import type { PageNode } from '../types'
import { editNodeProps } from '../crdt/transactions'

interface PropertiesPanelProps {
  doc: Y.Doc
  node: PageNode | null
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ doc, node }) => {
  // Track local input values so the field feels responsive while debouncing
  const [localProps, setLocalProps] = useState<Record<string, string>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset local state whenever the selected node changes
  useEffect(() => {
    if (!node) {
      setLocalProps({})
      return
    }
    const stringProps: Record<string, string> = {}
    for (const [k, v] of Object.entries(node.props)) {
      if (typeof v === 'string') stringProps[k] = v
    }
    setLocalProps(stringProps)
  }, [node])

  const handleChange = (key: string, value: string) => {
    setLocalProps((prev) => ({ ...prev, [key]: value }))

    // Cancel any pending debounced write
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      if (node) {
        editNodeProps(doc, node.id, { [key]: value })
      }
    }, 300)
  }

  if (!node) {
    return (
      <aside className="properties-panel properties-panel-empty">
        <p className="properties-empty-msg">No selection</p>
      </aside>
    )
  }

  const stringPropKeys = Object.keys(node.props).filter(
    (k) => typeof node.props[k] === 'string',
  )

  return (
    <aside className="properties-panel">
      <div className="properties-header">
        <span className="properties-type">{node.type}</span>
        <span className="properties-id" title={node.id}>
          {node.id.slice(0, 8)}…
        </span>
      </div>

      <div className="properties-fields">
        {stringPropKeys.length === 0 && (
          <p className="properties-no-props">No editable props</p>
        )}
        {stringPropKeys.map((key) => (
          <label key={key} className="properties-field">
            <span className="properties-field-label">{key}</span>
            <input
              type="text"
              className="properties-field-input"
              value={localProps[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </aside>
  )
}

export default PropertiesPanel
