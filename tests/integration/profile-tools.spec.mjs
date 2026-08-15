import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtemp, mkdir, readFile, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

const projectRoot = new URL('../..', import.meta.url)
const scratch = await mkdtemp(join(tmpdir(), 'dsh-multiroot-profile-tools-'))
const artifacts = join(scratch, 'artifacts')
const dshHome = join(scratch, 'home')
const appRoot = join(scratch, 'app root')
const docsRoot = join(scratch, 'docs root')
const aiApiKeyEnvironments = [
  'DEEPSEEK_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'AZURE_OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
]
for (const name of aiApiKeyEnvironments) Reflect.deleteProperty(process.env, name)

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
  })
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')} failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  )
  return result
}

function packageImport(requireFromProfile, specifier) {
  return import(pathToFileURL(requireFromProfile.resolve(specifier)).href)
}

function outputText(result) {
  return result.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
}

let ctx
try {
  await Promise.all([
    mkdir(artifacts, { recursive: true }),
    mkdir(appRoot, { recursive: true }),
    mkdir(docsRoot, { recursive: true }),
  ])
  const packed = run('pnpm', ['pack', '--pack-destination', artifacts])
  const tarballName = packed.stdout.trim().split('\n').at(-1)
  assert.ok(tarballName?.endsWith('.tgz'), `pnpm pack did not print a tarball: ${packed.stdout}`)
  const tarball = isAbsolute(tarballName) ? tarballName : join(artifacts, tarballName)

  const dsh = ['dlx', '@deepseek-ai/dsh@0.1.0-rc.6']
  run('pnpm', [...dsh, 'plugin', '--profile', 'web', 'add', tarball], { env: { DSH_HOME: dshHome } })
  const dumped = run('pnpm', [...dsh, '--profile', 'web', '--dump-config'], { env: { DSH_HOME: dshHome } })
  assert.match(
    dumped.stdout,
    /(?:^|\n)- id: multiroot-workspace\n\s+name: dsh-multiroot-workspace(?:\n|$)/,
    'composed profile must contain the packed host bundle row',
  )
  assert.match(
    dumped.stdout,
    /(?:^|\n)- id: multiroot-workspace-tools\n\s+name: dsh-multiroot-workspace\/tools(?:\n|$)/,
    'composed profile must contain the packed tools row',
  )

  const profileDir = join(dshHome, 'profiles', 'web')
  const requireFromProfile = createRequire(join(profileDir, 'package.json'))
  const [{ Context }, { default: ToolRuntime }, { default: LocalFileSystem }, { default: SystemPrompt }] = await Promise.all([
    packageImport(requireFromProfile, '@deepseek-ai/cordis'),
    packageImport(requireFromProfile, '@deepseek-ai/dsh-tools'),
    packageImport(requireFromProfile, '@deepseek-ai/dsh-fs-local'),
    packageImport(requireFromProfile, '@deepseek-ai/dsh-system-prompt'),
  ])

  const pluginToolsPath = requireFromProfile.resolve('dsh-multiroot-workspace/tools')
  const relativePluginPath = relative(await realpath(profileDir), await realpath(pluginToolsPath))
  assert.ok(
    relativePluginPath !== '' && relativePluginPath !== '..' && !relativePluginPath.startsWith('../'),
    'tool row must load from the packed profile dependency',
  )
  const pluginTools = await import(pathToFileURL(pluginToolsPath).href)

  ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(LocalFileSystem, { cwd: appRoot })
  Object.defineProperties(ctx, {
    multirootRegistry: {
      configurable: true,
      value: {
        workspaceOfCwd: () => ({
          id: 'profile-smoke',
          title: 'profile smoke',
          roots: [
            { alias: 'app', path: appRoot, primary: true },
            { alias: 'docs', path: docsRoot, primary: false },
          ],
        }),
        currentRoot: () => 'app',
        setCurrentRoot: async () => undefined,
      },
    },
    sandboxPolicy: {
      configurable: true,
      value: { resolve: () => ({ mode: 'workspace-write' }) },
    },
    shell: { configurable: true, value: {} },
  })
  pluginTools.apply(ctx, {})

  let call = 0
  const agent = { session: { id: 'profile-session', header: { cwd: appRoot } } }
  const execute = (name, args) => ctx.tools.execute({
    signal: new AbortController().signal,
    callId: `profile-tools-${++call}`,
    name,
    arguments: args,
    agent,
  })

  assert.equal(
    aiApiKeyEnvironments.some(name => process.env[name] !== undefined),
    false,
    'profile tool invocation must run without an ambient AI API key',
  )
  const write = await execute('ws_write', { root: 'docs', path: 'shared.txt', content: 'from packed profile' })
  assert.equal(write.isError, false, outputText(write))
  const read = await execute('ws_read', { root: 'docs', path: 'shared.txt' })
  assert.equal(read.isError, false, outputText(read))
  assert.equal(outputText(read), 'from packed profile')
  assert.equal(await readFile(join(docsRoot, 'shared.txt'), 'utf8'), 'from packed profile')
  await assert.rejects(readFile(join(appRoot, 'shared.txt'), 'utf8'), error => error?.code === 'ENOENT')

  console.log('profile tools passed: packed install, rc.6 ToolRuntime, alias isolation, no API key')
} finally {
  try {
    await ctx?.fiber.dispose()
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }
}
