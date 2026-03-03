/**
 * ConnectingOverlay.tsx — Shown while the WebSocket connection is being established.
 */

import React from 'react'

const ConnectingOverlay: React.FC = () => (
  <div className="connecting-overlay">
    <div className="connecting-spinner" aria-hidden="true" />
    <p className="connecting-text">Connecting to collaboration server…</p>
  </div>
)

export default ConnectingOverlay
