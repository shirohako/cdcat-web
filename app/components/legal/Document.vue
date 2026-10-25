<script setup lang="ts">
import { sectionShift, type LegalDoc, type LegalKind } from '~/legal'
import { CONTACT_EMAIL } from '~/legal/constants'

/**
 * A legal document page, all on cards: the hero (title, intro, an illustration, the dates and the terms/privacy
 * switch), four "at a glance" tiles, then the table of contents beside the numbered sections and two closing cards.
 *
 * It tracks the reading position for both tables of contents: the current section is the last one whose top has
 * passed the reading line (just under the navbar, and under the mobile contents bar below lg), and how far through the
 * whole text the reader is (the mobile bar's progress line). A pick from the contents scrolls smoothly and writes the
 * #hash with history.replaceState (router.replace would make router.options.ts jump there instead); while that scroll
 * runs, the current section stays the picked one.
 */
const props = defineProps<{ doc: LegalDoc, kind: LegalKind }>()
const { t, locale } = useI18n()

const title = computed(() => t(props.kind === 'terms' ? 'legal.terms_title' : 'legal.privacy_title'))
const other = computed(() => props.kind === 'terms'
  ? { to: '/privacy', title: t('legal.privacy_title'), icon: 'lucide:shield-check' }
  : { to: '/terms', title: t('legal.terms_title'), icon: 'lucide:file-text' })
const docSwitch = computed(() => [
  { value: 'terms' as const, label: t('legal.terms_title'), icon: 'lucide:file-text', to: '/terms' },
  { value: 'privacy' as const, label: t('legal.privacy_title'), icon: 'lucide:shield-check', to: '/privacy' },
])
// The dates are calendar days: format them in UTC so no time zone moves them to the day before.
const dateFormat = computed(() => new Intl.DateTimeFormat(locale.value, { dateStyle: 'long', timeZone: 'UTC' }))
const formatDate = (day: string) => dateFormat.value.format(new Date(`${day}T00:00:00Z`))
const sectionIndex = computed(() => new Map(props.doc.sections.map((section, index) => [section.id, index])))

const root = useTemplateRef<HTMLElement>('root')
const content = useTemplateRef<HTMLElement>('content')
useRevealOnScroll(root)

const active = ref(0)
const progress = ref(0)
const flashId = ref<string | null>(null)

// The reading line: the fixed navbar, a little air, and below lg the sticky contents bar.
const NAVBAR = 64
const AIR = 16
const BAR = 60
let wide: MediaQueryList | undefined
const readingLine = () => NAVBAR + AIR + (wide?.matches ? 0 : BAR)
const clamp = (value: number) => Math.min(1, Math.max(0, value))

let frame = 0
let locked = false
let unlockTimer: ReturnType<typeof setTimeout> | undefined
let flashTimer: ReturnType<typeof setTimeout> | undefined

function track() {
  frame = 0
  const box = content.value
  const elements = props.doc.sections.map(section => document.getElementById(section.id))
  if (!box || elements.some(element => !element)) return
  const line = readingLine()
  const tops = elements.map(element => element!.getBoundingClientRect().top)
  const bounds = box.getBoundingClientRect()
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2

  if (!locked) {
    let index = 0
    tops.forEach((top, at) => { if (top - line <= 1) index = at })
    active.value = atBottom ? elements.length - 1 : index
  }
  progress.value = atBottom ? 1 : clamp((line - bounds.top) / Math.max(1, bounds.height - (window.innerHeight - line)))
}
const scheduleTrack = () => { frame ||= requestAnimationFrame(track) }

function unlockWhenSettled() {
  clearTimeout(unlockTimer)
  const unlock = () => {
    locked = false
    clearTimeout(unlockTimer)
    window.removeEventListener('scrollend', unlock)
    scheduleTrack()
  }
  window.addEventListener('scrollend', unlock, { once: true })
  // No scrollend when the target is already in place, or in browsers without the event.
  unlockTimer = setTimeout(unlock, 1000)
}

function navigate(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  const index = sectionIndex.value.get(id)
  if (index !== undefined) {
    active.value = index
    locked = true
    unlockWhenSettled()
    flashId.value = id
    clearTimeout(flashTimer)
    flashTimer = setTimeout(() => { flashId.value = null }, 900)
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - readingLine() + 1, behavior: reduced ? 'auto' : 'smooth' })
  history.replaceState(history.state, '', `#${encodeURIComponent(id)}`)
}

/**
 * RichContent renders plain <a> elements: without this, a #section link would jump and a link to the other document
 * would reload the whole site. Links that handled their own click (the contents, NuxtLinks) are left alone.
 */
function followLink(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const link = (event.target as Element).closest('a')
  const href = link?.getAttribute('href')
  if (!link || !href || link.target === '_blank') return
  if (href.startsWith('#')) {
    event.preventDefault()
    navigate(decodeURIComponent(href.slice(1)))
  }
  else if (href.startsWith('/') && !href.startsWith('//')) {
    event.preventDefault()
    void navigateTo(href)
  }
}

onMounted(() => {
  wide = window.matchMedia('(min-width: 1024px)')
  window.addEventListener('scroll', scheduleTrack, { passive: true })
  window.addEventListener('resize', scheduleTrack, { passive: true })
  track()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleTrack)
  window.removeEventListener('resize', scheduleTrack)
  cancelAnimationFrame(frame)
  clearTimeout(unlockTimer)
  clearTimeout(flashTimer)
})
// A new language moves every section.
watch(() => props.doc, () => nextTick(track))
</script>

<template>
  <!-- One width for the hero and the text: wider than 6xl, lines of the text would get too long to read. -->
  <div ref="root" class="container mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10" @click="followLink">
    <header class="rounded-lg bg-card p-5 md:px-7 md:py-6">
      <div class="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_13rem] lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12">
        <div class="min-w-0">
          <p class="flex items-center gap-2.5 text-sm font-medium text-primary">
            <span class="eyebrow-line h-px w-6 bg-primary" aria-hidden="true" />
            {{ t('legal.eyebrow') }}
          </p>
          <h1 class="mt-3 text-2xl font-bold leading-tight tracking-tight text-title md:text-[2rem]">
            <span class="sr-only">{{ title }}</span>
            <span aria-hidden="true"><span v-for="(char, index) in title" :key="index" class="char" :style="{ '--i': index }">{{ char }}</span></span>
          </h1>
          <p class="intro mt-3 max-w-2xl text-[15px] leading-7 text-body">{{ doc.intro }}</p>
        </div>

        <!-- Left out on phones, where it would only push the switch further down. -->
        <div class="art-host accent hidden aspect-15/8 w-full overflow-hidden rounded-md bg-sunken ring-1 ring-line md:block" style="--shift: 0">
          <LegalArtTerms v-if="kind === 'terms'" />
          <LegalArtPrivacy v-else />
        </div>
      </div>

      <!-- The switch drops to its own line when it and the dates don't fit side by side. -->
      <div class="intro mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-4">
        <p class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-meta">
          <span class="flex items-center gap-1.5">
            <Icon name="lucide:calendar" class="size-4" />
            {{ t('legal.effective') }}
            <time :datetime="doc.effective" class="text-body">{{ formatDate(doc.effective) }}</time>
          </span>
          <span v-if="doc.updated !== doc.effective" class="flex items-center gap-1.5">
            <Icon name="lucide:history" class="size-4" />
            {{ t('legal.updated') }}
            <time :datetime="doc.updated" class="text-body">{{ formatDate(doc.updated) }}</time>
          </span>
        </p>
        <UiSegmented :model-value="kind" :items="docSwitch" :label="t('legal.switch_label')" />
      </div>
    </header>

    <section class="mt-8 md:mt-12" :aria-label="t('legal.at_a_glance')">
      <UiSectionTitle :title="t('legal.at_a_glance')" />
      <div class="mt-4 grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <a
          v-for="(highlight, index) in doc.highlights"
          :key="highlight.to"
          :href="`#${highlight.to}`"
          class="group accent rounded-lg bg-card p-4 transition-colors duration-150 ease-out hover:bg-card-hover"
          :style="{ '--shift': sectionShift(sectionIndex.get(highlight.to) ?? 0), '--i': index }"
          data-reveal
        >
          <span class="flex items-center gap-2.5">
            <span class="grid size-7 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)">
              <Icon :name="highlight.icon" class="size-4" />
            </span>
            <span class="min-w-0 flex-1 text-sm font-semibold leading-5 text-title">{{ highlight.title }}</span>
            <Icon name="lucide:arrow-right" class="size-4 shrink-0 text-faint transition duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-(--accent)" />
          </span>
          <span class="mt-1.5 block text-[13px] leading-5 text-body">{{ highlight.text }}</span>
        </a>
      </div>
    </section>

    <div class="mt-10 lg:mt-12 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside class="hidden rounded-lg bg-card p-2 lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100vh-6rem)] lg:self-start">
        <LegalToc
          class="w-full"
          :sections="doc.sections"
          :active="active"
          @navigate="navigate"
        />
      </aside>

      <div class="min-w-0">
        <LegalTocBar
          class="lg:hidden"
          :sections="doc.sections"
          :active="active"
          :progress="progress"
          @navigate="navigate"
        />
        <div ref="content" class="space-y-4 pt-2 md:space-y-5 lg:pt-0">
          <LegalSection
            v-for="(section, index) in doc.sections"
            :key="section.id"
            :section="section"
            :index="index"
            :flash="flashId === section.id"
          />
        </div>

        <footer class="mt-4 grid gap-4 sm:grid-cols-2 md:mt-5 md:gap-5">
          <div class="rounded-lg bg-card p-5">
            <p class="flex items-center gap-2 font-semibold text-title">
              <Icon name="lucide:mail" class="size-4 text-primary" />
              {{ t('legal.questions_title') }}
            </p>
            <p class="mt-1.5 text-sm leading-6 text-body">{{ t('legal.questions_text') }}</p>
            <a :href="`mailto:${CONTACT_EMAIL}`" class="link mt-3 inline-block font-mono text-sm">{{ CONTACT_EMAIL }}</a>
          </div>
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
/* The hero comes in like the about page's: the short line wipes out, the title rises character by character. */
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
