<script setup lang="ts">
import { ArrowLeft, FileText, HardDrive, Plus } from '@lucide/vue'
import type { MyArticle } from '~/types/article'
import type { Pagination } from '~/types/api'

definePageMeta({ layout: 'writer', middleware: 'auth' })

/**
 * Writing a new article. With no unfinished drafts the writer opens at once; otherwise the author
 * picks a draft to continue (a server draft, or the unsaved new article kept in this browser) or
 * starts a blank one. My Articles and the article list both lead here.
 */
const { t, locale } = useI18n()
const { $api } = useNuxtApp()
const { user } = useAuth()
useHead({ title: computed(() => t('article_ui.writer.new_title')) })

const DRAFTS_SHOWN = 5
const stage = ref<'checking' | 'choose' | 'write'>('checking')
const drafts = ref<MyArticle[]>([])
const draftTotal = ref(0)
const local = ref<{ title: string, at: string } | null>(null)

onMounted(async () => {
  local.value = localNewArticleDraft(user.value?.id)
  try {
    const result = await $api<{ articles: MyArticle[], pagination: Pagination }>('/v1/me/articles', { query: { status: 'draft', per_page: DRAFTS_SHOWN } })
    drafts.value = result.articles
    draftTotal.value = result.pagination.total
  }
  catch { /* the writer still works without the list */ }
  stage.value = drafts.value.length || local.value ? 'choose' : 'write'
})

/** Starts a blank article; the unsaved one in this browser, if any, is dropped. */
function startNew() {
  clearLocalNewArticleDraft(user.value?.id)
  stage.value = 'write'
}

const date = (value: string | null) => value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : ''
</script>

<template>
  <ArticleWriter v-if="stage === 'write'" :article-id="null" />

  <div v-else class="flex min-h-dvh flex-col">
    <header class="flex shrink-0 items-center border-b border-line bg-card px-3 py-2 sm:px-4">
      <NuxtLink to="/articles/mine" class="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-meta transition-colors duration-150 ease-out hover:bg-ghost-hover hover:text-primary">
        <ArrowLeft :size="16" />{{ t('article_ui.mine.title') }}
      </NuxtLink>
    </header>

    <SkeletonStatus v-if="stage === 'checking'" page class="mx-auto w-full max-w-lg space-y-3 px-4 py-16">
      <div class="skeleton h-6 w-2/3 rounded-md" />
      <div v-for="row in 3" :key="row" class="skeleton h-14 rounded-xl" />
    </SkeletonStatus>

    <main v-else class="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
      <h1 class="text-xl font-bold text-title">{{ t('article_ui.chooser.title') }}</h1>
      <p class="mt-1 text-sm text-meta">{{ t('article_ui.chooser.description') }}</p>

      <ul class="card mt-6 divide-y divide-line overflow-hidden">
        <li v-if="local">
          <button type="button" class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active" @click="stage = 'write'">
            <HardDrive :size="16" class="shrink-0 text-warning" />
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-title">{{ local.title || t('article_ui.untitled') }}</p>
              <p class="mt-0.5 text-xs text-warning">{{ t('article_ui.chooser.local', { time: date(local.at) }) }}</p>
            </div>
            <span class="shrink-0 text-xs font-medium text-primary">{{ t('article_ui.chooser.continue') }}</span>
          </button>
        </li>
        <li v-for="article in drafts" :key="article.id">
          <NuxtLink :to="`/articles/${article.id}/edit`" class="flex items-center gap-3 px-4 py-3 transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active">
            <FileText :size="16" class="shrink-0 text-meta" />
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-title">{{ article.title || t('article_ui.untitled') }}</p>
              <p class="mt-0.5 text-xs text-meta">{{ t('article_ui.mine.updated', { time: date(article.updated_at) }) }}</p>
            </div>
            <span class="shrink-0 text-xs font-medium text-primary">{{ t('article_ui.chooser.continue') }}</span>
          </NuxtLink>
        </li>
      </ul>
      <NuxtLink v-if="draftTotal > drafts.length" to="/articles/mine?status=draft" class="link mt-2 inline-block text-xs">
        {{ t('article_ui.chooser.all_drafts', { count: draftTotal }) }}
      </NuxtLink>

      <button type="button" class="btn btn-primary mt-6 w-full" @click="startNew"><Plus :size="16" />{{ t('article_ui.chooser.new') }}</button>
      <p v-if="local" class="mt-2 text-center text-xs text-meta">{{ t('article_ui.chooser.new_drops_local') }}</p>
    </main>
  </div>
</template>
