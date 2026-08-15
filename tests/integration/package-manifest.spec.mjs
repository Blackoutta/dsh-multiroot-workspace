import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = new URL('../..', import.meta.url)
const expectedPeers = {
  '@deepseek-ai/cordis': '4.0.1',
  '@deepseek-ai/dsh-client-locale': '0.1.0-rc.6',
  '@deepseek-ai/dsh-client-runtime': '0.1.0-rc.6',
  '@deepseek-ai/dsh-client-ui-conversation': '0.1.0-rc.6',
  '@deepseek-ai/dsh-client-ui-sidebar': '0.1.0-rc.6',
  '@deepseek-ai/dsh-client-ui-slots': '0.1.0-rc.6',
  '@deepseek-ai/dsh-fs': '0.1.0-rc.6',
  '@deepseek-ai/dsh-storage-domain': '0.1.0-rc.6',
  '@deepseek-ai/dsh-tools': '0.1.0-rc.6',
  '@deepseek-ai/schemastery': '3.18.1',
  react: '18.3.1',
  'react-dom': '18.3.1',
}
const expectedPeerMetadata = Object.fromEntries(
  Object.keys(expectedPeers).map(name => [name, { optional: true }]),
)
const expectedClientInject = [
  '@deepseek-ai/dsh-client-locale',
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-ui-conversation',
  '@deepseek-ai/dsh-client-ui-sidebar',
]

const artifactDir = await mkdtemp(join(tmpdir(), 'dsh-manifest-'))
try {
  const pack = spawnSync('pnpm', ['pack', '--pack-destination', artifactDir], {
    cwd: root,
    encoding: 'utf8',
  })
  assert.equal(pack.status, 0, pack.stderr || pack.stdout)
  const artifacts = await readdir(artifactDir)
  assert.deepEqual(artifacts.filter(name => name.endsWith('.tgz')).length, 1)
  const tarball = join(artifactDir, artifacts.find(name => name.endsWith('.tgz')))

  const extract = spawnSync('tar', ['-xOzf', tarball, 'package/package.json'], { encoding: 'utf8' })
  assert.equal(extract.status, 0, extract.stderr)
  const manifest = JSON.parse(extract.stdout)

  assert.deepEqual(manifest.peerDependencies, expectedPeers)
  assert.deepEqual(manifest.peerDependenciesMeta, expectedPeerMetadata)
  assert.deepEqual(manifest.dependencies, { clsx: '^2.0.0', zod: '^4.4.3' })
  assert.deepEqual(manifest.dsh?.client, { platform: 'web', inject: expectedClientInject })
  assert.equal(manifest.peerDependencies?.['@deepseek-ai/dsh-client-ui-primitives'], undefined)
  assert.equal(manifest.devDependencies?.['@deepseek-ai/dsh-client-connection'], undefined)
  for (const [name, version] of Object.entries(manifest.devDependencies ?? {})) {
    if (name.startsWith('@deepseek-ai/dsh-')) assert.equal(version, '0.1.0-rc.6', name)
  }
  assert.equal(manifest.devDependencies?.['@deepseek-ai/cordis'], '4.0.1')
  assert.equal(manifest.devDependencies?.['@deepseek-ai/schemastery'], '3.18.1')
  assert.equal(manifest.devDependencies?.react, '18.3.1')
  assert.equal(manifest.devDependencies?.['react-dom'], '18.3.1')

  const workspace = await readFile(new URL('../../pnpm-workspace.yaml', import.meta.url), 'utf8')
  assert.match(workspace, /^packages:\n  - \.\n\nallowBuilds:\n  lightningcss: true\n$/)
} finally {
  await rm(artifactDir, { recursive: true, force: true })
}

console.log('packed manifest passed: direct imports, host peers, client services, workspace policy')
