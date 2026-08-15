import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../..', import.meta.url)
const read = path => readFile(new URL(path, root), 'utf8')

const [ci, release, manifestText] = await Promise.all([
  read('.github/workflows/ci.yml'),
  read('.github/workflows/release.yml'),
  read('package.json'),
])
const manifest = JSON.parse(manifestText)

assert.match(ci, /^name: CI$/m)
assert.match(ci, /^  pull_request:$/m)
assert.match(ci, /^  workflow_call:$/m)
assert.match(ci, /^permissions:\n  contents: read$/m)
assert.match(ci, /node-version: 24\.11\.1/)
assert.match(ci, /version: 11\.9\.0/)
assert.match(ci, /test "\$\(npm --version\)" = "11\.6\.2"/)
assert.match(ci, /pnpm run test:workflow-policy/)
assert.doesNotMatch(`${ci}\n${release}`, /^\s*- uses: [^\s]+@(?:v\d+|main|master)\s*$/m)
for (const command of [
  'pnpm install --frozen-lockfile',
  'pnpm run typecheck',
  'pnpm run test',
  'pnpm run test:reproducible-build',
  'pnpm run test:package-manifest',
  'pnpm run test:profile-tools',
  'pnpm run test:client-bundle',
  'pnpm run test:browser',
]) assert.match(ci, new RegExp(command.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')))
assert.match(ci, /pnpm exec playwright install --with-deps chromium/)

assert.match(release, /^name: Release$/m)
assert.match(release, /^      - 'v\*'$/m)
assert.match(release, /^permissions:\n  contents: read\n  id-token: write$/m)
assert.match(release, /uses: \.\/\.github\/workflows\/ci\.yml/)
assert.match(release, /node-version: 24\.11\.1/)
assert.match(release, /registry-url: 'https:\/\/registry\.npmjs\.org'/)
assert.match(release, /test "\$\(npm --version\)" = "11\.6\.2"/)
assert.match(release, /npm publish --tag next/)
assert.doesNotMatch(release, /NPM_TOKEN|NODE_AUTH_TOKEN|npm_[A-Za-z0-9]{20,}/)
assert.match(release, /package version does not match tag/)

assert.equal(manifest.scripts['test:profile-tools'], 'node tests/integration/profile-tools.spec.mjs')
assert.equal(manifest.scripts['test:workflow-policy'], 'node tests/integration/workflow-policy.spec.mjs')

console.log('workflow policy passed: full CI gate and tokenless trusted publication')
