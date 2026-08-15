import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/** Adapt DSH's published browser factory bundles to Vitest's ESM module graph. */
function dshClientBundles() {
  return {
    name: 'dsh-client-bundles',
    enforce: 'pre',
    load(id) {
      if (!/@deepseek-ai[/+]dsh-client-[^/]+\/lib\/client\.js$/u.test(id)) return
      return readFileSync(id, 'utf8').replace(/\n\/\/# sourceMappingURL=.*$/u, '')
    },
    transform(code) {
      if (!code.startsWith('window.__ModuleLoader__.load({')) return

      const dependencies = [...new Set([...code.matchAll(/\brequire\("([^"]+)"\)/g)].map(match => match[1]))]
      const names = [...new Set([...code.matchAll(/\bexports\.([A-Za-z_$][\w$]*)\s*=/g)].map(match => match[1]))]
      const imports = dependencies.map((specifier, index) =>
        `import * as dshDependency${index} from ${JSON.stringify(specifier)}`).join('\n')
      const modules = dependencies.map((specifier, index) =>
        `[${JSON.stringify(specifier)}, dshDependency${index}]`).join(',\n  ')
      const exports = names.map(name => `export const ${name} = dshExports.${name}`).join('\n')
      const handoffCode = code
        .replace(/^window\.__ModuleLoader__\.load\(/u, 'dshCapture(')
        .replace(/\n\/\/# sourceMappingURL=.*$/u, '')

      return `${imports}
let dshHandoff
const dshCapture = handoff => { dshHandoff = handoff }
${handoffCode}
if (dshHandoff === undefined) throw new Error('DSH client bundle did not register with ModuleLoader')
const dshModules = new Map([
  ${modules}
])
const dshExports = dshHandoff.factory(specifier => {
  if (!dshModules.has(specifier)) throw new Error(\`Unknown DSH client bundle dependency: \${specifier}\`)
  return dshModules.get(specifier)
})
${exports}
`
    },
  }
}

export default defineConfig({
  plugins: [dshClientBundles()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      {
        find: /^react(\/.*)?$/,
        replacement: `${fileURLToPath(new URL('./node_modules/react/', import.meta.url))}$1`,
      },
      {
        find: /^react-dom(\/.*)?$/,
        replacement: `${fileURLToPath(new URL('./node_modules/react-dom/', import.meta.url))}$1`,
      },
      {
        find: /^use-sync-external-store(\/.*)?$/,
        replacement: `${fileURLToPath(new URL('./node_modules/use-sync-external-store/', import.meta.url))}$1`,
      },
      {
        find: /^@testing-library\/react(\/.*)?$/,
        replacement: `${fileURLToPath(new URL('./node_modules/@testing-library/react/', import.meta.url))}$1`,
      },
    ],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.{ts,tsx}'],
    server: {
      deps: {
        inline: [/@deepseek-ai\/dsh-client-/],
      },
    },
    pool: 'forks',
    execArgv: process.allowedNodeEnvironmentFlags.has('--webstorage') ? ['--no-webstorage'] : [],
  },
})
