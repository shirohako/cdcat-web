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
              <col class="w-34">
              <col class="w-34">
              <col class="w-40">
              <col class="w-40">
              <col class="w-34">
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
                  v-for="user in users"
                  :key="user.id"
                  class="border-b border-slate-100 text-slate-700 transition hover:bg-slate-50"
                >
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <img
                        v-if="user.avatar"
                        :src="user.avatar"
                        class="h-9 w-9 rounded-full object-cover"
                      />
                      <div v-else class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                        {{ initials(user) }}
                      </div>
                      <div>
                        <p class="font-semibold text-slate-900">{{ user.nickname || user.username }}</p>
                        <p class="text-xs text-slate-500">@{{ user.username }}</p>
                        <p class="text-xs text-slate-500">{{ user.email }}</p>
                      </div>
                    </div>
                  </td>

                  <td class="px-4 py-3">
                    <span class="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                      {{ user.roles }}
                    </span>
                  </td>

                  <td class="px-4 py-3">
                    <span
                      :class="statusClass(user.status)"
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                    >
                      {{ user.status ? 'Active' : 'Suspended' }}
                    </span>
                  </td>

                  <td class="px-4 py-3 text-slate-600">{{ formatDate(user.joined_at) }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ formatRelativeTime(user.last_seen_at) }}</td>

                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-2">
                      <button
                        class="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        type="button"
                      >
                        Edit
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
  roles: string
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

const { $api } = useNuxtApp()

const page = ref(1)

const { data, pending, error } = await useAsyncData<ApiResponse>(
  'admin-users',
  () => $api('/v1/admin/users', { query: { page: page.value } }),
  { watch: [page] },
)

const users = computed(() => data.value?.users ?? [])
const pagination = computed(() => data.value?.pagination ?? { total: 0, per_page: 15, current_page: 1, last_page: 1 })

const totalPages = computed(() => pagination.value.last_page)

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

const initials = (user: ApiUser) => {
  const name = user.nickname || user.username
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const statusClass = (status: boolean) =>
  status ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'

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

