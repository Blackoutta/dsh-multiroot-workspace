import { readFile } from 'node:fs/promises'
import { basename, dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'
import { defineConfig } from 'tsdown'

/**
 * Build the browser half as a closure-factory artifact: the module table's
 * loader executes this file, which hands the (id, factory) pair to
 * `window.__ModuleLoader__.load`; platform modules (react, react-dom, cordis,
 * client runtime contracts) resolve through the injected `require` — they are
 * externals, never inlined.
 */
const ID = 'dsh-multiroot-workspace'
const ROOT = dirname(fileURLToPath(import.meta.url))
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

export default defineConfig({
  entry: { index: 'src/client/index.ts' },
  outDir: 'dist',
  format: 'cjs',
  platform: 'browser',
  deps: {
    neverBundle: [/^react(?:-dom)?(?:\/.+)?$/],
    alwaysBundle: ['clsx'],
    onlyBundle: false,
  },
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: function (require) { const module = { exports: {} }; const exports = module.exports;`,
  },
  footer: {
    js: 'return module.exports; }})',
  },
  dts: false,
  minify: false,
  sourcemap: false,
  target: 'es2022',
  plugins: [{
    name: 'dsh-css-modules-inline',
    resolveId(source, importer) {
      if (!source.endsWith('.module.css')) return null
      const file = importer === undefined ? source : resolve(dirname(importer), source)
      const relativeFile = relative(ROOT, file).split(sep).join('/')
      return CSS_VIRTUAL_PREFIX + relativeFile + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const relativeFile = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      const file = resolve(ROOT, relativeFile)
      this.addWatchFile(file)
      const source = await readFile(file)
      const { code, exports: cssExports } = transform({
        filename: relativeFile,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap = {}
      for (const [local, value] of Object.entries(cssExports ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
        classMap[local] = value.name
      }
      const tagId = `${ID}/${basename(file)}`
      return [
        `const css = ${JSON.stringify(code.toString())};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        "if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {",
        "  const tag = document.createElement('style');",
        `  tag.dataset.plugin = ${JSON.stringify(ID)};`,
        '  tag.dataset.pluginCss = tagId;',
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
    },
  }],
})
