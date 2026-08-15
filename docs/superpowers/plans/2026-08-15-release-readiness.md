# dsh-multiroot-workspace Release Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a reproducible, independently buildable prerelease of `dsh-multiroot-workspace` that preserves Sessions, installs without unexplained dependency warnings, and passes unit, package, clean-profile, and browser verification outside the DeepSeek Harness checkout.

**Architecture:** Keep the external two-row bundle: the Host row owns logical Workspace persistence and the Web API, while the tools row owns `ws_*` tools and model instructions. Replace the unsupported custom Session event with plugin-owned per-Session storage, retain the pinned `ui-workspace` source fork, and package the browser half as a deterministic prebuilt client artifact. Treat DSH and browser runtime packages as Host-provided optional peers, and test against the exact supported DSH prerelease.

**Tech Stack:** Node.js 24, pnpm 11, JavaScript/TypeScript, Cordis, DSH 0.1.0 prereleases, Zod, tsdown, Lightning CSS, Vitest, Playwright, npm Trusted Publishing.

---

## Release blockers recorded on 2026-08-15

- `ws_cd` appends `multiroot/current-root`, which is unknown to the Harness persistence reader and cannot carry `ignorable: true` through the public `Session.append()` API.
- The package has no automated coverage for the `ws_*` tool family.
- `@deepseek-ai/dsh-fs`, `@deepseek-ai/dsh-tools`, and `@deepseek-ai/schemastery` are direct runtime imports but are absent from the manifest.
- `dsh.client.inject` omits the stock Workspace client's package dependency edges.
- Typecheck and Vitest resolve files from a sibling DeepSeek Harness checkout.
- Consecutive client builds produce different bytes because CSS export keys are not sorted; generated module comments disclose the build machine's absolute path.
- The repository has no local license file or complete npm metadata. Packing from inside the Harness checkout inherits the parent repository's license by accident.
- The active release work is not merged into `main`; the repository has no remote, release tags, or CI workflows.
- The browser check covers one viewport and locale but not every browser acceptance path promised by the design.

## Supported first release

- Package version: `0.1.0-rc.1`.
- npm dist-tag: `next`.
- Supported Harness version: `0.1.0-rc.6` only.
- Supported host platforms: macOS and Linux. Windows remains unsupported until the POSIX shell commands and common-ancestor calculation have Windows coverage.
- Distribution: npm tarball with prebuilt `client.js`; Git installation remains supported through the source manifest's `prepare` script.

Execute Task 4 first because relocating this repository deliberately invalidates its former `../../../packages` source paths. Continue with Tasks 1, 2, 3, 5, 6, 7, and 8 in that order.

### Task 1: Replace the unsupported Session event

**Files:**

- Modify: `index.js`
- Modify: `tools.js`
- Modify: `tests/host/registry.spec.ts`
- Create: `tests/tools/tools.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Write failing persistence tests**

Add Host tests proving that the storage domain retains a current alias by Session id, rejects aliases absent from the logical Workspace, deletes selections when their logical Workspace is deleted, and returns the primary alias when no selection exists.

Run:

```sh
pnpm exec vitest run tests/host/registry.spec.ts
```

Expected: FAIL because the registry has no Session-root storage methods.

- [ ] **Step 2: Add the Session-root table**

Advance the `multiroot_workspace` storage domain version to `5` and add a `sessionRoots` table containing `{ workspaceId, alias }`, keyed by Session id. Expose these registry methods:

```js
currentRoot(sessionId, cwd)
setCurrentRoot(sessionId, cwd, alias)
clearCurrentRoot(sessionId)
```

`setCurrentRoot` must resolve the logical Workspace from `cwd`, compare aliases case-insensitively, and persist the canonical alias. Workspace deletion and purge must delete matching Session-root rows before publishing completion.

- [ ] **Step 3: Remove `multiroot/current-root` writes and folds**

Change `ws_cd` to call `ctx.multirootRegistry.setCurrentRoot(session.id, session.header.cwd, root.alias)`. Change default-root resolution to call `currentRoot`; retain primary-root fallback when no selection exists. Remove `effectiveCurrentRoot()` and every reference to `multiroot/current-root`.

- [ ] **Step 4: Test process restart behavior**

Mount the registry over one in-memory domain, set an alias, dispose the plugin, mount it again over the same stored tables, and assert that the alias survives. Assert that no Session event outside the Harness event set is appended.

- [ ] **Step 5: Document durability semantics**

Update the README to state that current-root selection is plugin-owned per-Session state, is cleared with the logical Workspace, defaults to the logical primary root, and is not copied when a Session is forked.

- [ ] **Step 6: Verify and commit**

```sh
pnpm exec vitest run tests/host/registry.spec.ts tests/tools/tools.spec.ts
git diff --check
git add index.js tools.js tests/host/registry.spec.ts tests/tools/tools.spec.ts README.md
git commit -m "fix: persist current roots in plugin storage"
```

Expected: focused tests pass and no `multiroot/current-root` reference remains.

### Task 2: Cover the model-facing tool family

**Files:**

- Modify: `tests/tools/tools.spec.ts`
- Create: `tests/integration/profile-tools.spec.mjs`
- Modify: `README.md`

- [ ] **Step 1: Add a reusable tool harness**

Build a fake Cordis context that captures `ctx.tools.register` calls and supplies bounded fakes for `fs`, `shell`, `sandboxPolicy`, `systemPrompt`, and `multirootRegistry`. Give each fake call recording so assertions observe resolved paths, policies, emitted filesystem events, and shell requests.

- [ ] **Step 2: Test root resolution**

Cover primary fallback, persisted selection, explicit alias override, case-insensitive aliases, unknown aliases, and Sessions outside a logical Workspace.

- [ ] **Step 3: Test filesystem tools**

Cover `ws_read`, `ws_write`, and `ws_edit`, including root-relative resolution, absolute-path rejection or confinement, read-before-write waterfalls, expected versions, `fs/observed`, missing files, and the one-megabyte read limit.

- [ ] **Step 4: Test search tools**

Cover `ws_glob` and `ws_grep`, including paths containing spaces and single quotes, result caps, empty results, non-zero search exits, and cancellation.

- [ ] **Step 5: Test Bash policy modes**

Cover single-root Bash plus `off`, `ancestor`, and `unfenced` cross-root modes. Assert the exact `workspaceRoot` and permission mode passed to `ctx.shell.run`; reject an empty root list and aliases outside the logical Workspace.

- [ ] **Step 6: Add an assembled profile smoke**

Install the packed bundle into a temporary profile, create two temporary roots, invoke the registered tools without an API key, and verify that a file written through one alias is read through that alias while the other root remains untouched.

- [ ] **Step 7: Verify and commit**

```sh
pnpm exec vitest run tests/tools
node tests/integration/profile-tools.spec.mjs
git diff --check
git add tests/tools tests/integration README.md
git commit -m "test: cover multiroot tools and policies"
```

### Task 3: Make dependency and client manifests complete

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `pnpm-workspace.yaml`
- Modify: `README.md`

- [ ] **Step 1: Declare every direct runtime import**

Add compatible Host-provided peer entries for `@deepseek-ai/dsh-fs`, `@deepseek-ai/dsh-tools`, and `@deepseek-ai/schemastery`. Keep `clsx` and `zod` as ordinary dependencies. Pin all DSH peer and development packages to `0.1.0-rc.6` for the first release.

- [ ] **Step 2: Mark Host-provided peers optional**

Add `peerDependenciesMeta` entries with `optional: true` for Cordis, React, and every `@deepseek-ai/*` peer. DSH supplies these through the profile module fallback; optional metadata prevents pnpm from treating that external provision as an installation failure.

- [ ] **Step 3: Declare the client graph**

Set:

```json
"dsh": {
  "bundle": { "patch": "./cordis.patch.yml" },
  "client": {
    "platform": "web",
    "inject": [
      "@deepseek-ai/dsh-client-locale",
      "@deepseek-ai/dsh-client-runtime",
      "@deepseek-ai/dsh-client-ui-conversation",
      "@deepseek-ai/dsh-client-ui-sidebar"
    ]
  }
}
```

- [ ] **Step 4: Make the project its own pnpm workspace**

Create:

```yaml
packages:
  - .

allowBuilds:
  lightningcss: true
```

Regenerate the lockfile with pnpm 11 and verify that pnpm never walks into a parent workspace.

- [ ] **Step 5: Verify a packed-profile install**

```sh
pnpm install --frozen-lockfile
pnpm pack --pack-destination .artifacts
release_home=$(mktemp -d)
DSH_HOME="$release_home" dsh plugin --profile web add .artifacts/dsh-multiroot-workspace-0.1.0-rc.1.tgz
pnpm peers check -C "$release_home/profiles/web"
```

Expected: installation succeeds without an unexplained peer warning; the package's direct imports are all declared.

- [ ] **Step 6: Commit**

```sh
git add package.json pnpm-lock.yaml pnpm-workspace.yaml README.md
git commit -m "build: complete external dependency metadata"
```

### Task 4: Remove parent-checkout dependencies

**Files:**

- Modify: `tsconfig.json`
- Modify: `vitest.config.mjs`
- Modify: `tests/client/*.spec.tsx`
- Modify: `tests/client/upstream/*.spec.tsx`
- Modify: `package.json`

- [ ] **Step 1: Remove the parent source path**

Delete the `@deepseek-ai/dsh-client-locale/src/*` mapping to `../../../packages/client/locale/src/*` from `tsconfig.json`.

- [ ] **Step 2: Remove the parent tsconfig plugin configuration**

Remove `vite-tsconfig-paths` and every alias targeting `../../../packages`. Resolve tests only through installed package exports and local source paths.

- [ ] **Step 3: Replace source-only locale imports**

Replace `@deepseek-ai/dsh-client-locale/src/locales/zh.ts` fixtures with local test dictionaries or the public locale export. Do not import another package's `src/` path from tests.

- [ ] **Step 4: Prove physical independence**

Copy a clean archive of the repository to a temporary directory outside every workspace and run:

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run test
pnpm run build
pnpm pack --pack-destination .artifacts
```

Expected: every command passes with the DeepSeek Harness checkout renamed or unavailable.

- [ ] **Step 5: Commit**

```sh
git add tsconfig.json vitest.config.mjs tests package.json pnpm-lock.yaml
git commit -m "build: remove harness checkout dependencies"
```

### Task 5: Make client builds deterministic and portable

**Files:**

- Modify: `tsdown.config.mjs`
- Modify: `.gitignore`
- Modify: `package.json`
- Regenerate: `client.js`
- Regenerate: `dist/index.cjs`

- [ ] **Step 1: Add a failing reproducibility check**

Create a script that builds twice, hashes `client.js`, and exits non-zero when the hashes differ or the repository-relative generated artifacts change after the second build.

- [ ] **Step 2: Sort CSS module exports**

Change CSS class-map construction to iterate:

```js
for (const [local, value] of Object.entries(cssExports ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
  classMap[local] = value.name
}
```

- [ ] **Step 3: Normalize virtual module ids**

Use a repository-relative POSIX path in the virtual id and generated region name. Verify that neither `client.js` nor `dist/index.cjs` contains `/Users/`, `/home/`, a drive-letter root, or the checkout's absolute path.

- [ ] **Step 4: Choose one artifact policy**

Keep `client.js` tracked because git installation needs a usable client after `prepare`; ignore `.artifacts/`. Keep `dist/index.cjs` tracked only if a test consumes it directly; otherwise remove it from Git and ignore `dist/`.

- [ ] **Step 5: Verify and commit**

```sh
pnpm run build
first=$(shasum -a 256 client.js | cut -d' ' -f1)
pnpm run build
second=$(shasum -a 256 client.js | cut -d' ' -f1)
test "$first" = "$second"
! rg '/Users/|/home/|[A-Za-z]:[/\\]' client.js
git diff --check
git add tsdown.config.mjs package.json .gitignore client.js dist/index.cjs
git commit -m "build: make client artifacts reproducible"
```

### Task 6: Complete legal, package, and consumer documentation

**Files:**

- Create: `LICENSE`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `UPSTREAM.md`
- Create: `CHANGELOG.md`

- [ ] **Step 1: Add the license owned by this repository**

Add an MIT license that preserves the DeepSeek copyright notice for copied Workspace UI code and adds the copyright holder for original multiroot code. Confirm the chosen holder before publishing.

- [ ] **Step 2: Complete npm metadata**

Add description, license, author, repository, homepage, bugs, keywords, `packageManager`, Node engines, supported operating systems, and `publishConfig.access: public`. Set the version to `0.1.0-rc.1`.

- [ ] **Step 3: Complete the README consumer contract**

Document prerequisites, exact install/start/remove commands, configuration, all `ws_*` tools, current-root durability, storage and purge behavior, adopted versus owned shadows, supported DSH version, supported platforms, permissions, and the `ancestor`/`unfenced` Bash risks.

- [ ] **Step 4: Refresh upstream verification**

Record the exact mirrored package and commit, the tested DSH version, current test counts, deterministic client hash, clean-profile result, and browser matrix. Keep copied files and permitted deviations explicit.

- [ ] **Step 5: Add the initial changelog**

Create an `Unreleased` section and a `0.1.0-rc.1` section describing logical Workspaces, shadow ownership, stock UI preservation, tools, platform limits, and the supported DSH version.

- [ ] **Step 6: Inspect the tarball**

```sh
pnpm pack --pack-destination .artifacts
tar -tzf .artifacts/dsh-multiroot-workspace-0.1.0-rc.1.tgz
tar -xOzf .artifacts/dsh-multiroot-workspace-0.1.0-rc.1.tgz package/LICENSE | head
```

Expected: the package contains the local license, README, manifest, Host entries, patch, and prebuilt client only.

- [ ] **Step 7: Commit**

```sh
git add LICENSE package.json README.md UPSTREAM.md CHANGELOG.md pnpm-lock.yaml
git commit -m "docs: prepare the first public prerelease"
```

### Task 7: Finish the browser acceptance matrix

**Files:**

- Modify: `tests/browser/multiroot-ui.spec.mjs`
- Create: `tests/browser/profile-fixture.mjs`
- Create: `tests/browser/screenshots/.gitkeep`
- Modify: `README.md`

- [ ] **Step 1: Own profile startup in the browser test**

Make the test create a temporary DSH home, install the packed tarball, start DSH on an ephemeral loopback port, and stop it in `finally`. Remove the requirement for a manually running `DSH_WEB_URL` server.

- [ ] **Step 2: Cover both themes and sidebar modes**

Run the assertions in light and dark themes at wide and rail widths. Check computed theme colors, the 36-pixel section header, 28-pixel controls, title width, and the absence of horizontal clipping.

- [ ] **Step 3: Cover creation and management**

Create a logical Workspace through the UI, preserve form input after one injected API failure, change the primary root, rename the logical Workspace, remove a secondary root, and delete the logical Workspace.

- [ ] **Step 4: Cover stock Session behavior**

Verify grouped and flat views, search, ordering, folding, drag ordering, Session rename, fork, archive, overflow actions, Hero picker, and ungrouped Sessions after logical Workspace deletion.

- [ ] **Step 5: Check browser diagnostics**

Fail on `pageerror`, console error, failed requests, unhandled dialogs, or a plugin bundle response other than JavaScript `200`.

- [ ] **Step 6: Capture reviewed screenshots**

Store baselines for wide, rail, create dialog, manage dialog, and Hero picker in both themes. Use deterministic fixture titles and paths so repeated runs are stable.

- [ ] **Step 7: Verify and commit**

```sh
pnpm run test:browser
git diff --check
git add tests/browser README.md
git commit -m "test: cover the public browser experience"
```

### Task 8: Add continuous integration and Trusted Publishing

**Files:**

- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/release.yml`
- Modify: `README.md`

- [ ] **Step 1: Add pull-request CI**

Run frozen installation, typecheck, unit tests, deterministic build verification, tarball inspection, clean-profile installation, Host API smoke, client bundle smoke, and Playwright tests on Ubuntu with Node 24 and the pinned pnpm version.

- [ ] **Step 2: Add tag publication**

Trigger on `v*`, grant only `contents: read` and `id-token: write`, rerun CI, assert `v$(package.version)` equals the tag, and run:

```sh
npm publish --tag next
```

Use npm Trusted Publishing; do not add a long-lived npm token.

- [ ] **Step 3: Create the GitHub repository and npm publisher relationship**

Create the public GitHub repository, set it as `origin`, configure npm's trusted publisher with the exact repository and `.github/workflows/release.yml`, and enable branch protection for CI.

- [ ] **Step 4: Merge release work into `main`**

Open a pull request from `blackoutta/external-ui-fork`, require the new CI, review the copied-code attribution and security-sensitive shell behavior, and merge without rewriting published tag history.

- [ ] **Step 5: Publish and verify the prerelease**

```sh
git switch main
git pull --ff-only
git tag v0.1.0-rc.1
git push origin v0.1.0-rc.1
npm view dsh-multiroot-workspace@next version dist.attestations --json
```

Expected: the registry reports `0.1.0-rc.1` with provenance.

- [ ] **Step 6: Install the registry artifact**

```sh
release_home=$(mktemp -d)
DSH_HOME="$release_home" dsh plugin --profile web add dsh-multiroot-workspace@next
DSH_HOME="$release_home" dsh --profile web --dump-config
```

Start the Web profile, run the browser smoke against the registry artifact, purge plugin data, remove the package, and confirm ordinary stock Workspace UI returns.

## Completion criteria

- No custom unknown Session event is written.
- Every model-facing tool has automated behavior and policy coverage.
- The repository builds and tests outside a Harness checkout.
- Two clean builds produce the same client hash and no absolute path.
- The packed manifest declares every direct import and the client graph.
- The tarball carries this repository's license and complete npm metadata.
- Clean-profile install, boot, API, client bundle, and browser checks pass against DSH `0.1.0-rc.6`.
- GitHub CI passes on `main`; npm Trusted Publishing produces a provenance-bearing `next` release.
