<template>
  <div class="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl">
    <!-- An assembly drawing: what went wrong, the device coming apart with numbered balloons, its parts list with the
         faulty part marked, and the title block. -->
    <section class="sheet">
      <div class="sheet-copy">
        <p class="sheet-kicker">
          <span class="sheet-dots" aria-hidden="true"><i /><i /><i /></span>
          {{ t(`error_page.${kind}.kicker`, { code: status }) }}
        </p>
        <h1 class="sheet-title mt-5 text-[2.25rem] leading-[1.15] text-title sm:text-[2.75rem]">{{ t(`error_page.${kind}.title`) }}</h1>
        <p class="mt-4 max-w-xl text-base font-medium leading-[1.9] text-title">{{ t(`error_page.${kind}.body`) }}</p>
        <div class="mt-7 flex flex-wrap gap-2.5">
          <template v-if="kind === 'not_found'">
            <UiButton to="/" variant="primary" size="lg">{{ t('error_page.home') }}</UiButton>
            <UiButton to="/search" size="lg" icon-right="lucide:arrow-right">{{ t('error_page.search') }}</UiButton>
          </template>
          <template v-else>
            <UiButton variant="primary" size="lg" icon="lucide:rotate-cw" @click="reload">{{ t('error_page.reload') }}</UiButton>
            <UiButton to="/" size="lg" icon-right="lucide:arrow-right">{{ t('error_page.home') }}</UiButton>
          </template>
        </div>
      </div>

      <div class="sheet-figure">
        <LandingTeardownFigure
          :device="drawing.device"
          :view-box="drawing.viewBox"
          :tones="drawing.tones"
          :labels="labels"
          marks="balloons"
          :title="t(`error_page.${drawing.device}`)"
        />
      </div>

      <table class="sheet-parts">
        <thead>
          <tr>
            <th scope="col">{{ t('error_page.parts.no') }}</th>
            <th scope="col">{{ t('error_page.parts.part') }}</th>
            <th scope="col">{{ t('error_page.parts.qty') }}</th>
            <th scope="col">{{ t('error_page.parts.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(part, i) in drawing.parts" :key="part.name" :class="{ 'is-hot': part.fault }">
            <td>{{ i + 1 }}</td>
            <td>{{ part.name }}</td>
            <td>{{ part.qty ?? 1 }}</td>
            <td>{{ part.fault ? t(`error_page.parts.${part.fault}`) : '✓' }}</td>
          </tr>
        </tbody>
      </table>

      <dl class="sheet-block">
        <div class="col-span-2">
          <dt>{{ t('error_page.block.name') }}</dt>
          <dd>{{ t(`error_page.${kind}.name`) }}</dd>
        </div>
        <div>
          <dt>{{ t('error_page.block.number') }}</dt>
          <dd>{{ status }}</dd>
        </div>
        <div>
          <dt>{{ t('error_page.block.scale') }}</dt>
          <dd>NTS</dd>
        </div>
        <div>
          <dt>{{ t('error_page.block.state') }}</dt>
          <dd class="is-hot">{{ t(kind === 'not_found' ? 'error_page.parts.missing' : 'error_page.block.repair') }}</dd>
        </div>
        <div>
          <dt>{{ t('error_page.block.sheet') }}</dt>
          <dd>1 / 1</dd>
        </div>
        <div class="col-span-2 flex items-baseline justify-between">
          <dd>{{ SITE_NAME }}</dd>
          <dt>{{ drawing.device === 'piano' ? 'Grand piano' : 'Music box' }}</dt>
        </div>
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { TeardownLabel, TeardownTone } from '~/utils/teardown'

/**
 * The error page's content (app/error.vue): a drawing sheet with a device coming apart on a loop. A missing page is a
 * grand piano whose parts list is short of key 404 (a piano has 88); any other failure is a music box with its spring
 * jammed. Part names stay English in every language, like the home page's stickers.
 */
const props = defineProps<{ status: number }>()
const { t } = useI18n()

const kind = computed(() => (props.status === 404 ? 'not_found' : props.status >= 500 ? 'server' : 'request'))

interface Part {
  name: string
  /** The drawing's anchor the part's balloon points at, and where the balloon sits, in the drawing's units. */
  anchor: string
  at: [number, number]
  qty?: number
  fault?: 'missing' | 'jammed'
}

interface Drawing {
  device: 'piano' | 'musicbox'
  viewBox: [number, number, number, number]
  tones: Record<string, TeardownTone>
  parts: Part[]
}

const PIANO: Drawing = {
  device: 'piano',
  viewBox: [86, 14, 240, 266],
  tones: { rim: 'lilac', cheek: 'lilac', legs: 'lilac', lid: 'lilac', prop: 'lilac', desk: 'lilac', keys: 'white', sharps: 'night', action: 'sky', soundboard: 'mint', plate: 'butter' },
  parts: [
    { name: 'Lid', anchor: 'lid', at: [314, 30] },
    { name: 'Plate & strings', anchor: 'plate', at: [314, 118] },
    { name: 'Soundboard', anchor: 'soundboard', at: [314, 160] },
    { name: 'Action', anchor: 'action', at: [100, 166] },
    { name: 'Keys', anchor: 'keys', at: [100, 208], qty: 88 },
    { name: 'Music desk', anchor: 'desk', at: [100, 124] },
    { name: 'Case', anchor: 'rim', at: [314, 206] },
    { name: 'Key 404', anchor: 'missing', at: [196, 266], qty: 0, fault: 'missing' }
  ]
}

const MUSIC_BOX: Drawing = {
  device: 'musicbox',
  viewBox: [86, 14, 240, 266],
  tones: { case: 'coral', lid: 'coral', bed: 'silver', cylinder: 'butter', comb: 'sky', spring: 'mint', governor: 'lilac', key: 'butter' },
  parts: [
    { name: 'Lid', anchor: 'lid', at: [314, 46] },
    { name: 'Comb', anchor: 'comb', at: [100, 80] },
    { name: 'Pinned cylinder', anchor: 'cylinder', at: [100, 128] },
    { name: 'Spring barrel', anchor: 'spring', at: [314, 124], fault: 'jammed' },
    { name: 'Governor', anchor: 'governor', at: [314, 166] },
    { name: 'Bed plate', anchor: 'bed', at: [314, 204] },
    { name: 'Winding key', anchor: 'key', at: [314, 248] },
    { name: 'Box', anchor: 'case', at: [100, 232] }
  ]
}

const drawing = computed(() => (kind.value === 'not_found' ? PIANO : MUSIC_BOX))
const labels = computed<TeardownLabel[]>(() => drawing.value.parts.map((part, i) => ({
  anchor: part.anchor,
  text: part.name,
  at: part.at,
  align: 'center',
  tone: 'white',
  n: i + 1,
  hot: !!part.fault,
})))

useHead({ title: () => t(`error_page.${kind.value}.name`) })
useSeoMeta({ robots: 'noindex' })

function reload() {
  window.location.reload()
}
</script>

<style scoped>
/* The sheet: grid paper inside a border and a drawn frame. Light ink on the dark card in the dark theme; the parts
   list's faulty row and the balloons keep their coral either way. */
.sheet {
  --sheet-ink: #1d2444;
  --sheet-grid: rgb(29 36 68 / 0.06);
  --sheet-head: #eef1f7;
  --sheet-hot: #ffb7a5;
  --sheet-hot-ink: #1d2444;
  display: grid;
  gap: 1.75rem;
  border: 2px solid var(--sheet-ink);
  border-radius: 0.75rem;
  padding: 1.5rem;
  background:
    repeating-linear-gradient(0deg, transparent 0 23px, var(--sheet-grid) 23px 24px),
    repeating-linear-gradient(90deg, transparent 0 23px, var(--sheet-grid) 23px 24px),
    var(--card);
  outline: 1px solid var(--sheet-ink);
  outline-offset: -8px;
  color: var(--title);
}

[data-theme="dark"] .sheet {
  --sheet-ink: #c9cfe6;
  --sheet-grid: rgb(201 207 230 / 0.06);
  --sheet-head: rgb(201 207 230 / 0.08);
}

@media (min-width: 640px) {
  .sheet { padding: 2.25rem; }
}

@media (min-width: 1024px) {
  .sheet {
    grid-template-columns: minmax(0, 1fr) 18rem;
    grid-template-rows: auto minmax(0, 1fr) auto;
    column-gap: 2.5rem;
    padding: 2.75rem;
  }

  .sheet-copy { grid-column: 1; grid-row: 1; }
  .sheet-figure { grid-column: 1; grid-row: 2 / 4; }
  .sheet-parts { grid-column: 2; grid-row: 1 / 3; align-self: start; }
  .sheet-block { grid-column: 2; grid-row: 3; align-self: end; }
}

.sheet-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 0.5rem;
  background: var(--sheet-head);
  padding: 0.5rem 0.75rem;
  color: var(--meta);
  font-size: 0.8125rem;
  font-weight: 600;
}

.sheet-dots {
  display: inline-flex;
  gap: 0.3rem;
}

.sheet-dots i {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #f4a9bc;
}

.sheet-dots i:nth-child(2) { background: #f6d27a; }
.sheet-dots i:nth-child(3) { background: #9ad7b8; }

.sheet-title {
  font-family: "CDCat Display", sans-serif;
  font-weight: 900;
  text-wrap: balance;
}

.sheet-figure > * {
  max-width: 32rem;
  margin-inline: auto;
}

.sheet-parts {
  width: 100%;
  border-collapse: collapse;
  background: var(--card);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}

.sheet-parts th,
.sheet-parts td {
  border: 1px solid var(--sheet-ink);
  padding: 0.4rem 0.6rem;
  text-align: left;
}

.sheet-parts th {
  background: var(--sheet-head);
  font-family: inherit;
  font-weight: 700;
}

.sheet-parts td:first-child,
.sheet-parts td:nth-child(3) { text-align: center; }

.sheet-parts tr.is-hot td {
  background: var(--sheet-hot);
  color: var(--sheet-hot-ink);
  font-weight: 700;
}

.sheet-block {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border: 1px solid var(--sheet-ink);
  background: var(--card);
  font-size: 0.8125rem;
}

.sheet-block > div {
  display: grid;
  gap: 0.15rem;
  border: 1px solid var(--sheet-ink);
  padding: 0.4rem 0.6rem;
}

.sheet-block dt {
  color: var(--meta);
  font-size: 0.6875rem;
}

.sheet-block dd {
  margin: 0;
  font-family: var(--font-mono);
  font-weight: 700;
}

.sheet-block dd.is-hot { color: #c4553d; }

[data-theme="dark"] .sheet-block dd.is-hot { color: var(--sheet-hot); }
</style>
