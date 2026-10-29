<template>
  <div ref="page" class="container mx-auto max-w-6xl space-y-14 px-4 py-10 md:space-y-20 md:px-8 md:py-16 2xl:max-w-7xl">
    <section class="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_17rem] lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
      <div class="max-w-2xl">
        <p class="flex items-center gap-2.5 text-sm font-medium text-primary">
          <span class="eyebrow-line h-px w-6 bg-primary" aria-hidden="true" />
          {{ t('about_page.label') }}
        </p>
        <!-- On phones the CD case on the right is left out; the site's icon sits beside the title instead. -->
        <div class="mt-5 flex items-center gap-4">
          <img
            src="/images/brand/icon-256.webp"
            srcset="/images/brand/icon-256.webp 256w, /images/brand/icon-512.webp 512w"
            sizes="64px"
            alt=""
            width="256"
            height="256"
            class="size-16 shrink-0 rounded-xl ring-1 ring-line md:hidden"
          >
          <h1
            class="hero-title min-w-0 text-balance text-3xl font-bold leading-tight tracking-tight text-title md:text-[2.75rem] md:leading-[1.2]"
            :style="{ '--step': titleStep, '--count': title.count }"
          >
            <!-- Read as one line; the split-up copy below is only for the eyes. -->
            <span class="sr-only">{{ title.text }}</span>
            <span aria-hidden="true">
              <template v-for="(unit, u) in title.units" :key="u">
                <template v-if="unit.space">{{ ' ' }}</template>
                <span v-else class="unit" :class="{ 'unit-em': unit.em }">
                  <span v-for="glyph in unit.chars" :key="glyph.i" class="char" :style="{ '--i': glyph.i }"><span class="glyph">{{ glyph.char }}</span></span>
                  <svg v-if="unit.em" class="underline" viewBox="0 0 100 12" preserveAspectRatio="none">
                    <path d="M2 8.5C20 4.5 44 3.5 64 5.5S90 9 98 5" pathLength="1" />
                  </svg>
                </span>
              </template>
            </span>
          </h1>
        </div>
        <p class="hero-lead isolate mt-5 text-base leading-8 text-body md:text-lg">
          <template v-for="(part, p) in lead" :key="p">
            <span v-if="part.mark" class="mark accent" :style="{ '--shift': part.shift, '--n': part.order }">{{ part.text }}</span>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>
        <div class="hero-actions mt-8 flex flex-wrap gap-3">
          <UiButton to="/albums" variant="primary" icon="lucide:disc-3" class="min-h-11 px-5">{{ t('about_page.cta_browse') }}</UiButton>
          <!-- The plain button colour almost matches the light page, so this one stands on the card surface with a border. -->
          <UiButton
            to="/contribute"
            variant="outline"
            icon="lucide:pencil-line"
            class="min-h-11 px-5 [--ui-btn-active:var(--card-active)] [--ui-btn-bg:var(--card)] [--ui-btn-hover:var(--card-hover)]"
          >
            {{ t('about_page.cta_contribute') }}
          </UiButton>
        </div>
      </div>

      <!-- A CD case: the site's picture as the cover, an obi down the spine, the disc half out. Hovering pulls it further. -->
      <div class="group relative mx-auto hidden aspect-4/3 w-full md:block" aria-hidden="true">
        <svg
          viewBox="0 0 200 200"
          class="absolute top-[5%] right-0 aspect-square h-[90%] w-auto transition-transform duration-700 ease-out group-hover:translate-x-[6%] group-hover:rotate-60 motion-reduce:transition-none"
        >
          <circle cx="100" cy="100" r="99" class="fill-card stroke-line" stroke-width="1" />
          <circle cx="100" cy="100" r="86" class="fill-none stroke-line" stroke-width="1" />
          <circle cx="100" cy="100" r="72" class="fill-none stroke-line" stroke-width="1" />
          <circle cx="100" cy="100" r="58" class="fill-none stroke-line" stroke-width="1" />
          <path d="M127 25.8A79 79 0 0 1 179 100" class="fill-none stroke-primary" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="100" cy="100" r="34" class="fill-sunken stroke-line" stroke-width="1" />
          <circle cx="100" cy="100" r="9" class="fill-page stroke-line" stroke-width="1" />
        </svg>
        <div class="absolute inset-y-0 left-0 flex aspect-square h-full overflow-hidden rounded-md bg-hero ring-1 ring-line">
          <div class="flex w-[15%] shrink-0 flex-col items-center justify-between bg-primary py-3 text-on-primary">
            <span class="text-xs font-bold tracking-[0.2em] [writing-mode:vertical-rl]">CDCat</span>
            <span class="text-[10px] tracking-[0.15em] [writing-mode:vertical-rl]">{{ t('about_page.obi') }}</span>
          </div>
          <!-- The cover is at most 240px tall; srcset picks the copy for the screen's density. -->
          <img
            src="/images/brand/icon-512.webp"
            srcset="/images/brand/icon-256.webp 256w, /images/brand/icon-512.webp 512w, /images/brand/icon-1024.webp 1024w"
            sizes="240px"
            alt=""
            width="512"
            height="512"
            class="h-full min-w-0 flex-1 object-cover"
          >
        </div>
      </div>
    </section>

    <section>
      <UiSectionTitle :title="t('about_page.vision_title')" size="lg" />
      <div class="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article
          class="art-host accent flex flex-col gap-5 rounded-lg bg-card p-5 md:col-span-2 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-8"
          :style="{ '--shift': featured.shift, '--i': 0 }"
          data-reveal
        >
          <div class="h-40 overflow-hidden rounded-md bg-sunken md:order-last md:h-auto md:min-h-52">
            <component :is="featured.art" />
          </div>
          <div class="flex flex-col justify-center md:py-3">
            <span class="font-mono text-xs tabular-nums text-(--accent)">01</span>
            <h3 class="mt-2 text-xl font-semibold text-title md:text-2xl">{{ featured.title }}</h3>
            <p class="mt-3 text-[15px] leading-7 text-body">{{ featured.desc }}</p>
          </div>
        </article>
        <article
          v-for="(item, index) in others"
          :key="item.key"
          class="art-host accent flex flex-col rounded-lg bg-card p-5"
          :style="{ '--shift': item.shift, '--i': index === 0 ? 1 : (index - 1) % 3 }"
          data-reveal
        >
          <div class="h-32 overflow-hidden rounded-md bg-sunken">
            <component :is="item.art" />
          </div>
          <span class="mt-5 font-mono text-xs tabular-nums text-(--accent)">{{ String(index + 2).padStart(2, '0') }}</span>
          <h3 class="mt-1.5 text-base font-semibold text-title">{{ item.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-body">{{ item.desc }}</p>
        </article>
        <!-- Dashed like the editors' "add" buttons: this is the slot still to be filled. -->
        <NuxtLink
          to="/contribute"
          class="art-host accent group flex flex-col rounded-lg border border-dashed border-primary/45 bg-primary/5 p-5 transition-colors duration-150 ease-out hover:bg-primary/10 md:col-span-2 lg:col-span-1"
          style="--i: 2"
          data-reveal
        >
          <div class="h-32 overflow-hidden rounded-md bg-sunken">
            <AboutArtJoin />
          </div>
          <h3 class="mt-5 text-base font-semibold text-title">{{ t('about_page.join_title') }}</h3>
          <p class="mt-2 text-sm leading-6 text-body">{{ t('about_page.join_desc') }}</p>
          <span class="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary">
            {{ t('about_page.join_action') }}
            <Icon name="lucide:arrow-right" class="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
          </span>
        </NuxtLink>
      </div>
    </section>

    <section>
      <UiSectionTitle :title="t('about_page.guides_title')" :description="t('about_page.guides_desc')" size="lg" />
      <ol class="mt-5 grid gap-4 md:grid-cols-3 md:gap-8">
        <li
          v-for="(guide, index) in guides"
          :key="guide.key"
          class="art-host accent group relative flex flex-col rounded-lg bg-card p-5"
          :style="{ '--shift': guide.shift, '--i': index }"
          data-reveal
        >
          <div class="h-32 overflow-hidden rounded-md bg-sunken">
            <component :is="guide.art" />
          </div>
          <div class="mt-5 flex items-center gap-2.5">
            <span
              class="grid size-7 shrink-0 place-items-center rounded-md border border-(--accent)/40 font-mono text-xs tabular-nums text-(--accent) transition-colors duration-200 ease-out group-hover:bg-(--accent) group-hover:text-(--on-accent)"
            >
              {{ index + 1 }}
            </span>
            <span class="text-xs font-medium text-(--accent)">{{ guide.tag }}</span>
          </div>
          <h3 class="mt-3 font-semibold leading-6 text-title">{{ guide.title }}</h3>
          <p class="mt-1.5 text-sm leading-6 text-body">{{ guide.desc }}</p>
          <!-- One small button tinted with the step's colour (the text keeps the title colour, so it reads on the
               tint); a step without a guide yet gets the same button, disabled. -->
          <div class="mt-auto pt-4">
            <UiButton
              :to="guide.link ?? undefined"
              :disabled="!guide.link"
              :icon="guide.link ? undefined : 'lucide:hourglass'"
              size="sm"
              class="group/view [--ui-btn-active:color-mix(in_oklab,var(--accent)_42%,transparent)] [--ui-btn-bg:var(--accent-soft)] [--ui-btn-color:var(--title)] [--ui-btn-hover:color-mix(in_oklab,var(--accent)_32%,transparent)]"
            >
              {{ guide.link ? t('common.view') : t('common.coming_soon') }}
              <Icon v-if="guide.link" name="lucide:arrow-right" class="size-4 transition-transform duration-150 ease-out group-hover/view:translate-x-0.5" />
            </UiButton>
          </div>
          <!-- In the gap to the next step, level with the middle of the illustration. -->
          <Icon
            v-if="index < guides.length - 1"
            name="lucide:chevron-right"
            class="absolute top-21 -right-6 hidden size-4 -translate-y-1/2 text-faint md:block"
            aria-hidden="true"
          />
        </li>
      </ol>
    </section>

    <section>
      <UiSectionTitle :title="t('about_page.legal_title')" :description="t('about_page.legal_desc')" size="lg" />
      <!-- The rows of the lists below, each on its own card, side by side. Hovering draws a line under the title in
           the card's colour, fills and tilts its icon, and turns the › into an arrow. -->
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="(doc, index) in legalDocs"
          :key="doc.to"
          :to="doc.to"
          class="legal-card accent flex items-center gap-4 rounded-lg bg-card px-5 py-4"
          :style="{ '--i': index, '--shift': doc.shift }"
          data-reveal
        >
          <span class="tile grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)">
            <Icon :name="doc.icon" class="size-4.5" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="title w-fit text-sm font-medium text-title">{{ doc.title }}</p>
            <p class="mt-0.5 text-xs leading-5 text-meta">{{ doc.desc }}</p>
          </div>
          <span class="trail relative size-4 shrink-0 text-meta" aria-hidden="true">
            <Icon name="lucide:chevron-right" class="rest absolute inset-0 size-4" />
            <Icon name="lucide:arrow-right" class="go absolute inset-0 size-4" />
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- Two lists of rows inside one card, inset so a hovered row is a rounded block of its own colour. Its icon fills
         and turns once; rows that aren't links stay still. -->
    <section class="grid items-start gap-14 lg:grid-cols-2 lg:gap-8">
      <div>
        <UiSectionTitle :title="t('about_page.docs_title')" :description="t('about_page.docs_desc')" size="lg" />
        <ul class="link-list mt-5 grid rounded-lg bg-card p-1.5" style="--i: 0" data-reveal>
          <li>
            <NuxtLink to="/join" class="link-row accent flex items-center gap-4 rounded-md px-3.5 py-3" style="--shift: 30">
              <span class="tile grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)">
                <Icon name="lucide:users-round" class="spin size-4.5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-title">{{ t('about_page.recruit') }}</p>
                <p class="mt-0.5 text-xs leading-5 text-meta">{{ t('about_page.recruit_desc') }}</p>
              </div>
              <Icon name="lucide:chevron-right" class="trail size-4 shrink-0 text-meta" />
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              :to="SOURCE_URL"
              external
              target="_blank"
              rel="noopener noreferrer"
              class="link-row accent flex items-center gap-4 rounded-md px-3.5 py-3"
              style="--shift: -90"
            >
              <span class="tile grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)">
                <Icon name="simple-icons:github" class="spin size-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-title">{{ t('about_page.frontend_repo') }}</p>
                <p class="mt-0.5 text-xs leading-5 text-meta">{{ t('about_page.frontend_repo_desc') }}</p>
              </div>
              <span class="trail inline-flex shrink-0 items-center gap-1 text-xs font-medium text-meta">
                GitHub
                <Icon name="lucide:arrow-up-right" class="external size-3.5" />
              </span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/docs/api" class="link-row accent flex items-center gap-4 rounded-md px-3.5 py-3" style="--shift: 100">
              <span class="tile grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)">
                <Icon name="lucide:plug" class="spin size-4.5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-title">{{ t('about_page.api_docs') }}</p>
                <p class="mt-0.5 text-xs leading-5 text-meta">{{ t('about_page.api_docs_desc') }}</p>
              </div>
              <Icon name="lucide:chevron-right" class="trail size-4 shrink-0 text-meta" />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <UiSectionTitle :title="t('about_page.community_title')" :description="t('about_page.community_desc')" size="lg" />
        <ul class="link-list mt-5 grid rounded-lg bg-card p-1.5" style="--i: 1" data-reveal>
          <li>
            <NuxtLink to="/discussions" class="link-row accent flex items-center gap-4 rounded-md px-3.5 py-3" style="--shift: 0">
              <span class="tile grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)">
                <Icon name="lucide:message-circle" class="spin size-4.5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-title">{{ t('about_page.discussions') }}</p>
                <p class="mt-0.5 text-xs leading-5 text-meta">{{ t('about_page.discussions_desc') }}</p>
              </div>
              <Icon name="lucide:chevron-right" class="trail size-4 shrink-0 text-meta" />
            </NuxtLink>
          </li>
          <li class="flex items-center gap-4 px-3.5 py-3">
            <span class="accent grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)" style="--shift: -60">
              <Icon name="simple-icons:qq" class="size-4" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-title">{{ t('about_page.qq_group') }}</p>
              <p class="mt-0.5 text-xs leading-5 text-meta">
                {{ t('about_page.qq_label') }}
                <span class="ml-1 font-mono tabular-nums text-body">{{ QQ_GROUP }}</span>
              </p>
            </div>
          </li>
          <li>
            <NuxtLink
              :to="TELEGRAM_URL"
              external
              target="_blank"
              rel="noopener noreferrer"
              class="link-row accent flex items-center gap-4 rounded-md px-3.5 py-3"
              style="--shift: 150"
            >
              <span class="tile grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)">
                <Icon name="simple-icons:telegram" class="spin size-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-title">{{ t('about_page.telegram_group') }}</p>
                <p class="mt-0.5 text-xs leading-5 text-meta">{{ t('about_page.telegram_join') }}</p>
              </div>
              <Icon name="lucide:arrow-up-right" class="trail external size-4 shrink-0 text-meta" />
            </NuxtLink>
          </li>
          <li class="flex items-center gap-4 px-3.5 py-3">
            <span class="accent grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)" style="--shift: 40">
              <Icon name="simple-icons:discord" class="size-4" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-title">{{ t('about_page.discord_group') }}</p>
              <p class="mt-0.5 text-xs leading-5 text-meta">{{ t('about_page.not_open') }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  AboutArtApi,
  AboutArtArchive,
  AboutArtCommunity,
  AboutArtEditions,
  AboutArtRelations,
  AboutArtResearch,
  AboutArtRoles,
  AboutArtStories,
  AboutArtSubmit,
  AboutArtTimeline,
} from '#components'

const { t } = useI18n()
useRevealOnScroll(useTemplateRef('page'))

const legalDocs = computed(() => [
  { to: '/terms', title: t('legal.terms_title'), desc: t('about_page.terms_desc'), icon: 'lucide:file-text', shift: 80 },
  { to: '/privacy', title: t('legal.privacy_title'), desc: t('about_page.privacy_desc'), icon: 'lucide:shield-check', shift: 190 },
])

// The hero's strings mark their highlighted words with {placeholders}; a control character stands in for each, so
// the translated sentence can be split around it whatever its word order.
const MARK = '\u0001'
const CJK = /[぀-ヿ㐀-鿿豈-﫿]/

/** The title, split into characters so they can move one by one. `space` units are plain spaces to wrap at. */
const title = computed(() => {
  const [before = '', after = ''] = t('about_page.title', { em: MARK }).split(MARK)
  const em = t('about_page.title_em')
  const units: { space: boolean, em: boolean, chars: { char: string, i: number }[] }[] = []
  let i = 0
  const glyphs = (text: string) => [...text].map(char => ({ char, i: i++ }))
  const plain = (text: string) => {
    for (const word of text.split(/(\s+)/).filter(Boolean)) {
      if (/^\s+$/.test(word)) units.push({ space: true, em: false, chars: [] })
      // CJK may wrap between any two characters, so each is a unit of its own; other words stay whole.
      else if (CJK.test(word)) units.push(...glyphs(word).map(glyph => ({ space: false, em: false, chars: [glyph] })))
      else units.push({ space: false, em: false, chars: glyphs(word) })
    }
  }
  plain(before)
  // The highlighted phrase never wraps, so its underline stays one stroke.
  units.push({ space: false, em: true, chars: glyphs(em.replace(/ /g, ' ')) })
  plain(after)
  return { text: before + em + after, units, count: i }
})
// However long the title, its characters are all in within about 0.7s.
const titleStep = computed(() => `${Math.min(28, Math.round(700 / title.value.count))}ms`)

/** Each highlighted keyword of the lead, with the colour of its mark (see .accent in assets/css/ui.css). */
const LEAD_MARKS: Record<string, number> = { lovers: 40, nonprofit: 150, doujin: 80, japanese: -60 }
const lead = computed(() => {
  const marked = Object.fromEntries(Object.keys(LEAD_MARKS).map(key => [key, `${MARK}${key}${MARK}`]))
  let order = 0
  return t('about_page.lead', marked).split(MARK).map((text, index) => index % 2
    ? { mark: true, text: t(`about_page.lead_${text}`), shift: LEAD_MARKS[text], order: order++ }
    : { mark: false, text })
})

// `shift` turns each card's colour away from the theme hue, in degrees (see .accent in assets/css/ui.css).
const highlights = computed(() => [
  {
    key: 'archive',
    title: t('about_page.highlights.archive_title'),
    desc: t('about_page.highlights.archive_desc'),
    art: AboutArtArchive,
    shift: 0
  },
  {
    key: 'timeline',
    title: t('about_page.highlights.timeline_title'),
    desc: t('about_page.highlights.timeline_desc'),
    art: AboutArtTimeline,
    shift: 80
  },
  {
    key: 'creator',
    title: t('about_page.highlights.creator_title'),
    desc: t('about_page.highlights.creator_desc'),
    art: AboutArtEditions,
    shift: 150
  },
  {
    key: 'developer',
    title: t('about_page.highlights.developer_title'),
    desc: t('about_page.highlights.developer_desc'),
    art: AboutArtApi,
    shift: -90
  },
  {
    key: 'relations',
    title: t('about_page.highlights.relations_title'),
    desc: t('about_page.highlights.relations_desc'),
    art: AboutArtRelations,
    shift: 40
  },
  {
    key: 'community',
    title: t('about_page.highlights.community_title'),
    desc: t('about_page.highlights.community_desc'),
    art: AboutArtCommunity,
    shift: -60
  },
  {
    key: 'stories',
    title: t('about_page.highlights.stories_title'),
    desc: t('about_page.highlights.stories_desc'),
    art: AboutArtStories,
    shift: 190
  }
])
const featured = computed(() => highlights.value[0]!)
const others = computed(() => highlights.value.slice(1))

const guides = computed(() => [
  {
    key: 'basics',
    tag: t('about_page.guide_basics_tag'),
    title: t('about_page.guide_basics_title'),
    desc: t('about_page.guide_basics_desc'),
    link: '/help/design' as string | null,
    art: AboutArtRoles,
    shift: -50
  },
  {
    key: 'research',
    tag: t('about_page.guide_research_tag'),
    title: t('about_page.guide_research_title'),
    desc: t('about_page.guide_research_desc'),
    link: null as string | null,
    art: AboutArtResearch,
    shift: 0
  },
  {
    key: 'submit',
    tag: t('about_page.guide_submit_tag'),
    title: t('about_page.guide_submit_title'),
    desc: t('about_page.guide_submit_desc'),
    link: '/help/editor' as string | null,
    art: AboutArtSubmit,
    shift: 50
  }
])

usePageSeo({
  title: () => t('menu.about'),
  description: () => t('seo.pages.about'),
})
</script>

<style scoped>
/*
 * Hero: the title's characters rise in one after another (--i × --step), then the highlighted phrase gets a
 * hand-drawn underline. Hovering the title sends a wave through it (on .glyph, so the entrance on .char never
 * replays) and wipes the line in again. The lead's keywords are marked in their own colours, one after another.
 */
.unit {
  display: inline-block;
  white-space: nowrap;
}

.unit-em {
  position: relative;
  color: var(--primary);
}

.char {
  display: inline-block;
  animation: char-in 600ms cubic-bezier(0.2, 0.7, 0.2, 1) calc(var(--i) * var(--step)) backwards;
}

.glyph {
  display: inline-block;
}

.hero-title:hover .glyph {
  animation: wave 650ms ease-in-out calc(var(--i) * var(--step));
}

.underline {
  position: absolute;
  bottom: -0.14em;
  left: -2%;
  width: 104%;
  height: 0.32em;
  overflow: visible;
  fill: none;
  stroke: var(--primary);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.6;
  transform-origin: left;
}

.underline path {
  stroke-dasharray: 1;
  animation: draw 700ms cubic-bezier(0.3, 0.7, 0.2, 1) calc(var(--count) * var(--step) + 150ms) backwards;
}

.hero-title:hover .underline {
  animation: wipe 600ms cubic-bezier(0.3, 0.7, 0.2, 1) 150ms backwards;
}

.eyebrow-line {
  transform-origin: left;
  animation: wipe 500ms cubic-bezier(0.3, 0.7, 0.2, 1) backwards;
}

.hero-lead {
  animation: rise 600ms cubic-bezier(0.2, 0.7, 0.2, 1) 250ms backwards;
}

.hero-actions {
  animation: rise 600ms cubic-bezier(0.2, 0.7, 0.2, 1) 400ms backwards;
}

.mark {
  position: relative;
  white-space: nowrap;
  color: var(--title);
}

/* Behind the word (the lead is isolated, so -1 stays above the page); hovering fills it to the full height. */
.mark::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: auto -0.15em 0.08em;
  height: 0.42em;
  border-radius: 2px;
  background: color-mix(in oklab, var(--accent) 30%, transparent);
  transform-origin: left;
  transition: height 200ms ease-out;
  animation: wipe 500ms cubic-bezier(0.3, 0.7, 0.2, 1) calc(650ms + var(--n) * 160ms) backwards;
}

.mark:hover::before {
  height: calc(100% - 0.1em);
}

@keyframes char-in {
  from {
    opacity: 0;
    translate: 0 0.45em;
  }
}

@keyframes wave {
  35% { translate: 0 -0.16em; }
  70% { translate: 0 0.03em; }
}

@keyframes draw {
  from { stroke-dashoffset: 1; }
}

@keyframes wipe {
  from { scale: 0 1; }
}

@keyframes rise {
  from {
    opacity: 0;
    translate: 0 10px;
  }
}

/*
 * 条款与政策: the title's underline draws in from the left, the icon fills and tilts, and the › gives way to an arrow.
 * 一起开发 and 交流群: a hovered row takes a wash of its own colour, its icon fills and turns once (only on the way in,
 * so leaving doesn't spin it back), and its arrow moves off in its direction.
 */
.tile,
.trail,
.trail :is(.rest, .go, .external) {
  transition: background-color 200ms ease-out, color 200ms ease-out, opacity 200ms ease-out, rotate 200ms ease-out,
    scale 200ms ease-out, translate 200ms ease-out;
}

.legal-card .title {
  padding-bottom: 1px;
  background: linear-gradient(var(--accent), var(--accent)) left 100% / 0 2px no-repeat;
  transition: background-size 280ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.legal-card .go {
  opacity: 0;
  translate: -6px 0;
}

.legal-card:is(:hover, :focus-visible) .title {
  background-size: 100% 2px;
}

.legal-card:is(:hover, :focus-visible) .tile {
  rotate: -6deg;
}

.legal-card:is(:hover, :focus-visible) .rest {
  opacity: 0;
  translate: 4px 0;
}

.legal-card:is(:hover, :focus-visible) .go {
  opacity: 1;
  translate: 0 0;
}

:is(.legal-card, .link-row):is(:hover, :focus-visible) .tile {
  background-color: var(--accent);
  color: var(--on-accent);
}

:is(.legal-card, .link-row):is(:hover, :focus-visible) .trail {
  color: var(--accent);
}

/* The rows' dividers start under the text and step aside for a hovered row. */
.link-list li {
  position: relative;
}

.link-list li + li::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0.875rem;
  left: 4.125rem;
  border-top: 1px solid var(--line);
  transition: opacity 150ms ease-out;
}

.link-list li:has(> .link-row:is(:hover, :focus-visible))::before,
.link-list li:has(> .link-row:is(:hover, :focus-visible)) + li::before {
  opacity: 0;
}

.link-row {
  transition: background-color 200ms ease-out;
}

.link-row:is(:hover, :focus-visible) {
  background-color: color-mix(in oklab, var(--accent) 10%, var(--card));
}

.link-row:active {
  background-color: color-mix(in oklab, var(--accent) 16%, var(--card));
}

.link-row:is(:hover, :focus-visible) .tile {
  scale: 1.06;
}

.link-row:is(:hover, :focus-visible) .spin {
  rotate: 360deg;
  transition: rotate 650ms cubic-bezier(0.3, 0.7, 0.2, 1);
}

.link-row:is(:hover, :focus-visible) .trail:not(:has(.external)):not(.external) {
  translate: 3px 0;
}

.link-row:is(:hover, :focus-visible) .external {
  translate: 2px -2px;
}

@media (prefers-reduced-motion: reduce) {
  .tile,
  .trail,
  .trail :is(.rest, .go, .external),
  .legal-card .title,
  .link-row .spin,
  .art-host :deep(svg *),
  .char,
  .glyph,
  .underline,
  .underline path,
  .eyebrow-line,
  .hero-lead,
  .hero-actions,
  .mark::before {
    transition: none !important;
    animation: none !important;
  }
}
</style>
