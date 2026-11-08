<template>
  <CatalogSection :title="$t('shouts.title')" :icon="MessageSquareQuote">
    <template #actions>{{ $t('shouts.count', { count: total }) }}</template>

    <!-- Like the album page's 留言: the viewer's own shout on top; else, with shouts below, the button that opens the
         Markdown editor in a dialog. With none at all, only that button, centred. -->
    <div v-if="isAuthenticated && mine" class="border-b border-line px-5 py-4">
      <div class="rounded-md bg-black/[0.03] px-3 py-2.5 dark:bg-white/[0.04]">
        <p class="mb-1 text-xs font-semibold text-title">{{ $t('shouts.mine') }}</p>
        <RichContent :content="mine.content" format="markdown" class="text-sm" />
        <div class="mt-1.5 flex gap-1.5">
          <UiButton size="xs" @click="openEditor">{{ $t('common.edit') }}</UiButton>
          <UiButton variant="danger-soft" size="xs" @click="remove">{{ $t('common.delete') }}</UiButton>
        </div>
      </div>
    </div>
    <div v-else-if="shouts.length" class="border-b border-line px-5 py-3">
      <UiButton v-if="isAuthenticated" variant="primary" size="xs" :icon="PenLine" @click="openEditor">{{ $t('shouts.write') }}</UiButton>
      <UiButton v-else :to="loginPath" size="xs">{{ $t('shouts.login') }}</UiButton>
    </div>

    <ul v-if="shouts.length" class="divide-y divide-line">
      <li v-for="shout in shouts" :key="shout.id" class="flex gap-3 px-5 py-4">
        <NuxtLink :to="`/profile/${shout.user?.username}`" class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-sunken">
          <img v-if="shout.user?.avatar_url" :src="shout.user.avatar_url" :alt="shout.user.nickname" class="h-full w-full object-cover">
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-center gap-x-2 text-xs">
            <NuxtLink :to="`/profile/${shout.user?.username}`" class="font-semibold text-body transition-colors duration-150 ease-out hover:text-primary">{{ shout.user?.nickname || shout.user?.username }}</NuxtLink>
            <time class="text-meta" :datetime="shout.updated_at" :title="exact(shout.updated_at)">{{ ago(shout.updated_at) }}</time>
            <UiButton
              v-if="isAuthenticated && shout.user?.username !== user?.username"
              size="xs"
              :icon="Flag"
              :label="$t('shouts.report')"
              class="ml-auto"
              @click="reporting = shout"
            />
          </p>
          <div class="relative mt-1" :class="{ 'max-h-56 overflow-hidden': isLong(shout) && !expanded.has(shout.id) }">
            <RichContent :content="shout.content" format="markdown" class="text-sm" />
            <div v-if="isLong(shout) && !expanded.has(shout.id)" class="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-card" />
          </div>
          <UiButton v-if="isLong(shout)" size="xs" class="mt-1" @click="toggleExpanded(shout.id)">
            {{ $t(expanded.has(shout.id) ? 'reviews.collapse' : 'reviews.expand') }}
          </UiButton>
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
    <div v-else class="flex justify-center px-5 pb-6 pt-4">
      <UiButton v-if="isAuthenticated" variant="primary" size="xs" :icon="PenLine" @click="openEditor">{{ $t('shouts.write') }}</UiButton>
      <UiButton v-else :to="loginPath" size="xs">{{ $t('shouts.login') }}</UiButton>
    </div>

    <div v-if="page < lastPage" class="border-t border-line px-5 py-2 text-center">
      <UiButton size="xs" :disabled="pending" @click="loadMore">{{ $t('shouts.more') }}</UiButton>
    </div>
  </CatalogSection>

  <ShoutEditorModal v-if="editorOpen" :id="id" :resource="resource" :content="mine?.content" @close="editorOpen = false" @saved="onSaved" />

  <dialog class="modal" :open="!!reporting">
    <div class="modal-box max-w-sm">
      <h3 class="mb-3 font-bold text-title">{{ $t('shouts.report') }}</h3>
      <UiSelect v-model="reportReason" :options="reportReasonOptions" size="sm" class="mb-2 w-full" />
      <textarea v-model="reportNote" rows="2" class="textarea w-full text-sm" :placeholder="$t('shouts.report_note')" />
      <div class="modal-action">
        <UiButton size="sm" @click="reporting = null">{{ $t('common.cancel') }}</UiButton>
        <UiButton variant="danger" size="sm" @click="report">{{ $t('shouts.report') }}</UiButton>
      </div>
    </div>
    <div class="modal-backdrop bg-black/50" @click="reporting = null" />
  </dialog>
</template>

<script setup lang="ts">
import type { Shout, ShoutPage } from '~/types/shout'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { Flag, MessageSquareQuote, PenLine } from '@lucide/vue'

const props = defineProps<{ resource: 'artists', id: number }>()

const REPORT_REASONS = ['spam', 'abuse', 'spoiler', 'off_topic', 'infringement', 'illegal', 'other'] as const

const { $api } = useNuxtApp()
const { t } = useI18n()
const route = useRoute()
const { isAuthenticated, user } = useAuth()
const { ago, exact } = useRelativeTime()
const { localizeError } = useLocalizedApiError()
const { showToast } = useToast()

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

const loginPath = computed(() => `/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)

const expanded = ref(new Set<number>())
const isLong = (shout: Shout) => shout.content.length > 600 || shout.content.split('\n').length > 12
const toggleExpanded = (id: number) => {
  const next = new Set(expanded.value)
  if (!next.delete(id)) next.add(id)
  expanded.value = next
}

const editorOpen = ref(false)
const openEditor = () => { editorOpen.value = true }
const onSaved = async () => {
  editorOpen.value = false
  await load()
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
