/**
 * RichTextEditor.tsx — Collaborative rich-text editor powered by Tiptap + Yjs.
 *
 * Mounts a Tiptap editor backed by a Y.XmlFragment from the richtext map,
 * enabling real-time collaborative editing via the Collaboration extension.
 * CollaborationCursor shows remote cursors when awareness data is provided.
 */

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'
import { getRichtextMap } from '../crdt/doc'

interface RichTextEditorProps {
  doc: Y.Doc
  nodeId: string
  readOnly?: boolean
  /** Optional provider; enables collaborative cursors when present. */
  awareness?: WebsocketProvider['awareness']
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  doc,
  nodeId,
  readOnly = false,
  awareness,
}) => {
  // Get-or-create the Y.XmlFragment for this node's content
  const richtextMap = getRichtextMap(doc)
  if (!richtextMap.has(nodeId)) {
    // Initialise inside a transaction so peers see the fragment creation
    doc.transact(() => {
      richtextMap.set(nodeId, doc.getXmlFragment(`rt-${nodeId}`))
    })
  }
  const fragment = richtextMap.get(nodeId)!

  const extensions = [
    // Disable the history extension — Yjs provides undo/redo via its own UndoManager
    StarterKit.configure({ history: false }),
    Collaboration.configure({ fragment }),
    ...(awareness
      ? [
          CollaborationCursor.configure({
            provider: { awareness },
          }),
        ]
      : []),
  ]

  const editor = useEditor({
    extensions,
    editable: !readOnly,
  })

  return (
    <div className="richtext-editor" data-node-id={nodeId}>
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor
