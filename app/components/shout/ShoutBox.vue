<template>
  <CatalogSection :title="$t('shouts.title')" :icon="MessageSquareQuote">
    <template #actions>{{ $t('shouts.count', { count: total }) }}</template>

    <div class="space-y-3 border-b border-line px-5 py-4">
      <template v-if="isAuthenticated">
        <div v-if="editing || !mine">
          <textarea
            v-model="draft"
            rows="2"
            :maxlength="SHOUT_MAX_LENGTH"
            class="textarea field-sizing-content max-h-60 min-h-16 w-full text-sm"
            :placeholder="$t('shouts.placeholder')"
          />
          <div class="mt-1 flex items-center gap-2">
            <span class="text-[11px] tabular-nums text-meta">{{ draft.length }} / {{ SHOUT_MAX_LENGTH }}</span>
            <span v-if="errorMessage" class="text-xs text-danger">{{ errorMessage }}</span>
            <button v-if="mine" type="button" class="btn btn-ghost btn-xs ml-auto" @click="editing = false">{{ $t('common.cancel') }}</button>
            <button type="button" class="btn btn-primary btn-xs" :class="{ 'ml-auto': !mine }" :disabled="saving || !draft.trim()" @click="save">
              {{ $t(mine ? 'shouts.update' : 'shouts.post') }}
            </button>
          </div>
        </div>
        <div v-else class="rounded-lg bg-primary/10 px-3 py-2 text-sm">
          <p class="mb-1 text-[11px] font-semibold text-primary">{{ $t('shouts.mine') }}</p>
          <p class="whitespace-pre-line text-title">{{ mine.content }}</p>
          <div class="mt-1 flex gap-3 text-[11px] text-meta">
            <button type="button" class="link link-muted" @click="startEdit">{{ $t('common.edit') }}</button>
            <button type="button" class="text-danger hover:underline" @click="remove">{{ $t('common.delete') }}</button>
          </div>
        </div>
      </template>
      <p v-else class="text-sm text-meta">
        <NuxtLink :to="`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`" class="link">{{ $t('shouts.login') }}</NuxtLink>
      </p>
    </div>

    <ul v-if="shouts.length" class="divide-y divide-line">
      <li v-for="shout in shouts" :key="shout.id" class="flex gap-3 px-5 py-3">
        <NuxtLink :to="`/profile/${shout.user?.username}`" class="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sunken">
          <img v-if="shout.user?.avatar_url" :src="shout.user.avatar_url" :alt="shout.user.nickname" class="h-full w-full object-cover">
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-center gap-x-2 text-xs">
            <NuxtLink :to="`/profile/${shout.user?.username}`" class="font-semibold text-body transition-colors duration-150 ease-out hover:text-primary">{{ shout.user?.nickname || shout.user?.username }}</NuxtLink>
            <time class="text-meta" :datetime="shout.updated_at" :title="exact(shout.updated_at)">{{ ago(shout.updated_at) }}</time>
            <button
              v-if="isAuthenticated && shout.user?.username !== user?.username"
              type="button"
              class="ml-auto text-faint transition-colors duration-150 ease-out hover:text-primary"
              :title="$t('shouts.report')"
              @click="reporting = shout"
            ><Flag :size="12" /></button>
          </p>
          <p class="mt-0.5 whitespace-pre-line wrap-break-word text-sm text-title">{{ shout.content }}</p>
        </div>
      </li>
    </ul>
    <SkeletonStatus v-else-if="pending" class="divide-y divide-line">
      <div v-for="row in 2" :key="row" class="flex gap-3 px-5 py-3">
        <div class="skeleton size-8 shrink-0 rounded-full" />
        <div class="flex-1 space-y-2 pt-0.5">
          <div class="skeleton h-2.5 w-28 rounded-full" />
          <div class="skeleton h-3 rounded-full" :class="row === 1 ? 'w-3/4' : 'w-1/2'" />
        </div>
      </div>
    </SkeletonStatus>
    <p v-else class="px-5 py-6 text-center text-sm text-meta">{{ $t('shouts.empty') }}</p>

    <div v-if="page < lastPage" class="border-t border-line px-5 py-2 text-center">
      <button type="button" class="btn btn-ghost btn-xs" :disabled="pending" @click="loadMore">{{ $t('shouts.more') }}</button>
    </div>
  </CatalogSection>

  <dialog class="modal" :open="!!reporting">
    <div class="modal-box max-w-sm">
      <h3 class="mb-3 font-bold text-title">{{ $t('shouts.report') }}</h3>
      <UiSelect v-model="reportReason" :options="reportReasonOptions" size="sm" class="mb-2 w-full" />
      <textarea v-model="reportNote" rows="2" class="textarea w-full text-sm" :placeholder="$t('shouts.report_note')" />
      <div class="modal-action">
        <button type="button" class="btn btn-ghost btn-sm" @click="reporting = null">{{ $t('common.cancel') }}</button>
        <button type="button" class="btn btn-sm btn-error" @click="report">{{ $t('shouts.report') }}</button>
      </div>
    </div>
    <div class="modal-backdrop bg-black/50" @click="reporting = null" />
  </dialog>
  <CommonToast :toast="toast" />
</template>

<script setup lang="ts">
import type { Shout, ShoutPage } from '~/types/shout'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { SHOUT_MAX_LENGTH } from '~/types/shout'
import { Flag, MessageSquareQuote } from '@lucide/vue'

const props = defineProps<{ resource: 'artists', id: number }>()

const REPORT_REASONS = ['spam', 'abuse', 'spoiler', 'off_topic', 'infringement', 'illegal', 'other'] as const

const { $api } = useNuxtApp()
const { t } = useI18n()
const route = useRoute()
const { isAuthenticated, user } = useAuth()
const { ago, exact } = useRelativeTime()
const { localizeError } = useLocalizedApiError()
const { toast, showToast } = useToast()

const shouts = ref<Shout[]>([])
const mine = ref<Shout | null>(null)
const total = ref(0)
const page = ref(1)
const lastPage = ref(1)
// True until the first page is in, so the empty note doesn't flash first.
const pending = ref(true)

const load = async (at = 1) => {
  pending.value = true
  try {
    const result = await $api<ShoutPage>(`/v1/${props.resource}/${props.id}/shouts`, { params: { page: at } })
    shouts.value = at === 1 ? result.shouts : [...shouts.value, ...result.shouts]
    mine.value = result.mine
    total.value = result.pagination.total
    page.value = result.pagination.current_page
    lastPage.value = result.pagination.last_page
  } finally {
    pending.value = false
  }
}
const loadMore = () => load(page.value + 1)
// On client-side navigation start at once; after a server render, wait until hydration is done.
if (import.meta.client && !useNuxtApp().isHydrating) load()
else onMounted(() => load())

const draft = ref('')
const editing = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const startEdit = () => {
  draft.value = mine.value?.content ?? ''
  editing.value = true
}

const save = async () => {
  saving.value = true
  errorMessage.value = ''
  try {
    mine.value = await $api<Shout>(`/v1/${props.resource}/${props.id}/shout`, { method: 'PUT', body: { content: draft.value } })
    editing.value = false
    draft.value = ''
    await load()
  } catch (error) {
    errorMessage.value = localizeError(error)
  } finally {
    saving.value = false
  }
}

const remove = async () => {
  if (!confirm(t('shouts.delete_confirm'))) return
  try {
    await $api(`/v1/${props.resource}/${props.id}/shout`, { method: 'DELETE' })
    mine.value = null
    await load()
  } catch (error) {
    showToast(localizeError(error), 'error')
  }
}

const reporting = ref<Shout | null>(null)
const reportReason = ref<typeof REPORT_REASONS[number]>('spam')
const reportReasonOptions = computed<UiSelectOption<typeof REPORT_REASONS[number]>[]>(() => REPORT_REASONS.map(reason => ({ value: reason, label: t(`shouts.reasons.${reason}`) })))
const reportNote = ref('')
const report = async () => {
  if (!reporting.value) return
  try {
    await $api(`/v1/shouts/${reporting.value.id}/reports`, { method: 'POST', body: { reason: reportReason.value, note: reportNote.value || null } })
    showToast(t('shouts.reported'))
  } catch (error) {
    showToast(localizeError(error), 'error')
  } finally {
    reporting.value = null
    reportNote.value = ''
  }
}
</script>
