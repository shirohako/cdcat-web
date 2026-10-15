import http from 'node:http'

export const baseline = 'd'.repeat(64)
export const impactChecksum = 'e'.repeat(64)
export const workSchema = {
  id: 1, title: '完整作品', type: 'album', release_date: '2026-01-01', image_url: 'https://example.test/cover.jpg',
  slug: 'complete-work', meta: { aliases: ['别名'] }, release_event_id: null,
  snapshot_version: 1, baseline_checksum: baseline,
  structure: [{ disc_number: 1, title: 'Disc One' }],
  related_songs: [{ id: 11, disc_number: 1, track_number: 1, title: '曲目一', duration: '3:00', is_instrumental: true, meta: { isrc: 'JP123' } }],
  related_artists: [{ id: 21, artist_id: 2, display_name: '演唱者' }],
  credits: [{ id: 31, artist_id: 2, song_id: 11, display_name: '作曲者', role: 'Composer', order: 0, meta: { track: '1.1', source: 'booklet' } }, { id: 32, artist_id: 2, song_id: null, display_name: '制作人', role: 'Producer', order: 5, meta: [] }, { id: 33, artist_id: 2, song_id: null, display_name: '母带', role: 'Mastering', order: 9, meta: null }],
  products: [{ id: 41, name: '通常盘', edition_type: 'REGULAR', medium: 'PHYSICAL', price: 123.45, currency: 'JPY', meta: { shops: ['shop'] } }],
  bonuses: [{ id: 51, type: 'BOOKLET', name: '歌词本', meta: { pages: 12 } }],
  links: [{ id: 61, link_provider_id: 1, url: 'https://example.test/work', meta: { locale: 'ja' } }],
}

export async function createMockAPI(port) {
  const permissions = {
    founder: ['admin.access', 'users.manage', 'users.assign-roles', 'revisions.view', 'revisions.review', 'content.manage', 'roles.manage', 'audit.view', 'system.logs'],
    moderator: ['admin.access', 'users.manage', 'revisions.view', 'revisions.review'],
    contributor: ['admin.access', 'revisions.view', 'revisions.review'],
    member: ['content.submit'],
  }
  const state = { revisionStatus: 'pending', role: 'member', revoked: false, meFailure: null, requests: [], legacy: false, destructive: false, submissionFailure: null, blockers: [], userStatus: true, userProfile: {}, sessions: 2, roleRecords: null, dashboardFailure: false, userProtected: false }
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    if (req.method === 'OPTIONS') return res.writeHead(204).end()
    let body = ''
    for await (const part of req) body += part
    const contentType = req.headers['content-type'] || ''
    const payload = !body ? {} : contentType.includes('multipart/form-data')
      ? Object.fromEntries(await new Response(body, { headers: { 'content-type': contentType } }).formData())
      : JSON.parse(body)
    const url = new URL(req.url, 'http://127.0.0.1')
    const token = req.headers.authorization?.replace('Bearer ', '')
    state.requests.push({ path: url.pathname, method: req.method, payload, token, query: Object.fromEntries(url.searchParams) })
    const send = (data) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: true, data }))
    }
    const fail = (status, name) => {
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: { name, code: status, message: name } }))
    }
    if (url.pathname === '/v1/me') {
      if (state.meFailure) return fail(state.meFailure.status, state.meFailure.name)
      return send({
        id: 1, username: 'admin', nickname: '管理员', email: 'admin@example.test',
        roles: token, role_level: token === 'founder' ? 100 : 20,
        permissions: state.revoked ? [] : permissions[token] || [], joined_at: '2026-01-01T00:00:00Z',
      })
    }
    if (url.pathname === '/v1/auth/login') return send({ token: 'founder' })
    if (url.pathname === '/v1/auth/logout') return send({})
    if (url.pathname === '/v1/works/1/schema') return send(workSchema)
    if (url.pathname === '/v1/artists/2/schema') return send({ id: 2, name: '原艺术家', type: 'person', bio: '简介', links: [], snapshot_version: 1, baseline_checksum: baseline })
    if (url.pathname === '/v1/entries/3/schema') return send({ id: 3, name: '原条目', type: 'anime', image_url: 'https://example.test/entry.jpg', meta: { year: 2026 }, related_works: [{ id: 1 }], snapshot_version: 1, baseline_checksum: baseline })
    if (url.pathname === '/v1/franchises/4/schema') return send({
      id: 4, name: '原系列', image_url: 'https://example.test/series.jpg', meta: { year: 2026, tags: ['tag'] },
      groups: [{ id: 'g1', name: '分组名', order: 5, meta: { edition: 1 } }],
      related_entries: [{ id: 3, group_id: 'g1', order: 8, meta: { tags: ['a'] } }], related_works: [{ id: 1, group_id: 'g1', order: 9 }],
      snapshot_version: 1, baseline_checksum: baseline,
    })
    if (url.pathname === '/v1/artists/lookup') return send({ artists: [{ id: 2, name: '原艺术家', type: 'person' }] })
    if (url.pathname === '/v1/link-providers') return send([{ id: 1, name: '官方网站', category: 'official' }])
    if (url.pathname === '/v1/revisions/deletion-preview') return send({ counts: [{ label: '曲目', count: 1 }, { label: '歌词', count: 1 }], blockers: state.blockers, checksum: impactChecksum, baseline_checksum: baseline })
    if (url.pathname === '/v1/revisions' && req.method === 'POST') {
      if (state.submissionFailure) return fail(409, state.submissionFailure)
      return send({ id: 99, requires_reconfirmation: false })
    }
    if (url.pathname === '/v1/admin/content/work/1/deletion-impact') {
      if (url.searchParams.get('song_ids[]') !== '11') return fail(422, 'VALIDATION_FAILED')
      return send({ counts: [{ label: '曲目', count: 1 }], blockers: state.blockers, checksum: impactChecksum })
    }
    if (url.pathname === '/v1/revisions/7' && state.destructive) return send({
      revision: { id: 7, resource_type: 'work', resource_id: 1, action: 'update', title: '删除误录曲目', status: 'pending',
        data: { related_songs: [] }, requires_reconfirmation: false, requires_content_manage: true, impact_checksum: impactChecksum },
      previous: { data: { related_songs: [{ id: 11 }] }, checksum: baseline },
    })
    if (url.pathname === '/v1/revisions/7') return send({
      revision: { id: 7, resource_type: 'franchise', resource_id: 4, action: 'update', title: '测试系列修订', status: state.revisionStatus,
        data: { name: '新系列' }, snapshot_version: state.legacy ? null : 1, requires_reconfirmation: state.legacy, requires_content_manage: false },
      previous: state.legacy ? null : { data: { name: '原系列' }, checksum: baseline },
    })
    if (url.pathname === '/v1/admin/dashboard') {
      if (state.dashboardFailure) return fail(500, 'INTERNAL_ERROR')
      const data = {
        generated_at: '2026-10-16T00:00:00Z',
        metrics: ['users', 'works', 'artists', 'entries', 'franchises', 'songs', 'reviews', 'articles', 'lyrics', 'events'].map(key => ({ key, total: 10, new_7: 2, new_30: 4, daily: Array.from({ length: 30 }, (_, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, count: i % 3 })) })),
      }
      if (permissions[token]?.includes('revisions.view')) data.pending_revisions = 1
      if (permissions[token]?.includes('audit.view')) data.recent_actions = [{ id: 1, actor_name: 'admin', action: 'users.update', reason: '审核资料', result: 'success', created_at: '2026-10-16T00:00:00Z' }]
      if (permissions[token]?.includes('system.logs')) data.operations = { failed_jobs: 2, scheduler: { status: 'unknown', last_seen_at: null }, worker: { status: 'unknown', last_seen_at: null } }
      return send(data)
    }
    state.roleRecords ??= Object.entries(permissions).map(([name, list], index) => ({ id: index + 1, name, permissions: [...list], level: { founder: 100, moderator: 50, contributor: 20, member: 0 }[name] }))
    if (url.pathname === '/v1/admin/permissions/catalog') return send([...new Set(Object.values(permissions).flat())].map(name => ({ name, group: name.startsWith('users') || name.startsWith('roles') ? '用户' : '后台', description: name === 'roles.manage' ? '管理角色及权限' : name, assignable: token === 'founder' || permissions[token]?.includes(name) })))
    if (url.pathname === '/v1/admin/roles' && req.method === 'POST') {
      const role = { id: 10 + state.roleRecords.length, ...payload }
      state.roleRecords.push(role)
      return send({ id: role.id, name: role.name })
    }
    const roleMatch = url.pathname.match(/^\/v1\/admin\/roles\/(\d+)$/)
    if (roleMatch) {
      const role = state.roleRecords.find(role => role.id === Number(roleMatch[1]))
      if (req.method === 'PUT') Object.assign(role, payload)
      if (req.method === 'DELETE') {
        if (state.role === role.name && !payload.replacement_role_id) return fail(422, 'VALIDATION_FAILED')
        if (state.role === role.name) state.role = state.roleRecords.find(item => item.id === payload.replacement_role_id)?.name
        state.roleRecords = state.roleRecords.filter(item => item.id !== role.id)
      }
      return send({})
    }
    if (url.pathname === '/v1/admin/roles') return send(state.roleRecords.map(role => ({ ...role, users_count: role.name === state.role || role.name === 'founder' ? 1 : 0, can_manage: role.name !== 'founder' && token === 'founder', can_delete: !['founder', 'member'].includes(role.name) && token === 'founder' })))
    if (url.pathname === '/v1/admin/users/2' && req.method === 'GET') return send({
      id: 2, username: 'member', nickname: '测试用户', email: 'member@example.test', birthday: '2000-01-01', avatar: null, banner: null, bio: '用户简介',
      status: state.userStatus, roles: state.role, role_names: [state.role], role_level: 0, can_manage: !state.userProtected, permissions: ['content.submit'], contributions_count: 3, reviews_count: 2,
      joined_at: '2026-01-01T00:00:00Z', last_seen_at: null,
      login_sessions: Array.from({ length: state.sessions }, () => ({ created_at: '2026-01-01T00:00:00Z', last_used_at: null })), login_sessions_total: state.sessions,
      ...state.userProfile,
    })
    if (url.pathname === '/v1/admin/users/2' && req.method === 'PUT') {
      if (payload.status !== undefined) state.userStatus = payload.status
      else Object.assign(state.userProfile, payload)
      return send({})
    }
    if (url.pathname === '/v1/admin/users/2/activity') return send({ items: [{ id: 7, title: `${url.searchParams.get('type')} 测试记录`, status: url.searchParams.get('type') === 'articles' ? 'draft' : 'pending', created_at: '2026-01-01T00:00:00Z' }], pagination: { total: 1, per_page: 15, current_page: 1, last_page: 1 } })
    if (/^\/v1\/admin\/users\/2\/(revoke-tokens|send-reset|clear-verification-limit)$/.test(url.pathname)) {
      if (url.pathname.endsWith('revoke-tokens')) state.sessions = 0
      return send({ audit_id: 10 })
    }
    if (url.pathname === '/v1/admin/users') {
      if (url.searchParams.get('search') === 'failure') return fail(500, 'INTERNAL_ERROR')
      const users = url.searchParams.get('search') === 'empty' ? [] : [{
        id: 2, username: 'member', nickname: '测试用户', email: 'member@example.test',
        roles: state.role, role_level: 0, can_manage: !state.userProtected, status: state.userStatus, reviews_count: 2, contributions_count: 3,
        joined_at: '2026-01-01T00:00:00Z', last_seen_at: null,
      }]
      return send({ users, pagination: { total: users.length, per_page: 15, current_page: 1, last_page: 1 } })
    }
    if (url.pathname === '/v1/admin/users/2/role') {
      state.role = payload.role
      return send({ id: 2, roles: state.role })
    }
    if (url.pathname === '/v1/admin/revisions') {
      const matches = !url.searchParams.get('status') || url.searchParams.get('status') === state.revisionStatus
      return send({
        revisions: matches ? [{ id: 7, resource_type: 'franchise', action: 'update', title: '测试系列修订', status: state.revisionStatus, created_at: '2026-10-15T00:00:00Z', submitter: { username: 'member', nickname: '投稿者' } }] : [],
        pagination: { total: matches ? 1 : 0, per_page: 15, current_page: 1, last_page: 1 },
      })
    }
    if (/\/v1\/admin\/revisions\/7\/(approve|reject)$/.test(url.pathname)) {
      state.revisionStatus = url.pathname.endsWith('reject') ? 'rejected' : 'approved'
      return send({})
    }
    return send({ works: [], pagination: { total: 0, last_page: 1 }, stats: {}, entries: [], artists: [], franchises: [] })
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  return { state, close: () => new Promise(resolve => server.close(resolve)) }
}
