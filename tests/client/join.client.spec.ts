import { describe, expect, it } from 'vitest'
import type { WorkspaceId, WorkspaceView } from '@deepseek-ai/dsh-client-runtime/client'
import { joinMultiroot } from '../../src/client/multiroot/join.ts'
import type { MultirootWorkspaceRecord } from '../../src/client/multiroot/types.ts'

function workspaceView(overrides: Partial<WorkspaceView> = {}): WorkspaceView {
  return {
    workspaceId: 'workspace-1' as WorkspaceId,
    path: '/repo/app',
    title: 'app',
    sessionIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function logicalRecord(overrides: Partial<MultirootWorkspaceRecord> = {}): MultirootWorkspaceRecord {
  return {
    id: 'logical-1',
    title: 'product',
    roots: [{ alias: 'app', path: '/repo/app', primary: true }],
    shadowWorkspaceId: 'shadow-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('joinMultiroot', () => {
  it('joins by shadow id even when path spellings differ', () => {
    const host = workspaceView({
      workspaceId: 'shadow-1' as WorkspaceId,
      path: '/private/tmp/app',
    })
    const logical = logicalRecord({
      shadowWorkspaceId: 'shadow-1',
      roots: [
        { alias: 'app', path: '/tmp/app', primary: true },
        { alias: 'docs', path: '/repo/docs', primary: false },
      ],
    })

    expect(joinMultiroot([host], [logical]).metadataByWorkspaceId.get('shadow-1')).toEqual({
      logical,
      rootCount: 2,
      primaryAlias: 'app',
    })
  })

  it('reports a missing shadow without hiding ordinary Workspaces', () => {
    const ordinary = workspaceView({ workspaceId: 'ordinary-1' as WorkspaceId })
    const logical = logicalRecord({ shadowWorkspaceId: 'missing' })

    const result = joinMultiroot([ordinary], [logical])

    expect(result.workspaces).toEqual([ordinary])
    expect(result.missingShadowIds).toEqual([logical.id])
  })
})
