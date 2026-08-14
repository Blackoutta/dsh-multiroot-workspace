import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright'

const baseUrl = process.env.DSH_WEB_URL ?? 'http://127.0.0.1:3090'
const fixtureDir = await mkdtemp(path.join(tmpdir(), 'dsh-multiroot-ui-'))
const appDir = path.join(fixtureDir, 'app')
const docsDir = path.join(fixtureDir, 'docs')
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
  await Promise.all([mkdir(appDir), mkdir(docsDir)])
  const record = await api('/workspaces', {
    method: 'POST',
    body: JSON.stringify({
      title,
      roots: [
        { alias: 'app', path: appDir, primary: true },
        { alias: 'docs', path: docsDir, primary: false },
      ],
    }),
  })
  workspaceId = record.id

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  const pageErrors = []
  page.on('pageerror', error => { pageErrors.push(error.message) })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })

  const continueButton = page.getByRole('button', { name: '继续', exact: true })
  if (await continueButton.isVisible().catch(() => false)) await continueButton.click()
  const configureLaterButton = page.getByRole('button', { name: '稍后配置', exact: true })
  if (await configureLaterButton.isVisible().catch(() => false)) await configureLaterButton.click()

  await page.getByText(title, { exact: true }).waitFor()
  await page.getByText('2 个根 · 主根 app', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: '添加多根工作区' }).isVisible(), true)

  await page.getByRole('button', { name: '视图选项' }).click()
  await page.getByRole('menuitem', { name: '全部会话' }).click()
  await page.getByRole('tree', { name: '会话' }).waitFor()
  assert.equal(await page.getByText(title, { exact: true }).count(), 0)

  await page.getByRole('button', { name: '视图选项' }).click()
  await page.getByRole('menuitem', { name: '按工作区' }).click()
  const rowTitle = page.getByText(title, { exact: true })
  await rowTitle.waitFor()
  await rowTitle.hover()
  await page.getByRole('button', { name: `工作区“${title}”的操作` }).click()
  await page.getByRole('menuitem', { name: '管理多根工作区' }).click()
  await page.getByRole('heading', { name: '管理多根工作区' }).waitFor()
  assert.equal(await page.getByText(appDir, { exact: true }).isVisible(), true)
  assert.equal(await page.getByText(docsDir, { exact: true }).isVisible(), true)
  assert.deepEqual(pageErrors, [])
} finally {
  await browser?.close()
  if (workspaceId !== undefined) {
    await api(`/workspaces/${encodeURIComponent(workspaceId)}`, { method: 'DELETE' })
  }
  await rm(fixtureDir, { recursive: true, force: true })
}
