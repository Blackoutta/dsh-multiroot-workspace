import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import vm from 'node:vm'

const build = spawnSync('pnpm', ['run', 'build'], { cwd: new URL('../..', import.meta.url), stdio: 'inherit' })
assert.equal(build.status, 0, 'client build must succeed')

const injectedStyles = []
const document = {
  querySelector: () => null,
  createElement: tagName => ({ tagName, dataset: {}, textContent: '' }),
  head: { appendChild: tag => { injectedStyles.push(tag.textContent) } },
}
let handoff
const window = { __ModuleLoader__: { load: value => { handoff = value } } }
const bundle = await readFile(new URL('../../client.js', import.meta.url), 'utf8')
vm.runInNewContext(bundle, { document, window })

assert.equal(handoff.id, 'dsh-multiroot-workspace')
assert.equal(typeof handoff.factory, 'function')

const requiredModules = new Set()
const stub = new Proxy(() => undefined, { get: () => stub, apply: (_target, _this, args) => args[0] })
const modules = new Map([
  ['react', stub],
  ['react-dom', { createPortal: stub }],
  ['react/jsx-runtime', { Fragment: Symbol('Fragment'), jsx: stub, jsxs: stub }],
])
const plugin = handoff.factory(specifier => {
  requiredModules.add(specifier)
  assert.ok(modules.has(specifier), `unexpected client module requirement: ${specifier}`)
  return modules.get(specifier)
})

assert.equal(typeof plugin.apply, 'function')
assert.ok(Array.isArray(plugin.inject))
assert.deepEqual([...requiredModules].sort(), ['react', 'react-dom', 'react/jsx-runtime'])
assert.ok(injectedStyles.some(css => css.includes('danger')), 'plugin CSS must include the danger class')

console.log('client bundle passed: handoff, host module boundary, exports, and plugin CSS')
