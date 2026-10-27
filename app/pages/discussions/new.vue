<script setup lang="ts">
import { Loader2, Send } from '@lucide/vue'
import type { ContentLinkSummary, ContentLinkType, TagSummary } from '~/types/article'
import type { DiscussionCategoryDetail, DiscussionReferences } from '~/types/discussion'
import type { UiSelectOption } from '~/components/ui/Select.vue'
import { TAG_NAME_MAX, tagErrorKey, tagPayload } from '~/utils/tags'

/**
 * Starts a topic. `?category=` preselects the category and `?link=album:123` links
 * the content the reader came from. The category's template prefills the text,
 * and everything is kept as a local draft until it is posted.
 */
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { $api } = useNuxtApp()
const { localizeError } = useLocalizedApiError()
const { flat, categoryName, canModerate } = useDiscussionCategories()
const { resolveEnv, complete } = useDiscussionAssist()
const notice = useDiscussionNotice()
const { value: draft, load, clear } = useDiscussionDraft('new-topic', () => ({ category_id: null as number | null, title: '', raw: '', tags: [] as TagSummary[], links: [] as ContentLinkSummary[] }))
const busy = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string>>({})
const appliedTemplate = ref('')

const choices = computed(() => flat.value.filter(category => !category.is_archived && (category.topic_permission === 'everyone' || canModerate.value)))
const categoryOptions = computed<UiSelectOption<number | null>[]>(() => choices.value.map(category => ({ value: category.id, label: `${category.parent_id ? '\u3000' : ''}${categoryName(category)}` })))
const selected = computed(() => flat.value.find(category => category.id === draft.value.category_id) ?? null)

onMounted(async () => {
  load()
  const fromQuery = Number(route.query.category)
  if (fromQuery && choices.value.some(category => category.id === fromQuery)) draft.value.category_id = fromQuery
  const link = /^(album|artist|entry|series|event):(\d+)$/.exec(String(route.query.link ?? ''))
  if (link && !draft.value.links.some(item => item.type === link[1] && item.id === Number(link[2]))) {
    try {
      const plural = { album: 'albums', artist: 'artists', entry: 'entries', franchise: 'franchises', event: 'events' }[link[1] as ContentLinkType]
      const response = await $api<{ references: DiscussionReferences }>('/v1/discussions/references', { method: 'POST', body: { raw: `[[${link[1]}:${link[2]}]]` } })
      const item = response.references[plural]?.[link[2]!] as ContentLinkSummary | undefined
      if (item) draft.value.links = [...draft.value.links, { type: link[1] as ContentLinkType, id: Number(link[2]), title: item.title, image_url: item.image_url ?? null, date: item.date ?? null, kind: item.kind ?? null }]
    }
    catch { /* the reader can still link it by hand */ }
  }
})

// A category's template fills an empty editor, and replaces the previous template if untouched.
watch(selected, async (category) => {
  if (!category) return
  try {
    const detail = await $api<DiscussionCategoryDetail>(`/v1/discussions/categories/${category.slug}`)
    const template = detail.topic_template ?? ''
    if (!draft.value.raw.trim() || draft.value.raw === appliedTemplate.value) {
      draft.value.raw = template
      appliedTemplate.value = template
    }
  }
  catch { /* no template */ }
})

async function submit() {
  fieldErrors.value = {}
  error.value = ''
  if (!draft.value.category_id) {
    fieldErrors.value.category_id = t('discussions.new.choose_category')
    return
  }
  busy.value = true
  try {
    const response = await $api<{ id: number }>('/v1/discussions/topics', {
      method: 'POST',
      body: {
        category_id: draft.value.category_id, title: draft.value.title.trim(), raw: draft.value.raw,
        ...tagPayload(draft.value.tags), links: draft.value.links.map(link => ({ type: link.type, id: link.id })),
      },
    })
    clear()
    notice.success(t('discussions.new.posted'))
    await router.push(`/discussions/${response.id}`)
  }
  catch (failure) {
    const details = (failure as { details?: { details?: Record<string, string[]> } }).details?.details
    if ((failure as { name?: string }).name === 'VALIDATION_FAILED' && details) {
      for (const field of Object.keys(details)) fieldErrors.value[field] = t(`discussions.new.invalid.${field}`, t('discussions.new.invalid.other'))
      const tagError = tagErrorKey(details)
      if (tagError) fieldErrors.value.tags = t(tagError, { max: TAG_NAME_MAX })
    }
    else {
      error.value = localizeError(failure)
    }
  }
  finally {
    busy.value = false
  }
}

useSeoMeta({ title: () => t('discussions.new.title'), robots: 'noindex' })
</script>

<template>
  <div class="min-h-[calc(100vh-3.5rem)]">
    <div class="container mx-auto max-w-4xl px-4 py-8 md:px-6">
      <nav class="mb-3 text-xs text-meta"><NuxtLink to="/discussions" class="transition-colors duration-150 ease-out hover:text-primary">{{ t('discussions.title') }}</NuxtLink> / {{ t('discussions.new.title') }}</nav>
      <form class="card space-y-5 p-5 sm:p-6" @submit.prevent="submit">
        <h1 class="text-xl font-bold text-title">{{ t('discussions.new.title') }}</h1>
        <label class="block text-sm font-medium text-body">
          {{ t('discussions.fields.category') }}
          <UiSelect v-model="draft.category_id" :options="categoryOptions" :placeholder="t('discussions.new.choose_category')" :invalid="Boolean(fieldErrors.category_id)" class="mt-1 w-full" />
          <span v-if="fieldErrors.category_id" class="mt-1 block text-xs text-danger">{{ fieldErrors.category_id }}</span>
          <span v-else-if="selected?.kind === 'question'" class="mt-1 block text-xs text-success">{{ t('discussions.new.question_hint') }}</span>
        </label>
        <label class="block text-sm font-medium text-body">
          {{ t('discussions.fields.title') }}
          <input v-model="draft.title" maxlength="120" class="input mt-1 w-full text-base" :class="{ 'input-error': fieldErrors.title }" :placeholder="t('discussions.new.title_placeholder')">
          <span v-if="fieldErrors.title" class="mt-1 block text-xs text-danger">{{ fieldErrors.title }}</span>
        </label>
        <div>
          <ClientOnly>
            <MarkdownEditor v-model="draft.raw" :max-length="20000" :resolve-env="resolveEnv" :complete="complete" :error="fieldErrors.raw" :placeholder="t('discussions.composer.floor_placeholder')" @submit="submit" />
          </ClientOnly>
        </div>
        <div class="grid gap-5 md:grid-cols-2">
          <div class="text-sm font-medium text-body">
            {{ t('discussions.fields.tags') }} <span class="text-xs font-normal text-meta">{{ t('discussions.new.optional') }}</span>
            <CommonTagPicker v-model="draft.tags" class="mt-1" :max="5" :allow-staff="canModerate" />
            <span v-if="fieldErrors.tags" class="mt-1 block text-xs font-normal text-danger">{{ fieldErrors.tags }}</span>
          </div>
          <div class="text-sm font-medium text-body">
            {{ t('discussions.fields.links') }} <span class="text-xs font-normal text-meta">{{ t('discussions.new.links_hint') }}</span>
            <CommonContentLinkPicker v-model="draft.links" class="mt-1" :max="10" />
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-4">
          <p v-if="error" role="alert" class="mr-auto text-sm text-danger">{{ error }}</p>
          <span v-else class="mr-auto text-xs text-meta">{{ t('discussions.new.draft_hint') }}</span>
          <NuxtLink to="/discussions" class="btn btn-ghost">{{ t('common.cancel') }}</NuxtLink>
          <button type="submit" class="btn btn-primary" :disabled="busy"><Loader2 v-if="busy" :size="15" class="animate-spin" /><Send v-else :size="15" />{{ t('discussions.new.submit') }}</button>
        </div>
      </form>
    </div>
    <DiscussionNotice />
  </div>
</template>
