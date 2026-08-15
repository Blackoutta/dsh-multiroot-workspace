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

`ws_cd` stores the current-root selection as plugin-owned state keyed by Session id, so it survives plugin and Harness restarts without adding a custom Session event. A Session with no stored selection uses its logical Workspace's primary root. Deleting or purging that logical Workspace clears its selections. Forked Sessions do not inherit the source Session's selection and therefore begin on the primary root.

The selection table is additive within storage-domain version 4. Harness rc.6 has no domain migration API and rejects a changed version stamp, while its supported backends safely materialize a newly declared table at the existing version; this preserves previously stored logical Workspaces.

## Model tools and permissions

Sessions opened in a logical Workspace receive these tools:

- `ws_list` lists aliases, canonical paths, and the primary/current markers.
- `ws_cd` changes the plugin-owned current alias for that Session.
- `ws_read`, `ws_write`, and `ws_edit` access a root-relative text file. The tools reject lexical traversal and canonical targets outside the selected root (including symlink escapes); reads are limited to 1 MiB. Mutations use the Harness read-before-write/version waterfalls and publish `fs/observed` events.
- `ws_glob` and `ws_grep` run ripgrep inside the selected root and cap output at 200 lines. Ripgrep exit 1 is an empty result; real command failures and cancellation are surfaced.
- `ws_bash` runs in one selected root by default and passes that exact root to the active sandbox policy. `workdir` cannot escape the selected root.

`crossRootBash` controls an explicit non-empty `roots` list. The default, `off`, rejects multiple roots. `ancestor` fences the process to their tightest common ancestor, which can expose sibling content below that ancestor. `unfenced` requests `danger-full-access` with no `workspaceRoot`; enable it only when the deployment deliberately accepts unrestricted host access. Unknown aliases are always rejected before a shell process starts.

## UI behavior

- **按工作区** shows ordinary and logical Workspace project rows. Logical rows add the root count and primary alias.
- **全部会话** is the stock flat view: it hides project rows and shows every visible Session once.
- The branch icon in the Workspace header opens multiroot creation. A logical Workspace row's existing action menu opens management.
- The management dialog shows complete directory names and paths in a two-column layout. When a Workspace has many roots, only the root list scrolls; the name field, add action, and footer remain fixed.
- Forms use Harness Modal, Button, icon, and theme primitives; no Unicode folder/archive icons are rendered.

Before uninstalling, call `DELETE /plugins/multiroot/api/data` to remove logical records and plugin-owned shadows. Adopted user Workspaces are preserved.
