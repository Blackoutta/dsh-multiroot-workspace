/** One named filesystem root in a logical multiroot Workspace. */
export interface RootSpec {
  alias: string
  path: string
  primary: boolean
}

/** Durable logical Workspace projected by the multiroot Host API. */
export interface MultirootWorkspaceRecord {
  id: string
  title: string
  roots: RootSpec[]
  shadowWorkspaceId: string
  createdAt: string
  updatedAt: string
}

/** Rendering metadata joined to one Host Workspace by stable id. */
export interface MultirootMetadata {
  logical: MultirootWorkspaceRecord
  rootCount: number
  primaryAlias: string
}

/** Create payload accepted by the multiroot Host API. */
export interface CreateMultirootWorkspace {
  title: string
  roots: RootSpec[]
}

/** Editable fields accepted by the multiroot Host API. */
export interface UpdateMultirootWorkspace {
  title?: string
  roots?: RootSpec[]
}
