import assert from 'node:assert/strict'
import { mkdir, mkdtemp, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright'
import { startProfile } from './profile-fixture.mjs'

const screenshotDir = path.join(import.meta.dirname, 'screenshots')
const screenshotDisplayRoot = '/tmp/dsh-multiroot-browser-fixture'
const aliases = ['app', 'docs', 'packages', 'integration-fixtures', 'reference-materials']
const title = '浏览器验收工作区'
const renamedTitle = '浏览器验收工作区-已重命名'
const sessionTitles = ['会话验收一', '会话验收二', '会话验收三', '会话验收四', '会话验收五', '会话验收六', '会话验收七']
let fixtureDir
let canonicalFixtureDir
let rootDirs = []
let profile
let baseUrl
let workspaceId
let browser

const themeColors = {
  light: {
    bodyBackground: 'rgb(255, 255, 255)',
    bodyColor: 'rgb(15, 17, 21)',
    controlColor: 'rgb(97, 102, 107)',
    titleColor: 'rgb(129, 133, 140)',
  },
  dark: {
    bodyBackground: 'rgb(21, 21, 23)',
    bodyColor: 'rgb(249, 250, 251)',
    controlColor: 'rgb(207, 211, 214)',
    titleColor: 'rgb(173, 178, 184)',
  },
}

async function setTheme(page, theme) {
  await page.getByRole('button', { name: '设置', exact: true }).click()
  await page.getByRole('button', { name: theme === 'light' ? '浅色' : '深色', exact: true }).click()
  await page.getByRole('button', { name: '关闭', exact: true }).click()
}

async function captureScreenshot(page, name, expectedPathPrefix) {
  const prefixes = [fixtureDir, canonicalFixtureDir].filter((prefix, index, all) => (
    prefix !== undefined && all.indexOf(prefix) === index
  )).sort((left, right) => right.length - left.length)
  const matchedPrefixes = await page.evaluate(({ displayRoot, prefixes }) => {
    const changes = []
    const matched = new Set()
    const normalized = (value) => {
      let result = value
      for (const prefix of prefixes) {
        if (!result.includes(prefix)) continue
        matched.add(prefix)
        result = result.replaceAll(prefix, displayRoot)
      }
      return result
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const before = node.nodeValue ?? ''
      const after = normalized(before)
      if (after === before) continue
      changes.push({ kind: 'text', node, value: before })
      node.nodeValue = after
    }
    for (const control of document.querySelectorAll('input, textarea')) {
      const before = control.value
      const after = normalized(before)
      if (after === before) continue
      changes.push({ kind: 'value', node: control, value: before })
      control.value = after
    }
    window.__dshMultirootScreenshotChanges = changes
    return [...matched]
  }, { displayRoot: screenshotDisplayRoot, prefixes })
  try {
    if (expectedPathPrefix !== undefined) {
      assert.ok(matchedPrefixes.includes(expectedPathPrefix), `${name} did not normalize ${expectedPathPrefix}`)
    }
    await page.screenshot({
      path: path.join(screenshotDir, name),
      animations: 'disabled',
      caret: 'hide',
    })
  } finally {
    await page.evaluate(() => {
      const changes = window.__dshMultirootScreenshotChanges ?? []
      for (const change of changes) {
        if (change.kind === 'text') change.node.nodeValue = change.value
        else change.node.value = change.value
      }
      delete window.__dshMultirootScreenshotChanges
    })
  }
}

async function pickDirectory(page, rootPath) {
  await page.getByRole('button', { name: '添加文件夹…', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '选择工作区目录' })
  await dialog.waitFor({ state: 'visible', timeout: 10_000 })
  await dialog.getByRole('button', { name: '编辑路径', exact: true }).click()
  const pathInput = dialog.getByRole('textbox', { name: '编辑路径', exact: true })
  await pathInput.fill(rootPath)
  await pathInput.press('Enter')
  await dialog.getByRole('button', { name: '打开', exact: true }).click()
  await dialog.waitFor({ state: 'hidden', timeout: 10_000 })
}

async function fillCreateDialog(page, createDialog) {
  await createDialog.getByRole('textbox', { name: '工作区名称', exact: true }).fill(title)
  for (const rootDir of rootDirs) await pickDirectory(page, rootDir)
  for (const [index, alias] of aliases.entries()) {
    await createDialog.getByRole('textbox', { name: `根 ${index + 1} 的别名`, exact: true }).fill(alias)
  }
}

async function createNamedSession(page, sessionTree, workspaceTitle, sessionTitle) {
  const workspaceRow = sessionTree.getByRole('treeitem').filter({ hasText: workspaceTitle }).first()
  await workspaceRow.hover()
  await page.getByRole('button', { name: `在“${workspaceTitle}”中新建会话`, exact: true }).click()
  await sessionTree.locator('[role="treeitem"][aria-selected="true"]')
    .getByText('新会话', { exact: true }).waitFor()
  await page.getByText('探索未至之境', { exact: true }).waitFor()
  const composer = page.locator('textarea:visible')
  await composer.waitFor({ state: 'visible', timeout: 10_000 })
  const send = page.getByRole('button', { name: '发送消息', exact: true })
  const deadline = Date.now() + 10_000
  let submitted = false
  let lastComposerState
  while (Date.now() < deadline) {
    await composer.fill(sessionTitle)
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    lastComposerState = await composer.evaluate((textarea) => ({
      value: textarea.value,
      placeholder: textarea.placeholder,
      disabled: textarea.disabled,
      readOnly: textarea.readOnly,
    }))
    lastComposerState.sendDisabled = await send.isDisabled()
    if (lastComposerState.value !== sessionTitle || lastComposerState.sendDisabled) continue
    await send.click()
    submitted = true
    break
  }
  assert.equal(submitted, true, `composer did not submit ${sessionTitle}: ${JSON.stringify(lastComposerState)}`)
  await sessionTree.getByText(sessionTitle, { exact: true }).waitFor({ timeout: 10_000 })
  const configureLater = page.getByRole('button', { name: '稍后配置', exact: true })
  if (await configureLater.isVisible()) await configureLater.click()
  const stopButton = page.getByRole('button', { name: '停止生成', exact: true })
  if (await stopButton.isVisible()) await stopButton.click()
}

async function forkAndRenameSession(page, sessionTree, sourceTitle, targetTitle) {
  const sourceRow = sessionTree.getByRole('treeitem').filter({ hasText: sourceTitle }).first()
  await sourceRow.hover()
  await sourceRow.getByRole('button', { name: `会话“${sourceTitle}”的操作`, exact: true }).click()
  await page.getByRole('menuitem', { name: '分叉会话', exact: true }).click()
  await page.waitForFunction((previousTitle) => {
    const selected = document.querySelector('[role="tree"][aria-label="会话"] [role="treeitem"][aria-selected="true"]')
    const action = selected?.querySelector('button[aria-label^="会话“"]')
    return action !== null && action?.getAttribute('aria-label') !== `会话“${previousTitle}”的操作`
  }, sourceTitle)
  const selectedRow = sessionTree.locator('[role="treeitem"][aria-selected="true"]')
  const selectedAction = selectedRow.locator('button[aria-label^="会话“"]')
  await selectedRow.hover()
  await selectedAction.click()
  await page.getByRole('menuitem', { name: '重命名', exact: true }).click()
  const renameDialog = page.getByRole('dialog', { name: '重命名会话' })
  await renameDialog.getByRole('textbox', { name: '会话名称', exact: true }).fill(targetTitle)
  await renameDialog.getByRole('button', { name: '重命名', exact: true }).click()
  await renameDialog.waitFor({ state: 'hidden' })
  await sessionTree.getByText(targetTitle, { exact: true }).waitFor()
}

async function assertWideLayout(page, theme) {
  const expected = themeColors[theme]
  const facts = await page.getByText('工作区', { exact: true }).evaluate((title) => {
    const header = title.parentElement
    const controls = ['搜索会话', '视图选项', '添加工作区', '添加多根工作区'].map((label) => {
      const element = document.querySelector(`button[aria-label="${label}"]`)
      return { label, rect: element?.getBoundingClientRect().toJSON(), color: element === null ? null : getComputedStyle(element).color }
    })
    return {
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      bodyColor: getComputedStyle(document.body).color,
      controls,
      documentWidth: [document.documentElement.clientWidth, document.documentElement.scrollWidth],
      header: header?.getBoundingClientRect().toJSON(),
      title: title.getBoundingClientRect().toJSON(),
      titleColor: getComputedStyle(title).color,
    }
  })
  assert.equal(facts.bodyBackground, expected.bodyBackground)
  assert.equal(facts.bodyColor, expected.bodyColor)
  assert.deepEqual(facts.documentWidth, [1280, 1280])
  assert.equal(facts.header?.height, 36)
  assert.ok(facts.title.width >= 40, JSON.stringify(facts.title))
  assert.ok(facts.header !== undefined && facts.title.right <= facts.header.right, JSON.stringify(facts))
  assert.equal(facts.titleColor, expected.titleColor)
  for (const control of facts.controls) {
    assert.equal(control.rect?.width, 28, control.label)
    assert.equal(control.rect?.height, 28, control.label)
    assert.equal(control.color, expected.controlColor, control.label)
  }
}

async function assertRailLayout(page, theme) {
  const expected = themeColors[theme]
  const facts = await page.evaluate(() => ({
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    controls: ['打开侧边栏', '新建会话', '添加工作区', '添加多根工作区', '搜索会话'].map((label) => {
      const element = document.querySelector(`button[aria-label="${label}"]`)
      return { label, rect: element?.getBoundingClientRect().toJSON(), color: element === null ? null : getComputedStyle(element).color }
    }),
    documentWidth: [document.documentElement.clientWidth, document.documentElement.scrollWidth],
  }))
  assert.equal(facts.bodyBackground, expected.bodyBackground)
  assert.equal(facts.bodyColor, expected.bodyColor)
  assert.deepEqual(facts.documentWidth, [1280, 1280])
  assert.equal(await page.getByText('工作区', { exact: true }).count(), 0)
  for (const control of facts.controls) {
    assert.equal(control.rect?.width, 36, control.label)
    assert.equal(control.rect?.height, 36, control.label)
    assert.equal(control.color, expected.bodyColor, control.label)
  }
}

async function api(route, init = {}) {
  const response = await fetch(`${baseUrl}/plugins/multiroot/api${route}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers },
  })
  const body = await response.json()
  assert.equal(response.ok, true, `${init.method ?? 'GET'} ${route}: ${JSON.stringify(body)}`)
  assert.equal(body.ok, true, `${init.method ?? 'GET'} ${route}: ${JSON.stringify(body)}`)
  return body.value
}

try {
  // Exclusive roots prevent concurrent runs from deleting one another. Screenshot
  // binaries stay local because this random prefix appears in absolute paths;
  // titles, aliases, and the path suffixes under the prefix remain stable.
  fixtureDir = await mkdtemp(path.join(tmpdir(), 'dsh-multiroot-browser-fixture-'))
  canonicalFixtureDir = await realpath(fixtureDir)
  rootDirs = aliases.map(alias => path.join(fixtureDir, alias, 'nested', 'workspace-root'))
  await Promise.all(rootDirs.map(rootDir => mkdir(rootDir, { recursive: true })))
  await mkdir(screenshotDir, { recursive: true })
  profile = await startProfile()
  baseUrl = profile.baseUrl
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  const pageErrors = []
  const consoleErrors = []
  const failedRequests = []
  const dialogs = []
  const pluginBundles = []
  page.on('pageerror', error => { pageErrors.push(error.message) })
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  page.on('requestfailed', request => { failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`) })
  page.on('dialog', (dialog) => { dialogs.push(`${dialog.type()}: ${dialog.message()}`); void dialog.dismiss() })
  page.on('response', (response) => {
    if (response.url().includes('/plugins/dsh-multiroot-workspace/client.js?')) {
      pluginBundles.push({ status: response.status(), contentType: response.headers()['content-type'] })
    }
  })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })

  const continueButton = page.getByRole('button', { name: '继续', exact: true })
  if (await continueButton.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false)) {
    await continueButton.click()
  }
  const configureLaterButton = page.getByRole('button', { name: '稍后配置', exact: true })
  if (await configureLaterButton.waitFor({ state: 'visible', timeout: 2_000 }).then(() => true).catch(() => false)) {
    await configureLaterButton.click()
  }

  const createDialog = page.getByRole('dialog', { name: '添加多根工作区' })
  await setTheme(page, 'light')
  await page.getByRole('button', { name: '添加多根工作区', exact: true }).click()
  await fillCreateDialog(page, createDialog)
  await createDialog.getByText(rootDirs.at(-1), { exact: true }).waitFor()
  await captureScreenshot(page, 'light-create.png', fixtureDir)
  await createDialog.getByRole('button', { name: '关闭', exact: true }).click()
  await setTheme(page, 'dark')
  await page.getByRole('button', { name: '添加多根工作区', exact: true }).click()
  await fillCreateDialog(page, createDialog)
  await createDialog.getByText(rootDirs.at(-1), { exact: true }).waitFor()
  await captureScreenshot(page, 'dark-create.png', fixtureDir)

  await page.route('**/plugins/multiroot/api/workspaces', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: { message: '注入的一次性创建失败' } }),
    })
  }, { times: 1 })
  await createDialog.getByRole('button', { name: '创建', exact: true }).click()
  await createDialog.getByText('注入的一次性创建失败', { exact: true }).waitFor()
  assert.equal(await createDialog.getByRole('textbox', { name: '工作区名称', exact: true }).inputValue(), title)
  for (const [index, alias] of aliases.entries()) {
    assert.equal(await createDialog.getByRole('textbox', { name: `根 ${index + 1} 的别名`, exact: true }).inputValue(), alias)
    assert.equal(await createDialog.getByText(rootDirs[index], { exact: true }).count(), 1)
  }
  await createDialog.getByRole('button', { name: '创建', exact: true }).click()
  await createDialog.waitFor({ state: 'hidden', timeout: 10_000 })

  const [record] = await api('/workspaces')
  assert.ok(record !== undefined)
  workspaceId = record.id
  const storedRootPaths = record.roots.map(root => root.path)

  const sessionTree = page.getByRole('tree', { name: '会话' })
  await sessionTree.getByText(title, { exact: true }).waitFor()
  await page.getByText('5 个根 · 主根 app', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: '添加多根工作区' }).isVisible(), true)

  await page.getByRole('button', { name: '视图选项' }).click()
  await page.getByRole('menuitem', { name: '全部会话' }).click()
  await sessionTree.waitFor()
  assert.equal(await sessionTree.getByText(title, { exact: true }).count(), 0)

  await page.getByRole('button', { name: '视图选项' }).click()
  await page.getByRole('menuitem', { name: '按工作区' }).click()
  const rowTitle = sessionTree.getByText(title, { exact: true })
  await rowTitle.waitFor()
  await setTheme(page, 'light')
  await rowTitle.hover()
  await page.getByRole('button', { name: `工作区“${title}”的操作` }).click()
  await page.getByRole('menuitem', { name: '管理多根工作区' }).click()
  const heading = page.getByRole('heading', { name: '管理多根工作区' })
  const rootRegion = page.getByRole('region', { name: '根目录' })
  const lastPath = page.getByText(storedRootPaths.at(-1), { exact: true })
  await heading.waitFor()
  await lastPath.waitFor()
  await captureScreenshot(page, 'light-manage.png', canonicalFixtureDir)
  await page.getByRole('button', { name: '关闭', exact: true }).click()
  await setTheme(page, 'dark')
  await rowTitle.hover()
  await page.getByRole('button', { name: `工作区“${title}”的操作` }).click()
  await page.getByRole('menuitem', { name: '管理多根工作区' }).click()
  await heading.waitFor()
  await lastPath.waitFor()
  await captureScreenshot(page, 'dark-manage.png', canonicalFixtureDir)
  const geometry = await rootRegion.evaluate(element => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    dialog: element.closest('[role="dialog"]')?.getBoundingClientRect().toJSON(),
  }))
  assert.ok(geometry.scrollHeight > geometry.clientHeight, JSON.stringify(geometry))
  assert.ok(geometry.dialog !== undefined)
  assert.ok(geometry.dialog.top >= 0, JSON.stringify(geometry.dialog))
  assert.ok(geometry.dialog.bottom <= 720, JSON.stringify(geometry.dialog))

  await rootRegion.evaluate(element => { element.scrollTop = element.scrollHeight })
  await lastPath.scrollIntoViewIfNeeded()
  const [regionBox, pathBox] = await Promise.all([rootRegion.boundingBox(), lastPath.boundingBox()])
  assert.ok(regionBox !== null && pathBox !== null)
  assert.ok(pathBox.y >= regionBox.y && pathBox.y + pathBox.height <= regionBox.y + regionBox.height)
  assert.equal(await page.getByText('当前主根', { exact: true }).count(), 1)
  assert.equal(await page.getByRole('button', { name: '添加文件夹…' }).isVisible(), true)
  assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isVisible(), true)
  await page.getByRole('textbox', { name: '工作区名称', exact: true }).fill(renamedTitle)
  await page.getByRole('button', { name: '设“docs”为主根', exact: true }).click()
  const lastAliasInput = page.getByRole('textbox', { name: '根 5 的别名', exact: true })
  const lastRootRow = rootRegion.locator('div').filter({ has: lastAliasInput }).first()
  await lastRootRow.getByRole('button', { name: '移除', exact: true }).click()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await heading.waitFor({ state: 'hidden', timeout: 10_000 })
  await sessionTree.getByText(renamedTitle, { exact: true }).waitFor()
  await page.getByText('4 个根 · 主根 docs', { exact: true }).waitFor()
  const updated = await api(`/workspaces/${encodeURIComponent(workspaceId)}`)
  assert.equal(updated.title, renamedTitle)
  assert.equal(updated.roots.length, 4)
  assert.equal(updated.roots.find(root => root.primary)?.alias, 'docs')
  assert.equal(updated.roots.some(root => root.path === storedRootPaths.at(-1)), false)

  await createNamedSession(page, sessionTree, renamedTitle, sessionTitles[0])
  for (let index = 1; index < sessionTitles.length; index += 1) {
    await forkAndRenameSession(page, sessionTree, sessionTitles[index - 1], sessionTitles[index])
  }
  for (const theme of ['light', 'dark']) {
    await setTheme(page, theme)
    await assertWideLayout(page, theme)
    assert.equal(await sessionTree.getByText(renamedTitle, { exact: true }).count(), 1)
    assert.equal(await sessionTree.getByText(sessionTitles.at(-1), { exact: true }).count(), 1)
    await captureScreenshot(page, `${theme}-wide.png`)
    await page.getByRole('button', { name: '收起侧边栏', exact: true }).click()
    await page.waitForTimeout(350)
    await assertRailLayout(page, theme)
    await captureScreenshot(page, `${theme}-rail.png`)
    await page.getByRole('button', { name: '打开侧边栏', exact: true }).click()
    await page.waitForTimeout(350)
  }
  const overflow = page.getByRole('button', { name: '展开其余 2 个会话', exact: true })
  await overflow.waitFor()
  await overflow.click()
  for (const sessionTitle of sessionTitles) {
    assert.equal(await sessionTree.getByText(sessionTitle, { exact: true }).count(), 1)
  }
  await page.getByRole('button', { name: '收起', exact: true }).click()
  assert.equal(await sessionTree.getByText(sessionTitles[0], { exact: true }).count(), 0)

  const managedWorkspaceRow = sessionTree.getByRole('treeitem').filter({ hasText: renamedTitle }).first()
  await managedWorkspaceRow.click()
  for (const sessionTitle of sessionTitles) {
    assert.equal(await sessionTree.getByText(sessionTitle, { exact: true }).count(), 0)
  }
  await managedWorkspaceRow.click()
  await overflow.click()

  await page.getByRole('button', { name: '搜索会话', exact: true }).click()
  const searchResponsePromise = page.waitForResponse(response =>
    response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/session.search',
  )
  await page.getByRole('textbox', { name: '搜索会话…', exact: true }).fill(sessionTitles[2])
  const searchResponse = await searchResponsePromise
  assert.equal(searchResponse.status(), 200)
  await searchResponse.finished()
  const searchResults = page.getByRole('tree', { name: '搜索结果' })
  await searchResults.getByText(sessionTitles[2], { exact: true }).waitFor()
  for (const other of sessionTitles.filter(candidate => candidate !== sessionTitles[2])) {
    assert.equal(await searchResults.getByText(other, { exact: true }).count(), 0)
  }
  await page.getByRole('button', { name: '清除搜索', exact: true }).click()

  await page.getByRole('button', { name: '视图选项' }).click()
  await page.getByRole('menuitem', { name: '全部会话' }).click()
  for (const sessionTitle of sessionTitles) {
    assert.equal(await sessionTree.getByText(sessionTitle, { exact: true }).count(), 1)
  }
  assert.equal(await sessionTree.getByText(renamedTitle, { exact: true }).count(), 0)
  await page.getByRole('button', { name: '视图选项' }).click()
  await page.getByRole('menuitem', { name: '按工作区' }).click()

  await page.getByRole('button', { name: '新建会话', exact: true }).first().click()
  await page.getByText('探索未至之境', { exact: true }).waitFor()
  const delayedConfigureLater = page.getByRole('button', { name: '稍后配置', exact: true })
  if (await delayedConfigureLater.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false)) {
    await delayedConfigureLater.click()
    await delayedConfigureLater.waitFor({ state: 'hidden' })
  }
  for (const theme of ['light', 'dark']) {
    await setTheme(page, theme)
    await page.getByRole('button', { name: '选择工作区', exact: true }).click()
    await page.getByRole('menuitem', { name: renamedTitle, exact: true }).waitFor()
    await captureScreenshot(page, `${theme}-hero.png`)
    await page.keyboard.press('Escape')
  }
  await sessionTree.getByText(sessionTitles.at(-1), { exact: true }).click()

  await page.getByRole('button', { name: '视图选项' }).click()
  await page.getByRole('menuitem', { name: '最近更新' }).click()
  const updatedOverflow = page.getByRole('button', { name: /^展开其余 \d+ 个会话$/ })
  if (await updatedOverflow.isVisible()) await updatedOverflow.click()
  const updatedTitles = await sessionTree.locator('button[aria-label^="会话“"][aria-label$="”的操作"]')
    .evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')))
  assert.equal(updatedTitles[0], `会话“${sessionTitles.at(-1)}”的操作`)
  assert.equal(updatedTitles.at(-1), `会话“${sessionTitles[0]}”的操作`)
  await page.getByRole('button', { name: '视图选项' }).click()
  await page.getByRole('menuitem', { name: '手动排序' }).click()
  const manualOverflow = page.getByRole('button', { name: '展开其余 2 个会话', exact: true })
  if (await manualOverflow.isVisible()) await manualOverflow.click()
  const dragSource = sessionTree.getByRole('treeitem').filter({ hasText: sessionTitles.at(-1) }).first()
  const dragTarget = sessionTree.getByRole('treeitem').filter({ hasText: sessionTitles[0] }).first()
  await dragSource.dragTo(dragTarget, { targetPosition: { x: 8, y: 2 } })
  const orderedTitles = await sessionTree.locator('button[aria-label^="会话“"][aria-label$="”的操作"]')
    .evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')))
  const draggedLabel = `会话“${sessionTitles.at(-1)}”的操作`
  const targetLabel = `会话“${sessionTitles[0]}”的操作`
  assert.equal(orderedTitles[0], `会话“${sessionTitles[5]}”的操作`)
  assert.equal(orderedTitles.indexOf(draggedLabel) + 1, orderedTitles.indexOf(targetLabel))

  const archiveTitle = sessionTitles[1]
  const archiveRow = sessionTree.getByRole('treeitem').filter({ hasText: archiveTitle }).first()
  await archiveRow.hover()
  await archiveRow.getByRole('button', { name: `会话“${archiveTitle}”的操作`, exact: true }).click()
  await page.getByRole('menuitem', { name: '归档会话', exact: true }).click()
  await sessionTree.getByText(archiveTitle, { exact: true }).waitFor({ state: 'hidden' })

  const finalWorkspaceRow = sessionTree.getByRole('treeitem').filter({ hasText: renamedTitle }).first()
  await finalWorkspaceRow.hover()
  await finalWorkspaceRow.getByRole('button', { name: `工作区“${renamedTitle}”的操作`, exact: true }).click()
  await page.getByRole('menuitem', { name: '删除工作区', exact: true }).click()
  const deleteDialog = page.getByRole('dialog', { name: '删除工作区' })
  await deleteDialog.getByRole('button', { name: '删除工作区', exact: true }).click()
  await deleteDialog.waitFor({ state: 'hidden' })
  await sessionTree.getByText('未分组', { exact: true }).waitFor()
  await sessionTree.getByText(sessionTitles[0], { exact: true }).waitFor()
  workspaceId = undefined
  assert.deepEqual(pluginBundles, [{ status: 200, contentType: 'text/javascript; charset=utf-8' }])
  assert.deepEqual(pageErrors, [])
  assert.deepEqual(consoleErrors, [])
  assert.deepEqual(failedRequests, [])
  assert.deepEqual(dialogs, [])
} finally {
  try {
    await browser?.close()
  } finally {
    try {
      if (workspaceId !== undefined) {
        await api(`/workspaces/${encodeURIComponent(workspaceId)}`, { method: 'DELETE' })
      }
    } finally {
      try {
        if (fixtureDir !== undefined) await rm(fixtureDir, { recursive: true, force: true })
      } finally {
        await profile?.stop()
      }
    }
  }
}
