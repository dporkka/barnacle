/**
 * awareness.ts — Thin wrappers around the Yjs Awareness API.
 *
 * The Awareness protocol propagates ephemeral user presence data
 * (cursor position, user name, colour) to all connected peers without
 * persisting the information in the document history.
 */

import type { WebsocketProvider } from 'y-websocket'
import type { CollabUser } from '../types'

/** Extract the Awareness instance from a provider (structural alias). */
export type Awareness = WebsocketProvider['awareness']

/** Returns the Awareness instance attached to the given provider. */
export function initAwareness(provider: WebsocketProvider): Awareness {
  return provider.awareness
}

/** Set the local user's presence data visible to all peers. */
export function setLocalUser(awareness: Awareness, user: CollabUser): void {
  awareness.setLocalStateField('user', user)
}

/**
 * Returns the presence data of all *remote* users currently connected.
 * Filters out the local client so only peers are returned.
 */
export function getRemoteUsers(awareness: Awareness): CollabUser[] {
  const states = awareness.getStates()
  const users: CollabUser[] = []

  states.forEach((state, clientId) => {
    if (clientId !== awareness.clientID && state['user']) {
      users.push(state['user'] as CollabUser)
    }
  })

  return users
}
