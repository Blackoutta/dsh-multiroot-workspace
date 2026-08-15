import { beforeEach, describe, expect, it, vi } from 'vitest'
import { relative as relativePath, resolve as resolvePath } from 'node:path'

vi.mock('@deepseek-ai/schemastery', () => ({
  default: {
    object: (value: unknown) => value,
    union: () => ({ default: (value: unknown) => value }),
  },
}))

vi.mock('@deepseek-ai/dsh-fs', () => ({
  FsError: class FsError extends Error {
    code: string
    constructor(message: string, code: string) {
      super(message)
      this.code = code
    }
  },
}))

vi.mock('@deepseek-ai/dsh-tools', () => ({
  defineTool: (definition: unknown) => definition,
}))

interface ToolDefinition {
  name: string
  execute(args: Record<string, any>, exec: ToolExec): Promise<string>
}

interface ToolExec {
  agent: { session: Session }
  signal: AbortSignal
}

interface Session {
  id: string
  header: { cwd: string }
  append: ReturnType<typeof vi.fn>
}

const workspace = {
  id: 'logical-workspace',
  title: 'product',
  roots: [
    { alias: 'app', path: '/workspace/app', primary: true },
    { alias: 'docs', path: '/workspace/docs', primary: false },
  ],
}

function target(path: string, cwd: string) {
  const absolute = resolvePath(cwd, path)
  return { targetKey: absolute, displayPath: absolute }
}

interface FakeShellResult {
  stdout: { text: string }
  stderr: { text: string }
  exitCode: number | null
  signal: string | null
  timedOut: boolean
  aborted: boolean
}

function shellResult(overrides: Partial<FakeShellResult> = {}): FakeShellResult {
  return {
    stdout: { text: '' },
    stderr: { text: '' },
    exitCode: 0,
    signal: null,
    timedOut: false,
    aborted: false,
    ...overrides,
  }
}

async function createToolsHarness(options: {
  currentAlias?: string | null
  config?: { crossRootBash?: string }
  workspace?: typeof workspace
} = {}) {
  const { apply } = await import('../../tools.js')
  const definitions = new Map<string, ToolDefinition>()
  const selectedWorkspace = options.workspace ?? workspace
  const observed: unknown[][] = []
  const waterfallValues = new Map<string, unknown>([
    ['fs/write-intent', { kind: 'replaceIfVersion', version: 'seen-v1' }],
    ['fs/edit-intent', { version: 'seen-v1' }],
  ])
  const multirootRegistry = {
    workspaceOfCwd: vi.fn<() => typeof workspace | undefined>(() => selectedWorkspace),
    currentRoot: vi.fn(() => options.currentAlias === null ? undefined : options.currentAlias ?? 'app'),
    setCurrentRoot: vi.fn(async () => undefined),
  }
  const fs = {
    resolve: vi.fn(async (path: string, request: { cwd: string }) => target(path, request.cwd)),
    contains: vi.fn((parent: { targetKey: string }, child: { targetKey: string }) => {
      const relative = relativePath(parent.targetKey, child.targetKey)
      return relative === '' || (relative !== '..' && !relative.startsWith('../'))
    }),
    processPath: vi.fn((resolved: { targetKey: string }) => resolved.targetKey),
    stat: vi.fn<() => Promise<{ type: string, size: number, version: string } | undefined>>(async () => ({ type: 'file', size: 5, version: 'v1' })),
    readText: vi.fn(async () => 'hello'),
    writeText: vi.fn(async () => ({ operation: 'replace', version: 'v2' })),
    editText: vi.fn(async () => ({ version: 'v3' })),
  }
  const shell = {
    resolve: vi.fn((request: object) => Object.freeze({ ...request })),
    run: vi.fn<(request: object) => Promise<FakeShellResult>>(async () => shellResult()),
  }
  const sandboxPolicy = { resolve: vi.fn(() => ({ mode: 'workspace-write' })) }
  const ctx = {
    tools: {
      register: vi.fn((definition: ToolDefinition) => {
        definitions.set(definition.name, definition)
      }),
    },
    multirootRegistry,
    fs,
    shell,
    sandboxPolicy,
    systemPrompt: { section: vi.fn() },
    waterfall: vi.fn(async (event: string) => waterfallValues.get(event)),
    emit: vi.fn((...args: unknown[]) => { observed.push(args) }),
  }
  apply(ctx, options.config ?? {})
  const session: Session = {
    id: 'session-a',
    header: { cwd: '/workspace/app' },
    append: vi.fn(),
  }
  const controller = new AbortController()
  const exec: ToolExec = {
    agent: { session },
    signal: controller.signal,
  }
  const tool = (name: string) => {
    const definition = definitions.get(name)
    if (definition === undefined) throw new Error(`tool ${name} was not registered`)
    return definition
  }
  return {
    controller, ctx, exec, fs, multirootRegistry, observed, sandboxPolicy,
    session, shell, tool, waterfallValues,
  }
}

describe('root resolution', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('falls back to the primary root when no persisted selection exists', async () => {
    const harness = await createToolsHarness({ currentAlias: null })
    await harness.tool('ws_read').execute({ path: 'README.md' }, harness.exec)
    expect(harness.fs.resolve).toHaveBeenCalledWith('README.md', expect.objectContaining({ cwd: '/workspace/app' }))
  })

  it('uses the persisted selection when no explicit alias is supplied', async () => {
    const harness = await createToolsHarness({ currentAlias: 'docs' })
    await harness.tool('ws_read').execute({ path: 'guide.md' }, harness.exec)
    expect(harness.multirootRegistry.currentRoot).toHaveBeenCalledWith('session-a', '/workspace/app')
    expect(harness.fs.resolve).toHaveBeenCalledWith('guide.md', expect.objectContaining({ cwd: '/workspace/docs' }))
  })

  it('lets an explicit alias override the persisted selection case-insensitively', async () => {
    const harness = await createToolsHarness({ currentAlias: 'app' })
    await harness.tool('ws_read').execute({ root: 'DoCs', path: 'guide.md' }, harness.exec)
    expect(harness.fs.resolve).toHaveBeenCalledWith('guide.md', expect.objectContaining({ cwd: '/workspace/docs' }))
    expect(harness.multirootRegistry.currentRoot).not.toHaveBeenCalled()
  })

  it('rejects unknown aliases and lists the available aliases', async () => {
    const harness = await createToolsHarness()
    await expect(harness.tool('ws_read').execute({ root: 'missing', path: 'x' }, harness.exec))
      .rejects.toThrow('app, docs')
  })

  it('returns a clear result from ws_list outside a logical Workspace', async () => {
    const harness = await createToolsHarness()
    harness.multirootRegistry.workspaceOfCwd.mockReturnValue(undefined)
    await expect(harness.tool('ws_list').execute({}, harness.exec)).resolves.toContain('不属于任何多根工作区')
  })

  it('rejects tool access outside a logical Workspace', async () => {
    const harness = await createToolsHarness()
    harness.multirootRegistry.workspaceOfCwd.mockReturnValue(undefined)
    await expect(harness.tool('ws_read').execute({ path: 'x' }, harness.exec)).rejects.toThrow('不属于任何多根工作区')
  })

  it('persists ws_cd through plugin storage without appending a Session event', async () => {
    const harness = await createToolsHarness()
    await harness.tool('ws_cd').execute({ root: 'DoCs' }, harness.exec)
    expect(harness.multirootRegistry.setCurrentRoot).toHaveBeenCalledWith('session-a', '/workspace/app', 'docs')
    expect(harness.session.append).not.toHaveBeenCalled()
  })

  it('propagates failed ws_cd persistence without appending a Session event', async () => {
    const harness = await createToolsHarness()
    harness.multirootRegistry.setCurrentRoot.mockRejectedValueOnce(new Error('session root write failed'))
    await expect(harness.tool('ws_cd').execute({ root: 'docs' }, harness.exec)).rejects.toThrow('session root write failed')
    expect(harness.session.append).not.toHaveBeenCalled()
  })
})

describe('filesystem tools', () => {
  it('resolves relative reads inside the addressed root and records the observed version', async () => {
    const harness = await createToolsHarness()
    await expect(harness.tool('ws_read').execute({ root: 'docs', path: 'guide.md' }, harness.exec)).resolves.toBe('hello')
    const resolved = target('guide.md', '/workspace/docs')
    expect(harness.fs.readText).toHaveBeenCalledWith(resolved, harness.exec.signal)
    expect(harness.ctx.emit).toHaveBeenCalledWith('fs/observed', resolved, { kind: 'present', version: 'v1' }, harness.exec)
  })

  it('rejects absolute paths outside the addressed root before filesystem access', async () => {
    const harness = await createToolsHarness()
    await expect(harness.tool('ws_read').execute({ root: 'docs', path: '/etc/passwd' }, harness.exec))
      .rejects.toThrow('escapes the addressed root')
    expect(harness.fs.resolve).not.toHaveBeenCalled()
  })

  it.each(['ws_read', 'ws_write', 'ws_edit'])('%s rejects relative traversal outside the addressed root', async (name) => {
    const harness = await createToolsHarness()
    const args = name === 'ws_read'
      ? { root: 'docs', path: '../app/private.txt' }
      : name === 'ws_write'
        ? { root: 'docs', path: '../app/private.txt', content: 'x' }
        : { root: 'docs', path: '../app/private.txt', old_string: 'x', new_string: 'y' }
    await expect(harness.tool(name).execute(args, harness.exec)).rejects.toThrow('escapes the addressed root')
    expect(harness.fs.resolve).not.toHaveBeenCalled()
  })

  it('allows ordinary root-relative names beginning with two dots', async () => {
    const harness = await createToolsHarness()
    await expect(harness.tool('ws_read').execute({ root: 'docs', path: '..notes.md' }, harness.exec)).resolves.toBe('hello')
    expect(harness.fs.readText).toHaveBeenCalledWith(target('..notes.md', '/workspace/docs'), harness.exec.signal)
  })

  it('rejects a resolved target outside the root to confine symlink escapes', async () => {
    const harness = await createToolsHarness()
    harness.fs.resolve.mockImplementation(async (path: string, request: { cwd: string }) =>
      path === 'linked-secret' ? target('/outside/secret.txt', request.cwd) : target(path, request.cwd))
    await expect(harness.tool('ws_read').execute({ root: 'docs', path: 'linked-secret' }, harness.exec))
      .rejects.toThrow('escapes the addressed root')
    expect(harness.fs.readText).not.toHaveBeenCalled()
  })

  it('records a missing read before reporting FS_NOT_FOUND', async () => {
    const harness = await createToolsHarness()
    harness.fs.stat.mockResolvedValueOnce(undefined)
    await expect(harness.tool('ws_read').execute({ path: 'missing.txt' }, harness.exec))
      .rejects.toMatchObject({ code: 'FS_NOT_FOUND' })
    expect(harness.ctx.emit).toHaveBeenCalledWith(
      'fs/observed', target('missing.txt', '/workspace/app'), { kind: 'absent' }, harness.exec,
    )
  })

  it('rejects files larger than one MiB without reading their content', async () => {
    const harness = await createToolsHarness()
    harness.fs.stat.mockResolvedValueOnce({ type: 'file', size: 1024 * 1024 + 1, version: 'large' })
    await expect(harness.tool('ws_read').execute({ path: 'large.bin' }, harness.exec))
      .rejects.toMatchObject({ code: 'FS_TOO_LARGE' })
    expect(harness.fs.readText).not.toHaveBeenCalled()
  })

  it('passes the write-intent decision and exact root policy to writeText, then observes its version', async () => {
    const harness = await createToolsHarness()
    await harness.tool('ws_write').execute({ root: 'docs', path: 'guide.md', content: 'new' }, harness.exec)
    const resolved = target('guide.md', '/workspace/docs')
    expect(harness.ctx.waterfall).toHaveBeenCalledWith('fs/write-intent', resolved, harness.exec, expect.any(Function))
    expect(harness.fs.writeText).toHaveBeenCalledWith(
      resolved, 'new', { kind: 'replaceIfVersion', version: 'seen-v1' }, harness.exec.signal,
      { mode: 'workspace-write', workspaceRoot: '/workspace/docs', sessionId: 'session-a' },
    )
    expect(harness.ctx.emit).toHaveBeenCalledWith('fs/observed', resolved, { kind: 'present', version: 'v2' }, harness.exec)
  })

  it('passes the read-before-edit expected version and edit shape, then observes its version', async () => {
    const harness = await createToolsHarness()
    await harness.tool('ws_edit').execute({
      root: 'docs', path: 'guide.md', old_string: 'old', new_string: 'new', replace_all: true,
    }, harness.exec)
    const resolved = target('guide.md', '/workspace/docs')
    expect(harness.ctx.waterfall).toHaveBeenCalledWith('fs/edit-intent', resolved, harness.exec, expect.any(Function))
    expect(harness.fs.editText).toHaveBeenCalledWith(
      resolved, { oldString: 'old', newString: 'new', replaceAll: true }, { version: 'seen-v1' },
      harness.exec.signal, { mode: 'workspace-write', workspaceRoot: '/workspace/docs', sessionId: 'session-a' },
    )
    expect(harness.ctx.emit).toHaveBeenCalledWith('fs/observed', resolved, { kind: 'present', version: 'v3' }, harness.exec)
  })
})

describe('search tools', () => {
  it('quotes spaces and single quotes in glob patterns and paths', async () => {
    const harness = await createToolsHarness()
    await harness.tool('ws_glob').execute({ root: 'docs', pattern: "**/*'draft*.md", path: "team docs/it's" }, harness.exec)
    const request = harness.shell.resolve.mock.calls[0]?.[0] as { command: string }
    expect(request.command).toBe("rg --files -g '**/*'\\''draft*.md' '/workspace/docs/team docs/it'\\''s'")
  })

  it('quotes spaces and single quotes in grep queries and paths', async () => {
    const harness = await createToolsHarness()
    await harness.tool('ws_grep').execute({ root: 'docs', query: "owner's draft", path: "team docs/it's" }, harness.exec)
    const request = harness.shell.resolve.mock.calls[0]?.[0] as { command: string }
    expect(request.command).toBe(
      "rg --line-number --no-heading --color never -e 'owner'\\''s draft' '/workspace/docs/team docs/it'\\''s'",
    )
  })

  it('rejects a search directory whose canonical target escapes through a symlink', async () => {
    const harness = await createToolsHarness()
    harness.fs.resolve.mockImplementation(async (path: string, request: { cwd: string }) =>
      path === 'linked-search' ? target('/outside/search', request.cwd) : target(path, request.cwd))
    await expect(harness.tool('ws_glob').execute({ root: 'docs', pattern: '**/*', path: 'linked-search' }, harness.exec))
      .rejects.toThrow('escapes the addressed root')
    expect(harness.shell.run).not.toHaveBeenCalled()
  })

  it('uses the filesystem provider process path for a canonical search directory', async () => {
    const harness = await createToolsHarness()
    harness.fs.processPath.mockReturnValueOnce('/provider/docs search')
    await harness.tool('ws_grep').execute({ root: 'docs', query: 'needle', path: 'search' }, harness.exec)
    expect(harness.shell.resolve).toHaveBeenCalledWith(expect.objectContaining({
      command: "rg --line-number --no-heading --color never -e 'needle' '/provider/docs search'",
    }))
  })

  it.each(['ws_glob', 'ws_grep'])('%s caps output at 200 lines', async (name) => {
    const harness = await createToolsHarness()
    const lines = Array.from({ length: 203 }, (_, index) => `line-${index + 1}`)
    harness.shell.run.mockResolvedValueOnce(shellResult({ stdout: { text: lines.join('\n') } }))
    const args = name === 'ws_glob' ? { pattern: '**/*' } : { query: 'match' }
    const output = await harness.tool(name).execute(args, harness.exec)
    expect(output.split('\n')).toHaveLength(201)
    expect(output).toContain('… 3 more')
    expect(output).not.toContain('line-201\n')
  })

  it.each(['ws_glob', 'ws_grep'])('%s returns an empty string for no matches', async (name) => {
    const harness = await createToolsHarness()
    harness.shell.run.mockResolvedValueOnce(shellResult({ exitCode: 1 }))
    const args = name === 'ws_glob' ? { pattern: '**/*.none' } : { query: 'absent' }
    await expect(harness.tool(name).execute(args, harness.exec)).resolves.toBe('')
  })

  it.each(['ws_glob', 'ws_grep'])('%s rejects non-match command failures', async (name) => {
    const harness = await createToolsHarness()
    harness.shell.run.mockResolvedValueOnce(shellResult({ stderr: { text: 'rg: permission denied' }, exitCode: 2 }))
    const args = name === 'ws_glob' ? { pattern: '**/*' } : { query: 'match' }
    await expect(harness.tool(name).execute(args, harness.exec)).rejects.toThrow('rg: permission denied')
  })

  it.each([
    [{ exitCode: null, signal: null, timedOut: false, aborted: false }, 'ripgrep search failed without an exit code'],
    [{ exitCode: 1, signal: null, timedOut: false, aborted: true }, 'ripgrep search aborted'],
    [{ exitCode: 1, signal: null, timedOut: true, aborted: false }, 'ripgrep search timed out'],
    [{ exitCode: null, signal: 'SIGTERM', timedOut: false, aborted: false }, 'ripgrep search terminated by SIGTERM'],
  ])('rejects a resolved interrupted search result: %s', async (outcome, message) => {
    const harness = await createToolsHarness()
    harness.shell.run.mockResolvedValueOnce(shellResult({ stderr: { text: 'rg diagnostic' }, ...outcome }))
    await expect(harness.tool('ws_grep').execute({ query: 'match' }, harness.exec))
      .rejects.toThrow(`${message}: rg diagnostic`)
  })

  it.each(['ws_glob', 'ws_grep'])('%s forwards cancellation and propagates an aborted shell call', async (name) => {
    const harness = await createToolsHarness()
    harness.controller.abort()
    harness.shell.run.mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'))
    const args = name === 'ws_glob' ? { pattern: '**/*' } : { query: 'match' }
    await expect(harness.tool(name).execute(args, harness.exec)).rejects.toMatchObject({ name: 'AbortError' })
    expect(harness.shell.resolve).toHaveBeenCalledWith(expect.objectContaining({ signal: harness.exec.signal }))
  })
})

describe('bash policy modes', () => {
  it('fences a single-root invocation to that exact root', async () => {
    const harness = await createToolsHarness()
    await harness.tool('ws_bash').execute({ root: 'docs', command: 'pwd' }, harness.exec)
    const resolvedRequest = harness.shell.resolve.mock.results[0]?.value
    expect(harness.shell.run.mock.calls).toEqual([[resolvedRequest]])
    expect(resolvedRequest).toEqual({
      command: 'pwd',
      workdir: '/workspace/docs',
      sandboxPolicy: { mode: 'workspace-write', workspaceRoot: '/workspace/docs', sessionId: 'session-a' },
      signal: harness.exec.signal,
    })
  })

  it('rejects cross-root Bash in off mode', async () => {
    const harness = await createToolsHarness({ config: { crossRootBash: 'off' } })
    await expect(harness.tool('ws_bash').execute({ roots: ['app', 'docs'], command: 'pwd' }, harness.exec))
      .rejects.toThrow('crossRootBash=off')
    expect(harness.shell.run).not.toHaveBeenCalled()
  })

  it('fences ancestor mode to the tightest common ancestor', async () => {
    const harness = await createToolsHarness({ config: { crossRootBash: 'ancestor' } })
    await harness.tool('ws_bash').execute({ roots: ['app', 'docs'], command: 'pwd' }, harness.exec)
    const resolvedRequest = harness.shell.resolve.mock.results[0]?.value
    expect(harness.shell.run.mock.calls).toEqual([[resolvedRequest]])
    expect(resolvedRequest).toEqual({
      command: 'pwd',
      workdir: '/workspace/app',
      sandboxPolicy: { mode: 'workspace-write', workspaceRoot: '/workspace', sessionId: 'session-a' },
      signal: harness.exec.signal,
    })
  })

  it('uses danger-full-access without a workspaceRoot in unfenced mode', async () => {
    const harness = await createToolsHarness({ config: { crossRootBash: 'unfenced' } })
    const output = await harness.tool('ws_bash').execute({ roots: ['app', 'docs'], command: 'pwd' }, harness.exec)
    const resolvedRequest = harness.shell.resolve.mock.results[0]?.value
    expect(harness.shell.run.mock.calls).toEqual([[resolvedRequest]])
    expect(resolvedRequest).toEqual({
      command: 'pwd',
      workdir: '/workspace/app',
      sandboxPolicy: { mode: 'danger-full-access', sessionId: 'session-a' },
      signal: harness.exec.signal,
    })
    expect(Object.hasOwn(resolvedRequest.sandboxPolicy, 'workspaceRoot')).toBe(false)
    expect(output).toContain('UNFENCED')
  })

  it('rejects an explicitly empty root list before shell invocation', async () => {
    const harness = await createToolsHarness({ config: { crossRootBash: 'ancestor' } })
    await expect(harness.tool('ws_bash').execute({ roots: [], command: 'pwd' }, harness.exec))
      .rejects.toThrow('roots')
    expect(harness.shell.run).not.toHaveBeenCalled()
  })

  it('rejects aliases outside the logical Workspace before shell invocation', async () => {
    const harness = await createToolsHarness({ config: { crossRootBash: 'ancestor' } })
    await expect(harness.tool('ws_bash').execute({ roots: ['app', 'secret'], command: 'pwd' }, harness.exec))
      .rejects.toThrow('未知根 "secret"')
    expect(harness.shell.run).not.toHaveBeenCalled()
  })

  it('rejects absolute or relative workdirs that escape the addressed root', async () => {
    const harness = await createToolsHarness()
    await expect(harness.tool('ws_bash').execute({ root: 'docs', workdir: '/workspace/app', command: 'pwd' }, harness.exec))
      .rejects.toThrow('escapes the addressed root')
    await expect(harness.tool('ws_bash').execute({ root: 'docs', workdir: '../app', command: 'pwd' }, harness.exec))
      .rejects.toThrow('escapes the addressed root')
  })

  it.each([
    [{}, { root: 'docs' }],
    [{ crossRootBash: 'ancestor' }, { roots: ['docs', 'app'] }],
    [{ crossRootBash: 'unfenced' }, { roots: ['docs', 'app'] }],
  ])('rejects a canonical workdir escape under policy %s', async (config, roots) => {
    const harness = await createToolsHarness({ config })
    harness.fs.resolve.mockImplementation(async (path: string, request: { cwd: string }) =>
      path === 'linked-workdir' ? target('/outside/workdir', request.cwd) : target(path, request.cwd))
    await expect(harness.tool('ws_bash').execute({ ...roots, workdir: 'linked-workdir', command: 'pwd' }, harness.exec))
      .rejects.toThrow('escapes the addressed root')
    expect(harness.shell.run).not.toHaveBeenCalled()
  })

  it('uses the filesystem provider process path for an explicit canonical workdir', async () => {
    const harness = await createToolsHarness()
    harness.fs.processPath.mockReturnValueOnce('/provider/docs workdir')
    await harness.tool('ws_bash').execute({ root: 'docs', workdir: 'workdir', command: 'pwd' }, harness.exec)
    expect(harness.shell.run.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ workdir: '/provider/docs workdir' }))
  })
})
