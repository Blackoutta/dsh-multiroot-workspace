# ui-workspace source fork

- Package: `@deepseek-ai/dsh-client-ui-workspace@0.1.0-rc.5`
- Source commit: `47f943859b`
- Source directory: `packages/client/ui-workspace/src/client`
- Copied tests: all client tests except the package invariant test

Permitted deviations are limited to client registration assembly, Workspace browser integration props, project-row multiroot metadata and actions, dictionaries, and additive dialog styles. Tree derivation, stores, Session rows, stock dialogs, picker flow, and unrelated CSS rules remain upstream-equivalent. The Chinese flat-view label is clarified from `单列表` to `全部会话`; the underlying stock flat derivation is unchanged.

## Vendored client primitives

The reachable UI primitives were adapted from DeepSeek Harness commit `47f943859bef60e4160492346772ded9b24f765a`, from `packages/client/ui-primitives/src/{Button,HoverCard,Menu,Modal,StateDot,Tooltip}.{tsx,module.css}`. Their behavior and CSS are unchanged; imports were redirected to the local barrel at `src/client/vendor/primitives/index.ts`.

The local barrel exports only the primitive values and types used by this plugin: `Button`, `HoverCard`, `Menu`, `MenuEntry`, `Modal`, `StateDot`, `StateDotState`, and `Tooltip`. Its reduced `icons.tsx` contains only `IconArchiveOutline20`, `IconBranchOutline16`, `IconCloseFill14`, `IconEditOutline16`, `IconEllipsisOutline16`, `IconFolderClose16`, `IconFolderOpen16`, `IconPersonalizationOutline16`, `IconPlusOutline16`, `IconProjectAddOutline16`, `IconSearchOutline16`, `IconSettingsOutline16`, `IconTrashOutline16`, and `IconTriangleRightFill14`.

To avoid copying unrelated package modules, the reachable pointer-grace and clipboard helpers and the Menu/Modal-private check and close glyphs are retained inside their owning vendored components.

The full upstream MIT notice is preserved in `LICENSES/DeepSeek-Harness-MIT.txt` and included in the published package.

## Vendored client store runtime

The Workspace view store retains the upstream structural slot contract: `defineStore` returns a handle carrying its declaration and a scoped instance factory; instances expose snapshot reads, synchronous subscriptions, draft-stripped actions, and persisted-value cleanup. Actions clone before mutation, publish only after successful mutation, then persist whole-value JSON under the unchanged `dsh.workspace.view.v5` key (with an optional scope suffix). Malformed persisted JSON and localStorage read, write, or removal failures fall back without breaking the live store.

The local runtime intentionally omits the upstream generic Zustand, Immer, selector, animation-frame batching, shallow-equality, and arbitrary snapshot-store middleware because this plugin consumes only the JSON-compatible Workspace view store contract.

## Vendored subagent lineage helper

`src/client/vendor/subagents.ts` copies `indexSubagentDescendants` and its `SubagentDescendantSummary` result type from DeepSeek Harness commit `47f943859bef60e4160492346772ded9b24f765a`, source path `packages/client/runtime/src/client/sessions/subagent-lineage.ts`. The implementation is unchanged; its type-only imports use the public `@deepseek-ai/dsh-client-runtime/client` entry, and `src/client/upstream/tree.ts` imports the runtime value from this local module so the browser bundle has no DSH runtime JavaScript dependency.

## Verification

Verified on 2026-08-15 against Harness `0.1.0-rc.6`; the copied source remains pinned to commit `47f943859bef60e4160492346772ded9b24f765a`:

- Node.js `24.11.1` and pnpm `11.9.0`: frozen installation completed from this repository's own workspace and lockfile.
- `pnpm run test`: 17 files and 217 tests passed; `pnpm run typecheck` passed.
- Consecutive builds produced identical `client.js` and `dist/index.cjs` bytes with SHA-256 `b6171a42bce82ba0ece154d710ca3b54835e78a5745a9c2be14b0afc0cda9116`; neither artifact contains an absolute checkout path.
- The packed client executes through the rc.6 module-loader handoff and requires only Host-provided `react`, `react-dom`, and `react/jsx-runtime`.
- A fresh temporary rc.6 Web profile installed the tarball, loaded both bundle rows, executed packed `ws_write`/`ws_read` through the real ToolRuntime and LocalFileSystem, and required no model API key.
- The autonomous Playwright matrix passed in light and dark themes across wide and rail layouts, creation, management, stock Session behavior, Hero selection, deletion, diagnostics, and cleanup. Two consecutive runs produced identical 10/10 screenshot hashes after display-only temporary-path normalization.

All clean-profile and browser checks use temporary `DSH_HOME` directories. The sibling DeepSeek Harness checkout is not imported, modified, or required.
