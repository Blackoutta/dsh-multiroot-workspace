import { defineConfig } from 'tsdown'

/**
 * Build the browser half as a closure-factory artifact: the module table's
 * loader executes this file, which hands the (id, factory) pair to
 * `window.__ModuleLoader__.load`; platform modules (react, react-dom, cordis,
 * client runtime contracts) resolve through the injected `require` — they are
 * externals, never inlined.
 */
const ID = 'dsh-multiroot-workspace'

export default defineConfig({
  entry: { index: 'src/client/index.tsx' },
  outDir: 'dist',
  format: 'cjs',
  platform: 'browser',
  external: [
    /^react(-dom)?(\/.+)?$/,
    /^@deepseek-ai\//,
  ],
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
})
