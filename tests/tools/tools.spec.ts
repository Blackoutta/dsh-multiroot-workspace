import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@deepseek-ai/schemastery', () => ({
  default: {
    object: (value: unknown) => value,
    union: () => ({ default: (value: unknown) => value }),
  },
}))

vi.mock('@deepseek-ai/dsh-fs', () => ({
  FsError: class FsError extends Error {},
}))

vi.mock('@deepseek-ai/dsh-tools', () => ({
  defineTool: (definition: unknown) => definition,
}))

interface ToolDefinition {
  name: string
  execute(args: Record<string, unknown>, exec: ToolExec): Promise<string>
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

async function createToolsHarness(currentAlias: string | undefined = undefined) {
  const { apply } = await import('../../tools.js')
  const definitions = new Map<string, ToolDefinition>()
  const multirootRegistry = {
    workspaceOfCwd: vi.fn(() => workspace),
    currentRoot: vi.fn(() => currentAlias ?? 'app'),
    setCurrentRoot: vi.fn(async () => undefined),
  }
  const ctx = {
    tools: {
      register: vi.fn((definition: ToolDefinition) => {
        definitions.set(definition.name, definition)
      }),
    },
    multirootRegistry,
    systemPrompt: { section: vi.fn() },
  }
  apply(ctx, {})
  const session: Session = {
    id: 'session-a',
    header: { cwd: '/workspace/app' },
    append: vi.fn(),
  }
  const exec: ToolExec = {
    agent: { session },
    signal: new AbortController().signal,
  }
  const tool = (name: string) => {
    const definition = definitions.get(name)
    if (definition === undefined) throw new Error(`tool ${name} was not registered`)
    return definition
  }
  return { exec, multirootRegistry, session, tool }
}

describe('multiroot current-root tools', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('uses the plugin-owned Session root when no explicit alias is supplied', async () => {
    const harness = await createToolsHarness('docs')

    const output = await harness.tool('ws_list').execute({}, harness.exec)

    expect(harness.multirootRegistry.currentRoot).toHaveBeenCalledWith(
      'session-a',
      '/workspace/app',
    )
    expect(output).toContain('- docs (current) → /workspace/docs')
  })

  it('persists ws_cd through the registry without appending a custom Session event', async () => {
    const harness = await createToolsHarness()

    await harness.tool('ws_cd').execute({ root: 'DoCs' }, harness.exec)

    expect(harness.multirootRegistry.setCurrentRoot).toHaveBeenCalledWith(
      'session-a',
      '/workspace/app',
      'docs',
    )
    expect(harness.session.append).not.toHaveBeenCalled()
  })

  it('propagates a failed ws_cd persistence write without appending a Session event', async () => {
    const harness = await createToolsHarness()
    harness.multirootRegistry.setCurrentRoot.mockRejectedValueOnce(
      new Error('session root write failed'),
    )

    await expect(harness.tool('ws_cd').execute({ root: 'docs' }, harness.exec))
      .rejects.toThrow('session root write failed')
    expect(harness.session.append).not.toHaveBeenCalled()
  })
})
