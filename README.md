# dsh-multiroot-workspace

External DeepSeek Harness bundle providing logical Workspaces with multiple named filesystem roots. It replaces the stock Workspace UI only while installed, using a source fork pinned in [UPSTREAM.md](./UPSTREAM.md); it does not modify Harness repository files.

## Development

```sh
pnpm install --ignore-workspace
pnpm run test
pnpm run typecheck
pnpm run build
pnpm exec playwright install chromium
DSH_WEB_URL=http://127.0.0.1:3090 pnpm run test:browser
```

The browser check expects an installed profile containing this bundle to be running at `DSH_WEB_URL`. It creates and removes its own temporary logical Workspace and root directories.

The Host API is served under `/plugins/multiroot/api`. Creating a logical Workspace immediately creates or adopts its primary Host Workspace and returns `shadowWorkspaceId`. The browser joins logical metadata by that id and leaves the stock Workspace list authoritative for Session membership, search, grouping, ordering, and selection.

## UI behavior

- **按工作区** shows ordinary and logical Workspace project rows. Logical rows add the root count and primary alias.
- **全部会话** is the stock flat view: it hides project rows and shows every visible Session once.
- The branch icon in the Workspace header opens multiroot creation. A logical Workspace row's existing action menu opens management.
- The management dialog shows complete directory names and paths in a two-column layout. When a Workspace has many roots, only the root list scrolls; the name field, add action, and footer remain fixed.
- Forms use Harness Modal, Button, icon, and theme primitives; no Unicode folder/archive icons are rendered.

Before uninstalling, call `DELETE /plugins/multiroot/api/data` to remove logical records and plugin-owned shadows. Adopted user Workspaces are preserved.
