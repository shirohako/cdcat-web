import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { createMockAPI } from './mock-api.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const port = Number(process.env.ADMIN_TEST_PORT || 4318)
const apiPort = Number(process.env.ADMIN_TEST_API_PORT || 4319)
const baseURL = `http://127.0.0.1:${port}`
let api, app, browser, logPath, appLog
const errors = []
const contexts = []

before(async () => {
  logPath = join(await mkdtemp(join(tmpdir(), 'cdcat-admin-smoke-')), 'nuxt.log')
  appLog = createWriteStream(logPath)
  api = await createMockAPI(apiPort)
  app = spawn(process.execPath, ['node_modules/nuxt/bin/nuxt.mjs', 'dev', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root, detached: true,
    env: { ...process.env, NUXT_PUBLIC_API_BASE_URL: `http://127.0.0.1:${apiPort}`, NUXT_PUBLIC_BASE_URL: baseURL, NUXT_PUBLIC_AUTH_TOKEN: 'must-not-be-used' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  app.stdout.pipe(appLog)
  app.stderr.pipe(appLog)
  const deadline = Date.now() + 90000
  let ready = false
  while (Date.now() < deadline) {
    if (app.exitCode !== null) throw new Error(`Nuxt exited: ${await readFile(logPath, 'utf8')}`)
    try {
      ready = (await fetch(`${baseURL}/auth/login`, { signal: AbortSignal.timeout(5000) })).ok
    } catch { /* Retry while Nuxt compiles the first page. */ }
    if (ready) break
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  assert.ok(ready, `Nuxt did not start; see ${logPath}`)
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] })
}, { timeout: 120000 })

after(async () => {
  for (const context of contexts) await context.close()
  await browser?.close()
  if (app?.pid) {
    try { process.kill(-app.pid, 'SIGTERM') } catch { /* The child may have exited. */ }
  }
  appLog?.end()
  await api?.close()
})

beforeEach(() => {
  Object.assign(api.state, { revisionStatus: 'pending', role: 'member', revoked: false, meFailure: null, requests: [] })
  errors.length = 0
})

async function session(role, mobile = false) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } })
  contexts.push(context)
  if (role) await context.addCookies([{ name: 'auth_token', value: role, url: baseURL }])
  context.setDefaultTimeout(15000)
  context.setDefaultNavigationTimeout(15000)
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  return { context, page }
}

async function visit(page, path) {
  await page.goto(`${baseURL}${path}`)
  // Wait for hydration before clicking server-rendered controls.
  await page.waitForFunction(() => document.querySelector('#__nuxt')?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false)
  assert.deepEqual(errors, [])
}

test('anonymous admin visits require login and never send a public fallback token', async () => {
  const { page } = await session()
  await visit(page, '/admin/users')
  await page.waitForURL('**/auth/login?**')
  assert.ok(api.state.requests.every(request => !request.token))
  assert.deepEqual(errors, [])
})

test('contributors see the review module and can open and close mobile navigation', async () => {
  const { page } = await session('contributor', true)
  await visit(page, '/admin/users')
  await page.waitForURL('**/admin/revisions')
  await page.getByRole('heading', { name: '修改申请' }).waitFor()
  assert.equal(await page.locator('aside a[href="/admin/users"]').count(), 0)
  await page.getByRole('button', { name: '展开菜单' }).click()
  await page.waitForFunction(() => document.querySelector('aside').getBoundingClientRect().x === 0)
  await page.getByRole('button', { name: '关闭菜单', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('aside').getBoundingClientRect().right <= 0)
  assert.deepEqual(errors, [])
})

test('role assignment refreshes the row and closes the dialog', async () => {
  const { page } = await session('founder')
  await visit(page, '/admin/users')
  await page.getByRole('button', { name: '编辑角色' }).click()
  await page.locator('.fixed').getByText('contributor', { exact: true }).click()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.getByRole('heading', { name: '分配角色' }).waitFor({ state: 'hidden' })
  assert.equal(api.state.role, 'contributor')
  assert.ok(api.state.requests.some(request => request.path === '/v1/admin/users/2/role' && request.method === 'PUT'))
  assert.deepEqual(errors, [])
})

test('URL filters survive browser history and show empty and error states', async () => {
  const { page } = await session('founder')
  await visit(page, '/admin/users')
  await page.getByRole('searchbox').fill('empty')
  await page.getByRole('button', { name: '筛选条件', exact: true }).click()
  await page.waitForURL('**/admin/users?search=empty')
  await page.getByText('暂无记录', { exact: true }).waitFor()
  await page.getByRole('searchbox').fill('failure')
  await page.getByRole('button', { name: '筛选条件', exact: true }).click()
  await page.getByText('加载失败，请重试。', { exact: true }).waitFor()
  await page.goBack()
  await page.getByText('暂无记录', { exact: true }).waitFor()
  assert.equal(await page.getByRole('searchbox').inputValue(), 'empty')
  assert.deepEqual(errors, [])
})

test('pending totals refresh after rejection and the reason is mandatory', async () => {
  const { page } = await session('founder')
  await visit(page, '/admin/revisions')
  assert.match(await page.getByRole('button', { name: /待审核/ }).textContent(), /1/)
  await page.locator('table').getByRole('button', { name: '拒绝', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  assert.equal(await dialog.getByRole('button', { name: '确认拒绝' }).isDisabled(), true)
  await dialog.getByRole('textbox').fill('资料来源不足')
  await dialog.getByRole('button', { name: '确认拒绝' }).click()
  await dialog.waitFor({ state: 'hidden' })
  const request = api.state.requests.find(request => request.path === '/v1/admin/revisions/7/reject')
  assert.equal(request.payload.review_comment, '资料来源不足')
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === '待审核'))
  assert.deepEqual(errors, [])
})

test('permission revocation is checked on the next admin navigation', async () => {
  const { page } = await session('founder')
  await visit(page, '/admin/revisions')
  api.state.revoked = true
  await page.locator('aside a[href="/admin/users"]').click()
  await page.waitForURL(`${baseURL}/`)
  assert.deepEqual(errors, [])
})

test('inactive sessions are cleared; server failures retain the token and block admin access', async () => {
  api.state.meFailure = { status: 403, name: 'USER_INACTIVE' }
  const inactive = await session('founder')
  await visit(inactive.page, '/admin/users')
  await inactive.page.waitForURL('**/auth/login?**')
  assert.ok(!(await inactive.context.cookies()).some(cookie => cookie.name === 'auth_token' && cookie.value))
  api.state.meFailure = { status: 503, name: 'INTERNAL_ERROR' }
  const unavailable = await session('founder')
  const response = await unavailable.page.goto(`${baseURL}/admin/users`)
  assert.equal(response.status(), 503)
  assert.ok((await unavailable.context.cookies()).some(cookie => cookie.name === 'auth_token' && cookie.value === 'founder'))
})

test('logout revokes the current token before clearing the browser session', async () => {
  const { page, context } = await session('founder')
  await visit(page, '/')
  await page.getByRole('button', { name: 'User menu' }).click()
  await page.getByRole('button', { name: 'Sign Out', exact: true }).click()
  await page.getByRole('button', { name: 'User menu' }).waitFor({ state: 'hidden' })
  assert.ok(api.state.requests.some(request => request.path === '/v1/auth/logout' && request.method === 'POST' && request.token === 'founder'))
  assert.ok(!(await context.cookies()).some(cookie => cookie.name === 'auth_token' && cookie.value))
  assert.deepEqual(errors, [])
})

test('login reports a profile fetch failure instead of navigating as a successful login', async () => {
  api.state.meFailure = { status: 503, name: 'INTERNAL_ERROR' }
  const { page } = await session()
  await visit(page, '/auth/login')
  await page.locator('input[type="email"]').fill('admin@example.test')
  await page.locator('input[type="password"]').fill('test-password')
  await page.locator('form button[type="submit"]').click()
  await page.locator('.bg-red-50 p').waitFor()
  assert.equal(new URL(page.url()).pathname, '/auth/login')
  assert.ok(api.state.requests.some(request => request.path === '/v1/me' && request.token === 'founder'))
  assert.deepEqual(errors, [])
})
