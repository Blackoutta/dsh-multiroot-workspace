import { realpath } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apply } from '../../index.js'

class MemoryTable<T> {
  readonly values = new Map<string, T>()

  get(id: string): T | undefined {
    return this.values.get(id)
  }

  async put(id: string, value: T): Promise<void> {
    this.values.set(id, value)
  }

  async delete(id: string): Promise<boolean> {
    return this.values.delete(id)
  }

  entries(): MapIterator<[string, T]> {
    return this.values.entries()
  }

  get size(): number {
    return this.values.size
  }
}

interface DerivedRecord {
  registryWorkspaceId: string
  primaryPath: string
  owned: boolean
}

interface LogicalRegistry {
  create(input: { title: string; roots: Array<{ alias: string; path: string; primary: boolean }> }): Promise<{
    id: string
    shadowWorkspaceId: string
  }>
  purge(): Promise<{ shadows: number; records: number }>
}

async function createRegistryHarness(options: { existingWorkspaceId?: string } = {}) {
  const primary = await realpath(process.cwd())
  const workspaces = new MemoryTable<unknown>()
  const derived = new MemoryTable<DerivedRecord>()
  const globalState = { order: [] as string[] }
  const registryWorkspaces = new Map<string, {
    id: string
    path: string
    title: string
    sessionIds: string[]
    attachSession: ReturnType<typeof vi.fn>
  }>()
  if (options.existingWorkspaceId !== undefined) {
    registryWorkspaces.set(options.existingWorkspaceId, {
      id: options.existingWorkspaceId,
      path: primary,
      title: 'user workspace',
      sessionIds: [],
      attachSession: vi.fn(async () => undefined),
    })
  }
  let sequence = 0
  const workspaceRegistry = {
    create: vi.fn(async (path: string, title: string) => {
      const id = `workspace-${++sequence}`
      const workspace = {
        id,
        path,
        title,
        sessionIds: [] as string[],
        attachSession: vi.fn(async (sessionId: string) => {
          workspace.sessionIds.push(sessionId)
        }),
      }
      registryWorkspaces.set(id, workspace)
      return workspace
    }),
    resolveByPath: vi.fn(async (path: string) =>
      [...registryWorkspaces.values()].find(workspace => workspace.path === path)),
    get: vi.fn((id: string) => registryWorkspaces.get(id)),
    delete: vi.fn(async (id: string) => registryWorkspaces.delete(id)),
  }
  let registry: LogicalRegistry | undefined
  const ctx = {
    storageDomain: {
      open: vi.fn(async () => ({
        table: (name: string) => name === 'workspaces' ? workspaces : derived,
        global: {
          get: () => globalState,
          set: async (next: { order: string[] }) => { globalState.order = next.order },
        },
        close: vi.fn(async () => undefined),
      })),
    },
    workspaceRegistry,
    webServer: { register: vi.fn() },
    effect: vi.fn(),
    on: vi.fn(),
    provide: vi.fn((name: string, value: LogicalRegistry) => {
      if (name === 'multirootRegistry') registry = value
    }),
  }
  await apply(ctx, {})
  if (registry === undefined) throw new Error('multirootRegistry was not provided')
  return { registry, derived, primary, workspaceRegistry }
}

describe('multiroot Host registry', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('projects the explicit shadow Workspace id', async () => {
    const harness = await createRegistryHarness()
    const created = await harness.registry.create({
      title: 'product',
      roots: [{ alias: 'app', path: harness.primary, primary: true }],
    })

    expect(created).toMatchObject({ shadowWorkspaceId: 'workspace-1' })
    expect(harness.derived.get(created.id)).toEqual({
      registryWorkspaceId: 'workspace-1',
      primaryPath: harness.primary,
      owned: true,
    })
  })

  it('does not delete an adopted Workspace during purge', async () => {
    const harness = await createRegistryHarness({ existingWorkspaceId: 'user-workspace' })
    const created = await harness.registry.create({
      title: 'product',
      roots: [{ alias: 'app', path: harness.primary, primary: true }],
    })

    expect(harness.derived.get(created.id)?.owned).toBe(false)
    await harness.registry.purge()
    expect(harness.workspaceRegistry.delete).not.toHaveBeenCalledWith('user-workspace')
  })
})
