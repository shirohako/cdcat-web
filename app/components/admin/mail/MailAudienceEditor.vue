<script setup lang="ts">
import type { AdminMailAudience, AdminMailAudienceStats, AdminMailLocale, AdminRole } from '~/types/admin'

/**
 * Who a campaign goes to: everyone subscribed to its category, narrowed by optional filters that
 * must all match. The counts come from POST /v1/admin/mail/audience as the filters change.
 */
const props = withDefaults(defineProps<{ categoryId: number | null, disabled?: boolean }>(), { disabled: false })
const audience = defineModel<AdminMailAudience>({ required: true })
const emit = defineEmits<{ stats: [stats: AdminMailAudienceStats | null] }>()

const { $api } = useNuxtApp()
const { localeName, mailError } = useAdminMail()
const locales = ADMIN_MAIL_LOCALES
// Role names need users.manage or roles.manage; without them the role filter is left out.
const roles = ref<AdminRole[]>([])
onMounted(async () => {
  try {
    roles.value = await $api<AdminRole[]>('/v1/admin/roles', { progress: false })
  } catch {
    roles.value = []
  }
})

const toggle = (field: 'roles' | 'locales', value: string) => {
  const current = (audience.value[field] ?? []) as string[]
  const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value]
  audience.value = { ...audience.value, [field]: next.length ? next : undefined }
}
const set = (field: 'active_within_days' | 'joined_from' | 'joined_to', value: string) => {
  const parsed = field === 'active_within_days' ? (Number.parseInt(value) || undefined) : (value || undefined)
  audience.value = { ...audience.value, [field]: parsed }
}

const stats = ref<AdminMailAudienceStats | null>(null)
const counting = ref(false)
const countError = ref('')
let timer: ReturnType<typeof setTimeout> | undefined
let latest = 0
const count = () => {
  clearTimeout(timer)
  if (!props.categoryId) {
    stats.value = null
    emit('stats', null)
    return
  }
  timer = setTimeout(async () => {
    const request = ++latest
    counting.value = true
    try {
      const result = await $api<AdminMailAudienceStats>('/v1/admin/mail/audience', { method: 'POST', progress: false, body: { mail_category_id: props.categoryId, audience: audience.value } })
      if (request === latest) {
        stats.value = result
        countError.value = ''
        emit('stats', result)
      }
    } catch (failure) {
      if (request === latest) countError.value = mailError(failure)
    } finally {
      if (request === latest) counting.value = false
    }
  }, 400)
}
watch(() => [props.categoryId, audience.value], count, { immediate: true, deep: true })
onBeforeUnmount(() => clearTimeout(timer))
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50'
</script>

<template>
  <div class="space-y-4 text-sm">
    <p class="text-slate-600">默认发给订阅了这个类型的所有用户；下面的条件可以缩小范围，多个条件需要同时满足。</p>
    <fieldset v-if="roles.length" :disabled="disabled">
      <legend class="font-medium">角色</legend>
      <div class="mt-2 flex flex-wrap gap-3">
        <label v-for="role in roles" :key="role.id" class="flex items-center gap-1.5">
          <input type="checkbox" :checked="audience.roles?.includes(role.name)" @change="toggle('roles', role.name)">{{ role.name }}
        </label>
      </div>
    </fieldset>
    <fieldset :disabled="disabled">
      <legend class="font-medium">邮件语言</legend>
      <div class="mt-2 flex flex-wrap gap-3">
        <label v-for="locale in locales" :key="locale" class="flex items-center gap-1.5">
          <input type="checkbox" :checked="audience.locales?.includes(locale as AdminMailLocale)" @change="toggle('locales', locale)">{{ localeName(locale) }}
        </label>
      </div>
    </fieldset>
    <div class="flex flex-wrap items-end gap-4">
      <label class="block">最近几天内登录过
        <input type="number" min="1" max="3650" :value="audience.active_within_days ?? ''" :disabled="disabled" placeholder="不限" :class="[field, 'mt-1 block w-32']" @change="set('active_within_days', ($event.target as HTMLInputElement).value)">
      </label>
      <label class="block">注册日期从
        <input type="date" :value="audience.joined_from ?? ''" :disabled="disabled" :class="[field, 'mt-1 block']" @change="set('joined_from', ($event.target as HTMLInputElement).value)">
      </label>
      <label class="block">注册日期至
        <input type="date" :value="audience.joined_to ?? ''" :disabled="disabled" :class="[field, 'mt-1 block']" @change="set('joined_to', ($event.target as HTMLInputElement).value)">
      </label>
    </div>
    <div class="rounded-lg bg-slate-50 p-4" role="status" aria-live="polite">
      <p v-if="!categoryId" class="text-slate-500">先选择类型，才能统计收件人。</p>
      <p v-else-if="countError" class="text-red-700">{{ countError }}</p>
      <template v-else-if="stats">
        <p class="text-base">预计 {{ stats.total }} 人收到<span v-if="counting" class="ml-2 text-xs text-slate-400">统计中…</span></p>
        <p v-if="Object.keys(stats.by_locale).length" class="mt-1 text-xs text-slate-600">
          {{ Object.entries(stats.by_locale).map(([locale, total]) => `${localeName(locale)} ${total}`).join(' · ') }}
        </p>
        <p class="mt-1 text-xs text-slate-500">已排除：禁用账号 {{ stats.excluded.inactive }} 人，未订阅 {{ stats.excluded.unsubscribed }} 人，退信名单 {{ stats.excluded.suppressed }} 人</p>
      </template>
      <p v-else class="text-slate-400">统计中…</p>
    </div>
  </div>
</template>
