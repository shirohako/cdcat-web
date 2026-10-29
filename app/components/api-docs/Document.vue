<script setup lang="ts">
import { API_DOCS_CONTEXT, createApiDocsContext } from '~/api-docs/context'
import { itemId } from '~/api-docs/keys'
import { API_DOCS_STRUCTURE } from '~/api-docs/structure'
import type { ApiDocsDoc, ApiDocsSection } from '~/api-docs/types'

/**
 * The API reference, laid out like the guides (GuideDocument): the hero (title, intro, the API illustration, the
 * beta mark, when it last changed and the base address to copy), then the table of contents beside the numbered
 * sections and a closing feedback card. The structure is the same in every language; `doc` brings the words. Reading is
 * followed over every section and every endpoint, object and enum in it, so the contents can show both levels.
 */
const props = defineProps<{ doc: ApiDocsDoc }>()
const { t, locale } = useI18n()
const config = useRuntimeConfig()
const absolute = useSiteUrl()
const { showToast } = useToast()

// This site's own API, so the dev site shows the dev API; the same on the server and in the browser.
const base = computed(() => `${String(config.public.apiBaseUrl || 'https://api.cdcat.net').replace(/\/+$/, '')}/v1`)
const site = computed(() => absolute('/').replace(/\/$/, ''))
const context = computed(() => createApiDocsContext(props.doc.texts, base.value, site.value))
provide(API_DOCS_CONTEXT, context)

const texts = computed(() => props.doc.texts)
const labels = computed(() => texts.value.labels)
const sections = computed<ApiDocsSection[]>(() => API_DOCS_STRUCTURE.sections.map((section, index) => ({
  id: section.id,
  title: texts.value.sections[section.id]?.title ?? section.id,
  short: texts.value.sections[section.id]?.short,
  lead: texts.value.sections[section.id]?.lead ?? '',
  index,
  items: section.items,
})))

/** Every anchor reading is followed over, in page order, with the section it is in. */
const anchors = computed(() => sections.value.flatMap(section => [
  { id: section.id, section: section.index, item: null as string | null },
  ...section.items.flatMap((item) => {
    const id = itemId(item)
    return id ? [{ id, section: section.index, item: id }] : []
  }),
]))

const translated = computed(() => props.doc.locale === locale.value)
// The date is a calendar day: format it in UTC so no time zone moves it to the day before.
const dateFormat = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeZone: 'UTC' }))
const updated = computed(() => dateFormat.value.format(new Date(`${props.doc.updated}T00:00:00Z`)))

const content = useTemplateRef<HTMLElement>('content')
const { active, progress, flashId, navigate, followLink } = useDocReading(content, () => anchors.value.map(anchor => anchor.id))
const activeSection = computed(() => anchors.value[active.value]?.section ?? 0)
const activeItem = computed(() => anchors.value[active.value]?.item ?? null)

const issues = String(API_DOCS_STRUCTURE.constants.issues)
const email = String(API_DOCS_STRUCTURE.constants.email)

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
async function copyBase() {
  try {
    await navigator.clipboard.writeText(base.value)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => { copied.value = false }, 1500)
  }
  catch {
    showToast(labels.value.copy_failed, 'error')
  }
}
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <!-- One width for the hero and the text, as on the guides. -->
  <div class="container mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10" @click="followLink">
    <header class="rounded-lg bg-card p-5 md:px-7 md:py-6" :lang="doc.locale">
      <div class="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_13rem] lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
        <div class="min-w-0">
          <p class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-primary">
            <span class="eyebrow-line h-px w-6 bg-primary" aria-hidden="true" />
            {{ t('about_page.docs_title') }}
            <span class="text-faint" aria-hidden="true">/</span>
            <span class="text-meta">{{ labels.tag }}</span>
          </p>
          <h1 class="mt-3 text-2xl font-bold leading-tight tracking-tight text-title md:text-[2rem]">
            <span class="sr-only">{{ texts.title }}</span>
            <span aria-hidden="true"><span v-for="(char, index) in texts.title" :key="index" class="char" :style="{ '--i': index }">{{ char }}</span></span>
          </h1>
          <p class="intro mt-3 max-w-2xl text-[15px] leading-7 text-body">{{ texts.intro }}</p>
        </div>

        <!-- Left out on phones, where it would only push the base address further down. -->
        <div class="art-host accent hidden aspect-15/8 w-full overflow-hidden rounded-md bg-sunken ring-1 ring-line md:block" style="--shift: 0">
          <AboutArtApi />
        </div>
      </div>

      <div class="intro mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
        <p class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-meta">
          <UiBadge tone="warning" :title="labels.beta_note">{{ labels.beta }}</UiBadge>
          <span class="flex items-center gap-1.5">
            <Icon name="lucide:history" class="size-4" />
            {{ t('guide.updated') }}
            <time :datetime="doc.updated" class="text-body">{{ updated }}</time>
          </span>
          <span v-if="!translated" class="flex items-center gap-1.5">
            <Icon name="lucide:languages" class="size-4" />
            {{ t('join_page.source_language') }}
          </span>
        </p>
        <div class="flex min-w-0 max-w-full items-center gap-2.5 rounded-md bg-sunken py-1 pl-3 pr-1 ring-1 ring-line">
          <span class="shrink-0 text-xs text-meta">{{ labels.base_url }}</span>
          <code class="min-w-0 truncate font-mono text-[13px] text-title">{{ base }}</code>
          <UiButton :icon="copied ? 'lucide:check' : 'lucide:copy'" :label="copied ? labels.copied : labels.copy" size="xs" @click="copyBase" />
        </div>
      </div>
    </header>

    <div class="mt-6 md:mt-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[14rem_minmax(0,1fr)]">
      <aside class="hidden rounded-lg bg-card p-2 lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100vh-6rem)] lg:self-start" :lang="doc.locale">
        <ApiDocsToc
          class="w-full"
          :sections="sections"
          :active-section="activeSection"
          :active-item="activeItem"
          :label="t('guide.toc')"
          @navigate="navigate"
        />
      </aside>

      <div class="min-w-0">
        <DocTocBar
          class="lg:hidden"
          :lang="doc.locale"
          :sections="sections"
          :active="activeSection"
          :progress="progress"
          :label="t('guide.toc')"
          @navigate="navigate"
        />
        <div ref="content" class="space-y-4 pt-2 md:space-y-5 lg:pt-0" :lang="doc.locale">
          <ApiDocsSection v-for="section in sections" :key="section.id" :section="section" :flash-id="flashId" />
        </div>

        <footer class="mt-4 md:mt-5" :lang="doc.locale">
          <div class="flex flex-col rounded-lg bg-card p-5">
            <span class="flex items-center gap-2 font-semibold text-title">
              <Icon name="lucide:message-circle" class="size-4 text-primary" />
              {{ labels.feedback_title }}
            </span>
            <span class="mt-1.5 text-sm leading-6 text-body">{{ labels.feedback_text }}</span>
            <span class="mt-auto flex flex-wrap gap-2 pt-3">
              <UiButton :href="issues" target="_blank" rel="noopener noreferrer" size="sm" icon="simple-icons:github" icon-right="lucide:arrow-up-right">
                {{ labels.feedback_issue }}
              </UiButton>
              <UiButton :href="`mailto:${email}`" size="sm" icon="lucide:mail">
                {{ labels.feedback_email }}
                <span class="font-normal text-meta">{{ email }}</span>
              </UiButton>
            </span>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<!-- The rows, chips and JSON shared by every part of the page. -->
<style src="./api-docs.css"></style>

<style scoped>
/* The hero comes in like the guides': the short line wipes out, the title rises character by character. */
.eyebrow-line {
  transform-origin: left;
  animation: wipe 500ms cubic-bezier(0.3, 0.7, 0.2, 1) backwards;
}

.char {
  display: inline-block;
  white-space: pre;
  animation: char-in 600ms cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i) * 35ms) backwards;
}

.intro {
  animation: rise 600ms cubic-bezier(0.2, 0.7, 0.2, 1) 250ms backwards;
}

@keyframes wipe {
  from { scale: 0 1; }
}

@keyframes char-in {
  from {
    opacity: 0;
    translate: 0 0.45em;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    translate: 0 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .eyebrow-line,
  .char,
  .intro {
    animation: none;
  }

  .art-host :deep(svg *) {
    transition: none !important;
    animation: none !important;
  }
}
</style>
