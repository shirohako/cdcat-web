<template>
  <div class="min-h-screen">
    <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 2xl:max-w-7xl">
      <header class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{{ t('admin_pages.console') }}</p>
          <h1 class="mt-2 text-3xl font-black tracking-tight text-slate-900">{{ t('admin_pages.users.title') }}</h1>
          <p class="mt-1 text-sm text-slate-600">{{ t('admin_pages.users.description') }}</p>
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

      <AdminFilterBar>
        <form class="flex flex-wrap items-center gap-2" @submit.prevent="applyFilters()">
          <input v-model="search" type="search" minlength="2" maxlength="100" :aria-label="t('admin_pages.search')" :placeholder="t('admin_pages.search')" class="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <select :value="selectedRole" :aria-label="t('admin_pages.users.role')" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" @change="applyFilters(($event.target as HTMLSelectElement).value)">
            <option value="">{{ t('admin_pages.all_roles') }}</option>
            <option v-for="role in rolesData" :key="role.name" :value="role.name">{{ role.name }}</option>
          </select>
          <select v-model="status" :aria-label="t('admin_pages.users.status')" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">{{ t('admin_pages.all_statuses') }}</option><option value="active">{{ t('admin_pages.users.active') }}</option><option value="disabled">{{ t('admin_pages.users.disabled') }}</option>
          </select>
          <select v-model="sortBy" :aria-label="t('admin_pages.sort_by')" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <select v-model="sortOrder" :aria-label="t('admin_pages.sort_order')" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="desc">{{ t('admin_pages.descending') }}</option><option value="asc">{{ t('admin_pages.ascending') }}</option></select>
          <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white">{{ t('admin_pages.filters') }}</button>
        </form>
      </AdminFilterBar>
      <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
        <AdminListState :pending="pending" :error="error" :empty="users.length === 0" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 text-left text-sm">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/60">
                <th class="px-5 py-3 text-left text-xs font-semibold tracking-wide text-slate-500">{{ t('admin_pages.users.user') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500">{{ t('admin_pages.users.role') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500">{{ t('admin_pages.users.status') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500">{{ t('admin_pages.user_detail.reviews') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500">{{ t('admin_pages.user_detail.contributions') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500">{{ t('admin_pages.users.joined') }}</th>
                <th class="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500">{{ t('admin_pages.users.last_login') }}</th>
                <th v-if="canAssignRoles" class="w-24 px-4 py-3" />
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              <tr v-if="pending">
                <td :colspan="canAssignRoles ? 8 : 7" class="px-5 py-16 text-center text-sm text-slate-400">
                  <Icon name="lucide:loader-circle" class="mx-auto mb-2 h-5 w-5 animate-spin opacity-40" />
                  {{ t('common.loading') }}
                </td>
              </tr>

              <template v-else>
                <tr
                  v-for="u in users"
                  :key="u.id"
                  class="group transition-colors hover:bg-slate-50/70"
                >
                  <!-- 用户信息 -->
                  <td class="px-5 py-3.5">
                    <div class="flex items-center gap-3">
                      <img
                        v-if="u.avatar_url"
                        :src="u.avatar_url"
                        alt=""
                        class="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                      >
                      <div v-else class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                        {{ initials(u) }}
                      </div>
                      <div class="min-w-0">
                        <NuxtLink :to="`/admin/users/${u.id}`" class="truncate font-medium text-slate-900 underline decoration-slate-200 underline-offset-4">{{ u.nickname || u.username }}</NuxtLink>
                        <p class="truncate text-xs text-slate-400">{{ u.email }}</p>
                      </div>
                    </div>
                  </td>

                  <!-- 角色 -->
                  <td class="px-4 py-3.5">
                    <span
                      class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize"
                      :class="roleBadgeClass(u.roles)"
                    >
                      {{ u.roles || '—' }}
                    </span>
                  </td>

                  <!-- 状态 -->
                  <td class="px-4 py-3.5">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      :class="u.is_active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="u.is_active ? 'bg-emerald-500' : 'bg-slate-300'" />
                      {{ u.is_active ? t('admin_pages.users.active') : t('admin_pages.users.disabled') }}
                    </span>
                  </td>

                  <td class="px-4 py-3.5 tabular-nums text-slate-600">{{ u.reviews_count }}</td>
                  <td class="px-4 py-3.5 tabular-nums text-slate-600">{{ u.contributions_count }}</td>
                  <!-- 时间 -->
                  <td class="px-4 py-3.5 text-xs tabular-nums text-slate-400">{{ formatDate(u.joined_at) }}</td>
                  <td class="px-4 py-3.5 text-xs tabular-nums text-slate-400">{{ formatRelativeTime(u.last_seen_at) }}</td>

                  <!-- 操作 -->
                  <td v-if="canAssignRoles" class="px-4 py-3.5">
                    <button
                      class="whitespace-nowrap rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40"
                      type="button"
                      :disabled="!u.can_manage"
                      @click="openRoleModal(u)"
                    >
                      {{ t('admin_pages.users.edit_role') }}
                    </button>
                  </td>
                </tr>

                <tr v-if="users.length === 0">
                  <td :colspan="canAssignRoles ? 8 : 7" class="px-5 py-16 text-center text-sm text-slate-400">
                    {{ t('admin_pages.users.empty') }}
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <footer class="border-t border-slate-100 px-5 py-3.5">
          <CommonPagination
            v-model:page="page"
            :total-pages="pagination.last_page"
            :disabled="pending"
          />
        </footer>
        </AdminListState>
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
              <h2 class="text-sm font-semibold text-slate-900">{{ t('admin_pages.users.assign_role') }}</h2>
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
                  {{ t('admin_pages.users.permissions_count', { count: role.permissions.length }) }}
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
              <p class="text-xs font-semibold">{{ t('admin_pages.users.no_role') }}</p>
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
              {{ t('common.cancel') }}
            </button>
            <button
              class="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              :disabled="roleModal.saving || roleModal.selected === roleModal.user?.roles"
              @click="saveRole"
            >
              <span v-if="roleModal.saving">{{ t('common.saving') }}</span>
              <span v-else>{{ t('common.save') }}</span>
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
definePageMeta({ layout: 'admin', middleware: 'admin' })

type ApiUser = {
  id: number
  username: string
  nickname: string
  email: string
  avatar_url: string | null
  is_active: boolean
  roles: string | null
  role_level: number
  can_manage: boolean
  reviews_count: number
  contributions_count: number
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
  level: number
  name: string
  permissions: string[]
}

const { $api } = useNuxtApp()
const { hasPermission, user: currentUser } = useAuth()
const { t } = useAdminI18n()
const { intlLocale, formatDate: formatLocalizedDate } = useLocaleFormatting('zh-CN')
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))

const canAssignRoles = computed(() => hasPermission('users.assign-roles'))
const route = useRoute()
const router = useRouter()
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const search = ref(String(route.query.search || ''))
const status = ref(String(route.query.status || ''))
const sortBy = ref(String(route.query.sort_by || 'id'))
const sortOrder = ref(String(route.query.sort_order || 'desc'))
const sortOptions = computed(() => [
  { value: 'id', label: 'ID' }, { value: 'username', label: t('admin_pages.user_detail.username') },
  { value: 'joined_at', label: t('admin_pages.users.joined') }, { value: 'last_seen_at', label: t('admin_pages.users.last_login') },
  { value: 'reviews_count', label: t('admin_pages.user_detail.reviews') }, { value: 'contributions_count', label: t('admin_pages.user_detail.contributions') },
])
watch(() => route.query, value => { status.value = String(value.status || ''); sortBy.value = String(value.sort_by || 'id'); sortOrder.value = String(value.sort_order || 'desc') })
const selectedRole = computed(() => String(route.query.role || ''))
watch(() => route.query.search, value => { search.value = String(value || '') })
const applyFilters = (role = selectedRole.value) => router.push({ query: {
  ...route.query, search: search.value.trim() || undefined, role: role || undefined, page: undefined,
  status: status.value || undefined, sort_by: sortBy.value === 'id' ? undefined : sortBy.value, sort_order: sortOrder.value === 'desc' ? undefined : sortOrder.value,
} })
const query = computed(() => ({ page: page.value, search: route.query.search || undefined, role: selectedRole.value || undefined, is_active: route.query.status === 'active' ? 1 : route.query.status === 'disabled' ? 0 : undefined, sort_by: route.query.sort_by || undefined, sort_order: route.query.sort_order || undefined }))

// 用户列表
const { data, pending, error, refresh } = await useAsyncData<ApiResponse>(
  'admin-users',
  () => $api('/v1/admin/users', { query: query.value }),
  { watch: [query] },
)

const { data: rolesData } = await useAsyncData<RoleInfo[]>('admin-roles', () => $api('/v1/admin/roles'))

const users = computed(() => data.value?.users ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 15, current_page: 1, last_page: 1 })

const availableRoles = computed(() => (rolesData.value ?? []).filter(role =>
  role.name !== 'founder' && (currentUser.value?.roles === 'founder' || (
    role.level < (currentUser.value?.role_level ?? 0) && role.permissions.every(hasPermission)
  )),
))

const summary = computed(() => [
  { label: t('admin_pages.users.total'), value: pagination.value.total, icon: 'lucide:users', help: t('admin_pages.users.total_help') },
])

// ===== Role Modal =====
const roleModal = reactive({
  open: false,
  user: null as ApiUser | null,
  selected: null as string | null,
  saving: false,
})

const openRoleModal = (u: ApiUser) => {
  if (!u.can_manage) return
  roleModal.user = u
  roleModal.selected = u.roles ?? null
  roleModal.open = true
}
const closeRoleModal = () => { if (!roleModal.saving) roleModal.open = false }

const saveRole = async () => {
  if (!roleModal.user || roleModal.saving) return
  roleModal.saving = true
  try {
    await $api(`/v1/admin/users/${roleModal.user.id}/role`, {
      method: 'PUT',
      body: { role: roleModal.selected },
    })
    await refresh()
    showToast(t('admin_pages.users.role_updated'))
    roleModal.open = false
  } catch (e) {
    showToast(localizeError(e, 'admin_pages.users.update_failed'), 'error')
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
  founder:     'bg-violet-50 border-violet-200 text-violet-700',
  moderator:   'bg-blue-50 border-blue-200 text-blue-700',
  contributor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  member:      'bg-slate-50 border-slate-200 text-slate-600',
}
const roleBadgeClass = (role: string | null) => ROLE_BADGE[role ?? ''] ?? 'bg-slate-50 border-slate-200 text-slate-400'

const initials = (u: ApiUser) => {
  const name = u.nickname || u.username
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
const formatDate = (iso: string) => {
  if (!iso) return '—'
  return formatLocalizedDate(iso, { year: 'numeric', month: '2-digit', day: '2-digit' })
}
const formatRelativeTime = (iso: string) => {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const formatter = new Intl.RelativeTimeFormat(intlLocale.value, { numeric: 'auto' })
  if (mins < 1) return formatter.format(0, 'minute')
  if (mins < 60) return formatter.format(-mins, 'minute')
  const hours = Math.floor(mins / 60)
  if (hours < 24) return formatter.format(-hours, 'hour')
  const days = Math.floor(hours / 24)
  if (days < 30) return formatter.format(-days, 'day')
  return formatter.format(-Math.floor(days / 30), 'month')
}

onUnmounted(() => { if (toastTimer) clearTimeout(toastTimer) })

useHead({ title: computed(() => t('admin_pages.users.title')) })
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
