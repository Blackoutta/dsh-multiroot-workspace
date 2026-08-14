import type { WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client'
import type { MultirootMetadata, MultirootWorkspaceRecord } from './types.ts'

/** Join logical metadata to Host Workspaces without path inference. */
export function joinMultiroot(
  workspaces: readonly WorkspaceView[],
  records: readonly MultirootWorkspaceRecord[],
): {
  workspaces: WorkspaceView[]
  metadataByWorkspaceId: Map<string, MultirootMetadata>
  missingShadowIds: string[]
} {
  const workspaceIds = new Set(workspaces.map(workspace => workspace.workspaceId as string))
  const metadataByWorkspaceId = new Map<string, MultirootMetadata>()
  const missingShadowIds: string[] = []
  for (const logical of records) {
    if (!workspaceIds.has(logical.shadowWorkspaceId)) {
      missingShadowIds.push(logical.id)
      continue
    }
    const primary = logical.roots.find(root => root.primary)
    if (primary === undefined) continue
    metadataByWorkspaceId.set(logical.shadowWorkspaceId, {
      logical,
      rootCount: logical.roots.length,
      primaryAlias: primary.alias,
    })
  }
  return { workspaces: [...workspaces], metadataByWorkspaceId, missingShadowIds }
}
