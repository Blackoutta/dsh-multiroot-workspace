/**
 * dsh-multiroot-workspace — node half.
 *
 * The durable multiroot-workspace registry plus its HTTP API. One logical
 * workspace = a title + an ordered root list; exactly one root carries
 * `primary: true` (the session-cwd anchor). Records persist in the bundle's
 * own storage domain (`multiroot_workspace`), so installing/uninstalling the
 * bundle touches no host code.
 *
 * Derived ("shadow") workspaces: sessions created with cwd = a workspace's
 * primary root get a real identity in the host workspace registry — on
 * `session/created` the plugin ensures a registry entry exists for that
 * primary root (title = the multiroot title) and attaches the session. This
 * makes the standard UI surfaces (hero chip, session grouping, recent
 * workspace) resolve multiroot sessions correctly. The mapping is recorded in
 * the domain (`derived` table); reconciliation on boot and after every
 * mutation deletes shadows whose multiroot workspace vanished or whose
 * primary root moved, and `DELETE /data` purges every shadow plus all
 * multiroot records (the pre-uninstall cleanup step).
 *
 * Routes (prefix `/plugins/multiroot/api`), JSON `{ ok, value } | { ok, error }`:
 *   GET    /workspaces            list in durable order
 *   POST   /workspaces            create { title, roots }
 *   GET    /workspaces/:id        single
 *   PATCH  /workspaces/:id        { title?, roots? }
 *   PUT    /workspaces/:id/primary  { alias }
 *   DELETE /workspaces/:id        delete record
 *   GET    /workspaces/of-cwd?path=  lookup by canonical cwd
 *   GET    /ping                  liveness
 *   DELETE /data                  purge shadows + all multiroot records
 */

import { randomUUID } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'

export const name = 'dsh-multiroot-workspace'
export const inject = ['storageDomain', 'webServer', 'workspaceRegistry']

/** Config-declared roots become a read-only workspace record with this id. */
const CONFIG_WORKSPACE_ID = 'config-roots'

const rootSchema = z.object({
  alias: z.string(),
  path: z.string(),
  primary: z.boolean(),
})

const recordSchema = z.object({
  title: z.string(),
  roots: z.array(rootSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

/** Derived-shadow mapping: multiroot workspace id → registry workspace id. */
const derivedSchema = z.object({
  registryWorkspaceId: z.string(),
  primaryPath: z.string(),
})

const domainSpec = defineDomain({
  name: 'multiroot_workspace',
  version: 3,
  global: {
    schema: z.object({ order: z.array(z.string()) }),
    initial: { order: [] },
  },
  tables: {
    workspaces: domainTable(recordSchema),
    derived: domainTable(derivedSchema),
  },
})

function nowIso() {
  return new Date().toISOString()
}

/** Canonicalize a path; returns null when it does not exist. */
async function canonical(path) {
  try {
    return await realpath(path)
  } catch {
    return null
  }
}

/** Synchronous canonicalization for cwd lookups; falls back to the spelling. */
function canonicalSync(path) {
  try {
    return realpathSync.native(path)
  } catch {
    return path
  }
}

/**
 * Validate and canonicalize a root list. Throws a plain Error with a stable
 * `code` property on failure.
 */
async function validateRoots(roots, { tolerateMissing }) {
  if (!Array.isArray(roots) || roots.length === 0) {
    throw Object.assign(new Error('roots must be a non-empty array'), { code: 'invalid-roots' })
  }
  const seen = new Set()
  let primaryCount = 0
  const out = []
  for (const [index, root] of roots.entries()) {
    if (root === null || typeof root !== 'object') {
      throw Object.assign(new Error(`roots[${index}] must be an object`), { code: 'invalid-roots' })
    }
    const alias = typeof root.alias === 'string' ? root.alias.trim() : ''
    if (alias.length === 0) {
      throw Object.assign(new Error(`roots[${index}]: alias must be a non-empty string`), { code: 'invalid-roots' })
    }
    const key = alias.toLowerCase()
    if (seen.has(key)) {
      throw Object.assign(new Error(`roots[${index}]: alias "${alias}" is duplicated`), { code: 'alias-conflict' })
    }
    seen.add(key)
    const path = typeof root.path === 'string' ? root.path.trim() : ''
    if (path.length === 0) {
      throw Object.assign(new Error(`roots[${index}]: path must be a non-empty string`), { code: 'invalid-roots' })
    }
    let canonicalPath = await canonical(path)
    if (canonicalPath === null && !tolerateMissing) {
      throw Object.assign(new Error(`roots[${index}]: path "${path}" does not exist`), { code: 'path-not-found' })
    }
    canonicalPath ??= path
    const primary = root.primary === true
    if (primary) primaryCount += 1
    out.push({ alias, path: canonicalPath, primary })
  }
  if (primaryCount !== 1) {
    throw Object.assign(new Error('exactly one root must be marked primary'), { code: 'no-primary' })
  }
  return out
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function ok(res, value) {
  json(res, 200, { ok: true, value })
}

function fail(res, status, code, message) {
  json(res, status, { ok: false, error: { code, message } })
}

/** Read and parse a JSON request body; returns null on malformed input. */
function readBody(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        resolve(null)
      }
    })
    req.on('error', () => resolve(null))
  })
}

export async function apply(ctx, config) {
  const domain = await ctx.storageDomain.open(domainSpec)
  const table = domain.table('workspaces')
  const derivedTable = domain.table('derived')
  const order = domain.global
  ctx.effect(() => () => {
    void domain.close()
  }, 'multiroot: domain close')

  const touch = async (id, patch) => {
    const record = table.get(id)
    if (record === undefined) return undefined
    const updated = { ...record, ...patch, updatedAt: nowIso() }
    await table.put(id, updated)
    return updated
  }

  const prependOrder = (id) => order.set({ order: [id, ...order.get().order] })
  const removeOrder = (id) => order.set({ order: order.get().order.filter((entry) => entry !== id) })

  // ---- derived-shadow management ----

  /**
   * Delete one derived shadow (registry entry + mapping row). Missing registry
   * entries are tolerated (the user may have deleted them by hand).
   */
  const deleteShadow = async (multirootId) => {
    const mapping = derivedTable.get(multirootId)
    if (mapping === undefined) return
    await derivedTable.delete(multirootId)
    try {
      await ctx.workspaceRegistry.delete(mapping.registryWorkspaceId)
    } catch {
      // registry entry already gone — the mapping cleanup is the point
    }
  }

  /**
   * Reconcile every derived mapping against live state: drop mappings whose
   * multiroot workspace vanished, whose primary root moved, or whose registry
   * entry was deleted by hand. Runs on boot and after every mutation.
   */
  const reconcileShadows = async () => {
    for (const [multirootId, mapping] of derivedTable.entries()) {
      const record = table.get(multirootId)
      const registryEntry = ctx.workspaceRegistry.get(mapping.registryWorkspaceId)
      if (record === undefined
        || registryEntry === undefined
        || record.roots.find((root) => root.primary)?.path !== registryEntry.path) {
        if (registryEntry !== undefined && record === undefined) {
          // the owning workspace is gone — remove the orphaned shadow too
          try {
            await ctx.workspaceRegistry.delete(mapping.registryWorkspaceId)
          } catch {
            // concurrent removal — the mapping cleanup below is enough
          }
        }
        await derivedTable.delete(multirootId)
      }
    }
  }

  /**
   * Ensure a registry shadow exists for the workspace's primary root and
   * attach the session to it. Reuses an existing registry entry for the same
   * canonical path (whether ours or the user's own); title conflicts on
   * creation fall back to a suffixed title.
   */
  const ensureShadowAndAttach = async (record, sessionId, sessionCwd) => {
    const primary = record.roots.find((root) => root.primary)
    if (primary === undefined) return
    let shadowId = derivedTable.get(record.id)?.registryWorkspaceId
    if (shadowId !== undefined && ctx.workspaceRegistry.get(shadowId)?.path !== primary.path) {
      await deleteShadow(record.id)
      shadowId = undefined
    }
    if (shadowId === undefined) {
      const existing = await ctx.workspaceRegistry.resolveByPath(primary.path).catch(() => undefined)
      if (existing !== undefined) {
        shadowId = existing.id
      } else {
        let created
        try {
          created = await ctx.workspaceRegistry.create(primary.path, record.title)
        } catch {
          created = await ctx.workspaceRegistry.create(primary.path, `${record.title} (multiroot)`)
        }
        shadowId = created.id
      }
      await derivedTable.put(record.id, { registryWorkspaceId: shadowId, primaryPath: primary.path })
    }
    const shadow = ctx.workspaceRegistry.get(shadowId)
    await shadow?.attachSession(sessionId).catch((error) => {
      console.log('[multiroot] attachSession failed:', error?.message ?? String(error), '| session cwd:', sessionCwd, '| shadow path:', primary.path)
    })
  }

  // Attach freshly created sessions whose cwd anchors a multiroot primary.
  // Whole-handler containment: a bookkeeping bug must never fail the boot.
  ctx.on('session/created', (session) => {
    try {
      const cwd = session.header?.cwd
      if (cwd === undefined) return
      const key = canonicalSync(cwd)
      const record = registryList().find((entry) =>
        entry.roots.some((root) => root.primary && canonicalSync(root.path) === key))
      if (record === undefined) return
      void ensureShadowAndAttach(record, session.id, cwd).catch((error) => {
        ctx.logger?.warn?.(`multiroot attach: ${error?.message ?? String(error)}`)
      })
    } catch (error) {
      ctx.logger?.warn?.(`multiroot session/created handler: ${error?.message ?? String(error)}`)
    }
  })

  // ---- registry ----

  const registryList = () => {
    const records = []
    for (const id of order.get().order) {
      const record = table.get(id)
      if (record !== undefined) records.push({ id, ...record })
    }
    for (const [id, record] of table.entries()) {
      if (!records.some((entry) => entry.id === id)) records.push({ id, ...record })
    }
    return records
  }

  const registry = {
    list: registryList,
    get(id) {
      const record = table.get(id)
      return record === undefined ? undefined : { id, ...record }
    },
    /** The workspace whose canonical primary-root path equals the canonical cwd. */
    workspaceOfCwd(cwd) {
      const key = cwd === undefined ? undefined : canonicalSync(cwd)
      if (key === undefined) return undefined
      for (const record of registryList()) {
        const primary = record.roots.find((root) => root.primary)
        if (primary !== undefined && canonicalSync(primary.path) === key) return record
      }
      return undefined
    },
    async create({ title, roots }) {
      const cleanTitle = typeof title === 'string' ? title.trim() : ''
      if (cleanTitle.length === 0) {
        throw Object.assign(new Error('title must be a non-empty string'), { code: 'invalid-title' })
      }
      const canonicalRoots = await validateRoots(roots, { tolerateMissing: false })
      const id = randomUUID()
      const record = {
        title: cleanTitle,
        roots: canonicalRoots,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      await table.put(id, record)
      await prependOrder(id)
      return { id, ...record }
    },
    async update(id, { title, roots }) {
      const record = table.get(id)
      if (record === undefined) {
        throw Object.assign(new Error(`workspace "${id}" not found`), { code: 'workspace-not-found' })
      }
      if (id === CONFIG_WORKSPACE_ID) {
        throw Object.assign(new Error('config-declared roots are read-only'), { code: 'config-roots-readonly' })
      }
      const patch = {}
      if (title !== undefined) {
        const clean = typeof title === 'string' ? title.trim() : ''
        if (clean.length === 0) {
          throw Object.assign(new Error('title must be a non-empty string'), { code: 'invalid-title' })
        }
        patch.title = clean
      }
      if (roots !== undefined) {
        patch.roots = await validateRoots(roots, { tolerateMissing: false })
      }
      const updated = await touch(id, patch)
      await reconcileShadows()
      return updated
    },
    async setPrimary(id, alias) {
      const record = table.get(id)
      if (record === undefined) {
        throw Object.assign(new Error(`workspace "${id}" not found`), { code: 'workspace-not-found' })
      }
      if (id === CONFIG_WORKSPACE_ID) {
        throw Object.assign(new Error('config-declared roots are read-only'), { code: 'config-roots-readonly' })
      }
      const target = record.roots.find((root) => root.alias.toLowerCase() === String(alias).toLowerCase())
      if (target === undefined) {
        throw Object.assign(new Error(`alias "${alias}" not found`), { code: 'alias-not-found' })
      }
      const roots = record.roots.map((root) => ({ ...root, primary: root === target }))
      const updated = await touch(id, { roots })
      await reconcileShadows()
      return updated
    },
    async delete(id) {
      if (id === CONFIG_WORKSPACE_ID) {
        throw Object.assign(new Error('config-declared roots are read-only'), { code: 'config-roots-readonly' })
      }
      const existed = await table.delete(id)
      if (existed) {
        await deleteShadow(id)
        await removeOrder(id)
      }
      return existed
    },
    /** Purge everything this bundle owns: every shadow plus all records. */
    async purge() {
      let shadows = 0
      for (const [multirootId] of derivedTable.entries()) {
        await deleteShadow(multirootId)
        shadows += 1
      }
      let records = 0
      for (const [id] of table.entries()) {
        if (id !== CONFIG_WORKSPACE_ID) {
          await table.delete(id)
          records += 1
        }
      }
      await order.set({ order: [] })
      return { shadows, records }
    },
  }

  // Config-declared roots: a read-only record merged at startup. Missing
  // paths are tolerated (the deployment may mount them later); every other
  // validation rule applies.
  if (Array.isArray(config?.roots) && config.roots.length > 0) {
    const existing = table.get(CONFIG_WORKSPACE_ID)
    const roots = await validateRoots(config.roots, { tolerateMissing: true })
    const record = {
      title: typeof config?.title === 'string' && config.title.trim().length > 0 ? config.title.trim() : '配置根',
      roots,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    }
    await table.put(CONFIG_WORKSPACE_ID, record)
    const orderState = order.get().order
    if (!orderState.includes(CONFIG_WORKSPACE_ID)) {
      await order.set({ order: [...orderState, CONFIG_WORKSPACE_ID] })
    }
  }

  await reconcileShadows()

  ctx.provide('multirootRegistry', registry)

  // ---- HTTP API ----
  const API_PREFIX = '/plugins/multiroot/api'
  ctx.webServer.register({
    kind: 'prefix',
    path: API_PREFIX,
    handler: async (req, res) => {
      const rawPath = new URL(req.url ?? '/', 'http://x').pathname
      const rest = rawPath.startsWith(`${API_PREFIX}/`) ? rawPath.slice(API_PREFIX.length + 1) : ''
      const segments = rest.split('/').filter(Boolean)
      const method = req.method ?? 'GET'

      try {
        // GET /ping — liveness probe
        if (method === 'GET' && segments.length === 1 && segments[0] === 'ping') {
          return ok(res, { tableSize: table.size })
        }

        // DELETE /data — pre-uninstall cleanup (shadows + records)
        if (method === 'DELETE' && segments.length === 1 && segments[0] === 'data') {
          return ok(res, await registry.purge())
        }

        // GET /workspaces/of-cwd?path=...  (literal before :id dispatch)
        if (method === 'GET' && segments.length === 2 && segments[0] === 'workspaces' && segments[1] === 'of-cwd') {
          const path = new URL(req.url ?? '/', 'http://x').searchParams.get('path')
          if (path === null || path.length === 0) {
            return fail(res, 400, 'invalid-request', 'missing path query parameter')
          }
          const key = canonicalSync(path)
          return ok(res, registry.workspaceOfCwd(key))
        }

        if (segments.length === 1 && segments[0] === 'workspaces') {
          if (method === 'GET') return ok(res, registry.list())
          if (method === 'POST') {
            const body = await readBody(req)
            if (body === null) return fail(res, 400, 'invalid-json', 'request body is not valid JSON')
            return ok(res, await registry.create(body))
          }
          return fail(res, 405, 'method-not-allowed', `unsupported method ${method}`)
        }

        if (segments.length === 2 && segments[0] === 'workspaces') {
          const id = segments[1]
          if (method === 'GET') {
            const record = registry.get(id)
            return record === undefined ? fail(res, 404, 'workspace-not-found', `workspace "${id}" not found`) : ok(res, record)
          }
          if (method === 'PATCH') {
            const body = await readBody(req)
            if (body === null) return fail(res, 400, 'invalid-json', 'request body is not valid JSON')
            return ok(res, await registry.update(id, body))
          }
          if (method === 'DELETE') {
            return await registry.delete(id) ? ok(res, true) : fail(res, 404, 'workspace-not-found', `workspace "${id}" not found`)
          }
          return fail(res, 405, 'method-not-allowed', `unsupported method ${method}`)
        }

        if (segments.length === 3 && segments[0] === 'workspaces' && segments[2] === 'primary' && method === 'PUT') {
          const body = await readBody(req)
          if (body === null) return fail(res, 400, 'invalid-json', 'request body is not valid JSON')
          return ok(res, await registry.setPrimary(segments[1], body.alias))
        }

        return fail(res, 404, 'not-found', `no such route /${rest}`)
      } catch (error) {
        const code = error?.code ?? 'internal'
        ctx.logger?.warn?.(`multiroot api ${method} /${rest}: ${error?.message ?? String(error)}`)
        const status = code === 'internal' ? 500 : 400
        return fail(res, status, code, error?.message ?? String(error))
      }
    },
  })
}
