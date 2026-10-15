import http from 'node:http'

export async function createMockAPI(port) {
  const permissions = {
    founder: ['admin.access', 'users.manage', 'users.assign-roles', 'revisions.view', 'revisions.review', 'content.manage'],
    contributor: ['admin.access', 'revisions.view', 'revisions.review'],
    member: ['content.submit'],
  }
  const state = { revisionStatus: 'pending', role: 'member', revoked: false, meFailure: null, requests: [] }
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
    if (req.method === 'OPTIONS') return res.writeHead(204).end()
    let body = ''
    for await (const part of req) body += part
    const payload = body ? JSON.parse(body) : {}
    const url = new URL(req.url, 'http://127.0.0.1')
    const token = req.headers.authorization?.replace('Bearer ', '')
    state.requests.push({ path: url.pathname, method: req.method, payload, token })
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
    if (url.pathname === '/v1/admin/roles') return send(Object.entries(permissions).map(([name, list]) => ({ name, permissions: list, level: { founder: 100, contributor: 20, member: 0 }[name] })))
    if (url.pathname === '/v1/admin/users') {
      if (url.searchParams.get('search') === 'failure') return fail(500, 'INTERNAL_ERROR')
      const users = url.searchParams.get('search') === 'empty' ? [] : [{
        id: 2, username: 'member', nickname: '测试用户', email: 'member@example.test',
        roles: state.role, role_level: 0, can_manage: true, status: true,
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
