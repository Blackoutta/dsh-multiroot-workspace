/**
 * dsh-multiroot-workspace — ws_* tool family + system-prompt section.
 *
 * The model-facing half of a logical workspace: every root of the session's
 * workspace is addressable by `root` alias; the primary root is the default
 * (and equals the session cwd, so built-in tools keep working unchanged).
 *
 * Current-root durability: `ws_cd` appends a `multiroot/current-root` session
 * event (mirroring `sandbox/mode` — log-only, no surface op); the fold reads
 * the last event back, so the selection survives restarts and replay.
 *
 * Sandbox boundary: each call constructs a per-call policy whose
 * `workspaceRoot` is the ADDRESSED root (mode inherits the session). Cross-
 * root bash is an explicit policy ladder (config `crossRootBash`):
 *   'off' (default) — a `roots` list naming more than one root is rejected;
 *   'ancestor'      — the tightest common ancestor of the declared roots
 *                     fences the call (bounded blast radius);
 *   'unfenced'      — the call runs danger-full-access, labeled in the result.
 * fs writes/edits dispatch the same `fs/*-intent` waterfalls and
 * `fs/observed` events as `dsh-tool-fs`, so the observation-policy guards
 * (read-before-write, version checks) apply unchanged.
 */

import { isAbsolute, join, relative as pathRelative } from 'node:path'
import Schema from '@deepseek-ai/schemastery'
import { FsError } from '@deepseek-ai/dsh-fs'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-multiroot-workspace/tools'
export const inject = ['tools', 'fs', 'shell', 'systemPrompt', 'multirootRegistry', 'sandboxPolicy']

/** Cross-root bash policy ladder (see the module doc). */
const CROSS_ROOT_POLICIES = ['off', 'ancestor', 'unfenced']

/** Config schema for the tools plugin row. */
export const Config = Schema.object({
  crossRootBash: Schema.union(CROSS_ROOT_POLICIES).default('off'),
})

const READ_BOUND_BYTES = 1024 * 1024
const SEARCH_LINE_CAP = 200

/** Single-quote a string for a shell command line. */
function shq(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`
}

/** The last multiroot/current-root event's alias — replay IS the state. */
function effectiveCurrentRoot(session) {
  const events = session?.events
  if (events === undefined) return undefined
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event.type === 'multiroot/current-root') return event.data.alias
  }
  return undefined
}

/** The workspace of this call's session, or undefined when none applies. */
function workspaceOf(ctx, session) {
  const cwd = session?.header?.cwd
  return cwd === undefined ? undefined : ctx.multirootRegistry.workspaceOfCwd(cwd)
}

/** The single workspace root an invocation addresses. */
function resolveRoot(ctx, exec, args) {
  const session = exec.agent?.session
  const workspace = workspaceOf(ctx, session)
  if (workspace === undefined) {
    throw new Error('当前会话不属于任何多根工作区（会话 cwd 未匹配到主根）。请先在界面上创建多根工作区并在其中打开会话。')
  }
  let alias = args.root
  if (alias === undefined) alias = effectiveCurrentRoot(session)
  if (alias === undefined) {
    alias = workspace.roots.find((root) => root.primary)?.alias ?? workspace.roots[0].alias
  }
  const root = workspace.roots.find((candidate) => candidate.alias.toLowerCase() === String(alias).toLowerCase())
  if (root === undefined) {
    const available = workspace.roots.map((candidate) => candidate.alias).join(', ')
    throw new Error(`未知根 "${alias}"。当前工作区 "${workspace.title}" 的根：${available}`)
  }
  return root
}

/** Resolve several roots by alias (cross-root bash). */
function resolveRoots(ctx, exec, aliases) {
  const session = exec.agent?.session
  const workspace = workspaceOf(ctx, session)
  if (workspace === undefined) {
    throw new Error('当前会话不属于任何多根工作区（会话 cwd 未匹配到主根）。')
  }
  return [...new Set(aliases.map(String))].map((alias) => {
    const root = workspace.roots.find((candidate) => candidate.alias.toLowerCase() === alias.toLowerCase())
    if (root === undefined) {
      const available = workspace.roots.map((candidate) => candidate.alias).join(', ')
      throw new Error(`未知根 "${alias}"。当前工作区 "${workspace.title}" 的根：${available}`)
    }
    return root
  })
}

/** Per-call sandbox policy fenced to the addressed root, mode inherited from the session. */
function policyFor(ctx, exec, root) {
  const session = exec.agent?.session
  const sessionPolicy = ctx.sandboxPolicy.resolve({ session })
  return {
    mode: sessionPolicy.mode,
    workspaceRoot: root.path,
    ...(session === undefined ? {} : { sessionId: session.id }),
  }
}

/** The tightest common ancestor directory of several absolute paths. */
function commonAncestor(paths) {
  const split = paths.map((path) => path.split('/'))
  let prefix = split[0]
  for (const parts of split.slice(1)) {
    let index = 0
    while (index < prefix.length && index < parts.length && prefix[index] === parts[index]) index += 1
    prefix = prefix.slice(0, index)
  }
  return prefix.length > 0 ? prefix.join('/') || '/' : '/'
}

/** Format a write/edit outcome as a model-facing confirmation. */
function mutationText(displayPath, verb) {
  return `<path>${displayPath}</path>
<type>file</type>
<content>
${verb}
</content>`
}

export function apply(ctx, config) {
  const crossRootBash = CROSS_ROOT_POLICIES.includes(config?.crossRootBash) ? config.crossRootBash : 'off'

  ctx.tools.register(defineTool({
    name: 'ws_list',
    description: 'List the current logical workspace and its roots (aliases + canonical paths), including which root is primary and which is current.',
    parameters: {},
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      const session = exec.agent?.session
      const workspace = workspaceOf(ctx, session)
      if (workspace === undefined) {
        return '当前会话不属于任何多根工作区。请在 Web 界面创建多根工作区并在其中打开会话，或用 ws_list 确认。'
      }
      const current = effectiveCurrentRoot(session)
      const lines = [`逻辑工作区：${workspace.title}`, '根：']
      for (const root of workspace.roots) {
        const marks = [
          root.primary ? 'primary' : null,
          root.alias === current ? 'current' : null,
        ].filter(Boolean).join(', ')
        lines.push(`- ${root.alias}${marks.length > 0 ? ` (${marks})` : ''} → ${root.path}`)
      }
      return lines.join('\n')
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ws_cd',
    description: 'Switch the session\'s current root: subsequent ws_* calls without an explicit root operate on this root. Durable — survives restarts.',
    parameters: {
      root: { type: 'string', required: true, description: 'Root alias to switch to' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      const session = exec.agent?.session
      if (session === undefined) throw new Error('ws_cd requires a session')
      const root = resolveRoot(ctx, exec, args)
      session.append('multiroot/current-root', { alias: root.alias })
      return `当前根已切换为 ${root.alias}（${root.path}）`
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ws_read',
    description: 'Read a UTF-8 text file from a root of the current logical workspace (default: current root, then primary). Fails with FS_TOO_LARGE beyond 1 MiB.',
    parameters: {
      root: { type: 'string', description: 'Root alias; defaults to the current root, then the primary root' },
      path: { type: 'string', required: true, description: 'Path relative to the addressed root' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      const root = resolveRoot(ctx, exec, args)
      const target = await ctx.fs.resolve(args.path, { cwd: root.path, signal: exec.signal })
      const info = await ctx.fs.stat(target, exec.signal)
      if (info === undefined) {
        ctx.emit('fs/observed', target, { kind: 'absent' }, exec)
        throw new FsError(`cannot read "${target.displayPath}": not found`, 'FS_NOT_FOUND')
      }
      if (info.type !== 'file') {
        throw new FsError(`cannot read "${target.displayPath}": not a regular file`, 'FS_NOT_REGULAR_FILE')
      }
      if (info.size !== undefined && info.size > READ_BOUND_BYTES) {
        throw new FsError(`cannot read "${target.displayPath}": file exceeds 1 MiB read bound`, 'FS_TOO_LARGE')
      }
      const content = await ctx.fs.readText(target, exec.signal)
      ctx.emit('fs/observed', target, { kind: 'present', version: info.version }, exec)
      return content
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ws_write',
    description: 'Create or replace a UTF-8 text file in a root of the current logical workspace, under the same read-before-write and version guards as the built-in write tool.',
    parameters: {
      root: { type: 'string', description: 'Root alias; defaults to the current root, then the primary root' },
      path: { type: 'string', required: true, description: 'Path relative to the addressed root' },
      content: { type: 'string', required: true, description: 'Full new file content' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      const root = resolveRoot(ctx, exec, args)
      const target = await ctx.fs.resolve(args.path, { cwd: root.path, signal: exec.signal })
      const intent = await ctx.waterfall('fs/write-intent', target, exec, () => undefined)
      const outcome = await ctx.fs.writeText(target, args.content, intent, exec.signal, policyFor(ctx, exec, root))
      ctx.emit('fs/observed', target, { kind: 'present', version: outcome.version }, exec)
      return mutationText(target.displayPath, outcome.operation === 'create' ? 'Created file' : 'Updated file')
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ws_edit',
    description: 'Apply a literal search/replace edit to a text file in a root of the current logical workspace, with the same version guard as the built-in edit tool.',
    parameters: {
      root: { type: 'string', description: 'Root alias; defaults to the current root, then the primary root' },
      path: { type: 'string', required: true, description: 'Path relative to the addressed root' },
      old_string: { type: 'string', required: true, description: 'Literal text to replace (must match exactly)' },
      new_string: { type: 'string', required: true, description: 'Literal replacement text' },
      replace_all: { type: 'boolean', description: 'Replace every match instead of requiring exactly one' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      const root = resolveRoot(ctx, exec, args)
      const target = await ctx.fs.resolve(args.path, { cwd: root.path, signal: exec.signal })
      const expected = await ctx.waterfall('fs/edit-intent', target, exec, () => undefined)
      const outcome = await ctx.fs.editText(
        target,
        {
          oldString: args.old_string,
          newString: args.new_string,
          replaceAll: args.replace_all === true,
        },
        expected,
        exec.signal,
        policyFor(ctx, exec, root),
      )
      ctx.emit('fs/observed', target, { kind: 'present', version: outcome.version }, exec)
      return mutationText(target.displayPath, 'Edited file')
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ws_bash',
    description: 'Execute a bash command in a root of the current logical workspace. Single-root by default; cross-root requires the deployment policy and an explicit `roots` list.',
    parameters: {
      root: { type: 'string', description: 'Root alias for workdir; defaults to the current root, then the primary root' },
      roots: { type: 'array', items: { type: 'string' }, description: 'Explicit multi-root declaration (cross-root policy applies)' },
      command: { type: 'string', required: true, description: 'The bash command to execute' },
      workdir: { type: 'string', description: 'Working directory inside the addressed root (relative to it); defaults to the root itself' },
      timeoutMs: { type: 'number', description: 'Command timeout in milliseconds' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      const session = exec.agent?.session
      let policy
      let fenceNote = ''
      let workdirRootPath
      let rootLabel

      if (args.roots !== undefined) {
        const roots = resolveRoots(ctx, exec, args.roots)
        if (roots.length <= 1) {
          const root = roots[0]
          workdirRootPath = root.path
          rootLabel = root.alias
          policy = policyFor(ctx, exec, root)
        } else if (crossRootBash === 'off') {
          throw new Error('跨根 bash 已被部署策略禁用（crossRootBash=off）。请按根拆分为多次 ws_bash 调用。')
        } else if (crossRootBash === 'ancestor') {
          const ancestor = commonAncestor(roots.map((root) => root.path))
          workdirRootPath = roots[0].path
          rootLabel = roots.map((root) => root.alias).join(', ')
          policy = {
            mode: ctx.sandboxPolicy.resolve({ session }).mode,
            workspaceRoot: ancestor,
            ...(session === undefined ? {} : { sessionId: session.id }),
          }
          fenceNote = `\n[fence: common ancestor ${ancestor} of roots ${rootLabel}]`
        } else {
          workdirRootPath = roots[0].path
          rootLabel = roots.map((root) => root.alias).join(', ')
          policy = {
            mode: 'danger-full-access',
            ...(session === undefined ? {} : { sessionId: session.id }),
          }
          fenceNote = `\n[fence: UNFENCED across roots ${rootLabel} — deployment policy crossRootBash=unfenced]`
        }
      } else {
        const root = resolveRoot(ctx, exec, args)
        workdirRootPath = root.path
        rootLabel = root.alias
        policy = policyFor(ctx, exec, root)
      }

      const workdir = args.workdir === undefined ? workdirRootPath : joinWithinRoot(workdirRootPath, args.workdir)
      const result = await ctx.shell.run(ctx.shell.resolve({
        command: args.command,
        workdir,
        ...(args.timeoutMs === undefined ? {} : { timeoutMs: args.timeoutMs }),
        sandboxPolicy: policy,
        signal: exec.signal,
      }))
      const parts = []
      if (result.stdout.text !== '') parts.push(result.stdout.text)
      if (result.stderr.text !== '') parts.push(result.stderr.text)
      const body = parts.length > 0 ? parts.join('\n') : '(no output)'
      return `[root: ${rootLabel} | exit code: ${result.exitCode}]${fenceNote}\n${body}`
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ws_glob',
    description: 'List files matching a glob pattern inside a root of the current logical workspace (via ripgrep).',
    parameters: {
      root: { type: 'string', description: 'Root alias; defaults to the current root, then the primary root' },
      pattern: { type: 'string', required: true, description: 'Glob pattern, e.g. "**/*.ts"' },
      path: { type: 'string', description: 'Search directory relative to the addressed root; defaults to the root' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      const root = resolveRoot(ctx, exec, args)
      const searchDir = args.path === undefined ? root.path : joinWithinRoot(root.path, args.path)
      const command = `rg --files -g ${shq(args.pattern)} ${shq(searchDir)}`
      const result = await ctx.shell.run(ctx.shell.resolve({
        command,
        workdir: root.path,
        sandboxPolicy: policyFor(ctx, exec, root),
        signal: exec.signal,
      }))
      const lines = result.stdout.text.split('\n').filter((line) => line.length > 0)
      const capped = lines.slice(0, SEARCH_LINE_CAP)
      const suffix = lines.length > SEARCH_LINE_CAP ? `\n… ${lines.length - SEARCH_LINE_CAP} more` : ''
      return capped.join('\n') + suffix
    },
  }))

  ctx.tools.register(defineTool({
    name: 'ws_grep',
    description: 'Search for a regular expression inside a root of the current logical workspace (via ripgrep), capped at 200 matching lines.',
    parameters: {
      root: { type: 'string', description: 'Root alias; defaults to the current root, then the primary root' },
      query: { type: 'string', required: true, description: 'Regular expression to search for' },
      path: { type: 'string', description: 'Search directory relative to the addressed root; defaults to the root' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args, exec) {
      const root = resolveRoot(ctx, exec, args)
      const searchDir = args.path === undefined ? root.path : joinWithinRoot(root.path, args.path)
      const command = `rg --line-number --no-heading --color never -e ${shq(args.query)} ${shq(searchDir)}`
      const result = await ctx.shell.run(ctx.shell.resolve({
        command,
        workdir: root.path,
        sandboxPolicy: policyFor(ctx, exec, root),
        signal: exec.signal,
      }))
      const lines = result.stdout.text.split('\n').filter((line) => line.length > 0)
      const capped = lines.slice(0, SEARCH_LINE_CAP)
      const suffix = lines.length > SEARCH_LINE_CAP ? `\n… ${lines.length - SEARCH_LINE_CAP} more` : ''
      return capped.join('\n') + suffix
    },
  }))

  // System-prompt section: advertise the workspace roots and the tool split.
  ctx.systemPrompt.section({
    name: 'multiroot:workspace',
    order: 115,
    text: (context) => {
      const session = context.agent?.session
      const workspace = workspaceOf(ctx, session)
      if (workspace === undefined) return ''
      const current = effectiveCurrentRoot(session)
      const lines = workspace.roots.map((root) =>
        `- ${root.alias}${root.primary ? ' (primary)' : ''}${root.alias === current ? ' (current)' : ''} → ${root.path}`)
      return `当前逻辑工作区 <${workspace.title}>，包含以下根：\n${lines.join('\n')}\n\n内建 read/write/edit/bash/搜索作用于 primary 根（即会话 cwd）；访问其他根请使用 ws_* 工具并指定 root 参数。`
    },
  })
}

/** Resolve a workspace-relative workdir path; absolute paths must stay under the root. */
function joinWithinRoot(rootPath, relative) {
  const combined = isAbsolute(relative) ? relative : join(rootPath, relative)
  const relFromRoot = pathRelative(rootPath, combined)
  if (relFromRoot.startsWith('..')) {
    throw new Error(`workdir "${relative}" escapes the addressed root`)
  }
  return combined
}
