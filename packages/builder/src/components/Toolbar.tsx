/**
 * Toolbar.tsx — Builder toolbar with mode toggle, add-node, save, and publish actions.
 *
 * "Add Section" inserts a root-level section node via the addNode transaction.
 * The collaboration status indicator is shown as a coloured dot.
 */

import React from 'react'
import * as Y from 'yjs'
import type { BuilderMode } from '../types'
import { addNode } from '../crdt/transactions'

interface ToolbarProps {
  doc: Y.Doc
  mode: BuilderMode
  onModeChange: (m: BuilderMode) => void
  onSaveDraft: () => void
  onPublish: () => void
  /** Whether the WebSocket is currently connected. */
  connected: boolean
  /** Whether the document has fully synced with the server. */
  synced: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({
  doc,
  mode,
  onModeChange,
  onSaveDraft,
  onPublish,
  connected,
  synced,
}) => {
  const handleAddSection = () => {
    addNode(doc, 'section', null, { label: 'New Section' })
  }

  const connStatus = !connected ? 'disconnected' : !synced ? 'syncing' : 'connected'

  return (
    <header className="toolbar" role="toolbar" aria-label="Builder toolbar">
      {/* Add-node controls */}
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn toolbar-btn-primary"
          onClick={handleAddSection}
          disabled={mode !== 'editing'}
          title="Add a root section to the page"
        >
          + Add Section
        </button>
      </div>

      {/* Mode toggle */}
      <div className="toolbar-group toolbar-mode">
        <button
          type="button"
          className={`toolbar-btn${mode === 'editing' ? ' toolbar-btn-active' : ''}`}
          onClick={() => onModeChange('editing')}
          aria-pressed={mode === 'editing'}
        >
          Editing
        </button>
        <button
          type="button"
          className={`toolbar-btn${mode === 'preview' ? ' toolbar-btn-active' : ''}`}
          onClick={() => onModeChange('preview')}
          aria-pressed={mode === 'preview'}
        >
          Preview
        </button>
      </div>

      {/* Save / Publish */}
      <div className="toolbar-group toolbar-actions">
        <button
          type="button"
          className="toolbar-btn"
          onClick={onSaveDraft}
          disabled={mode === 'saving'}
        >
          Save Draft
        </button>
        <button
          type="button"
          className="toolbar-btn toolbar-btn-publish"
          onClick={onPublish}
          disabled={mode === 'saving'}
        >
          Publish
        </button>
      </div>

      {/* Collaboration status indicator */}
      <div className="toolbar-collab" title={`Status: ${connStatus}`} aria-label={`Collaboration ${connStatus}`}>
        <span className={`collab-dot collab-dot-${connStatus}`} aria-hidden="true" />
        <span className="collab-label">{connStatus}</span>
      </div>
    </header>
  )
}

export default Toolbar
