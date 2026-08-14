import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths({
    projects: [fileURLToPath(new URL('../../../tsconfig.base.json', import.meta.url))],
  })],
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
      {
        find: /^@deepseek-ai\/dsh-client-locale\/src\/(.*)$/,
        replacement: `${fileURLToPath(new URL('../../../packages/client/locale/src/', import.meta.url))}$1`,
      },
    ],
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.{ts,tsx}'],
    pool: 'forks',
    execArgv: process.allowedNodeEnvironmentFlags.has('--webstorage') ? ['--no-webstorage'] : [],
  },
})
