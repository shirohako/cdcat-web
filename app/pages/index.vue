<template>
  <div class="landing mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-6 md:gap-8 md:px-8 md:pt-8 2xl:max-w-7xl">
    <!-- The CD player, which comes apart by itself once the page is open; the mascot rides on its lid. -->
    <section class="grid items-center gap-2 xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] xl:gap-4">
      <div class="landing-intro max-w-xl px-1 pt-2 sm:px-3 xl:pb-8">
        <p class="landing-kicker">
          <span class="landing-dots" aria-hidden="true"><i /><i /><i /></span>
          {{ t('landing.hero.kicker') }}
        </p>
        <h1 class="landing-display mt-5 whitespace-pre-line text-[2.5rem] leading-[1.14] text-title sm:text-5xl xl:text-[3.5rem]">{{ t('landing.hero.title') }}</h1>
        <p class="mt-4 text-base font-medium leading-[1.9] text-title md:text-[1.0625rem]">{{ t('landing.hero.body') }}</p>
        <div class="mt-7 flex flex-wrap gap-2.5">
          <UiButton to="/albums" variant="primary" size="lg">{{ t('landing.hero.browse') }}</UiButton>
          <!-- In the page's pastels, with ink text; the arrow (the last child) slides forward on hover. -->
          <UiButton
            to="/about"
            size="lg"
            icon-right="lucide:arrow-right"
            class="[--ui-btn-bg:var(--landing-lilac)] [--ui-btn-color:var(--landing-ink)] [--ui-btn-hover:#c9bdf3] [--ui-btn-active:#bcaef0] [&>:last-child]:transition-transform [&>:last-child]:duration-200 [&>:last-child]:ease-out hover:[&>:last-child]:translate-x-1 motion-reduce:[&>:last-child]:transition-none"
          >
            {{ t('landing.hero.about') }}
          </UiButton>
        </div>
      </div>
      <LandingTeardownFigure
        device="discman"
        ssr
        :view-box="HERO_BOX"
        :tones="TONES.discman"
        :labels="LABELS.discman"
        :title="t('landing.hero.figure')"
      >
        <template #overlay="{ at }">
          <!-- The mascot rides the lid, on a layer of its own so its floating never repaints the drawing. -->
          <svg class="landing-ghost" viewBox="-1 -1 18 19.3" :style="{ ...at('lid', [146.7, 29.4]), width: `${(23.4 / HERO_BOX[2]) * 100}%` }" aria-hidden="true">
            <BrandGhost />
          </svg>
        </template>
      </LandingTeardownFigure>
    </section>

    <!-- The three verses as one collage: the jewel case large, the other two smaller, each with its stickers. -->
    <div class="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-8">
      <LandingTile large :title="t('landing.album.title')">
        <LandingTeardownFigure
          device="jewelcase"
          :view-box="[56, 4, 334, 292]"
          :tones="TONES.jewelcase"
          :labels="LABELS.jewelcase"
          :title="t('landing.album.figure')"
        />
      </LandingTile>
      <LandingTile tone="sky" :title="t('landing.listen.title')">
        <LandingTeardownFigure
          device="headphones"
          :view-box="[22, 45, 376, 207]"
          :tones="TONES.headphones"
          :labels="LABELS.headphones"
          :title="t('landing.listen.figure')"
        />
      </LandingTile>
      <LandingTile tone="mint" :title="t('landing.discover.title')">
        <LandingTeardownFigure
          device="turntable"
          :view-box="[66, 22, 288, 253]"
          :tones="TONES.turntable"
          :labels="LABELS.turntable"
          :title="t('landing.discover.figure')"
        />
      </LandingTile>
    </div>

    <section class="grid items-center gap-6 rounded-2xl bg-card px-5 py-8 sm:grid-cols-[7rem_minmax(0,1fr)] sm:p-10 xl:gap-10">
      <svg class="w-20 sm:w-28" viewBox="-2 -9 23 30" aria-hidden="true">
        <BrandGhost mouth="sing" />
        <path class="landing-note" d="M17.5 -1.5v-5.2l3 -.9v5.2" />
        <circle class="landing-note-head" cx="16.4" cy="-1.5" r="1.2" />
        <circle class="landing-note-head" cx="19.4" cy="-2.4" r="1.2" />
      </svg>
      <div class="max-w-2xl">
        <h2 class="landing-display text-[2rem] leading-[1.2] text-title sm:text-[2.5rem]">{{ t('landing.community.title') }}</h2>
        <p class="mt-3 text-base font-medium leading-[1.9] text-title">{{ t('landing.community.body') }}</p>
        <div class="mt-6 flex flex-wrap gap-2.5">
          <UiButton to="/docs/api" variant="primary" size="lg">{{ t('landing.community.api_docs') }}</UiButton>
          <UiButton to="/docs/design" size="lg">{{ t('landing.community.design') }}</UiButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { TeardownLabel, TeardownTone } from '~/utils/teardown'

/**
 * The home page: an introduction to CDCat beside exploded drawings of music devices (components/landing,
 * tools/teardown), each coming apart and back together on a loop while it is on screen.
 */
const { t } = useI18n()

const HERO_BOX: [number, number, number, number] = [56, 12, 314, 268]

type Device = 'discman' | 'jewelcase' | 'headphones' | 'turntable'

/** Each part's colour. */
const TONES: Record<Device, Record<string, TeardownTone>> = {
  discman: { shell: 'butter', pcb: 'mint', chassis: 'lilac', sled: 'sky', hub: 'white', disc: 'silver', lid: 'pink', buttons: 'coral' },
  jewelcase: { base: 'white', inlay: 'mint', tray: 'lilac', disc: 'silver', booklet: 'pink', obi: 'butter', lid: 'silver' },
  headphones: { 'left-cup': 'lilac', 'cushion': 'pink', 'driver': 'butter', 'shell': 'lilac', 'board': 'mint', 'cap': 'white', 'headband': 'lilac', 'pad': 'pink' },
  turntable: { plinth: 'white', belt: 'coral', sub: 'butter', platter: 'sky', record: 'night', arm: 'silver', headshell: 'lilac', cartridge: 'coral', counterweight: 'butter' }
}

/**
 * The parts' English names (the user's rule: never translated), placed in each drawing's units. In the collage's small
 * tiles the drawing is narrower than the tile, so stickers may reach past its edges into the space beside it.
 */
const LABELS: Partial<Record<Device, TeardownLabel[]>> = {
  discman: [
    { anchor: 'buttons', text: 'Buttons', at: [300, 62], align: 'start', tone: 'coral' },
    { anchor: 'lid', text: 'Top lid', at: [124, 76], align: 'end', tone: 'pink' },
    { anchor: 'disc', text: 'Compact disc', at: [132, 120], align: 'end', tone: 'sky' },
    { anchor: 'sled', text: 'Optical pickup', at: [124, 164], align: 'end', tone: 'lilac' },
    { anchor: 'chassis', text: 'Chassis', at: [300, 170], align: 'start', tone: 'butter' },
    { anchor: 'pcb', text: 'Main board', at: [300, 214], align: 'start', tone: 'mint' },
    { anchor: 'shell', text: 'Bottom shell', at: [124, 252], align: 'end', tone: 'butter' }
  ],
  jewelcase: [
    { anchor: 'lid', text: 'Front cover', at: [300, 18], align: 'start', tone: 'silver' },
    { anchor: 'booklet', text: 'Booklet', at: [104, 90], align: 'center', tone: 'pink' },
    { anchor: 'disc', text: 'Disc', at: [350, 124], align: 'start', tone: 'sky' },
    { anchor: 'tray', text: 'Tray', at: [350, 176], align: 'start', tone: 'lilac' },
    { anchor: 'inlay', text: 'Inlay', at: [350, 212], align: 'start', tone: 'mint' },
    { anchor: 'obi', text: 'Obi strip', at: [118, 282], align: 'center', tone: 'butter' },
    { anchor: 'base', text: 'Case', at: [350, 262], align: 'start', tone: 'coral' }
  ],
  headphones: [
    { anchor: 'headband', text: 'Headband', at: [40, 52], align: 'end', tone: 'lilac' },
    { anchor: 'cushion', text: 'Ear cushion', at: [118, 268], align: 'center', tone: 'pink' },
    { anchor: 'driver', text: 'Driver', at: [228, 268], align: 'center', tone: 'butter' },
    { anchor: 'board', text: 'Bluetooth board', at: [330, 92], align: 'center', tone: 'mint' },
    { anchor: 'cap', text: 'Touch cover', at: [400, 268], align: 'end', tone: 'silver' }
  ],
  turntable: [
    { anchor: 'record', text: 'Vinyl record', at: [332, 40], align: 'start', tone: 'pink' },
    { anchor: 'arm', text: 'Tonearm', at: [352, 150], align: 'start', tone: 'silver' },
    { anchor: 'cartridge', text: 'Cartridge', at: [330, 238], align: 'start', tone: 'coral' },
    { anchor: 'platter', text: 'Platter', at: [78, 96], align: 'end', tone: 'sky' },
    { anchor: 'belt', text: 'Belt', at: [78, 160], align: 'end', tone: 'coral' },
    { anchor: 'plinth', text: 'Plinth', at: [70, 236], align: 'end', tone: 'lilac' }
  ]
}

const absolute = useSiteUrl()
usePageSeo({
  title: () => t('home.seo_title'),
  description: () => t('home.seo_description'),
  jsonLd: () => websiteLd({ name: SITE_NAME, url: absolute('/'), logo: absolute('/icon.png'), description: t('home.seo_description') })
})
useHead({
  // The home title already names the site.
  titleTemplate: '%s',
  meta: [{ name: 'keywords', content: computed(() => t('home.seo_keywords')) }],
})
// The first drawing comes with the page (`ssr`). The title face is wanted at once; the collage's drawings are fetched
// at low priority while the scripts load, so they are ready, or nearly, when their figures mount. Only the
// server-rendered page asks for them: coming back to the home page within the site, all are already loaded (the font
// face, and the drawings cached by loadTeardown), and a fresh preload would go unused.
if (import.meta.server) {
  useHead({
    link: [
      { rel: 'preload', href: '/landing/fonts/display.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
      ...(['jewelcase', 'headphones', 'turntable'] as const).map(device => (
        { rel: 'preload', href: `/landing/teardown/${device}.json`, as: 'fetch', crossorigin: 'anonymous', fetchpriority: 'low' } as const
      ))
    ]
  })
}
</script>

<style>
.landing {
  --landing-lilac: #d8cff6;
  --landing-ink: #1d2444;
  /* The collage's tinted tiles (LandingTile); in the dark theme only a hint of the pastel on the card colour. */
  --landing-tile-sky: #dceafb;
  --landing-tile-mint: #d8f0e3;
}

html[data-theme="dark"] .landing {
  --landing-tile-sky: color-mix(in oklab, #bcd8f6 12%, var(--card));
  --landing-tile-mint: color-mix(in oklab, #bfe7d2 12%, var(--card));
}

.landing-display {
  font-family: "CDCat Display", sans-serif;
  font-weight: 900;
  text-wrap: balance;
}
</style>

<style scoped>
.landing-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 0.5rem;
  background: var(--card);
  padding: 0.5rem 0.75rem;
  color: var(--meta);
  font-size: 0.8125rem;
  font-weight: 600;
}

.landing-dots {
  display: inline-flex;
  gap: 0.3rem;
}

.landing-dots i {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #f4a9bc;
}

.landing-dots i:nth-child(2) { background: #f6d27a; }
.landing-dots i:nth-child(3) { background: #9ad7b8; }

.landing-ghost {
  position: absolute;
  z-index: 1;
  overflow: visible;
  will-change: transform;
  /* Hops on once the drawing has faded in; `scale` and `translate` add to the inline transform that places it. */
  animation: landing-ghost-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards;
}

/* The intro settles in line by line as the page opens. */
.landing-intro > * {
  animation: landing-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.landing-intro > :nth-child(2) { animation-delay: 60ms; }
.landing-intro > :nth-child(3) { animation-delay: 120ms; }
.landing-intro > :nth-child(4) { animation-delay: 180ms; }

@keyframes landing-ghost-in {
  from {
    opacity: 0;
    translate: 0 -40%;
    scale: 0.6;
  }
}

@keyframes landing-rise {
  from {
    opacity: 0;
    translate: 0 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-ghost,
  .landing-intro > * { animation: none; }
}

.landing-note {
  fill: none;
  stroke: var(--title);
  stroke-width: 0.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.landing-note-head { fill: var(--title); }
</style>
