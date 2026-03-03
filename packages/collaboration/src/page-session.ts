import * as Y from 'yjs'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { Env } from './types'

// Message type constants (matching y-websocket protocol)
const MSG_SYNC = 0
const MSG_AWARENESS = 1
// MSG_AUTH and MSG_QUERY_AWARENESS are part of the protocol but handled generically
const MSG_AUTH = 2
const MSG_QUERY_AWARENESS = 3

// y-websocket sync sub-message types
const SYNC_STEP1 = 0
const SYNC_STEP2 = 1
const SYNC_UPDATE = 2

interface AwarenessState {
  // Opaque client state blob stored as-is and forwarded to peers
  data: Uint8Array
}

interface SessionState {
  clients: Map<string, WebSocket>
  doc: Y.Doc
  /** clientId -> raw awareness blob (last known state per client) */
  awarenessStates: Map<number, AwarenessState>
  updateCount: number
  snapshotThreshold: number
  /** Tombstone map for deleted node IDs */
  deletedNodeIds: Set<string>
}

export class PageSession implements DurableObject {
  private state: SessionState

  constructor(private ctx: DurableObjectState, private env: Env) {
    const doc = new Y.Doc()
    this.state = {
      clients: new Map(),
      doc,
      awarenessStates: new Map(),
      updateCount: 0,
      snapshotThreshold: 100,
      deletedNodeIds: new Set(),
    }

    // Load snapshot from persistent storage on cold start
    this.ctx.blockConcurrencyWhile(() => this.loadSnapshot())
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 400 })
    }

    const { 0: clientWs, 1: serverWs } = new WebSocketPair()
    this.ctx.acceptWebSocket(serverWs)

    const clientId = crypto.randomUUID()
    this.state.clients.set(clientId, serverWs)
    ;(serverWs as unknown as Record<string, string>)['_barnacleClientId'] = clientId

    // Sync Step 1: send our state vector so the client can send its diff
    const sv = Y.encodeStateVector(this.state.doc)
    const step1Encoder = encoding.createEncoder()
    encoding.writeVarUint(step1Encoder, MSG_SYNC)
    encoding.writeVarUint(step1Encoder, SYNC_STEP1)
    encoding.writeVarUint8Array(step1Encoder, sv)
    serverWs.send(encoding.toUint8Array(step1Encoder))

    // Query awareness from the new client so it sends its state
    const qaEncoder = encoding.createEncoder()
    encoding.writeVarUint(qaEncoder, MSG_QUERY_AWARENESS)
    serverWs.send(encoding.toUint8Array(qaEncoder))

    return new Response(null, { status: 101, webSocket: clientWs })
  }

  webSocketMessage(ws: WebSocket, message: ArrayBuffer | string): void {
    try {
      const data =
        message instanceof ArrayBuffer
          ? new Uint8Array(message)
          : new TextEncoder().encode(message)

      const decoder = decoding.createDecoder(data)
      const msgType = decoding.readVarUint(decoder)

      switch (msgType) {
        case MSG_SYNC:
          this.handleSyncMessage(ws, decoder)
          this.state.updateCount++
          if (this.state.updateCount >= this.state.snapshotThreshold) {
            this.state.updateCount = 0
            this.ctx.waitUntil(this.saveSnapshot())
          }
          break
        case MSG_AWARENESS:
          this.handleAwarenessMessage(ws, decoder)
          break
        case MSG_AUTH:
          // Auth not required in this implementation; ignore
          break
        case MSG_QUERY_AWARENESS: {
          // Respond with all known awareness states
          const update = this.encodeAllAwarenessStates()
          if (update !== null) {
            const encoder = encoding.createEncoder()
            encoding.writeVarUint(encoder, MSG_AWARENESS)
            encoding.writeVarUint8Array(encoder, update)
            ws.send(encoding.toUint8Array(encoder))
          }
          break
        }
        default:
          console.warn('Unknown message type:', msgType)
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err)
    }
  }

  webSocketClose(ws: WebSocket, _code: number, _reason: string): void {
    this.removeClient(ws)
  }

  webSocketError(ws: WebSocket, error: unknown): void {
    console.error('WebSocket error:', error)
    this.removeClient(ws)
  }

  private removeClient(ws: WebSocket): void {
    const clientId = (ws as unknown as Record<string, string>)['_barnacleClientId']
    if (clientId) {
      this.state.clients.delete(clientId)
    }
  }

  private broadcast(message: Uint8Array, excludeWs?: WebSocket): void {
    for (const client of this.state.clients.values()) {
      if (client !== excludeWs) {
        try {
          client.send(message)
        } catch {
          // Client may have disconnected; ignore send errors
        }
      }
    }
  }

  private handleSyncMessage(ws: WebSocket, decoder: decoding.Decoder): void {
    const syncStep = decoding.readVarUint(decoder)

    if (syncStep === SYNC_STEP1) {
      // Client sent its state vector → reply with our diff (sync step 2)
      const clientSV = decoding.readVarUint8Array(decoder)
      const diff = Y.encodeStateAsUpdate(this.state.doc, clientSV)

      const step2Encoder = encoding.createEncoder()
      encoding.writeVarUint(step2Encoder, MSG_SYNC)
      encoding.writeVarUint(step2Encoder, SYNC_STEP2)
      encoding.writeVarUint8Array(step2Encoder, diff)
      ws.send(encoding.toUint8Array(step2Encoder))
    } else if (syncStep === SYNC_STEP2 || syncStep === SYNC_UPDATE) {
      // Client sent a diff or incremental update → apply and broadcast
      const update = decoding.readVarUint8Array(decoder)
      Y.applyUpdate(this.state.doc, update)

      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, MSG_SYNC)
      encoding.writeVarUint(encoder, SYNC_UPDATE)
      encoding.writeVarUint8Array(encoder, update)
      this.broadcast(encoding.toUint8Array(encoder), ws)
    }
  }

  private handleAwarenessMessage(_ws: WebSocket, decoder: decoding.Decoder): void {
    // The awareness update blob is opaque – store and forward it
    const update = decoding.readVarUint8Array(decoder)

    // Decode the simple awareness wire format: [clientId, clock, json]*
    // We store the raw blob per logical client and forward it to peers.
    const updateDecoder = decoding.createDecoder(update)
    const numClients = decoding.readVarUint(updateDecoder)
    for (let i = 0; i < numClients; i++) {
      const clientId = decoding.readVarUint(updateDecoder)
      decoding.readVarUint(updateDecoder) // clock (unused here)
      const stateJson = decoding.readVarString(updateDecoder)
      if (stateJson === 'null') {
        this.state.awarenessStates.delete(clientId)
      } else {
        this.state.awarenessStates.set(clientId, { data: update })
      }
    }

    // Forward the raw update to all other clients
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MSG_AWARENESS)
    encoding.writeVarUint8Array(encoder, update)
    this.broadcast(encoding.toUint8Array(encoder), _ws)
  }

  /** Encodes all stored awareness states into a single awareness update blob. */
  private encodeAllAwarenessStates(): Uint8Array | null {
    if (this.state.awarenessStates.size === 0) return null
    // Return the most recent blob we have; in a full implementation each
    // client's state would be individually encoded and merged here.
    const blobs = Array.from(this.state.awarenessStates.values())
    return blobs[blobs.length - 1].data
  }

  private async saveSnapshot(): Promise<void> {
    try {
      const snapshot = Y.encodeStateAsUpdate(this.state.doc)
      await this.ctx.storage.put('snapshot', snapshot)
    } catch (err) {
      console.error('Failed to save snapshot:', err)
    }
  }

  private async loadSnapshot(): Promise<void> {
    try {
      const snapshot = await this.ctx.storage.get<Uint8Array>('snapshot')
      if (snapshot) {
        Y.applyUpdate(this.state.doc, snapshot)
      }
    } catch (err) {
      console.error('Failed to load snapshot:', err)
    }
  }
}
