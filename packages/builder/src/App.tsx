import React from 'react'
import { BuilderShell } from './components/BuilderShell'

/** Parse URL search params and mount the builder shell. */
function App(): React.ReactElement {
  const params = new URLSearchParams(window.location.search)
  const pageId = params.get('pageId') ?? 'default-page'
  const wsUrl = params.get('wsUrl') ?? 'ws://localhost:1234'

  return <BuilderShell pageId={pageId} wsUrl={wsUrl} />
}

export default App
