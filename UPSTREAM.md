# ui-workspace source fork

- Package: `@deepseek-ai/dsh-client-ui-workspace@0.1.0-rc.5`
- Source commit: `47f943859b`
- Source directory: `packages/client/ui-workspace/src/client`
- Copied tests: all client tests except the package invariant test

Permitted deviations are limited to client registration assembly, Workspace browser integration props, project-row multiroot metadata and actions, dictionaries, and additive dialog styles. Tree derivation, stores, Session rows, stock dialogs, picker flow, and unrelated CSS rules remain upstream-equivalent. The Chinese flat-view label is clarified from `单列表` to `全部会话`; the underlying stock flat derivation is unchanged.

## Verification

Verified on 2026-08-14 against Harness `0.1.0-rc.5` / `47f943859b`:

- `pnpm run test` — 11 files and 127 tests passed.
- `pnpm run typecheck` — passed with the standalone strict program.
- `pnpm run build` — emitted the loader factory and three inline CSS Modules; `clsx` is bundled because it is not a Harness platform module.
- Isolated profile boot at `http://127.0.0.1:3090/` — the client loaded, a two-root logical Workspace rendered by explicit shadow id, grouped and All sessions views worked, and the management dialog remained aligned in the dark theme at a 1280 × 720 viewport.

The isolated boot used a temporary `DSH_HOME`; the parent Harness worktree remained clean.
