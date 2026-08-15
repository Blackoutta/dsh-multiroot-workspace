# Multiroot Dialog Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved scrollable field-card layout for the multiroot management dialog without changing its behavior.

**Architecture:** Keep `MultirootDialog` and the Harness `Modal` primitive as the only components. Add semantic wrappers and CSS Module classes for the dialog frame, fixed form regions, scrollable roots, labeled root fields, and radio-style primary action. Reuse existing Button and theme tokens; add no dependency or abstraction.

**Tech Stack:** React 18, TypeScript, CSS Modules, Harness UI primitives, Vitest, Testing Library, Playwright.

---

### Task 1: Pin the approved structure with failing component tests

**Files:**
- Modify: `tests/client/multiroot-dialogs.client.spec.tsx`
- Create: `tests/client/multiroot-dialog-styles.client.spec.ts`

- [ ] **Step 1: Add a management-dialog test with long aliases and paths**

Render a five-root `MultirootWorkspaceRecord`, then assert the named `根目录` region, all complete aliases and paths, the `当前主根` text, and each `设为主根` button. Assert that the path is rendered as selectable text rather than a truncated input value:

```tsx
expect(screen.getByRole('region', { name: '根目录' })).toBeTruthy()
expect(screen.getByText('/Users/yang/Desktop/projects/dify-log-consumer')).toBeTruthy()
expect(screen.getByText('当前主根')).toBeTruthy()
expect(screen.getByRole('button', { name: '设“dify-log-consumer”为主根' })).toBeTruthy()
```

- [ ] **Step 2: Add the failing CSS contract test**

Add a CSS contract test that reads `Dialogs.module.css` and asserts the declarations that prevent the reported regression:

```ts
expect(declarations('.dialog')?.get('width')).toBe('min(760px, 100%)')
expect(declarations('.rootScroller')?.get('overflow-y')).toBe('auto')
expect(declarations('.rootScroller')?.get('overscroll-behavior')).toBe('contain')
expect(declarations('.rootPath')?.get('overflow-wrap')).toBe('anywhere')
expect(declarations('.rootPath')?.get('text-overflow')).toBeUndefined()
```

- [ ] **Step 3: Run both focused tests and verify RED**

Run: `pnpm exec vitest run --config vitest.config.mjs tests/client/multiroot-dialogs.client.spec.tsx tests/client/multiroot-dialog-styles.client.spec.ts`

Expected: FAIL because the root-list region, `当前主根` copy, dialog width, and root scroller do not exist.

### Task 2: Implement the fixed-frame, scrollable field-card layout

**Files:**
- Modify: `src/client/multiroot/Dialogs.tsx`
- Modify: `src/client/multiroot/Dialogs.module.css`
- Modify: `src/client/upstream/locales.ts`
- Test: `tests/client/multiroot-dialogs.client.spec.tsx`

- [ ] **Step 1: Give the Modal and root list explicit layout classes**

Pass `className={css.dialog}` and `contentClassName={css.dialogContent}` to `Modal`. Keep the Workspace name fixed above a labeled scroll region and move Add folder below it:

```tsx
<div className={css.rootList} role="region" aria-label={t('multiroot.roots')}>
  <div className={css.rootListHeader}>
    <span>{t('multiroot.roots')}</span>
    <span>{t('multiroot.rootCount', { count: roots.length })}</span>
  </div>
  <div className={css.rootScroller}>{roots.map((root, index) => (
    <div className={css.rootRow} key={`${root.path}:${index}`}>
      <div className={css.rootFields}>
        <label className={css.field}>{t('multiroot.directoryName')}<input className={css.input} value={root.alias} /></label>
        <div className={css.field}>{t('multiroot.directoryPath')}<span className={css.rootPath}>{root.path}</span></div>
      </div>
    </div>
  ))}</div>
</div>
```

- [ ] **Step 2: Render each root as two labeled fields and a compact action row**

Retain the alias input and path text, but add visible labels and the approved role copy:

```tsx
<div className={css.rootFields}>
  <label className={css.field}>{t('multiroot.directoryName')}<input className={css.input} /></label>
  <div className={css.field}>{t('multiroot.directoryPath')}<span className={css.rootPath}>{root.path}</span></div>
</div>
<div className={css.rootActions}>
  {root.primary ? <span className={css.primary}><span className={css.radioSelected} />{t('multiroot.currentPrimary')}</span> : <Button variant="ghost">{t('multiroot.makePrimary', { name: root.alias })}</Button>}
  <Button variant="ghost">{t('multiroot.remove')}</Button>
</div>
```

- [ ] **Step 3: Apply the approved sizing and responsive CSS**

Use a 760-pixel desktop cap, viewport height cap, scroll containment, complete path wrapping, two desktop columns, and one narrow column:

```css
.dialog { width: min(760px, 100%); max-height: calc(100dvh - 48px); }
.rootScroller { max-height: clamp(160px, calc(100dvh - 390px), 390px); overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.rootFields { display: grid; grid-template-columns: minmax(180px, .7fr) minmax(260px, 1.3fr); gap: 12px; }
.rootPath { overflow-wrap: anywhere; user-select: text; }
@media (max-width: 680px) { .rootFields { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm exec vitest run --config vitest.config.mjs tests/client/multiroot-dialogs.client.spec.tsx`

Expected: both dialog tests pass.

### Task 3: Pin layout CSS and update consumer documentation

**Files:**
- Modify: `README.md`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Document the dialog behavior and bump the test package version**

Update `README.md` to state that the management dialog preserves complete aliases and paths while only its roots scroll. Change the package version from `0.1.0` to `0.1.1` and update the lockfile with `pnpm install --lockfile-only --ignore-workspace` so pnpm treats the desktop tarball as a new package identity.

- [ ] **Step 2: Run unit, type, and production-build verification**

Run:

```bash
pnpm run test
pnpm run typecheck
pnpm run build
git diff --check
```

Expected: all tests pass, typecheck exits zero, build emits `dist/index.cjs` and copies `client.js`, and the diff check reports nothing.

### Task 4: Verify the real UI and package the extension

**Files:**
- Modify: `tests/browser/multiroot-ui.spec.mjs`
- Generated: `client.js`
- Generated: `dist/index.cjs`
- Output: `/Users/yang/Desktop/dsh-multiroot-workspace-0.1.1.tgz`

- [ ] **Step 1: Extend the browser regression with five roots and layout assertions**

Create five temporary roots through the existing API fixture. Open Manage, then assert the root-list region scrolls while its bounding box remains within the dialog, every full path is present, and a narrow viewport stacks the root fields.

```js
const rootRegion = page.getByRole('region', { name: '根目录' })
const geometry = await rootRegion.evaluate(element => ({
  clientHeight: element.clientHeight,
  scrollHeight: element.scrollHeight,
  bottom: element.getBoundingClientRect().bottom,
}))
assert.equal(geometry.scrollHeight > geometry.clientHeight, true)
assert.equal(geometry.bottom < 720, true)
for (const rootPath of rootPaths) {
  assert.equal(await page.getByText(rootPath, { exact: true }).count(), 1)
}
```

- [ ] **Step 2: Run the real browser regression against an isolated web profile**

Run:

```bash
layout_test_home=$(mktemp -d /private/tmp/dsh-mr-layout.XXXXXX)
DSH_HOME="$layout_test_home" pnpm dsh plugin --profile web add /Users/yang/Desktop/projects/deepseek-harness/tmp/logical-workspace/dsh-multiroot-workspace
DSH_HOME="$layout_test_home" pnpm dsh web --port 3090
DSH_WEB_URL=http://127.0.0.1:3090 pnpm run test:browser
```

Expected: the Playwright script exits zero with no page errors.

- [ ] **Step 3: Commit the implementation**

```bash
git add README.md package.json pnpm-lock.yaml src/client/multiroot/Dialogs.tsx src/client/multiroot/Dialogs.module.css src/client/upstream/locales.ts tests/client/multiroot-dialogs.client.spec.tsx tests/client/multiroot-dialog-styles.client.spec.ts tests/browser/multiroot-ui.spec.mjs client.js dist/index.cjs
git commit -m "fix: improve multiroot dialog layout"
```

- [ ] **Step 4: Pack and verify the desktop artifact**

Run `npm_config_ignore_scripts=true pnpm pack --ignore-workspace --out /Users/yang/Desktop/dsh-multiroot-workspace-0.1.1.tgz`, then verify it with `gzip -t`, `tar -tzf`, and SHA-256. Confirm both the extension repository and Harness parent repository have empty `git status --short` output.
