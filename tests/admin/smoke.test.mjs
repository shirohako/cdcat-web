import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { baseline, createMockAPI, impactChecksum } from './mock-api.mjs'

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
  Object.assign(api.state, { revisionStatus: 'pending', role: 'member', revoked: false, meFailure: null, requests: [], legacy: false, destructive: false, submissionFailure: null, blockers: [], userStatus: true, userProfile: {}, sessions: 2, roleRecords: null, dashboardFailure: false, userProtected: false })
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
  await page.waitForURL(`${baseURL}/admin`)
  await page.getByRole('heading', { name: '工作台', exact: true }).waitFor()
  assert.equal(await page.locator('aside a[href="/admin/users"]').count(), 0)
  await page.getByRole('button', { name: '展开菜单' }).click()
  await page.waitForFunction(() => document.querySelector('aside').getBoundingClientRect().x === 0)
  await page.getByRole('button', { name: '关闭菜单', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('aside').getBoundingClientRect().right <= 0)
  assert.deepEqual(errors, [])
})

test('role assignment refreshes the row and closes the dialog', async () => {
  const { page } = await session('staff')
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
  const { page } = await session('staff')
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

test('pending totals refresh after a batch rejection and the reason is mandatory', async () => {
  const { page } = await session('staff')
  await visit(page, '/admin/revisions')
  assert.match(await page.getByRole('link', { name: /待审/ }).textContent(), /1/)
  await page.getByRole('checkbox', { name: '选择修订 7' }).check()
  await page.getByRole('button', { name: '批量驳回', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  assert.equal(await dialog.getByRole('button', { name: '确认' }).isDisabled(), true)
  await dialog.getByRole('textbox').fill('资料来源不足')
  await dialog.getByRole('button', { name: '确认' }).click()
  await dialog.waitFor({ state: 'hidden' })
  const request = api.state.requests.find(request => request.path === '/v1/admin/revisions/batch')
  assert.deepEqual(request.payload, { action: 'reject', ids: [7], review_comment: '资料来源不足' })
  await page.getByText('成功 1 条，失败 0 条').waitFor()
  await page.getByRole('link', { name: '待审 0' }).waitFor()
  assert.deepEqual(errors, [])
})

test('permission revocation is checked on the next admin navigation', async () => {
  const { page } = await session('staff')
  await visit(page, '/admin/revisions')
  api.state.revoked = true
  await page.locator('aside a[href="/admin/users"]').click()
  await page.waitForURL(`${baseURL}/`)
  assert.deepEqual(errors, [])
})

test('inactive sessions are cleared; server failures retain the token and block admin access', async () => {
  api.state.meFailure = { status: 403, name: 'USER_INACTIVE' }
  const inactive = await session('staff')
  await visit(inactive.page, '/admin/users')
  await inactive.page.waitForURL('**/auth/login?**')
  assert.ok(!(await inactive.context.cookies()).some(cookie => cookie.name === 'auth_token' && cookie.value))
  api.state.meFailure = { status: 503, name: 'INTERNAL_ERROR' }
  const unavailable = await session('staff')
  const response = await unavailable.page.goto(`${baseURL}/admin/users`)
  assert.equal(response.status(), 503)
  assert.ok((await unavailable.context.cookies()).some(cookie => cookie.name === 'auth_token' && cookie.value === 'staff'))
})

test('logout revokes the current token before clearing the browser session', async () => {
  const { page, context } = await session('staff')
  await visit(page, '/')
  await page.getByRole('button', { name: 'User menu' }).click()
  await page.getByRole('button', { name: 'Sign Out', exact: true }).click()
  await page.getByRole('button', { name: 'User menu' }).waitFor({ state: 'hidden' })
  assert.ok(api.state.requests.some(request => request.path === '/v1/auth/logout' && request.method === 'POST' && request.token === 'staff'))
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
  assert.ok(api.state.requests.some(request => request.path === '/v1/me' && request.token === 'staff'))
  assert.deepEqual(errors, [])
})

function submission() {
  const request = api.state.requests.find(request => request.path === '/v1/revisions' && request.method === 'POST')
  assert.ok(request, 'editor submitted a revision')
  assert.equal(request.payload.baseline_checksum, baseline)
  return { ...request.payload, payload: JSON.parse(request.payload.payload) }
}

test('artist edits submit the resource ID and the baseline from the protected schema', async () => {
  const { page } = await session('member')
  await visit(page, '/contribute/artist/2')
  await page.getByPlaceholder('Enter artist name').fill('新艺术家')
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL('**/contribute/success?**')
  assert.equal(submission().resource_id, '2')
  assert.equal(submission().payload.name, '新艺术家')
  assert.deepEqual(errors, [])
})

test('entry edit initializes, shows the comparison, and submits with its baseline', async () => {
  const { page } = await session('member')
  await visit(page, '/contribute/entry/3')
  await page.locator('form input[type="text"]').first().fill('新条目')
  await page.locator('form button[type="submit"]').click()
  await page.getByRole('button', { name: /Confirm changes|确认修改/ }).click()
  await page.getByRole('button', { name: /Confirm submission|确认提交/ }).click()
  await page.waitForURL('**/contribute/success?**')
  assert.equal(submission().resource_id, '3')
  assert.equal(submission().payload.meta.year, 2026)
  assert.deepEqual(errors, [])
})

test('series JSON editing preserves typed metadata, groups, and relation order', async () => {
  const { page } = await session('member')
  await visit(page, '/contribute/franchise/4')
  await page.getByRole('button', { name: 'JSON 编辑', exact: true }).click()
  const editor = page.getByPlaceholder('输入系列 JSON...')
  const payload = JSON.parse(await editor.inputValue())
  payload.name = '新系列'
  await editor.fill(JSON.stringify(payload))
  await page.getByRole('button', { name: '验证并同步', exact: true }).click()
  await page.getByRole('button', { name: '提交修改', exact: true }).click()
  await page.getByRole('button', { name: '确认修改', exact: true }).click()
  await page.getByRole('button', { name: '确认提交', exact: true }).click()
  await page.waitForURL('**/contribute/success?**')
  const sent = submission()
  assert.equal(sent.resource_id, '4')
  assert.equal(sent.payload.meta.year, 2026)
  assert.deepEqual(sent.payload.meta.tags, ['tag'])
  assert.equal(sent.payload.groups[0].name, '分组名')
  assert.equal(sent.payload.groups[0].order, 5)
  assert.equal(sent.payload.related_entries[0].order, 8)
  assert.deepEqual(sent.payload.related_entries[0].meta.tags, ['a'])
  assert.deepEqual(errors, [])
})

async function albumEditor(page) {
  await visit(page, '/contribute/album/1')
  await page.getByRole('button', { name: 'JSON Editor', exact: true }).click()
  const editor = page.locator('textarea[spellcheck="false"]')
  await editor.waitFor({ state: 'visible' })
  return editor
}

test('album JSON round trip keeps child identities, track credits, prices, and hidden metadata', async () => {
  const { page } = await session('member')
  const editor = await albumEditor(page)
  const draft = JSON.parse(await editor.inputValue())
  draft.baseline_checksum = 'a'.repeat(64)
  await editor.fill(JSON.stringify(draft))
  await page.getByRole('button', { name: 'Validate & Apply', exact: true }).click()
  await page.getByRole('button', { name: 'Update Album', exact: true }).click()
  await page.waitForURL('**/contribute/success?**')
  const sent = submission()
  assert.equal(String(sent.resource_id), '1')
  const payload = sent.payload
  assert.equal(payload.related_tracks[0].id, 11)
  assert.equal(payload.related_tracks[0].is_instrumental, true)
  assert.deepEqual(payload.related_tracks[0].meta, { isrc: 'JP123' })
  assert.equal(payload.related_artists[0].id, 21)
  assert.equal(payload.credits[0].id, 31)
  assert.equal(payload.credits[0].track_id, 11)
  assert.equal(payload.credits[0].artist_id, '2')
  assert.deepEqual(payload.credits[0].meta, { track: '1.1', source: 'booklet' })
  assert.equal(payload.credits[1].id, 32)
  assert.equal(payload.credits[1].order, 5)
  assert.deepEqual(payload.credits[1].meta, [])
  assert.equal(payload.credits[2].id, 33)
  assert.equal(payload.credits[2].meta, null)
  assert.equal(payload.products[0].price, 123.45)
  assert.deepEqual(payload.products[0].meta, { shops: ['shop'] })
  assert.deepEqual(payload.bonuses[0].meta, { pages: 12 })
  assert.deepEqual(payload.links[0].meta, { locale: 'ja' })
  assert.deepEqual(payload.meta, { aliases: ['别名'] })
  assert.deepEqual(errors, [])
})

test('removing the last track previews impact and requires a reason before submitting empty collections', async () => {
  const { page } = await session('member')
  const editor = await albumEditor(page)
  const payload = JSON.parse(await editor.inputValue())
  Object.assign(payload, { structure: [], related_tracks: [], related_artists: [], products: [], bonuses: [], links: [], credits: payload.credits.filter(credit => credit.track_id) })
  await editor.fill(JSON.stringify(payload))
  await page.getByRole('button', { name: 'Validate & Apply', exact: true }).click()
  await page.getByRole('button', { name: 'Update Album', exact: true }).click()
  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: '删除影响' }) })
  await dialog.waitFor()
  assert.equal(await dialog.locator('button[type="submit"]').isDisabled(), true)
  assert.equal(api.state.requests.filter(request => request.path === '/v1/revisions').length, 0)
  const preview = api.state.requests.find(request => request.path === '/v1/revisions/deletion-preview')
  assert.deepEqual(preview.payload.track_ids, [11])
  await dialog.getByRole('textbox').fill('删除误录的曲目')
  await dialog.locator('button[type="submit"]').click()
  await page.waitForURL('**/contribute/success?**')
  const sent = submission()
  assert.equal(sent.impact_checksum, impactChecksum)
  assert.equal(sent.comment, '删除误录的曲目')
  for (const key of ['structure', 'related_tracks', 'related_artists', 'credits', 'products', 'bonuses', 'links']) assert.deepEqual(sent.payload[key], [])
  assert.deepEqual(errors, [])
})

test('legacy pending revisions cannot be approved and offer reopening the current editor', async () => {
  api.state.legacy = true
  const { page } = await session('staff')
  await visit(page, '/revisions/7')
  await page.getByRole('alert').waitFor()
  assert.equal(await page.getByRole('button', { name: '通过', exact: true }).isDisabled(), true)
  assert.equal(await page.locator('a[href="/contribute/franchise/4"]').count(), 1)
  assert.deepEqual(errors, [])
})

test('a stale album submission displays the actionable API error and retains the draft', async () => {
  api.state.submissionFailure = 'REVISION_STALE'
  const { page } = await session('member')
  await albumEditor(page)
  await page.getByRole('button', { name: 'Update Album', exact: true }).click()
  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: '提交失败' }) })
  await dialog.waitFor()
  assert.match(await dialog.textContent(), /changed|变化|更新/)
  assert.equal(new URL(page.url()).pathname, '/contribute/album/1')
  assert.deepEqual(errors, [])
})

test('destructive review previews the exact tracks and requires confirmation before approval', async () => {
  api.state.destructive = true
  const { page } = await session('staff')
  await visit(page, '/revisions/7')
  await page.getByRole('button', { name: '通过', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  assert.equal(await dialog.locator('button[type="submit"]').isDisabled(), true)
  const preview = api.state.requests.find(request => request.path === '/v1/admin/content/album/1/deletion-impact')
  assert.equal(preview.query['track_ids[]'], '11')
  await dialog.getByRole('textbox').fill('已核对曲目和歌词的删除范围')
  await dialog.locator('button[type="submit"]').click()
  await page.waitForURL('**/admin/revisions')
  const approved = api.state.requests.find(request => request.path === '/v1/admin/revisions/7/approve')
  assert.equal(approved.payload.review_comment, '已核对曲目和歌词的删除范围')
  assert.deepEqual(errors, [])
})

test('contributors cannot approve a track removal from revision details', async () => {
  api.state.destructive = true
  const { page } = await session('contributor')
  await visit(page, '/revisions/7')
  assert.equal(await page.getByRole('button', { name: '通过', exact: true }).isDisabled(), true)
  assert.deepEqual(errors, [])
})

test('dashboard renders trends and keeps audit and operations sections permission-bound', async () => {
  const staff = await session('staff')
  await visit(staff.page, '/admin')
  await staff.page.getByRole('heading', { name: '工作台', exact: true }).waitFor()
  await staff.page.getByRole('heading', { name: '最近管理操作' }).waitFor()
  await staff.page.getByRole('heading', { name: '运维摘要' }).waitFor()
  await staff.page.getByRole('button', { name: '近 30 天', exact: true }).click()
  assert.equal(await staff.page.getByRole('button', { name: '近 30 天', exact: true }).getAttribute('aria-pressed'), 'true')
  assert.equal(await staff.page.getByRole('img', { name: '用户新增趋势' }).count(), 1)
  const contributor = await session('contributor')
  await visit(contributor.page, '/admin')
  assert.equal(await contributor.page.getByRole('heading', { name: '最近管理操作' }).count(), 0)
  assert.equal(await contributor.page.getByRole('heading', { name: '运维摘要' }).count(), 0)
  assert.equal(await contributor.page.locator('aside a[href="/admin/roles"]').count(), 0)
  assert.deepEqual(errors, [])
})

test('user state and sort filters survive history and user details are reachable', async () => {
  const { page } = await session('staff')
  await visit(page, '/admin/users')
  await page.getByRole('combobox', { name: '状态', exact: true }).selectOption('disabled')
  await page.getByRole('combobox', { name: '排序字段' }).selectOption('reviews_count')
  await page.getByRole('combobox', { name: '排序方向' }).selectOption('asc')
  const filtered = page.waitForResponse(response => response.url().includes('/v1/admin/users?') && response.url().includes('status=disabled'))
  await page.getByRole('button', { name: '筛选条件' }).click()
  await filtered
  await page.waitForURL('**/admin/users?**status=disabled**')
  const request = api.state.requests.filter(request => request.path === '/v1/admin/users').at(-1)
  assert.equal(request.query.status, 'disabled')
  assert.equal(request.query.sort_by, 'reviews_count')
  assert.equal(request.query.sort_order, 'asc')
  await page.locator('table').getByRole('link', { name: '测试用户', exact: true }).click()
  await page.waitForURL('**/admin/users/2')
  await page.getByRole('heading', { name: '基本资料', exact: true }).waitFor()
  await page.goBack()
  assert.equal(await page.getByRole('combobox', { name: '状态', exact: true }).inputValue(), 'disabled')
  assert.equal(await page.getByRole('combobox', { name: '排序字段' }).inputValue(), 'reviews_count')
  assert.deepEqual(errors, [])
})

test('user details edit profile, require status reasons, and revoke only after confirmation', async () => {
  const { page } = await session('staff')
  await visit(page, '/admin/users/2')
  await page.getByRole('textbox', { name: '昵称', exact: true }).fill('已核对用户')
  await page.getByRole('button', { name: '保存资料' }).click()
  await page.getByRole('status').filter({ hasText: '已保存' }).waitFor()
  assert.equal(api.state.userProfile.nickname, '已核对用户')
  await page.getByRole('button', { name: '禁用账号', exact: true }).click()
  let dialog = page.getByRole('dialog')
  await dialog.waitFor()
  assert.equal(await dialog.locator('button[type="submit"]').isDisabled(), true)
  await dialog.getByRole('textbox').fill('发布垃圾内容')
  await dialog.locator('button[type="submit"]').click()
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(api.state.userStatus, false)
  await page.getByRole('button', { name: '启用账号', exact: true }).waitFor()
  await page.getByRole('button', { name: '作废全部登录会话', exact: true }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox').fill('找回账号后清理会话')
  await dialog.locator('button[type="submit"]').click()
  await dialog.waitFor({ state: 'hidden' })
  await page.getByText('暂无登录会话', { exact: true }).waitFor()
  const revoke = api.state.requests.find(request => request.path.endsWith('/revoke-tokens'))
  assert.equal(revoke.payload.reason, '找回账号后清理会话')
  await page.getByRole('button', { name: '分配角色', exact: true }).click()
  await dialog.getByRole('combobox', { name: '角色', exact: true }).selectOption('contributor')
  await dialog.locator('button[type="submit"]').click()
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(api.state.role, 'contributor')
  assert.deepEqual(errors, [])
})

test('user content tabs and recovery actions use the selected account and explicit reasons', async () => {
  const { page } = await session('staff')
  await visit(page, '/admin/users/2')
  await page.getByRole('button', { name: '文章', exact: true }).click()
  await page.getByText('articles 测试记录', { exact: true }).waitFor()
  assert.equal(await page.getByRole('link', { name: 'articles 测试记录' }).count(), 0)
  await page.getByRole('button', { name: '发送密码重置验证码' }).click()
  let dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox').fill('本人申请找回账号')
  await dialog.locator('button[type="submit"]').click()
  await dialog.waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: '清除验证码限制' }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: '需要清除限制的 IP（可选）' }).fill('192.0.2.20')
  await dialog.getByRole('textbox', { name: '原因（必填）' }).fill('确认误触发限制')
  await dialog.locator('button[type="submit"]').click()
  await dialog.waitFor({ state: 'hidden' })
  const reset = api.state.requests.find(request => request.path.endsWith('/send-reset'))
  const clear = api.state.requests.find(request => request.path.endsWith('/clear-verification-limit'))
  assert.equal(reset.payload.reason, '本人申请找回账号')
  assert.equal(clear.payload.ip, '192.0.2.20')
  assert.equal(clear.payload.reason, '确认误触发限制')
  assert.deepEqual(errors, [])
})

test('roles can be created with grouped permissions while reserved roles stay read-only', async () => {
  const { page } = await session('staff')
  await visit(page, '/admin/roles')
  await page.getByRole('link', { name: '新建角色', exact: true }).click()
  await page.waitForURL('**/admin/roles/new')
  await page.getByRole('textbox', { name: /角色名称/ }).fill('curator')
  await page.getByRole('spinbutton', { name: /角色等级/ }).fill('30')
  await page.locator('input[type="checkbox"][value="admin.access"]').check()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.waitForURL('**/admin/roles')
  const created = api.state.requests.find(request => request.path === '/v1/admin/roles' && request.method === 'POST')
  assert.equal(created.payload.name, 'curator')
  assert.equal(created.payload.level, 30)
  assert.deepEqual(created.payload.permissions, ['admin.access'])
  await page.locator('tr').filter({ has: page.getByRole('cell', { name: 'curator', exact: true }) }).getByRole('link', { name: '编辑角色', exact: true }).click()
  await page.getByRole('spinbutton', { name: /角色等级/ }).fill('31')
  await page.locator('input[type="checkbox"][value="content.submit"]').check()
  await page.getByRole('button', { name: '保存', exact: true }).click()
  await page.waitForURL('**/admin/roles')
  const updated = api.state.requests.find(request => request.path.startsWith('/v1/admin/roles/') && request.method === 'PUT')
  assert.equal(updated.payload.level, 31)
  assert.ok(updated.payload.permissions.includes('content.submit'))
  const staffRow = page.locator('tr').filter({ has: page.getByRole('cell', { name: 'staff', exact: true }) })
  assert.equal(await staffRow.getByRole('button', { name: '删除角色', exact: true }).count(), 0)
  await staffRow.getByRole('link', { name: '查看角色', exact: true }).click()
  assert.equal(await page.getByRole('textbox', { name: /角色名称/ }).isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: '保存', exact: true }).count(), 0)
  assert.deepEqual(errors, [])
})

test('deleting an assigned role requires both replacement and a reason', async () => {
  api.state.role = 'contributor'
  const { page } = await session('staff')
  await visit(page, '/admin/roles')
  const row = page.locator('tr').filter({ has: page.getByRole('cell', { name: 'contributor', exact: true }) })
  await row.getByRole('button', { name: '删除角色', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox').fill('合并重复角色')
  assert.equal(await dialog.locator('button[type="submit"]').isDisabled(), true)
  const member = api.state.roleRecords.find(role => role.name === 'member')
  await dialog.getByRole('combobox', { name: '替代角色', exact: true }).selectOption(String(member.id))
  await dialog.locator('button[type="submit"]').click()
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(api.state.role, 'member')
  const deletion = api.state.requests.find(request => request.method === 'DELETE')
  assert.equal(deletion.payload.replacement_role_id, member.id)
  assert.equal(deletion.payload.reason, '合并重复角色')
  assert.deepEqual(errors, [])
})

test('users.manage alone cannot enter role editing routes', async () => {
  const { page } = await session('moderator')
  await visit(page, '/admin/roles/new')
  await page.waitForURL(`${baseURL}/admin`)
  assert.equal(await page.locator('aside a[href="/admin/roles"]').count(), 0)
  assert.equal(await page.getByRole('heading', { name: '新建角色', exact: true }).count(), 0)
  assert.deepEqual(errors, [])
})


test('protected users remain visible while profile and security operations are disabled', async () => {
  api.state.userProtected = true
  const { page } = await session('staff')
  await visit(page, '/admin/users/2')
  assert.equal(await page.getByRole('textbox', { name: '昵称', exact: true }).isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: '保存资料' }).count(), 0)
  assert.equal(await page.getByRole('button', { name: '发送密码重置验证码' }).count(), 0)
  assert.deepEqual(errors, [])
})
