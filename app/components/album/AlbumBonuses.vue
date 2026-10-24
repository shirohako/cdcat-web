<template>
  <CatalogSection v-if="bonuses.length" :title="$t('album.section.bonuses')" :icon="Gift">
    <template v-if="bonuses.length > 1" #actions>{{ $t('content_display.bonuses', { count: bonuses.length }) }}</template>

    <ul class="divide-y divide-line">
      <li v-for="bonus in sorted" :key="bonus.id" class="flex gap-3 px-5 py-3">
        <div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sunken">
          <img v-if="bonusImage(bonus.id)" :src="bonusImage(bonus.id)!" :alt="bonus.name" class="h-full w-full object-cover">
          <div v-else class="flex h-full w-full items-center justify-center"><Gift :size="18" class="text-faint" /></div>
        </div>
        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-sm font-medium leading-snug text-title">{{ bonus.name }}</span>
            <span class="shrink-0 rounded-full bg-pink-50 px-1.5 py-0.5 text-[10px] font-bold text-pink-600 dark:bg-pink-400/15 dark:text-pink-300">{{ enumLabel('bonus_type', bonus.type) }}</span>
            <span v-if="bonus.is_digital" class="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-500 dark:bg-blue-400/15 dark:text-blue-300">DL</span>
            <span v-if="bonus.availability" class="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">{{ enumLabel('limited_rule', bonus.availability) }}</span>
          </div>
          <p class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-meta">
            <span v-if="bonus.shop" class="flex items-center gap-1"><Store :size="11" />{{ bonus.shop }}</span>
            <NuxtLink v-if="bonus.event" :to="`/albums?event=${bonus.event.id}`" class="flex items-center gap-1 transition-colors hover:text-primary"><CalendarDays :size="11" />{{ bonus.event.name }}</NuxtLink>
            <span class="flex items-center gap-1">
              <Package :size="11" />
              {{ bonus.product_ids.length ? editionNames(bonus.product_ids) : $t('album.bonuses.all_editions') }}
            </span>
          </p>
          <p v-if="bonus.description" class="whitespace-pre-line text-xs leading-relaxed text-body">{{ bonus.description }}</p>
          <p v-if="bonus.note" class="text-[11px] text-meta">{{ bonus.note }}</p>
          <p v-if="bonus.disc_ids.length" class="flex flex-wrap gap-2 text-[11px]">
            <a v-for="discId in bonus.disc_ids" :key="discId" :href="`#disc-${discId}`" class="link inline-flex items-center gap-1">
              <Disc3 :size="11" />Disc {{ discNumbers.get(discId) }}
            </a>
          </p>
        </div>
      </li>
    </ul>
  </CatalogSection>
</template>

<script setup lang="ts">
import type { AlbumBonus, AlbumDisc, AlbumImage, AlbumProduct } from '~/types/album'
import { CalendarDays, Disc3, Gift, Package, Store } from '@lucide/vue'

const props = defineProps<{
  bonuses: AlbumBonus[]
  products: AlbumProduct[]
  discs: AlbumDisc[]
  images: AlbumImage[]
}>()

const { t } = useI18n()
const { enumLabel } = useCatalogDisplay()

const sorted = computed(() => [...props.bonuses].sort((a, b) => a.sort_order - b.sort_order))
const discNumbers = computed(() => new Map(props.discs.map(disc => [disc.id, disc.position])))

const editionNames = (ids: number[]) => ids
  .map(id => props.products.find(product => product.id === id))
  .filter(Boolean)
  .map(product => product!.name || t(product!.edition_type === 'limited' ? 'content_display.limited' : 'content_display.regular'))
  .join('、')

const bonusImage = (bonusId: number) => props.images.find(image => image.bonus_id === bonusId && image.image)?.image?.thumbnail_url ?? null
</script>
