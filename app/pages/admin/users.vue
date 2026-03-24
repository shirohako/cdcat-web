<template>
  <div class="min-h-screen bg-slate-100">
    <div class="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admin Console</p>
          <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-900">User Management</h1>
          <p class="mt-1 text-sm text-slate-600">Manage user accounts, roles, and status.</p>
        </div>
      </header>

      <section class="mb-5 grid max-w-280 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="item in summary"
          :key="item.label"
          class="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div class="flex min-w-0 items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ item.label }}</p>
              <p class="mt-2 truncate text-2xl font-black text-slate-900">{{ item.value }}</p>
            </div>
            <div class="rounded-lg bg-slate-100 p-2 text-slate-700">
              <Icon :name="item.icon" class="h-4 w-4" />
            </div>
          </div>
          <p class="mt-2 wrap-break-word text-xs leading-5 text-slate-500">{{ item.help }}</p>
        </article>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 table-fixed text-left text-sm">
            <colgroup>
              <col>
              <col class="w-36">
              <col class="w-34">
              <col class="w-40">
              <col class="w-40">
              <col class="w-20">
            </colgroup>
            <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th class="px-4 py-3">User</th>
                <th class="px-4 py-3">Role</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Joined</th>
                <th class="px-4 py-3">Last Login</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="pending">
                <td colspan="6" class="px-4 py-14 text-center text-slate-400">
                  Loading...
                </td>
              </tr>

              <template v-else>
                <tr
                  v-for="u in users"
                  :key="u.id"
                  class="border-b border-slate-100 text-slate-700 transition hover:bg-slate-50"
                >
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <img
                        v-if="u.avatar"
                        :src="u.avatar"
                        class="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                      <div v-else class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                        {{ initials(u) }}
                      </div>
                      <div>
                        <p class="font-semibold text-slate-900">{{ u.nickname || u.username }}</p>
                        <p class="text-xs text-slate-500">@{{ u.username }}</p>
                        <p class="text-xs text-slate-500">{{ u.email }}</p>
                      </div>
                    </div>
                  </td>

                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize"
                      :class="roleBadgeClass(u.roles)"
                    >
                      {{ u.roles || '—' }}
                    </span>
                  </td>

                  <td class="px-4 py-3">
                    <span
                      :class="statusClass(u.status)"
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="u.status ? 'bg-emerald-500' : 'bg-rose-400'" />
                      {{ u.status ? 'Active' : 'Suspended' }}
                    </span>
                  </td>

                  <td class="px-4 py-3 text-slate-600">{{ formatDate(u.joined_at) }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ formatRelativeTime(u.last_seen_at) }}</td>

                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-2">
                      <button
                        v-if="canAssignRoles"
                        class="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        type="button"
                        @click="openRoleModal(u)"
                      >
                        Role
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="users.length === 0">
                  <td colspan="6" class="px-4 py-14 text-center text-slate-500">
                    No users available.
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <footer class="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p class="text-slate-500">Showing {{ startItem }}-{{ endItem }} of {{ pagination.total }}</p>

          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              :disabled="page <= 1"
              @click="page -= 1"
            >
              <Icon name="lucide:chevron-left" class="h-4 w-4" />
              Prev
            </button>

            <span class="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700">
              {{ page }} / {{ totalPages }}
            </span>

            <button
              class="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              :disabled="page >= totalPages"
              @click="page += 1"
            >
              Next
              <Icon name="lucide:chevron-right" class="h-4 w-4" />
            </button>
          </div>
        </footer>
      </section>
    </div>

    <!-- Role Modal -->
    <Transition name="modal">
      <div v-if="roleModal.open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" @click="closeRoleModal" />
        <div class="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl">

          <!-- 标题 -->
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">分配角色</h2>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ roleModal.user?.nickname || roleModal.user?.username }}
              </p>
            </div>
            <button
              class="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              @click="closeRoleModal"
            >
              <Icon name="lucide:x" class="h-4 w-4" />
            </button>
          </div>

          <!-- 角色列表 -->
          <div class="p-3">
            <div
              v-for="role in availableRoles"
              :key="role.name"
              class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition"
              :class="roleModal.selected === role.name
                ? 'bg-slate-900 text-white'
                : 'hover:bg-slate-50 text-slate-700'"
              @click="roleModal.selected = role.name"
            >
              <div
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-black uppercase"
                :class="roleModal.selected === role.name
                  ? 'bg-white/15 text-white'
                  : roleBadgeClass(role.name)"
              >
                {{ role.name[0] }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold capitalize">{{ role.name }}</p>
                <p
                  class="mt-0.5 truncate text-xs"
                  :class="roleModal.selected === role.name ? 'text-slate-300' : 'text-slate-400'"
                >
                  {{ role.permissions.length }} permissions
                </p>
              </div>
              <Icon
                v-if="roleModal.selected === role.name"
                name="lucide:check"
                class="h-4 w-4 shrink-0 text-white"
              />
            </div>

            <!-- 清除角色 -->
            <div
              class="mt-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition"
              :class="roleModal.selected === null
                ? 'bg-rose-50 text-rose-700'
                : 'hover:bg-slate-50 text-slate-400'"
              @click="roleModal.selected = null"
            >
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100">
                <Icon name="lucide:user-minus" class="h-3.5 w-3.5" />
              </div>
              <p class="text-xs font-semibold">无角色</p>
              <Icon
                v-if="roleModal.selected === null"
                name="lucide:check"
                class="ml-auto h-4 w-4 shrink-0 text-rose-500"
              />
            </div>
          </div>

          <!-- 底部 -->
          <div class="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <button
              class="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              @click="closeRoleModal"
            >
              取消
            </button>
            <button
              class="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              :disabled="roleModal.saving || roleModal.selected === roleModal.user?.roles"
              @click="saveRole"
            >
              <span v-if="roleModal.saving">保存中…</span>
              <span v-else>保存</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast -->
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="fixed bottom-5 right-5 z-60 flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 text-sm font-medium shadow-lg"
        :class="toast.type === 'error' ? 'border-rose-200 text-rose-700' : 'border-slate-200 text-slate-800'"
      >
        <Icon
          :name="toast.type === 'error' ? 'lucide:alert-triangle' : 'lucide:check'"
          class="h-4 w-4"
          :class="toast.type === 'error' ? 'text-rose-500' : 'text-emerald-500'"
        />
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
type ApiUser = {
  id: number
  username: string
  nickname: string
  email: string
  avatar: string | null
  status: boolean
  roles: string | null
  joined_at: string
  last_seen_at: string
}

type ApiResponse = {
  users: ApiUser[]
  pagination: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

type RoleInfo = {
  name: string
  permissions: string[]
}

const { $api } = useNuxtApp()
const { hasPermission } = useAuth()

const canAssignRoles = hasPermission('users.assign-roles')

const page = ref(1)

// 用户列表
const { data, pending } = await useAsyncData<ApiResponse>(
  'admin-users',
  () => $api('/v1/admin/users', { query: { page: page.value } }),
  { watch: [page] },
)

// 角色元数据（有 users.assign-roles 权限才需要）
const { data: rolesData } = canAssignRoles
  ? await useAsyncData<RoleInfo[]>('admin-roles', () => $api('/v1/admin/roles'))
  : { data: ref(null) }

const users = computed(() => data.value?.users ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 15, current_page: 1, last_page: 1 })
const totalPages = computed(() => pagination.value.last_page)

// 角色列表，按层级排序
const ROLE_ORDER = ['founder', 'moderator', 'contributor', 'member']
const availableRoles = computed<RoleInfo[]>(() => {
  const list: RoleInfo[] = (rolesData?.value ?? []).filter(r => r.name !== 'founder')
  return [...list].sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a.name)
    const bi = ROLE_ORDER.indexOf(b.name)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
})

const startItem = computed(() => {
  if (!pagination.value.total) return 0
  return (pagination.value.current_page - 1) * pagination.value.per_page + 1
})
const endItem = computed(() => {
  if (!pagination.value.total) return 0
  return Math.min(pagination.value.current_page * pagination.value.per_page, pagination.value.total)
})

const summary = computed(() => [
  { label: 'Total Users', value: pagination.value.total, icon: 'lucide:users', help: 'All accounts in system' },
])

// ===== Role Modal =====
const roleModal = reactive({
  open: false,
  user: null as ApiUser | null,
  selected: null as string | null,
  saving: false,
})

const openRoleModal = (u: ApiUser) => {
  roleModal.user = u
  roleModal.selected = u.roles ?? null
  roleModal.open = true
}
const closeRoleModal = () => { roleModal.open = false }

const saveRole = async () => {
  if (!roleModal.user) return
  roleModal.saving = true
  try {
    await $api(`/v1/users/${roleModal.user.id}/role`, {
      method: 'PUT',
      body: { role: roleModal.selected },
    })
    // 乐观更新本地数据
    const target = users.value.find(u => u.id === roleModal.user!.id)
    if (target) target.roles = roleModal.selected
    showToast('角色已更新')
    closeRoleModal()
  } catch (e: any) {
    showToast(e.message || '更新失败', 'error')
  } finally {
    roleModal.saving = false
  }
}

// ===== Toast =====
const toast = reactive({ show: false, message: '', type: 'success' as 'success' | 'error' })
let toastTimer: ReturnType<typeof setTimeout> | null = null
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.show = true
  toast.message = message
  toast.type = type
  toastTimer = setTimeout(() => { toast.show = false }, 2500)
}

// ===== 样式 =====
const ROLE_BADGE: Record<string, string> = {
  founder:     'bg-violet-100 text-violet-700',
  moderator:   'bg-blue-100 text-blue-700',
  contributor: 'bg-emerald-100 text-emerald-700',
  member:      'bg-slate-100 text-slate-600',
}
const roleBadgeClass = (role: string | null) => ROLE_BADGE[role ?? ''] ?? 'bg-slate-100 text-slate-500'
const statusClass = (status: boolean) =>
  status ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'

const initials = (u: ApiUser) => {
  const name = u.nickname || u.username
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const formatDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const formatRelativeTime = (iso: string) => {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

useHead({ title: 'Admin Users' })
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-active > div:last-child, .modal-leave-active > div:last-child {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease;
}
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from > div:last-child { transform: scale(0.96) translateY(6px); opacity: 0; }
.modal-leave-to > div:last-child { transform: scale(0.97); opacity: 0; }

.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(6px); }
</style>
