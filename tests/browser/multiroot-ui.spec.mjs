import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.DSH_WEB_URL ?? 'http://127.0.0.1:3090'
const fixtureDir = await mkdtemp(path.join(tmpdir(), 'dsh-multiroot-ui-'))
const aliases = ['app', 'docs', 'packages', 'integration-fixtures', 'reference-materials']
const rootDirs = aliases.map(alias => path.join(fixtureDir, alias, 'nested', 'workspace-root'))
const title = `浏览器回归-${Date.now()}`
let workspaceId
let browser

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
  await Promise.all(rootDirs.map(rootDir => mkdir(rootDir, { recursive: true })))
  const record = await api('/workspaces', {
    method: 'POST',
    body: JSON.stringify({
      title,
      roots: rootDirs.map((rootPath, index) => ({
        alias: aliases[index],
        path: rootPath,
        primary: index === 0,
      })),
    }),
  })
  workspaceId = record.id
  const storedRootPaths = record.roots.map(root => root.path)

  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', error => { pageErrors.push(error.message) })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })

  const continueButton = page.getByRole('button', { name: '继续', exact: true })
  if (await continueButton.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false)) {
    await continueButton.click()
  }
  const configureLaterButton = page.getByRole('button', { name: '稍后配置', exact: true })
  if (await configureLaterButton.waitFor({ state: 'visible', timeout: 2_000 }).then(() => true).catch(() => false)) {
    await configureLaterButton.click()
  }

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
  await rowTitle.hover()
  await page.getByRole('button', { name: `工作区“${title}”的操作` }).click()
  await page.getByRole('menuitem', { name: '管理多根工作区' }).click()
  const heading = page.getByRole('heading', { name: '管理多根工作区' })
  await heading.waitFor()
  const rootRegion = page.getByRole('region', { name: '根目录' })
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
  const lastPath = page.getByText(storedRootPaths.at(-1), { exact: true })
  await lastPath.scrollIntoViewIfNeeded()
  const [regionBox, pathBox] = await Promise.all([rootRegion.boundingBox(), lastPath.boundingBox()])
  assert.ok(regionBox !== null && pathBox !== null)
  assert.ok(pathBox.y >= regionBox.y && pathBox.y + pathBox.height <= regionBox.y + regionBox.height)
  assert.equal(await page.getByText('当前主根', { exact: true }).count(), 1)
  assert.equal(await page.getByRole('button', { name: '添加文件夹…' }).isVisible(), true)
  assert.equal(await page.getByRole('button', { name: '保存', exact: true }).isVisible(), true)
  assert.deepEqual(pageErrors, [])
} finally {
  await browser?.close()
  if (workspaceId !== undefined) {
    await api(`/workspaces/${encodeURIComponent(workspaceId)}`, { method: 'DELETE' })
  }
  await rm(fixtureDir, { recursive: true, force: true })
}
