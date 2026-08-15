import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const artifacts = ['client.js', 'dist/index.cjs']
const absolutePath = /\/(?:Users|home|private\/tmp|tmp)\/|(?:^|[^A-Za-z])[A-Za-z]:[\\/]/mu

function build() {
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
  })
}

async function snapshot() {
  return new Map(await Promise.all(artifacts.map(async (artifact) => [artifact, await readFile(new URL(`../${artifact}`, import.meta.url))])))
}

function hash(content) {
  return createHash('sha256').update(content).digest('hex')
}

const baseline = await snapshot()
build()
const first = await snapshot()
build()
const second = await snapshot()

for (const artifact of artifacts) {
  const firstContent = first.get(artifact)
  const secondContent = second.get(artifact)
  if (!firstContent.equals(secondContent)) {
    throw new Error(`${artifact} changed across builds: ${hash(firstContent)} != ${hash(secondContent)}`)
  }
  if (!baseline.get(artifact).equals(secondContent)) throw new Error(`${artifact} was not up to date`)
  if (absolutePath.test(secondContent.toString())) throw new Error(`${artifact} contains an absolute build path`)
  console.log(`${artifact}: ${hash(secondContent)}`)
}
