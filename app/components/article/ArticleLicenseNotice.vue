<template>
  <section v-if="article.is_repost || info" id="article-license" class="card flex items-start gap-3 px-5 py-4">
    <span class="flex size-9 shrink-0 items-center justify-center rounded-xl" :class="article.is_repost ? 'bg-warning/15 text-warning' : 'bg-btn text-btn-content'">
      <Repeat2 v-if="article.is_repost" :size="17" />
      <Copyright v-else-if="!info?.url" :size="17" />
      <span v-else class="font-mono text-xs font-bold tracking-tight">cc</span>
    </span>

    <div v-if="article.is_repost" class="min-w-0 text-sm">
      <p class="font-semibold text-title">
        {{ article.source?.author ? t('article_ui.declaration.reposted_from', { author: article.source.author }) : t('article_ui.declaration.reposted_unknown') }}
      </p>
      <a v-if="article.source?.url" :href="article.source.url" target="_blank" rel="noopener nofollow ugc" class="link mt-0.5 inline-flex max-w-full items-center gap-1">
        <span class="truncate">{{ article.source.url }}</span><ExternalLink :size="12" class="shrink-0" />
      </a>
    </div>

    <div v-else-if="info" class="min-w-0 text-sm">
      <p class="text-xs text-meta">{{ t('article_ui.declaration.license_of') }}</p>
      <p class="mt-0.5 font-semibold text-title">
        {{ t(`article_ui.licenses.${info.key}.name`) }}<span v-if="info.url" class="ml-1.5 font-mono text-xs font-normal text-meta">{{ info.short }}</span>
      </p>
      <p class="mt-1 text-body">{{ t(`article_ui.licenses.${info.key}.summary`) }}</p>
      <ArticleLicensePermissions :info="info" class="mt-2" />
      <a v-if="deedUrl" :href="deedUrl" target="_blank" rel="license noopener" class="link mt-2 inline-flex max-w-full items-center gap-1 text-xs">
        <span class="truncate">{{ deedUrl }}</span><ExternalLink :size="11" class="shrink-0" />
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ArticleDetail } from '~/types/article'
import { Copyright, ExternalLink, Repeat2 } from '@lucide/vue'
import { articleLicense, licenseDeedUrl } from '~/utils/articleLicenses'

/** The end of an article: its license, or where a repost comes from (docs/articles/README.md#协议与转载). */
const props = defineProps<{ article: Pick<ArticleDetail, 'license' | 'is_repost' | 'source'> }>()
const { t, locale } = useI18n()

const info = computed(() => props.article.is_repost ? null : articleLicense(props.article.license))
const deedUrl = computed(() => info.value ? licenseDeedUrl(info.value, locale.value) : null)
</script>
