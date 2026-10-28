<script setup lang="ts">
/**
 * 版本: the made-up album's three editions as the section lists them (name, type, the format worked out from their
 * discs, catalog number and the rest), then the first one opened for editing down to its disc ticks.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const EDITIONS = computed(() => [
  { name: '初回限定盤', type: t('catalog.edition_type.limited'), format: 'CD+BD', details: ['STNT-0012~3', '4580000000017', 'JP', '3300 JPY', t('catalog.limited_rule.first_press')] },
  { name: '通常盤', type: t('catalog.edition_type.regular'), format: 'CD', details: ['STNT-0014', '2200 JPY'] },
  { name: '配信版', type: t('catalog.edition_type.regular'), format: 'DL', hires: true, details: ['2026-11-01'] },
])
/** Numbers, codes and dates are set in the monospace font, as the editor does. */
const numeric = (value: string) => /\d/.test(value)
const DISCS = computed(() => [
  { n: 1, format: t('catalog.disc_format.cd'), ticked: true },
  { n: 2, format: t('catalog.disc_format.bd'), ticked: true },
  { n: 3, format: t('catalog.disc_format.digital'), ticked: false },
])
</script>

<template>
  <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]" aria-hidden="true">
    <GuideMockPanel :title="t('editor.album.section.editions')" icon="lucide:package">
      <ul class="space-y-1.5">
        <li v-for="(edition, index) in EDITIONS" :key="edition.name" class="flex gap-2 rounded-md px-2 py-1.5" :class="index === 0 ? 'bg-primary/8 ring-1 ring-primary/30' : 'bg-sunken'">
          <span class="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-card font-mono text-[10px] font-bold text-meta ring-1 ring-line">{{ index + 1 }}</span>
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-semibold text-title">{{ edition.name }}</span>
              <GuideMockChip :label="edition.type" />
              <span class="rounded-sm bg-card px-1 font-mono text-[10px] font-semibold text-body ring-1 ring-line">{{ edition.format }}</span>
              <span v-if="edition.hires" class="rounded-sm bg-warning/15 px-1 text-[10px] font-bold text-warning">Hi-Res</span>
            </span>
            <span class="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-meta">
              <span v-for="detail in edition.details" :key="detail" :class="{ 'font-mono': numeric(detail) }">{{ detail }}</span>
            </span>
          </span>
        </li>
      </ul>
      <p class="mt-2.5"><GuideMockButton :label="t('editor.editions.add')" icon="lucide:plus" variant="add" /></p>
    </GuideMockPanel>

    <div class="overflow-hidden rounded-lg bg-popover shadow-overlay ring-1 ring-line">
      <p class="flex items-center gap-2 border-b border-line px-3 py-2 text-[13px] font-semibold text-title">
        <Icon name="lucide:package" class="size-3.5 text-primary" />{{ t('editor.dialog.edition_edit') }}
      </p>
      <div class="space-y-2.5 p-3">
        <div class="grid grid-cols-3 gap-2">
          <GuideMockField :label="t('editor.dialog.edition_name')" value="初回限定盤" />
          <GuideMockField :label="t('catalog.field.edition_type')" :value="t('catalog.edition_type.limited')" select />
          <GuideMockField :label="t('catalog.field.medium')" :value="t('catalog.product_medium.physical')" select />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <GuideMockField :label="t('catalog.field.limited_rule')" :value="t('catalog.limited_rule.first_press')" select />
          <GuideMockField :label="t('catalog.field.catalog_number')" value="STNT-0012~3" mono />
        </div>
        <div>
          <p class="mb-1 flex items-center gap-2 text-[11px] font-medium text-body">
            {{ t('editor.editions.discs') }}
            <span class="rounded-sm bg-sunken px-1 font-mono text-[10px] font-semibold text-title">CD+BD</span>
          </p>
          <p class="flex flex-wrap gap-1.5">
            <span
              v-for="disc in DISCS"
              :key="disc.n"
              class="inline-flex h-7 items-center gap-1.5 rounded-md border px-2"
              :class="disc.ticked ? 'border-primary/40 bg-primary/10' : 'border-line'"
            >
              <GuideMockCheck :checked="disc.ticked" :label="`${t('editor.album.disc_n', { n: disc.n })} · ${disc.format}`" />
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
