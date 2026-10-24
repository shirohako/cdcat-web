<script setup lang="ts">
import type { ArticleLicense, ArticleType, ContentLinkSummary, TagSummary } from '~/types/article'
import { ARTICLE_LICENSES } from '~/utils/articleLicenses'

/** The article's metadata: type, tags, summary, cover, page banner, links, rights and custom link path. */
const props = withDefaults(defineProps<{ disabled?: boolean, allowStaffTags?: boolean, errors?: Record<string, string> }>(),
  { disabled: false, allowStaffTags: false, errors: () => ({}) })
const type = defineModel<ArticleType | null>('type', { required: true })
const summary = defineModel<string>('summary', { required: true })
const coverUrl = defineModel<string>('coverUrl', { required: true })
const bannerUrl = defineModel<string>('bannerUrl', { required: true })
const slug = defineModel<string>('slug', { required: true })
const links = defineModel<ContentLinkSummary[]>('links', { required: true })
const tags = defineModel<TagSummary[]>('tags', { required: true })
const license = defineModel<ArticleLicense>('license', { required: true })
const isRepost = defineModel<boolean>('isRepost', { required: true })
const sourceUrl = defineModel<string>('sourceUrl', { required: true })
const sourceAuthor = defineModel<string>('sourceAuthor', { required: true })
const { t } = useI18n()
const { types, typeName } = useArticleTypes()
// A type deactivated since it was picked stays visible while selected; it can only go live on an article that already had it.
const typeOptions = computed(() => types.value.filter(item => item.is_active || item.key === type.value))
const coverBroken = ref(false)
watch(coverUrl, () => { coverBroken.value = false })
const isHttps = (url: string) => !url.trim() || /^https:\/\/\S+$/i.test(url.trim())
const coverIsHttps = computed(() => isHttps(coverUrl.value))
const bannerBroken = ref(false)
watch(bannerUrl, () => { bannerBroken.value = false })
const bannerIsHttps = computed(() => isHttps(bannerUrl.value))
const sourceIsWeb = computed(() => !sourceUrl.value.trim() || /^https?:\/\/\S+$/i.test(sourceUrl.value.trim()))

const label = 'block text-xs font-semibold uppercase tracking-wide text-meta'
const field = 'input w-full'
const errorText = (key: string) => props.errors[key]
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-2">
      <span :class="label">{{ t('article_ui.fields.type') }} <span class="text-danger">*</span></span>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          v-for="option in typeOptions" :key="option.key" type="button" :disabled="disabled"
          class="rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors duration-150 ease-out disabled:opacity-60"
          :class="type === option.key ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-line text-body hover:bg-card-hover'"
          :aria-pressed="type === option.key" @click="type = option.key">
          {{ typeName(option.key) }}
        </button>
      </div>
      <p v-if="errorText('type')" class="text-xs text-danger">{{ errorText('type') }}</p>
    </section>

    <section class="space-y-2">
      <span :class="label">{{ t('article_ui.fields.tags') }}</span>
      <CommonTagPicker v-model="tags" :disabled="disabled" :allow-staff="allowStaffTags" />
      <p v-if="errorText('tag_ids')" class="text-xs text-danger">{{ errorText('tag_ids') }}</p>
    </section>

    <section class="space-y-2">
      <label :class="label" for="writer-summary">{{ t('article_ui.fields.summary') }}</label>
      <textarea
        id="writer-summary" v-model="summary" rows="3" maxlength="200" :disabled="disabled" class="textarea w-full resize-none"
        :placeholder="t('article_ui.fields.summary_placeholder')" />
      <p class="flex justify-between text-[11px] text-meta">
        <span>{{ t('article_ui.fields.summary_hint') }}</span><span class="tabular-nums">{{ summary.length }}/200</span>
      </p>
    </section>

    <section class="space-y-2">
      <label :class="label" for="writer-cover">{{ t('article_ui.fields.cover') }}</label>
      <input id="writer-cover" v-model="coverUrl" type="url" inputmode="url" maxlength="500" :disabled="disabled" :class="field" placeholder="https://…">
      <p v-if="!coverIsHttps || errorText('cover_url')" class="text-xs text-danger">{{ errorText('cover_url') || t('article_ui.fields.cover_https') }}</p>
      <div v-else-if="coverUrl.trim()" class="aspect-video overflow-hidden rounded-lg border border-line bg-sunken">
        <img v-if="!coverBroken" :src="coverUrl.trim()" :alt="t('article_ui.fields.cover_preview')" class="size-full object-cover" referrerpolicy="no-referrer" @error="coverBroken = true">
        <p v-else class="grid size-full place-items-center text-xs text-meta">{{ t('article_ui.fields.cover_broken') }}</p>
      </div>
    </section>

    <section class="space-y-2">
      <label :class="label" for="writer-banner">{{ t('article_ui.fields.banner') }}</label>
      <input id="writer-banner" v-model="bannerUrl" type="url" inputmode="url" maxlength="500" :disabled="disabled" :class="field" placeholder="https://…">
      <p class="text-[11px] text-meta">{{ t('article_ui.fields.banner_hint') }}</p>
      <p v-if="!bannerIsHttps || errorText('banner_url')" class="text-xs text-danger">{{ errorText('banner_url') || t('article_ui.fields.cover_https') }}</p>
      <div v-else-if="bannerUrl.trim()" class="aspect-[3/1] overflow-hidden rounded-lg border border-line bg-sunken">
        <img v-if="!bannerBroken" :src="bannerUrl.trim()" :alt="t('article_ui.fields.banner_preview')" class="size-full object-cover" referrerpolicy="no-referrer" @error="bannerBroken = true">
        <p v-else class="grid size-full place-items-center text-xs text-meta">{{ t('article_ui.fields.cover_broken') }}</p>
      </div>
    </section>

    <section class="space-y-2">
      <span :class="label">{{ t('article_ui.fields.links') }}</span>
      <p class="text-[11px] text-meta">{{ t('article_ui.fields.links_hint') }}</p>
      <CommonContentLinkPicker v-model="links" :disabled="disabled" />
      <p v-if="errorText('links')" class="text-xs text-danger">{{ errorText('links') }}</p>
    </section>

    <section class="space-y-2">
      <span :class="label">{{ t('article_ui.declaration.title') }}</span>
      <div class="grid grid-cols-2 gap-1.5" role="radiogroup" :aria-label="t('article_ui.declaration.title')">
        <button
          v-for="repost in [false, true]" :key="String(repost)" type="button" role="radio" :disabled="disabled" :aria-checked="isRepost === repost"
          class="rounded-lg border px-2.5 py-1.5 text-sm transition-colors duration-150 ease-out disabled:opacity-60"
          :class="isRepost === repost ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-line text-body hover:bg-card-hover'"
          @click="isRepost = repost">
          {{ t(repost ? 'article_ui.declaration.repost' : 'article_ui.declaration.original') }}
        </button>
      </div>

      <template v-if="!isRepost">
        <div class="space-y-1.5" role="radiogroup" :aria-label="t('article_ui.declaration.license_of')">
          <label
            v-for="item in ARTICLE_LICENSES" :key="item.key"
            class="flex cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2 transition-colors duration-150 ease-out has-[:disabled]:cursor-default has-[:disabled]:opacity-60"
            :class="license === item.key ? 'border-primary bg-primary/10' : 'border-line hover:bg-card-hover'">
            <input v-model="license" type="radio" name="writer-license" :value="item.key" :disabled="disabled" class="radio radio-sm mt-0.5 shrink-0">
            <span class="min-w-0">
              <span class="block text-sm font-medium leading-5 text-title">{{ t(`article_ui.licenses.${item.key}.name`) }}</span>
              <span v-if="item.url" class="block font-mono text-[10px] text-meta">{{ item.short }}</span>
              <ArticleLicensePermissions :info="item" class="mt-1" />
            </span>
          </label>
        </div>
        <p class="text-[11px] text-meta">{{ t('article_ui.declaration.license_hint') }}</p>
        <p v-if="errorText('license')" class="text-xs text-danger">{{ errorText('license') }}</p>
      </template>

      <div v-else class="space-y-2">
        <label :class="label" for="writer-source-url">{{ t('article_ui.declaration.source_url') }} <span class="text-danger">*</span></label>
        <input id="writer-source-url" v-model="sourceUrl" type="url" inputmode="url" maxlength="2048" :disabled="disabled" :class="field" placeholder="https://…">
        <p v-if="!sourceIsWeb || errorText('source_url')" class="text-xs text-danger">{{ errorText('source_url') || t('article_ui.errors.source_url') }}</p>
        <label :class="label" for="writer-source-author">{{ t('article_ui.declaration.source_author') }}</label>
        <input id="writer-source-author" v-model="sourceAuthor" maxlength="100" :disabled="disabled" :class="field" :placeholder="t('article_ui.declaration.source_author_placeholder')">
        <p v-if="errorText('source_author')" class="text-xs text-danger">{{ errorText('source_author') }}</p>
        <p class="text-[11px] text-meta">{{ t('article_ui.declaration.repost_hint') }}</p>
      </div>
    </section>

    <details class="group rounded-lg border border-line">
      <summary class="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-meta transition-colors duration-150 ease-out hover:text-primary">{{ t('article_ui.fields.advanced') }}</summary>
      <div class="space-y-2 border-t border-line p-3">
        <label :class="label" for="writer-slug">{{ t('article_ui.fields.slug') }}</label>
        <input id="writer-slug" v-model="slug" maxlength="100" :disabled="disabled" :class="[field, 'font-mono']" placeholder="my-article">
        <p class="text-[11px] text-meta">{{ t('article_ui.fields.slug_hint') }}</p>
        <p v-if="errorText('slug')" class="text-xs text-danger">{{ errorText('slug') }}</p>
      </div>
    </details>
  </div>
</template>
