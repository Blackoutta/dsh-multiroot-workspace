# Self-Contained Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make the browser half independently buildable and testable against DSH 0.1.0-rc.6 without runtime imports from its incomplete published client artifacts.

**Architecture:** Vendor only the Workspace fork's reachable UI primitives and a minimal structural store engine, bundle them into the plugin ModuleLoader artifact, and keep React/ReactDOM as the only browser runtime externals. Preserve the rc.6 test-runtime adapter solely to execute published ModuleLoader bundles; never synthesize CSS or alias into the Harness checkout.

**Tech Stack:** Node.js 24, pnpm 11, TypeScript/React 18, tsdown, Lightning CSS, Vitest, DSH 0.1.0-rc.6.

## Global Constraints

- /Users/yang/Desktop/projects/deepseek-harness is read-only reference material.
- Pin supported DSH packages to 0.1.0-rc.6.
- Preserve public Host and client APIs.
- Copy only reachable primitive/store code and retain upstream attribution.
- Do not import ../../../packages, unpublished package source, or absolute checkout paths.
- Do not fabricate CSS maps or weaken UI assertions.
- Follow TDD and commit each reviewed task separately.

---

### Task 1: Vendor the reachable UI primitives

**Files:**

- Create: src/client/vendor/primitives/index.ts
- Create: src/client/vendor/primitives/{Button,HoverCard,Menu,Modal,StateDot,Tooltip}.tsx
- Create: matching six .module.css files
- Create: src/client/vendor/primitives/icons.tsx
- Create: tests/client/vendor-primitives.client.spec.tsx
- Modify: src/client/upstream/WorkspaceBrowser.tsx
- Modify: src/client/upstream/WorkspacePicker.tsx
- Modify: src/client/upstream/rows/Rows.tsx
- Modify: src/client/multiroot/Dialogs.tsx
- Modify: UPSTREAM.md

**Interfaces:**

- Consumes: React 18 and the existing local CSS-module build plugin.
- Produces: the exact primitive names currently imported from dsh-client-ui-primitives, including MenuEntry and StateDotState.

- [ ] **Step 1: Write the failing primitive test**

Create a jsdom test importing the local Menu. Render Rename and a danger Delete item and assert:

    expect(screen.getByRole('menuitem', { name: 'Delete' }).className).toMatch(/danger/)
    expect(screen.getByRole('menuitem', { name: 'Rename' }).className).not.toMatch(/danger/)

Also assert a non-empty list class and one onSelect('delete') call.

- [ ] **Step 2: Verify RED**

Run:

    pnpm exec vitest run tests/client/vendor-primitives.client.spec.tsx

Expected: failure because the local primitive barrel does not exist.

- [ ] **Step 3: Copy only reachable upstream code**

Use read-only source commit 47f943859bef60e4160492346772ded9b24f765a and copy behavior/CSS from these exact files:

    packages/client/ui-primitives/src/Button.*
    packages/client/ui-primitives/src/HoverCard.*
    packages/client/ui-primitives/src/Menu.*
    packages/client/ui-primitives/src/Modal.*
    packages/client/ui-primitives/src/StateDot.*
    packages/client/ui-primitives/src/Tooltip.*

Build icons.tsx from only:

    IconArchiveOutline20 IconBranchOutline16 IconCloseFill14 IconEditOutline16
    IconEllipsisOutline16 IconFolderClose16 IconFolderOpen16 IconPersonalizationOutline16
    IconPlusOutline16 IconProjectAddOutline16 IconSearchOutline16 IconSettingsOutline16
    IconTrashOutline16 IconTriangleRightFill14

Every vendored source begins with:

    // Adapted from DeepSeek Harness commit 47f943859bef60e4160492346772ded9b24f765a.
    // Copyright (c) DeepSeek. Licensed under the repository's upstream license.

The local barrel exports only names used by this plugin.

- [ ] **Step 4: Switch production imports**

Replace all value and primitive type imports from dsh-client-ui-primitives with the correct relative local barrel import. Keep names and call sites unchanged.

- [ ] **Step 5: Verify GREEN**

Run:

    pnpm exec vitest run tests/client/vendor-primitives.client.spec.tsx tests/client/upstream/rows.client.spec.tsx tests/client/multiroot-dialogs.client.spec.tsx
    pnpm run typecheck

Expected: pass, including the unchanged danger-class assertion.

- [ ] **Step 6: Document and commit**

Record copied paths, commit, reduced barrel/icon set, and unchanged behavior/CSS in UPSTREAM.md.

    git diff --check
    git add src/client/vendor/primitives src/client/upstream/WorkspaceBrowser.tsx src/client/upstream/WorkspacePicker.tsx src/client/upstream/rows/Rows.tsx src/client/multiroot/Dialogs.tsx tests/client/vendor-primitives.client.spec.tsx UPSTREAM.md
    git commit -m "build: vendor reachable client primitives"

---

### Task 2: Own the client store runtime

**Files:**

- Create: src/client/vendor/store.ts
- Create: tests/client/vendor-store.client.spec.ts
- Modify: src/client/upstream/stores.ts
- Modify: UPSTREAM.md

**Interfaces:**

- Consumes: JSON-compatible Workspace view state and localStorage when available.
- Produces: defineStore and EngineStoreHandle with the structural spec/create interface consumed by DSH slots.

- [ ] **Step 1: Write failing store tests**

Test an increment action, synchronous subscription, valid persisted reload, malformed JSON fallback, scoped key test.counter.session-a, and clearPersisted removal:

    const handle = defineStore({
      init: () => ({ count: 0 }),
      persist: 'test.counter',
      actions: { increment: (draft, by: number) => { draft.count += by } },
    })
    const instance = handle.create()
    instance.actions.increment(2)
    expect(instance.getSnapshot()).toEqual({ count: 2 })

- [ ] **Step 2: Verify RED**

    pnpm exec vitest run tests/client/vendor-store.client.spec.ts

Expected: failure because vendor/store.ts does not exist.

- [ ] **Step 3: Implement the minimum structural store**

Export StoreSpec, EngineStoreInstance, EngineStoreHandle, and defineStore. The handle exposes spec and create(scopeKey?). Instances expose getSnapshot, subscribe, baked actions, and clearPersisted.

Implementation rules:

- structuredClone before each draft mutation;
- publish the snapshot only after the mutator returns;
- notify a snapshot copy of subscribers synchronously;
- persist JSON after successful actions;
- catch storage read/write/remove failures;
- append .scopeKey to a persisted key;
- add no Zustand, Immer, or other dependency.

- [ ] **Step 4: Switch the Workspace store import**

Use:

    import { defineStore, type EngineStoreHandle } from '../vendor/store.ts'

Keep createWorkspaceViewStore and dsh.workspace.view.v5 unchanged.

- [ ] **Step 5: Verify and commit**

    pnpm exec vitest run tests/client/vendor-store.client.spec.ts tests/client/upstream
    pnpm run typecheck
    git diff --check
    git add src/client/vendor/store.ts src/client/upstream/stores.ts tests/client/vendor-store.client.spec.ts UPSTREAM.md
    git commit -m "build: own the client store runtime"

Document which structural behaviors were retained and which unused generic middleware was omitted.

---

### Task 3: Verify the self-contained ModuleLoader artifact

**Files:**

- Modify: tsdown.config.mjs
- Modify: vitest.config.mjs
- Modify: tests/client/module-loader.client.spec.ts
- Create: tests/integration/client-bundle.spec.mjs
- Modify: package.json

**Interfaces:**

- Consumes: local client code plus Host react, react/jsx-runtime, and react-dom.
- Produces: client.js with the dsh-multiroot-workspace handoff and no DSH client JavaScript imports.

- [ ] **Step 1: Extend the bundle-policy test and verify RED**

Scan src/client and reject non-type imports from:

    @deepseek-ai/dsh-client-runtime/client
    @deepseek-ai/dsh-client-ui-primitives

The rc.6 Vitest adapter may convert handoff factories to ESM and remove an invalid source-map trailer. It must not generate or replace CSS exports.

    pnpm exec vitest run tests/client/module-loader.client.spec.ts

Expected: failure until the remaining runtime import is removed and the policy assertion is active.

- [ ] **Step 2: Narrow production externals**

Set:

    deps: {
      neverBundle: [/^react(?:-dom)?(?:\/.+)?$/],
      alwaysBundle: ['clsx'],
      onlyBundle: false,
    }

Type-only DSH imports erase. Any DSH client JavaScript import in client.js is a failure.

- [ ] **Step 3: Add the final-artifact integration test**

Build and execute client.js with a fake ModuleLoader. Assert:

    assert.equal(handoff.id, 'dsh-multiroot-workspace')
    assert.equal(typeof handoff.factory, 'function')
    assert.equal(typeof plugin.apply, 'function')
    assert.ok(Array.isArray(plugin.inject))
    assert.deepEqual([...requiredModules].sort(), ['react', 'react-dom', 'react/jsx-runtime'])
    assert.ok(injectedStyles.some(css => css.includes('danger')))

Supply minimal fake React/ReactDOM exports, capture document.head style tags, and reject every other require specifier.

- [ ] **Step 4: Add and run the artifact command**

Add:

    "test:client-bundle": "node tests/integration/client-bundle.spec.mjs"

Run:

    pnpm exec vitest run tests/client
    pnpm run test:client-bundle
    pnpm run typecheck
    pnpm run build

Expected: all pass and only the three allowed Host modules are requested.

- [ ] **Step 5: Verify and commit**

    ! rg "Menu_module_css_default|cssExports.*danger|danger.*cssExports" vitest.config.mjs tests/client/module-loader.client.spec.ts
    ! rg "from ['\"]@deepseek-ai/dsh-client-(runtime/client|ui-primitives)['\"]" src/client
    git diff --check
    git add tsdown.config.mjs vitest.config.mjs tests/client/module-loader.client.spec.ts tests/integration/client-bundle.spec.mjs package.json
    git commit -m "build: make the client bundle self-contained"

---

### Task 4: Complete physical independence

**Files:**

- Modify: tsconfig.json
- Modify: vitest.config.mjs
- Create/Modify: tests/client/common-locale.ts
- Modify: affected tests/client specs
- Modify: package.json
- Modify: pnpm-lock.yaml
- Modify: docs/superpowers/plans/2026-08-15-release-readiness.md

**Interfaces:**

- Consumes: Tasks 1-3 and the existing uncommitted parent-path removal.
- Produces: the original release-readiness Task 4 completion and a repository reproducible outside the Harness checkout.

- [ ] **Step 1: Finish parent-path removal**

Verify all four facts:

    tsconfig.json has no ../../../packages mapping
    vitest.config.mjs has no vite-tsconfig-paths or ../../../packages alias
    tests use tests/client/common-locale.ts
    package.json and pnpm-lock.yaml omit vite-tsconfig-paths

Keep the test-only rc.6 ModuleLoader adapter, limited to faithful handoff conversion and invalid source-map trailer removal.

- [ ] **Step 2: Run full local verification**

    pnpm install --frozen-lockfile
    pnpm run typecheck
    pnpm run test
    pnpm run build
    pnpm run test:client-bundle

Expected: all pass without reading the Harness checkout.

- [ ] **Step 3: Prove clean physical independence**

Archive tracked files plus current Task 4 changes, extract under mktemp -d outside /Users/yang/Desktop/projects, then run:

    pnpm install --frozen-lockfile
    pnpm run typecheck
    pnpm run test
    pnpm run build
    pnpm run test:client-bundle
    pnpm pack --pack-destination .artifacts

Expected: all pass. The tarball includes prebuilt client.js and excludes src, tests, absolute paths, and Harness files.

- [ ] **Step 4: Update the parent release plan**

Record that its Task 4 implementation is superseded by the approved self-contained-client design while preserving the original physical-independence acceptance criteria.

- [ ] **Step 5: Verify and commit**

    ! rg "\.\./\.\./\.\./packages|dsh-client-locale/src|vite-tsconfig-paths" tsconfig.json vitest.config.mjs package.json tests
    git diff --check
    git add tsconfig.json vitest.config.mjs tests/client package.json pnpm-lock.yaml docs/superpowers/plans/2026-08-15-release-readiness.md
    git commit -m "build: remove harness checkout dependencies"

After this commit, resume release readiness at Tasks 1, 2, 3, 5, 6, 7, and 8.

