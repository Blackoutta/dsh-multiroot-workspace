# dsh-multiroot-workspace

External DeepSeek Harness bundle providing logical Workspaces with multiple named filesystem roots. It replaces the stock Workspace UI only while installed, using a source fork pinned in [UPSTREAM.md](./UPSTREAM.md); it does not modify Harness repository files.

## Prerequisites

The first public prerelease targets DeepSeek Harness `0.1.0-rc.6` exactly on macOS and Linux. Harness supplies the pinned Cordis, DSH client and Host services, Schemastery, React, and ReactDOM peers when it loads the plugin; consumers should install the plugin through a Harness profile instead of installing those peers into the plugin package. Source development uses Node.js `24.11.1` and pnpm `11.9.0`.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run test
pnpm run typecheck
pnpm run build
pnpm exec playwright install chromium
pnpm run test:browser
```

The browser check packs the current plugin, creates an isolated temporary DSH home, installs it through the exact public `@deepseek-ai/dsh@0.1.0-rc.6` CLI, and starts Web on a random loopback port. It exercises the public UI with stable fixture titles, aliases, and path suffixes, then stops the server and removes the temporary profile and directories in `finally`; no sibling Harness checkout or manually managed `DSH_WEB_URL` is used.

The check writes ten review screenshots under `tests/browser/screenshots/`: light and dark variants of the wide sidebar, rail, create dialog, manage dialog, and Hero picker. Runtime directories remain exclusive temporary paths, while their visible screenshot text is normalized to a stable display prefix. These generated PNGs are local review artifacts and are intentionally not staged with release commits; the directory itself is retained by `.gitkeep`.

Pull requests and `main` run the same Node.js 24.11.1 / pnpm 11.9.0 release gate in GitHub Actions, including packed-profile, deterministic-build, client-bundle, and browser checks. A `v<package-version>` tag may publish the `next` dist-tag only after that reusable gate passes. Publication uses npm Trusted Publishing through `.github/workflows/release.yml` with GitHub OIDC; no long-lived npm token is used.

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
