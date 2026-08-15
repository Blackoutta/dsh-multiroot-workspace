import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DSH_VERSION = '0.1.0-rc.6'
const PNPM_VERSION = '11.9.0'
const projectRoot = fileURLToPath(new URL('../..', import.meta.url))

function pnpm(args, options) {
  return spawn('pnpm', args, {
    ...options,
    env: { ...process.env, ...options?.env },
  })
}

async function run(command, args, options) {
  const child = command === 'pnpm' ? pnpm(args, options) : spawn(command, args, options)
  let output = ''
  child.stdout?.on('data', chunk => { output += chunk })
  child.stderr?.on('data', chunk => { output += chunk })
  const [code, signal] = await once(child, 'exit')
  if (code !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited ${code ?? signal}\n${output}`)
  }
  return output
}

async function waitForServer(child, output) {
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    const match = output().match(/dsh web: (http:\/\/127\.0\.0\.1:\d+)/)
    if (match) {
      try {
        const response = await fetch(match[1])
        if (response.ok) return match[1]
      } catch {}
    }
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`dsh web exited before becoming ready\n${output()}`)
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`dsh web did not become ready\n${output()}`)
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGTERM')
  await Promise.race([
    once(child, 'exit'),
    new Promise(resolve => setTimeout(resolve, 5_000)),
  ])
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL')
    await once(child, 'exit')
  }
}

export async function startProfile() {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'dsh-multiroot-profile-'))
  const runner = path.join(temporaryRoot, 'runner')
  const home = path.join(temporaryRoot, 'home')
  const tarball = path.join(temporaryRoot, 'plugin.tgz')
  const profilePatch = path.join(temporaryRoot, 'browser.patch.yml')
  let server

  try {
    await mkdir(runner)
    const pnpmVersion = (await run('pnpm', ['--version'], { cwd: runner })).trim()
    if (pnpmVersion !== PNPM_VERSION) {
      throw new Error(`browser fixture requires pnpm ${PNPM_VERSION}, received ${pnpmVersion}`)
    }
    await writeFile(path.join(runner, 'package.json'), JSON.stringify({ private: true }))
    await writeFile(path.join(runner, 'pnpm-workspace.yaml'), `packages:
  - .
allowBuilds:
  '@deepseek-ai/dsh-subprocess-local': false
  '@google/genai': false
  koffi: false
  node-pty: true
  protobufjs: false
`)
    await writeFile(profilePatch, `- id: directory-picker
  disabled: true
- insert:
    - id: directory-picker-browse
      name: '@deepseek-ai/dsh-host-directory-picker-browse'
    - id: ui-directory-picker-browse
      name: '@deepseek-ai/dsh-client-ui-directory-picker-browse'
`)
    await run('pnpm', ['add', '--save-exact', `@deepseek-ai/dsh@${DSH_VERSION}`], { cwd: runner })
    await run('pnpm', ['pack', '--out', tarball], { cwd: projectRoot })
    await run('pnpm', ['dsh', 'plugin', '--profile', 'web', 'add', tarball], {
      cwd: runner,
      env: { DSH_HOME: home },
    })

    let output = ''
    server = pnpm(['dsh', 'web', '--patch', profilePatch, '--host', '127.0.0.1', '--port', '0'], {
      cwd: runner,
      env: { DSH_HOME: home },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    server.stdout.on('data', chunk => { output += chunk })
    server.stderr.on('data', chunk => { output += chunk })
    const baseUrl = await waitForServer(server, () => output)
    let stopped = false

    return {
      baseUrl,
      home,
      async stop() {
        if (stopped) return
        await stopChild(server)
        await rm(temporaryRoot, { recursive: true, force: true })
        stopped = true
      },
    }
  } catch (error) {
    if (server) await stopChild(server)
    await rm(temporaryRoot, { recursive: true, force: true })
    throw error
  }
}
