export interface Env {
  PAGE_SESSION: DurableObjectNamespace
  ENVIRONMENT: string
}

export interface AwarenessUpdate {
  clientId: number
  state: {
    name: string
    color: string
    cursor?: { nodeId: string; position: number }
  } | null
}
