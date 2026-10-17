<script setup lang="ts">
/**
 * The syntax guide the editor's help banner points at. Every example is
 * generated from `markdownContainers` and rendered through `RichContent`, so
 * adding a container to the catalogue documents it here automatically.
 *
 * SEO is deliberately left to the host: mount this in your own page and call
 * whatever head/meta helper you already use.
 */
import { computed, onUnmounted, ref } from 'vue'
import { Check, Clipboard, ExternalLink, List, ShieldCheck } from 'lucide'
import RichContent from './RichContent.vue'
import MdIcon from './internal/MdIcon.vue'
import { useMarkdownT } from '~/utils/markdownI18n'
import { markdownContainers, type MarkdownContainerName, type MarkdownEnv } from '~/utils/markdown'

const props = withDefaults(defineProps<{
  /** Small eyebrow above the title, e.g. your product name. Hidden when empty. */
  brand?: string
  /** Image used by the sizing examples. Must be servable from the host. */
  imageSrc?: string
  /** Alt text for that image — it is visible in the example's Markdown source. */
  imageAlt?: string
}>(), { brand: '', imageSrc: '/logo.png', imageAlt: 'Logo' })

const { t } = useMarkdownT()
const underlineExampleColors = ['slate', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'] as const
const textSizeExamples = ['small', 'large', 'xlarge'] as const

const basics = computed(() => [
  { label: t('markdown.help.basic.heading'), source: '# H1\n## H2\n### H3\n#### H4' },
  { label: t('markdown.help.basic.list'), source: '- Item\n- Item\n\n1. First\n2. Second' },
  { label: t('markdown.help.basic.link'), source: '[CommonMark](https://commonmark.org)' },
  { label: t('markdown.help.basic.emphasis'), source: '**Bold** and *italic* and ~~strike~~' },
  { label: t('markdown.help.basic.task'), source: '- [x] Complete\n- [ ] Remaining' },
  { label: t('markdown.help.basic.quote'), source: '> A useful note\n> Supporting details continue here.\n> The final line stays in the same quote.' },
  { label: t('markdown.help.basic.code'), source: '`inline code`\n\n```\ncode block\n```' },
])

const inlineFormatting = computed(() => [
  {
    label: t('markdown.help.formatting.mark'),
    source: `${t('markdown.help.formatting.outerSample')}==${t('markdown.help.formatting.sample')}==${t('markdown.help.formattingSampleAfter')}`,
  },
  { label: t('markdown.help.formatting.color'), source: `[${t('markdown.help.formatting.sample')}]{color=red}` },
  {
    label: t('markdown.help.formatting.size'),
    source: `${t('markdown.help.formatting.outerSample')} ${textSizeExamples
      .map(size => `[${t(`markdown.editor.sizes.${size}`)}]{size=${size}}`)
      .join(' ')}`,
  },
  {
    label: t('markdown.help.formatting.underline'),
    source: `${t('markdown.help.formatting.outerSample')}[${t('markdown.editor.colors.slate')}]{underline=slate}${t('markdown.help.formattingSampleAfter')}\n${underlineExampleColors
      .filter(color => color !== 'slate')
      .map(color => `[${t(`markdown.editor.colors.${color}`)}]{underline=${color}}`)
      .join(' ')}`,
  },
])

const attributeExamples = computed(() => [
  {
    label: t('markdown.help.formatting.combined.title'),
    description: t('markdown.help.formatting.combined.description'),
    badge: t('markdown.help.formatting.recommended'),
    badgeClass: 'bg-emerald-50 text-emerald-700',
    source: `[${t('markdown.help.formatting.sample')}]{color=red size=large}`,
  },
  {
    label: t('markdown.help.formatting.nested.title'),
    description: t('markdown.help.formatting.nested.description'),
    badge: t('markdown.help.formatting.supported'),
    badgeClass: 'bg-sky-50 text-sky-700',
    source: `[${t('markdown.help.formatting.outerSample')} [${t('markdown.help.formatting.innerSample')}]{color=red}]{size=large}`,
  },
  {
    label: t('markdown.help.formatting.avoid.title'),
    description: t('markdown.help.formatting.avoid.description'),
    badge: t('markdown.help.formatting.notRecommended'),
    badgeClass: 'bg-amber-50 text-amber-700',
    source: `[[${t('markdown.help.formatting.sample')}]{color=red}]{size=large}`,
  },
])

const nestedExample = computed(() => `:::: details ${t('markdown.editor.placeholders.title')}\n::: warning ${t('markdown.blocks.warning.defaultTitle')}\n${t('markdown.editor.placeholders.content')}\n:::\n::::`)
const inlineSpoilerExample = computed(() => `${t('markdown.help.spoilers.inlineBefore')}||${t('markdown.help.spoilers.inlineSample')}||${t('markdown.help.spoilers.inlineAfter')}`)
const imageSizingExamples = computed(() => {
  const image = `![${props.imageAlt}](${props.imageSrc})`
  return [
    { label: t('markdown.help.basic.image'), source: image },
    { label: t('markdown.help.images.width'), source: `${image}{width=48}` },
    { label: t('markdown.help.images.height'), source: `${image}{height=88}` },
    { label: t('markdown.help.images.both'), source: `${image}{width=112 height=48}` },
  ]
})

const containerExamples = computed<Record<MarkdownContainerName, string>>(() => ({
  details: `::: details ${t('markdown.help.advanced.examples.detailsTitle')}\n${t('markdown.help.advanced.examples.detailsBody')}\n:::`,
  info: `::: info ${t('markdown.help.advanced.examples.infoTitle')}\n${t('markdown.help.advanced.examples.infoBody')}\n:::`,
  tip: `::: tip ${t('markdown.help.advanced.examples.tipTitle')}\n${t('markdown.help.advanced.examples.tipBody')}\n:::`,
  warning: `::: warning ${t('markdown.help.advanced.examples.warningTitle')}\n${t('markdown.help.advanced.examples.warningBody')}\n:::`,
  danger: `::: danger ${t('markdown.help.advanced.examples.dangerTitle')}\n${t('markdown.help.advanced.examples.dangerBody')}\n:::`,
  checklist: `::: checklist ${t('markdown.help.advanced.examples.checklistTitle')}\n- [x] ${t('markdown.help.advanced.examples.checklistDone')}\n- [ ] ${t('markdown.help.advanced.examples.checklistPending')}\n- [ ] ${t('markdown.help.advanced.examples.checklistOptional')}\n:::`,
  steps: `::: steps\n1. ${t('markdown.help.advanced.examples.stepsFirst')}\n2. ${t('markdown.help.advanced.examples.stepsSecond')}\n3. ${t('markdown.help.advanced.examples.stepsThird')}\n:::`,
  spoiler: `::: spoiler ${t('markdown.help.advanced.examples.spoilerTitle')}\n${t('markdown.help.advanced.examples.spoilerBody')}\n:::`,
}))

// The discussion examples render against sample summaries, as a real post would
// against the references the API returns with it.
const discussionEnv = computed<MarkdownEnv>(() => ({
  references: {
    users: { example_user: { id: 0, username: 'example_user', nickname: t('markdown.help.discussion.sampleUser'), avatar_url: null } },
    posts: { 1024: { id: 1024, topic_id: 1, topic_title: '', floor: 12, parent_floor: null, user: { username: 'example_user', nickname: t('markdown.help.discussion.sampleUser') }, status: 'visible' } },
    albums: { 1: { type: 'album', id: 1, title: t('markdown.help.discussion.sampleAlbum'), image_url: null, date: '2002-08-11' } },
  },
}))
const discussionExamples = computed(() => [
  { label: t('markdown.help.discussion.mention'), hint: t('markdown.help.discussion.mentionHint'), source: '@example_user' },
  { label: t('markdown.help.discussion.quote'), hint: t('markdown.help.discussion.quoteHint'), source: `::: quote post:1024\n${t('markdown.help.advanced.examples.tipBody')}\n:::` },
  { label: t('markdown.help.discussion.ref'), hint: t('markdown.help.discussion.refHint'), source: '[[album:1]]\n\n…[[album:1]]…' },
])

function containerExample(name: MarkdownContainerName) {
  return containerExamples.value[name]
}

// The package owns no toast surface, so the button itself is the confirmation.
const copiedSource = ref('')
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy(source: string) {
  try {
    await navigator.clipboard.writeText(source)
    copiedSource.value = source
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => { copiedSource.value = '' }, 1500)
  }
  catch {
    copiedSource.value = ''
  }
}

const copyLabel = (source: string) =>
  copiedSource.value === source ? t('markdown.help.copied') : t('markdown.help.copy')

onUnmounted(() => clearTimeout(copiedTimer))
</script>

<template>
  <div class="space-y-8">
    <header class="overflow-hidden rounded-2xl bg-slate-950 px-5 py-9 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-12">
      <div class="max-w-2xl">
        <p v-if="brand" class="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">{{ brand }}</p>
        <h1 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{{ t('markdown.help.title') }}</h1>
        <p class="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">{{ t('markdown.help.lead') }}</p>
      </div>
    </header>

    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 class="text-xl font-bold text-slate-900">{{ t('markdown.help.basic.title') }}</h2>
      <p class="mt-1 text-sm text-slate-500">{{ t('markdown.help.basic.description') }}</p>
      <div class="mt-4 flex gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3 text-sm leading-6 text-sky-900">
        <MdIcon :icon="List" class="mt-1 size-4 shrink-0 text-sky-600" />
        <p>{{ t('markdown.help.basic.headingTocHint') }}</p>
      </div>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <article v-for="example in basics" :key="example.label" class="overflow-hidden rounded-lg border border-slate-200">
          <div class="flex items-center justify-between bg-slate-50 px-3 py-2">
            <h3 class="text-xs font-semibold text-slate-700">{{ example.label }}</h3>
            <button type="button" :aria-label="copyLabel(example.source)" class="text-slate-400 hover:text-slate-800" @click="copy(example.source)">
              <MdIcon :icon="copiedSource === example.source ? Check : Clipboard" class="size-3.5" />
            </button>
          </div>
          <pre class="overflow-x-auto border-b border-slate-100 p-3 text-xs leading-6 text-slate-700"><code>{{ example.source }}</code></pre>
          <div class="bg-slate-50/30 p-3">
            <span class="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{{ t('markdown.help.result') }}</span>
            <RichContent :content="example.source" format="markdown" />
          </div>
        </article>
      </div>
      <div class="mt-7 border-t border-slate-100 pt-6">
        <h3 class="font-bold text-slate-900">{{ t('markdown.help.images.title') }}</h3>
        <p class="mt-1 text-sm leading-6 text-slate-500">{{ t('markdown.help.images.description') }}</p>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <article v-for="example in imageSizingExamples" :key="example.label" class="overflow-hidden rounded-lg border border-slate-200">
            <div class="flex items-center justify-between bg-slate-50 px-3 py-2">
              <h4 class="text-xs font-semibold text-slate-700">{{ example.label }}</h4>
              <button type="button" :aria-label="copyLabel(example.source)" class="text-slate-400 hover:text-slate-800" @click="copy(example.source)">
                <MdIcon :icon="copiedSource === example.source ? Check : Clipboard" class="size-3.5" />
              </button>
            </div>
            <pre class="overflow-x-auto border-b border-slate-100 p-3 text-xs leading-6 text-slate-700"><code>{{ example.source }}</code></pre>
            <RichContent class="markdown-image-example p-3" :content="example.source" format="markdown" />
          </article>
        </div>
      </div>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 class="text-xl font-bold text-slate-900">{{ t('markdown.help.formatting.title') }}</h2>
      <p class="mt-1 text-sm text-slate-500">{{ t('markdown.help.formatting.description') }}</p>
      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <article v-for="example in inlineFormatting" :key="example.label" class="overflow-hidden rounded-lg border border-slate-200">
          <div class="flex items-center justify-between bg-slate-50 px-3 py-2">
            <h3 class="text-xs font-semibold text-slate-700">{{ example.label }}</h3>
            <button type="button" :aria-label="copyLabel(example.source)" class="text-slate-400 hover:text-slate-800" @click="copy(example.source)">
              <MdIcon :icon="copiedSource === example.source ? Check : Clipboard" class="size-3.5" />
            </button>
          </div>
          <pre class="overflow-x-auto border-b border-slate-100 p-3 text-xs leading-6 text-slate-700"><code>{{ example.source }}</code></pre>
          <RichContent class="p-3" :content="example.source" format="markdown" />
        </article>
      </div>

      <div class="mt-7 border-t border-slate-100 pt-6">
        <h3 class="font-bold text-slate-900">{{ t('markdown.help.formatting.attributesTitle') }}</h3>
        <p class="mt-1 text-sm leading-6 text-slate-500">{{ t('markdown.help.formatting.attributesDescription') }}</p>
        <div class="mt-4 grid gap-4 lg:grid-cols-3">
          <article v-for="example in attributeExamples" :key="example.label" class="overflow-hidden rounded-lg border border-slate-200">
            <header class="border-b border-slate-100 bg-slate-50 px-3 py-2.5">
              <div class="flex items-center justify-between gap-2">
                <h4 class="text-sm font-semibold text-slate-800">{{ example.label }}</h4>
                <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" :class="example.badgeClass">{{ example.badge }}</span>
              </div>
              <p class="mt-1 text-xs leading-5 text-slate-500">{{ example.description }}</p>
            </header>
            <div class="relative border-b border-slate-100 p-3 pr-9">
              <pre class="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-slate-700"><code>{{ example.source }}</code></pre>
              <button type="button" :aria-label="copyLabel(example.source)" class="absolute right-3 top-3 text-slate-400 hover:text-slate-800" @click="copy(example.source)">
                <MdIcon :icon="copiedSource === example.source ? Check : Clipboard" class="size-3.5" />
              </button>
            </div>
            <RichContent class="p-3" :content="example.source" format="markdown" />
          </article>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-xl font-bold text-slate-900">{{ t('markdown.help.advanced.title') }}</h2>
      <p class="mt-1 text-sm text-slate-500">{{ t('markdown.help.advanced.description') }}</p>
      <div class="mt-5 space-y-5">
        <template v-for="definition in markdownContainers" :key="definition.name">
          <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div>
                <h3 class="font-semibold text-slate-900">{{ t(definition.labelKey) }}</h3>
                <p class="mt-0.5 text-xs text-slate-400">{{ t(definition.descriptionKey) }}</p>
              </div>
              <code class="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">::: {{ definition.name }}</code>
            </header>
            <div class="grid md:grid-cols-2 md:divide-x md:divide-slate-200">
              <div class="min-w-0 bg-slate-950 p-4 text-slate-200">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{{ t('markdown.help.source') }}</span>
                  <button type="button" :aria-label="copyLabel(containerExample(definition.name))" class="text-slate-500 hover:text-white" @click="copy(containerExample(definition.name))">
                    <MdIcon :icon="copiedSource === containerExample(definition.name) ? Check : Clipboard" class="size-4" />
                  </button>
                </div>
                <pre class="overflow-x-auto whitespace-pre-wrap text-xs leading-6"><code>{{ containerExample(definition.name) }}</code></pre>
              </div>
              <div class="min-w-0 bg-slate-50/40 p-4">
                <span class="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{{ t('markdown.help.result') }}</span>
                <RichContent :content="containerExample(definition.name)" format="markdown" />
              </div>
            </div>
          </article>

          <article v-if="definition.name === 'spoiler'" class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
              <div>
                <h3 class="font-semibold text-slate-900">{{ t('markdown.editor.toolbar.inlineSpoiler') }}</h3>
                <p class="mt-0.5 text-xs text-slate-400">{{ t('markdown.help.spoilers.inline') }}</p>
              </div>
              <code class="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">|| ... ||</code>
            </header>
            <div class="grid md:grid-cols-2 md:divide-x md:divide-slate-200">
              <div class="min-w-0 bg-slate-950 p-4 text-slate-200">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{{ t('markdown.help.source') }}</span>
                  <button type="button" :aria-label="copyLabel(inlineSpoilerExample)" class="text-slate-500 hover:text-white" @click="copy(inlineSpoilerExample)">
                    <MdIcon :icon="copiedSource === inlineSpoilerExample ? Check : Clipboard" class="size-4" />
                  </button>
                </div>
                <pre class="overflow-x-auto whitespace-pre-wrap text-xs leading-6"><code>{{ inlineSpoilerExample }}</code></pre>
              </div>
              <div class="min-w-0 bg-slate-50/40 p-4">
                <span class="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{{ t('markdown.help.result') }}</span>
                <RichContent :content="inlineSpoilerExample" format="markdown" />
              </div>
            </div>
          </article>
        </template>
      </div>
    </section>

    <section class="grid gap-5 lg:grid-cols-2">
      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">{{ t('markdown.help.nesting.title') }}</h2>
        <p class="mt-1 text-sm leading-6 text-slate-500">{{ t('markdown.help.nesting.description') }}</p>
        <pre class="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs leading-6 text-slate-200"><code>{{ nestedExample }}</code></pre>
      </article>

      <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-bold text-slate-900">{{ t('markdown.help.spoilers.title') }}</h2>
        <p class="mt-1 text-sm leading-6 text-slate-500">{{ t('markdown.help.spoilers.description') }}</p>
        <ul class="mt-4 space-y-3 text-sm text-slate-600">
          <li class="flex gap-2"><MdIcon :icon="Check" class="mt-0.5 size-4 shrink-0 text-emerald-500" />{{ t('markdown.help.spoilers.whole') }}</li>
          <li class="flex gap-2"><MdIcon :icon="Check" class="mt-0.5 size-4 shrink-0 text-emerald-500" />{{ t('markdown.help.spoilers.block') }}</li>
          <li class="flex gap-2"><MdIcon :icon="Check" class="mt-0.5 size-4 shrink-0 text-emerald-500" />{{ t('markdown.help.spoilers.inline') }}</li>
        </ul>
      </article>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 class="text-xl font-bold text-slate-900">{{ t('markdown.help.discussion.title') }}</h2>
      <p class="mt-1 text-sm text-slate-500">{{ t('markdown.help.discussion.description') }}</p>
      <div class="mt-5 grid gap-4 lg:grid-cols-3">
        <article v-for="example in discussionExamples" :key="example.label" class="flex flex-col overflow-hidden rounded-lg border border-slate-200">
          <header class="border-b border-slate-100 bg-slate-50 px-3 py-2.5">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-semibold text-slate-800">{{ example.label }}</h3>
              <button type="button" :aria-label="copyLabel(example.source)" class="text-slate-400 hover:text-slate-800" @click="copy(example.source)">
                <MdIcon :icon="copiedSource === example.source ? Check : Clipboard" class="size-3.5" />
              </button>
            </div>
            <p class="mt-1 text-xs leading-5 text-slate-500">{{ example.hint }}</p>
          </header>
          <pre class="overflow-x-auto whitespace-pre-wrap border-b border-slate-100 p-3 text-xs leading-6 text-slate-700"><code>{{ example.source }}</code></pre>
          <RichContent class="flex-1 p-3" :content="example.source" :env="discussionEnv" format="markdown" />
        </article>
      </div>
      <p class="mt-4 text-xs leading-5 text-slate-500">{{ t('markdown.help.discussion.refTypes') }}</p>
    </section>

    <aside class="flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-5 text-sky-950">
      <MdIcon :icon="ShieldCheck" class="mt-0.5 size-5 shrink-0 text-sky-600" />
      <div>
        <h2 class="font-semibold">{{ t('markdown.help.security.title') }}</h2>
        <p class="mt-1 text-sm leading-6 text-sky-800">{{ t('markdown.help.security.description') }}</p>
        <a href="https://commonmark.org/help/" target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:underline">
          {{ t('markdown.help.commonMark') }}
          <MdIcon :icon="ExternalLink" class="size-3.5" />
        </a>
      </div>
    </aside>
  </div>
</template>
