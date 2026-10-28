<script setup lang="ts">
import type { GuideDoc, GuideKind } from '~/guides'

/**
 * A guide page, laid out like the legal documents: the hero (title, intro, an illustration, when it last changed and
 * the switch between the guides), then the table of contents beside the numbered sections and two closing cards. Readers whose language the guide isn't written in yet get the text it is written in, with a
 * note saying so; the page's lang follows the text. useDocReading follows the reading position for both tables of
 * contents.
 */
const props = defineProps<{ doc: GuideDoc, kind: GuideKind }>()
const { t, locale } = useI18n()

const GUIDES = {
  design: { to: '/help/design', icon: 'lucide:blocks', title: 'about_page.guide_basics_title', tag: 'about_page.guide_basics_tag' },
  editor: { to: '/help/editor', icon: 'lucide:square-pen', title: 'about_page.guide_submit_title', tag: 'about_page.guide_submit_tag' },
} as const

const title = computed(() => t(GUIDES[props.kind].title))
const other = computed(() => {
  const kind = props.kind === 'design' ? 'editor' : 'design'
  return { ...GUIDES[kind], title: t(GUIDES[kind].title) }
})
const guideSwitch = computed(() => (['design', 'editor'] as const).map(kind => ({
  value: kind,
  label: t(GUIDES[kind].title),
  icon: GUIDES[kind].icon,
  to: GUIDES[kind].to,
})))
const translated = computed(() => props.doc.locale === locale.value)
// The date is a calendar day: format it in UTC so no time zone moves it to the day before.
const dateFormat = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeZone: 'UTC' }))
const updated = computed(() => dateFormat.value.format(new Date(`${props.doc.updated}T00:00:00Z`)))

const root = useTemplateRef<HTMLElement>('root')
const content = useTemplateRef<HTMLElement>('content')
useRevealOnScroll(root)
const { active, progress, flashId, navigate, followLink } = useDocReading(content, () => props.doc.sections.map(section => section.id))
</script>

<template>
  <!-- One width for the hero and the text: wider than 6xl, lines of the text would get too long to read. -->
  <div ref="root" class="container mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10" @click="followLink">
    <header class="rounded-lg bg-card p-5 md:px-7 md:py-6">
      <div class="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_13rem] lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
        <div class="min-w-0">
          <p class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-medium text-primary">
            <span class="eyebrow-line h-px w-6 bg-primary" aria-hidden="true" />
            {{ t('about_page.guides_title') }}
            <span class="text-faint" aria-hidden="true">/</span>
            <span class="text-meta">{{ t(GUIDES[kind].tag) }}</span>
          </p>
          <h1 class="mt-3 text-2xl font-bold leading-tight tracking-tight text-title md:text-[2rem]">
            <span class="sr-only">{{ title }}</span>
            <span aria-hidden="true"><span v-for="(char, index) in title" :key="index" class="char" :style="{ '--i': index }">{{ char }}</span></span>
          </h1>
          <p class="intro mt-3 max-w-2xl text-[15px] leading-7 text-body" :lang="doc.locale">{{ doc.intro }}</p>
        </div>

        <!-- Left out on phones, where it would only push the switch further down. -->
        <div class="art-host accent hidden aspect-15/8 w-full overflow-hidden rounded-md bg-sunken ring-1 ring-line md:block" style="--shift: 0">
          <GuideArtDesign v-if="kind === 'design'" />
          <GuideArtEditor v-else />
        </div>
      </div>

      <!-- The switch drops to its own line when it and the notes don't fit side by side. -->
      <div class="intro mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
        <p class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-meta">
          <span class="flex items-center gap-1.5">
            <Icon name="lucide:history" class="size-4" />
            {{ t('guide.updated') }}
            <time :datetime="doc.updated" class="text-body">{{ updated }}</time>
          </span>
          <span v-if="!translated" class="flex items-center gap-1.5">
            <Icon name="lucide:languages" class="size-4" />
            {{ t('guide.source_language') }}
          </span>
        </p>
        <UiSegmented :model-value="kind" :items="guideSwitch" :label="t('guide.switch_label')" />
      </div>
    </header>

    <div class="mt-6 md:mt-8 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[12rem_minmax(0,1fr)]">
      <aside class="hidden rounded-lg bg-card p-2 lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100vh-6rem)] lg:self-start" :lang="doc.locale">
        <DocToc
          class="w-full"
          :sections="doc.sections"
          :active="active"
          :label="t('guide.toc')"
          @navigate="navigate"
        />
      </aside>

      <div class="min-w-0">
        <DocTocBar
          class="lg:hidden"
          :lang="doc.locale"
          :sections="doc.sections"
          :active="active"
          :progress="progress"
          :label="t('guide.toc')"
          @navigate="navigate"
        />
        <div ref="content" class="space-y-4 pt-2 md:space-y-5 lg:pt-0" :lang="doc.locale">
          <GuideSection
            v-for="(section, index) in doc.sections"
            :key="section.id"
            :section="section"
            :index="index"
            :flash="flashId === section.id"
          />
        </div>

        <footer class="mt-4 grid gap-4 sm:grid-cols-2 md:mt-5 md:gap-5">
          <NuxtLink to="/discussions" class="group flex flex-col rounded-lg bg-card p-5 transition-colors duration-150 ease-out hover:bg-card-hover">
            <span class="flex items-center gap-2 font-semibold text-title">
              <Icon name="lucide:message-circle" class="size-4 text-primary" />
              {{ t('guide.questions_title') }}
            </span>
            <span class="mt-1.5 text-sm leading-6 text-body">{{ t('guide.questions_text') }}</span>
            <span class="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-primary">
              {{ t('guide.ask') }}
              <Icon name="lucide:arrow-right" class="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
            </span>
          </NuxtLink>
          <NuxtLink :to="other.to" class="group flex flex-col rounded-lg bg-card p-5 transition-colors duration-150 ease-out hover:bg-card-hover">
            <span class="text-xs font-medium text-meta">{{ t('legal.next_doc') }}</span>
            <span class="mt-2 flex items-center gap-2 font-semibold text-title">
              <Icon :name="other.icon" class="size-4 text-primary" />
              {{ other.title }}
            </span>
            <span class="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-primary">
              {{ t('legal.read_next') }}
              <Icon name="lucide:arrow-right" class="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
            </span>
          </NuxtLink>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The hero comes in like the legal documents': the short line wipes out, the title rises character by character. */
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
