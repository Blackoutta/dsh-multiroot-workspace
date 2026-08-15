import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../..', import.meta.url)
const [manifestText, readme, upstream, changelog, license] = await Promise.all([
  readFile(new URL('package.json', root), 'utf8'),
  readFile(new URL('README.md', root), 'utf8'),
  readFile(new URL('UPSTREAM.md', root), 'utf8'),
  readFile(new URL('CHANGELOG.md', root), 'utf8'),
  readFile(new URL('LICENSE', root), 'utf8'),
])
const manifest = JSON.parse(manifestText)

assert.equal(manifest.version, '0.1.0-rc.1')
assert.equal(manifest.description, 'Multi-root logical Workspaces for DeepSeek Harness')
assert.equal(manifest.license, 'MIT')
assert.equal(manifest.packageManager, 'pnpm@11.9.0')
assert.deepEqual(manifest.engines, { node: '>=24.11.1 <25' })
assert.deepEqual(manifest.os, ['darwin', 'linux'])
assert.deepEqual(manifest.publishConfig, { access: 'public' })
assert.equal(manifest.author, 'Blackoutta <hyytez@gmail.com>')
assert.deepEqual(manifest.repository, {
  type: 'git',
  url: 'git+https://github.com/Blackoutta/dsh-multiroot-workspace.git',
})
assert.equal(manifest.homepage, 'https://github.com/Blackoutta/dsh-multiroot-workspace#readme')
assert.deepEqual(manifest.bugs, { url: 'https://github.com/Blackoutta/dsh-multiroot-workspace/issues' })
assert.deepEqual(manifest.keywords, [
  'deepseek',
  'deepseek-harness',
  'dsh',
  'dsh-plugin',
  'multi-root',
  'workspace',
])
for (const file of ['CHANGELOG.md', 'LICENSE', 'UPSTREAM.md']) assert.ok(manifest.files.includes(file), file)
assert.match(license, /^MIT License$/m)
assert.match(license, /^Copyright \(c\) 2026 Blackoutta$/m)
assert.match(license, /^Copyright \(c\) 2026 DeepSeek$/m)

assert.match(readme, /```sh\ndsh plugin --profile web add dsh-multiroot-workspace@next\n```/)
assert.match(readme, /start the Web UI with `dsh web`/)
assert.match(readme, /^dsh plugin --profile web remove dsh-multiroot-workspace$/m)
assert.doesNotMatch(readme, /npm install --global @deepseek-ai\/dsh/)
assert.doesNotMatch(readme, /DSH_HOME=~\/dsh-test/)
assert.match(readme, /curl -fsS -X DELETE http:\/\/127\.0\.0\.1:3080\/plugins\/multiroot\/api\/data/)
assert.match(readme, /crossRootBash/)
assert.match(readme, /title: Product repository/)
assert.match(readme, /roots:\n      - alias: app/)
assert.match(readme, /exactly one root must set `primary: true`/)
assert.match(readme, /read-only logical Workspace `config-roots`/)
assert.match(readme, /Paths may be absent during startup/)
assert.match(readme, /Purge clears its Session selections and shadow mapping but preserves the declared record/)
assert.match(readme, /a later new Session whose cwd matches the primary root creates or adopts a Host shadow/)
assert.match(readme, /0\.1\.0-rc\.6/)
assert.match(readme, /macOS and Linux/)

assert.match(upstream, /Harness `0\.1\.0-rc\.6`/)
assert.match(upstream, /17 files and 217 tests passed/)
assert.match(upstream, /b6171a42bce82ba0ece154d710ca3b54835e78a5745a9c2be14b0afc0cda9116/)
assert.match(upstream, /10\/10 screenshot hashes/)
assert.match(changelog, /^## \[Unreleased\]$/m)
assert.match(changelog, /^## \[0\.1\.0-rc\.1\] - 2026-08-15$/m)

console.log('release docs passed: package policy, consumer commands, provenance, changelog')
