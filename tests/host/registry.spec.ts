import { realpath } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomainFacility, defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'
import { apply } from '../../index.js'

class MemoryTable<T> {
  readonly values = new Map<string, T>()

  constructor(
    private readonly onPut?: (id: string, value: T) => void,
    private readonly onDelete?: (id: string) => void,
  ) {}

  get(id: string): T | undefined {
    return this.values.get(id)
  }

  async put(id: string, value: T): Promise<void> {
    this.onPut?.(id, value)
    this.values.set(id, value)
  }

  async delete(id: string): Promise<boolean> {
    this.onDelete?.(id)
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

interface SessionRootRecord {
  workspaceId: string
  alias: string
}

interface RegistryStorage {
  workspaces: MemoryTable<unknown>
  derived: MemoryTable<DerivedRecord>
  sessionRoots: MemoryTable<SessionRootRecord>
  globalState: { order: string[] }
}

interface LogicalRegistry {
  create(input: { title: string; roots: Array<{ alias: string; path: string; primary: boolean }> }): Promise<{
    id: string
    shadowWorkspaceId: string
  }>
  get(id: string): { shadowWorkspaceId?: string } | undefined
  setPrimary(id: string, alias: string): Promise<{ shadowWorkspaceId: string }>
  update(id: string, input: {
    title?: string
    roots?: Array<{ alias: string; path: string; primary: boolean }>
  }): Promise<unknown>
  currentRoot(sessionId: string, cwd: string): string | undefined
  setCurrentRoot(sessionId: string, cwd: string, alias: string): Promise<void>
  clearCurrentRoot(sessionId: string): Promise<boolean>
  delete(id: string): Promise<boolean>
  purge(): Promise<{ shadows: number; records: number }>
}

async function createRegistryHarness(options: {
  existingWorkspaceId?: string
  failAttach?: string
  failSessionRootPut?: boolean
  config?: {
    title?: string
    roots?: Array<{ alias: string; path: string; primary: boolean }>
  }
  storage?: RegistryStorage
} = {}) {
  const primary = await realpath(process.cwd())
  const docs = await realpath('..')
  const calls: string[] = []
  const storage = options.storage ?? {
    workspaces: new MemoryTable<unknown>(
      () => { calls.push('put-record') },
      id => { calls.push(`delete-record:${id}`) },
    ),
    derived: new MemoryTable<DerivedRecord>((_id, value) => {
      calls.push(`put-derived:${value.registryWorkspaceId}`)
    }),
    sessionRoots: new MemoryTable<SessionRootRecord>(
      () => {
        if (options.failSessionRootPut === true) throw new Error('session root write failed')
      },
      id => { calls.push(`delete-session:${id}`) },
    ),
    globalState: { order: [] as string[] },
  }
  const { workspaces, derived, sessionRoots, globalState } = storage
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
      calls.push(`create:${id}`)
      const workspace = {
        id,
        path,
        title,
        sessionIds: [] as string[],
        attachSession: vi.fn(async (sessionId: string) => {
          calls.push(`attach:${id}:${sessionId}`)
          if (options.failAttach === sessionId) throw new Error(`attach ${sessionId} failed`)
          workspace.sessionIds.push(sessionId)
        }),
      }
      registryWorkspaces.set(id, workspace)
      return workspace
    }),
    resolveByPath: vi.fn(async (path: string) =>
      [...registryWorkspaces.values()].find(workspace => workspace.path === path)),
    get: vi.fn((id: string) => registryWorkspaces.get(id)),
    delete: vi.fn(async (id: string) => {
      calls.push(`delete:${id}`)
      return registryWorkspaces.delete(id)
    }),
  }
  let registry: LogicalRegistry | undefined
  let dispose: (() => void | Promise<void>) | undefined
  const ctx = {
    storageDomain: {
      open: vi.fn(async () => ({
        table: (name: string) => {
          if (name === 'workspaces') return workspaces
          if (name === 'derived') return derived
          if (name === 'session_roots') return sessionRoots
          throw new Error(`unknown table: ${name}`)
        },
        global: {
          get: () => globalState,
          set: async (next: { order: string[] }) => { globalState.order = next.order },
        },
        close: vi.fn(async () => undefined),
      })),
    },
    workspaceRegistry,
    webServer: { register: vi.fn() },
    effect: vi.fn((setup: () => () => void | Promise<void>) => { dispose = setup() }),
    on: vi.fn(),
    provide: vi.fn((name: string, value: LogicalRegistry) => {
      if (name === 'multirootRegistry') registry = value
    }),
  }
  await apply(ctx, options.config ?? {})
  if (registry === undefined) throw new Error('multirootRegistry was not provided')
  const logicalRegistry = registry
  const createLogicalWorkspaceWithSessions = async (sessionIds: string[]) => {
    const record = await logicalRegistry.create({
      title: 'product',
      roots: [
        { alias: 'app', path: primary, primary: true },
        { alias: 'docs', path: docs, primary: false },
      ],
    })
    const shadow = registryWorkspaces.get(record.shadowWorkspaceId)
    if (shadow === undefined) throw new Error('created shadow is missing')
    shadow.sessionIds.push(...sessionIds)
    return record
  }
  return {
    registry: logicalRegistry,
    derived,
    sessionRoots,
    storage,
    dispose: () => dispose?.(),
    primary,
    docs,
    workspaceRegistry,
    calls,
    createLogicalWorkspaceWithSessions,
  }
}

/** rc.6-compatible KV medium: versions are exact, while same-version tables are additive. */
class VersionedMemoryBackend {
  version: number | undefined
  readonly tables = new Map<string, Map<string, unknown>>()
  global: unknown = null
  private open = false

  readonly kv = {
    open: async (descriptor: {
      name: string
      version: number
      tables: readonly string[]
      hasGlobal: boolean
    }) => {
      if (this.open) throw new Error(`unit ${descriptor.name} is already open`)
      if (this.version === undefined) this.version = descriptor.version
      if (this.version !== descriptor.version) {
        throw Object.assign(new Error(
          `stored version ${this.version} != expected ${descriptor.version}`,
        ), { code: 'version-mismatch' })
      }
      this.open = true
      return {
        loadAll: async () => ({
          tables: Object.fromEntries(descriptor.tables.map(table => [
            table,
            Object.fromEntries(this.tables.get(table) ?? []),
          ])),
          global: this.global,
        }),
        putRecord: async (table: string, key: string, value: unknown) => {
          let records = this.tables.get(table)
          if (records === undefined) {
            records = new Map()
            this.tables.set(table, records)
          }
          records.set(key, value)
        },
        deleteRecord: async (table: string, key: string) => {
          this.tables.get(table)?.delete(key)
        },
        setGlobal: async (value: unknown) => { this.global = value },
        close: async () => { this.open = false },
      }
    },
  }

  async close(): Promise<void> {
    this.open = false
  }
}

function createDomainFacility(backend: VersionedMemoryBackend) {
  return new DomainFacility({
    storage: { backend: { get: () => backend } },
    emit: vi.fn(),
    logger: { warn: vi.fn() },
  } as never, { backend: 'memory' } as never)
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

  it('moves membership before publishing a new primary shadow', async () => {
    const harness = await createRegistryHarness()
    const record = await harness.createLogicalWorkspaceWithSessions(['session-a', 'session-b'])
    harness.calls.length = 0

    const updated = await harness.registry.setPrimary(record.id, 'docs')

    expect(updated.shadowWorkspaceId).toBe('workspace-2')
    expect(harness.calls).toEqual([
      'create:workspace-2',
      'attach:workspace-2:session-a',
      'attach:workspace-2:session-b',
      'put-derived:workspace-2',
      'put-record',
      'delete:workspace-1',
    ])
  })

  it('keeps the old primary when membership migration fails', async () => {
    const harness = await createRegistryHarness({ failAttach: 'session-b' })
    const record = await harness.createLogicalWorkspaceWithSessions(['session-a', 'session-b'])

    await expect(harness.registry.setPrimary(record.id, 'docs')).rejects.toMatchObject({
      code: 'shadow-migration-failed',
    })
    expect(harness.registry.get(record.id)?.shadowWorkspaceId).toBe('workspace-1')
  })

  it('defaults an unselected Session to the logical primary alias', async () => {
    const harness = await createRegistryHarness()
    await harness.createLogicalWorkspaceWithSessions([])

    expect(harness.registry.currentRoot('session-a', harness.primary)).toBe('app')
  })

  it('persists the canonical alias for a Session with case-insensitive input', async () => {
    const harness = await createRegistryHarness()
    await harness.createLogicalWorkspaceWithSessions([])

    await harness.registry.setCurrentRoot('session-a', harness.primary, 'DoCs')

    expect(harness.registry.currentRoot('session-a', harness.primary)).toBe('docs')
    expect(harness.sessionRoots.get('session-a')).toMatchObject({ alias: 'docs' })
  })

  it('rejects a Session root absent from its logical Workspace', async () => {
    const harness = await createRegistryHarness()
    await harness.createLogicalWorkspaceWithSessions([])

    await expect(harness.registry.setCurrentRoot('session-a', harness.primary, 'missing'))
      .rejects.toMatchObject({ code: 'alias-not-found' })
    expect(harness.registry.currentRoot('session-a', harness.primary)).toBe('app')
  })

  it('clears a Session root explicitly', async () => {
    const harness = await createRegistryHarness()
    await harness.createLogicalWorkspaceWithSessions([])
    await harness.registry.setCurrentRoot('session-a', harness.primary, 'docs')

    await harness.registry.clearCurrentRoot('session-a')

    expect(harness.registry.currentRoot('session-a', harness.primary)).toBe('app')
    expect(harness.sessionRoots.get('session-a')).toBeUndefined()
  })

  it('deletes Session roots before deleting their logical Workspace', async () => {
    const harness = await createRegistryHarness()
    const record = await harness.createLogicalWorkspaceWithSessions([])
    await harness.registry.setCurrentRoot('session-a', harness.primary, 'docs')

    await harness.registry.delete(record.id)

    expect(harness.sessionRoots.size).toBe(0)
  })

  it('purges every persisted Session root', async () => {
    const harness = await createRegistryHarness()
    await harness.createLogicalWorkspaceWithSessions([])
    await harness.registry.setCurrentRoot('session-a', harness.primary, 'docs')

    await harness.registry.purge()

    expect(harness.sessionRoots.size).toBe(0)
  })

  it('retains the Session root after the registry is disposed and mounted again', async () => {
    const first = await createRegistryHarness()
    await first.createLogicalWorkspaceWithSessions([])
    await first.registry.setCurrentRoot('session-a', first.primary, 'docs')
    await first.dispose()

    const second = await createRegistryHarness({ storage: first.storage })

    expect(second.registry.currentRoot('session-a', second.primary)).toBe('docs')
  })

  it('opens an existing v4 medium and adds Session roots without rebuilding stored data', async () => {
    const primary = await realpath(process.cwd())
    const docs = await realpath('..')
    const backend = new VersionedMemoryBackend()
    const storageDomain = createDomainFacility(backend)
    const legacySpec = defineDomain({
      name: 'multiroot_workspace',
      version: 4,
      global: {
        schema: z.object({ order: z.array(z.string()) }),
        initial: { order: [] as string[] },
      },
      tables: {
        workspaces: domainTable(z.object({
          title: z.string(),
          roots: z.array(z.object({
            alias: z.string(),
            path: z.string(),
            primary: z.boolean(),
          })),
          createdAt: z.string(),
          updatedAt: z.string(),
        })),
        derived: domainTable(z.object({
          registryWorkspaceId: z.string(),
          primaryPath: z.string(),
          owned: z.boolean(),
        })),
      },
    })
    const legacy = await storageDomain.open(legacySpec)
    await legacy.table('workspaces').put('legacy', {
      title: 'legacy product',
      roots: [
        { alias: 'app', path: primary, primary: true },
        { alias: 'docs', path: docs, primary: false },
      ],
      createdAt: '2026-08-14T00:00:00.000Z',
      updatedAt: '2026-08-14T00:00:00.000Z',
    })
    await legacy.table('derived').put('legacy', {
      registryWorkspaceId: 'host-legacy',
      primaryPath: primary,
      owned: false,
    })
    await legacy.global.set({ order: ['legacy'] })
    await legacy.close()
    let registry: LogicalRegistry | undefined
    let dispose: (() => void | Promise<void>) | undefined
    const hostWorkspace = {
      id: 'host-legacy',
      path: primary,
      title: 'legacy product',
      sessionIds: [] as string[],
      attachSession: vi.fn(async () => undefined),
    }
    const ctx = {
      storageDomain,
      workspaceRegistry: {
        get: vi.fn((id: string) => id === hostWorkspace.id ? hostWorkspace : undefined),
        resolveByPath: vi.fn(async () => hostWorkspace),
        create: vi.fn(),
        delete: vi.fn(),
      },
      webServer: { register: vi.fn() },
      effect: vi.fn((setup: () => () => void | Promise<void>) => { dispose = setup() }),
      on: vi.fn(),
      provide: vi.fn((name: string, value: LogicalRegistry) => {
        if (name === 'multirootRegistry') registry = value
      }),
    }

    await apply(ctx, {})
    if (registry === undefined) throw new Error('multirootRegistry was not provided')
    const logicalRegistry: LogicalRegistry = registry
    await logicalRegistry.setCurrentRoot('session-a', primary, 'docs')

    expect(backend.version).toBe(4)
    expect(logicalRegistry.get('legacy')).toMatchObject({ title: 'legacy product' })
    expect(logicalRegistry.currentRoot('session-a', primary)).toBe('docs')
    expect(backend.tables.get('workspaces')?.has('legacy')).toBe(true)
    expect(backend.tables.get('session_roots')?.get('session-a')).toEqual({
      workspaceId: 'legacy',
      alias: 'docs',
    })
    await dispose?.()
  })

  it('returns a Promise that resolves after the storage domain closes', async () => {
    const harness = await createRegistryHarness()

    const disposal = harness.dispose()

    expect(disposal).toBeInstanceOf(Promise)
    await disposal
  })

  it('purges orphan Session roots that no longer match a Workspace', async () => {
    const harness = await createRegistryHarness()
    await harness.sessionRoots.put('orphan-session', {
      workspaceId: 'deleted-workspace',
      alias: 'docs',
    })

    await harness.registry.purge()

    expect(harness.sessionRoots.size).toBe(0)
  })

  it('physically clears a selection when roots update removes its alias', async () => {
    const harness = await createRegistryHarness()
    const record = await harness.createLogicalWorkspaceWithSessions([])
    await harness.registry.setCurrentRoot('session-a', harness.primary, 'docs')

    await harness.registry.update(record.id, {
      roots: [{ alias: 'app', path: harness.primary, primary: true }],
    })

    expect(harness.sessionRoots.get('session-a')).toBeUndefined()
    expect(harness.registry.currentRoot('session-a', harness.primary)).toBe('app')
  })

  it('physically clears a selection when config roots remove its alias on restart', async () => {
    const first = await createRegistryHarness({
      config: {
        roots: [
          { alias: 'app', path: process.cwd(), primary: true },
          { alias: 'docs', path: '..', primary: false },
        ],
      },
    })
    await first.registry.setCurrentRoot('session-a', first.primary, 'docs')
    await first.dispose()

    const second = await createRegistryHarness({
      storage: first.storage,
      config: {
        roots: [{ alias: 'app', path: process.cwd(), primary: true }],
      },
    })

    expect(second.sessionRoots.get('session-a')).toBeUndefined()
    expect(second.registry.currentRoot('session-a', second.primary)).toBe('app')
  })

  it('does not revive a stale selection belonging to another Workspace', async () => {
    const harness = await createRegistryHarness()
    await harness.createLogicalWorkspaceWithSessions([])
    await harness.registry.setCurrentRoot('session-a', harness.primary, 'docs')
    await harness.registry.create({
      title: 'documentation',
      roots: [{ alias: 'manual', path: harness.docs, primary: true }],
    })

    expect(harness.registry.currentRoot('session-a', harness.docs)).toBe('manual')
  })

  it('propagates a failed Session-root persistence write without changing selection', async () => {
    const harness = await createRegistryHarness({ failSessionRootPut: true })
    await harness.createLogicalWorkspaceWithSessions([])

    await expect(harness.registry.setCurrentRoot('session-a', harness.primary, 'docs'))
      .rejects.toThrow('session root write failed')
    expect(harness.registry.currentRoot('session-a', harness.primary)).toBe('app')
  })

  it('deletes Session roots before deleting the Workspace record', async () => {
    const harness = await createRegistryHarness()
    const record = await harness.createLogicalWorkspaceWithSessions([])
    await harness.registry.setCurrentRoot('session-a', harness.primary, 'docs')
    harness.calls.length = 0

    await harness.registry.delete(record.id)

    expect(harness.calls.slice(0, 2)).toEqual([
      'delete-session:session-a',
      `delete-record:${record.id}`,
    ])
  })
})
