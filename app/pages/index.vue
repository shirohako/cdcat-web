<template>
  <div class="landing mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-6 md:gap-8 md:px-8 md:pt-8 2xl:max-w-7xl">
    <!-- The CD player, which comes apart by itself once the page is open; the mascot rides on its lid. -->
    <section class="grid items-center gap-2 xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] xl:gap-4">
      <div class="max-w-xl px-1 pt-2 sm:px-3 xl:pb-8">
        <p class="landing-kicker">
          <span class="landing-dots" aria-hidden="true"><i /><i /><i /></span>
          {{ t('landing.hero.kicker') }}
        </p>
        <h1 class="landing-display mt-5 whitespace-pre-line text-[2.5rem] leading-[1.14] text-title sm:text-5xl xl:text-[3.5rem]">{{ t('landing.hero.title') }}</h1>
        <p class="mt-4 text-base font-medium leading-[1.9] text-title md:text-[1.0625rem]">{{ t('landing.hero.body') }}</p>
        <div class="mt-7 flex flex-wrap gap-2.5">
          <UiButton to="/albums" variant="primary" size="lg">{{ t('landing.hero.browse') }}</UiButton>
          <UiButton to="/contribute" size="lg">{{ t('landing.hero.contribute') }}</UiButton>
        </div>
      </div>
      <LandingTeardownFigure
        device="discman"
        :view-box="HERO_BOX"
        :tones="TONES.discman"
        :labels="LABELS.discman"
        :title="t('landing.hero.figure')"
      >
        <template #overlay="{ on, at }">
          <!-- The mascot rides the lid, on a layer of its own so its floating never repaints the drawing. -->
          <svg class="landing-ghost" viewBox="-1 -1 18 19.3" :style="{ ...at('lid', [139.7, 46.2]), width: `${(23.4 / HERO_BOX[2]) * 100}%` }" aria-hidden="true">
            <BrandGhost />
          </svg>
          <span :class="['landing-bubble', { 'is-on': on }]" :style="spot(HERO_BOX, [151, 41])" aria-hidden="true">{{ t('landing.hero.bubble') }}</span>
        </template>
      </LandingTeardownFigure>
    </section>

    <LandingSection
      card
      :kicker="t('landing.album.kicker')"
      :title="t('landing.album.title')"
      :body="t('landing.album.body')"
      :tags="tags('album', { tracks: 'sky', credits: 'pink', lyrics: 'lilac', catalog: 'butter', editions: 'mint', bonuses: 'coral' })"
    >
      <LandingTeardownFigure
        device="jewelcase"
        :view-box="[56, 4, 334, 292]"
        :tones="TONES.jewelcase"
        :labels="LABELS.jewelcase"
        :title="t('landing.album.figure')"
      />
    </LandingSection>

    <LandingSection
      flip
      :kicker="t('landing.listen.kicker')"
      :title="t('landing.listen.title')"
      :body="t('landing.listen.body')"
      :tags="tags('listen', { plan: 'pink', wish: 'butter', done: 'sky', owned: 'mint', review: 'lilac', favorite: 'coral' })"
    >
      <LandingTeardownFigure
        device="headphones"
        :view-box="[20, 30, 395, 266]"
        :tones="TONES.headphones"
        :labels="LABELS.headphones"
        :title="t('landing.listen.figure')"
      />
    </LandingSection>

    <LandingSection
      card
      :kicker="t('landing.discover.kicker')"
      :title="t('landing.discover.title')"
      :body="t('landing.discover.body')"
      :tags="tags('discover', { artists: 'pink', circles: 'butter', events: 'sky', entries: 'lilac', series: 'mint' })"
    >
      <LandingTeardownFigure
        device="turntable"
        :view-box="[56, 20, 314, 262]"
        :tones="TONES.turntable"
        :labels="LABELS.turntable"
        :title="t('landing.discover.figure')"
      />
    </LandingSection>

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
          <UiButton to="/contribute" variant="primary" size="lg">{{ t('landing.community.contribute') }}</UiButton>
          <UiButton to="/help/editor" size="lg">{{ t('landing.community.guide') }}</UiButton>
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
  discman: { shell: 'butter', pcb: 'mint', chassis: 'lilac', sled: 'sky', hub: 'white', screws: 'white', disc: 'silver', lid: 'pink', buttons: 'coral' },
  jewelcase: { base: 'white', inlay: 'mint', tray: 'lilac', disc: 'silver', booklet: 'pink', obi: 'butter' },
  headphones: { 'left-cup': 'lilac', 'cushion': 'pink', 'mesh': 'silver', 'baffle': 'sky', 'driver': 'butter', 'shell': 'lilac', 'board': 'mint', 'battery': 'coral', 'cap': 'white', 'headband': 'lilac', 'pad': 'pink' },
  turntable: { plinth: 'white', feet: 'lilac', sub: 'butter', platter: 'sky', mat: 'pink', record: 'night', arm: 'silver' }
}

/** The parts' English names (the user's rule: never translated), placed in each drawing's units. */
const LABELS: Record<Device, TeardownLabel[]> = {
  discman: [
    { anchor: 'buttons', text: 'Buttons', at: [306, 54], align: 'start', tone: 'coral' },
    { anchor: 'lid', text: 'Top lid', at: [120, 60], align: 'end', tone: 'pink' },
    { anchor: 'disc', text: 'Compact disc', at: [128, 122], align: 'end', tone: 'sky' },
    { anchor: 'sled', text: 'Optical pickup', at: [120, 178], align: 'end', tone: 'lilac' },
    { anchor: 'chassis', text: 'Chassis', at: [306, 178], align: 'start', tone: 'butter' },
    { anchor: 'pcb', text: 'Main board', at: [306, 222], align: 'start', tone: 'mint' },
    { anchor: 'shell', text: 'Bottom shell', at: [120, 256], align: 'end', tone: 'butter' }
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
    { anchor: 'headband', text: 'Headband', at: [100, 36], align: 'end', tone: 'lilac' },
    { anchor: 'cushion', text: 'Ear cushion', at: [160, 284], align: 'center', tone: 'pink' },
    { anchor: 'driver', text: 'Driver', at: [252, 288], align: 'center', tone: 'butter' },
    { anchor: 'board', text: 'Bluetooth board', at: [298, 150], align: 'center', tone: 'mint' },
    { anchor: 'battery', text: 'Battery', at: [378, 182], align: 'center', tone: 'coral' },
    { anchor: 'cap', text: 'Touch cover', at: [404, 280], align: 'end', tone: 'silver' }
  ],
  turntable: [
    { anchor: 'record', text: 'Vinyl record', at: [300, 46], align: 'start', tone: 'pink' },
    { anchor: 'mat', text: 'Slipmat', at: [100, 74], align: 'end', tone: 'pink' },
    { anchor: 'platter', text: 'Platter', at: [100, 110], align: 'end', tone: 'sky' },
    { anchor: 'sub', text: 'Belt', at: [88, 146], align: 'end', tone: 'butter' },
    { anchor: 'arm', text: 'Tonearm', at: [314, 94], align: 'start', tone: 'silver' },
    { anchor: 'plinth', text: 'Plinth', at: [100, 222], align: 'end', tone: 'lilac' }
  ]
}

const tags = (section: string, tones: Record<string, string>) =>
  Object.entries(tones).map(([key, tone]) => ({ text: t(`landing.${section}.tags.${key}`), tone }))

/** A point of a drawing as a position over its figure. */
const spot = ([x0, y0, w, h]: [number, number, number, number], [x, y]: [number, number]) =>
  ({ left: `${((x - x0) / w) * 100}%`, top: `${((y - y0) / h) * 100}%` })

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
// The first drawing and the title face are wanted at once; the other drawings load when their figures mount. Only
// the server-rendered page asks for them: coming back to the home page within the site, both are already loaded
// (the font face, and the drawing cached by loadTeardown), and a fresh preload would go unused.
if (import.meta.server) {
  useHead({
    link: [
      { rel: 'preload', href: '/landing/teardown/discman.json', as: 'fetch', crossorigin: 'anonymous' },
      { rel: 'preload', href: '/landing/fonts/display.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
    ]
  })
}
</script>

<style>
/* The display face for the home page's titles: Resource Han Rounded Heavy (SIL OFL), one font for Chinese,
   Japanese, Korean and Latin, so changing language never changes or fetches a font. Cut down to the characters
   the titles use in every locale (tools/landing-fonts.mjs); the page's lang picks the regional glyph forms. */
@font-face {
  font-family: "CDCat Display";
  src: url("/landing/fonts/display.woff2") format("woff2");
  font-weight: 900;
  font-display: swap;
}

.landing {
  --landing-pink: #f7c3d0;
  --landing-butter: #fde7a4;
  --landing-mint: #bfe7d2;
  --landing-sky: #bcd8f6;
  --landing-lilac: #d8cff6;
  --landing-coral: #ffb7a5;
  --landing-ink: #1d2444;
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
}

/* The mascot's speech, over the lid it rides on; it pops up with the stickers. */
.landing-bubble {
  position: absolute;
  z-index: 2;
  border: 1px solid var(--landing-ink);
  border-radius: 999px;
  background: #ffffff;
  padding: 0.3rem 0.7rem;
  color: var(--landing-ink);
  font-size: 0.8125rem;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  transform: translate(-50%, -100%) scale(0.7);
  transform-origin: 50% 100%;
  transition: opacity 0.25s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: 0.5s;
}

.landing-bubble.is-on {
  opacity: 1;
  transform: translate(-50%, -100%) scale(1);
}

.landing-note {
  fill: none;
  stroke: var(--title);
  stroke-width: 0.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.landing-note-head { fill: var(--title); }

@media (max-width: 639px) {
  .landing-bubble { font-size: 0.6875rem; }
}

@media (prefers-reduced-motion: reduce) {
  .landing-bubble { transition: none; }
}
</style>
