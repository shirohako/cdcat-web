<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-3 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
        <Gift :size="16" class="text-pink-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">{{ $t('work.section.bonuses') }}</h2>
      <span v-if="bonuses && bonuses.length > 1" class="ml-auto text-xs text-gray-400">{{ bonuses.length }} 项特典</span>
    </div>

    <!-- Bonus List -->
    <div v-if="bonuses && bonuses.length" class="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-gray-100">
      <div
        v-for="(bonus, index) in bonuses"
        :key="bonus.id"
        class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors border-b border-gray-100"
        :class="{ 'lg:border-b-0': index >= bonuses.length - (bonuses.length % 2 === 0 ? 2 : 1) }"
      >
        <!-- Type icon -->
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          :class="getBonusTypeStyle(bonus.type).bg"
        >
          <component :is="getBonusIcon(bonus.type)" :size="15" :class="getBonusTypeStyle(bonus.type).icon" />
        </div>

        <!-- Main info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-sm font-medium text-gray-900 leading-snug">{{ bonus.name }}</span>
            <span
              class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full shrink-0"
              :class="getBonusTypeStyle(bonus.type).badge"
            >{{ formatBonusType(bonus.type) }}</span>
            <span v-if="bonus.is_digital" class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-blue-50 text-blue-500 shrink-0">DL</span>
          </div>
          <!-- Associated product -->
          <p v-if="linkedProduct(bonus.product_id)" class="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
            <Package :size="10" />
            {{ linkedProduct(bonus.product_id) }}
          </p>
        </div>

        <!-- Detail button -->
        <button
          type="button"
          class="shrink-0 text-[11px] text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 rounded px-2 py-0.5 transition-colors cursor-pointer"
          @click="openDetail(bonus)"
        >详情</button>
      </div>
    </div>

    <div v-else class="flex items-center justify-center gap-3 py-5 px-6">
      <div class="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
        <Gift :size="15" class="text-pink-400" />
      </div>
      <div class="text-left">
        <p class="text-sm font-semibold text-gray-600">{{ $t('work.empty.bonuses_title') }}</p>
        <p class="text-xs text-gray-500 mt-0.5">{{ $t('work.empty.bonuses_desc') }}</p>
      </div>
    </div>
  </section>

  <!-- Detail Dialog -->
  <dialog ref="detailDialog" class="modal">
    <div v-if="activeBonus" class="modal-box max-w-md">
      <!-- Dialog header -->
      <div class="flex items-start gap-3 mb-4">
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          :class="getBonusTypeStyle(activeBonus.type).bg"
        >
          <component :is="getBonusIcon(activeBonus.type)" :size="16" :class="getBonusTypeStyle(activeBonus.type).icon" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-gray-900 leading-snug">{{ activeBonus.name }}</h3>
          <div class="flex items-center gap-1.5 mt-1 flex-wrap">
            <span class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full" :class="getBonusTypeStyle(activeBonus.type).badge">
              {{ formatBonusType(activeBonus.type) }}
            </span>
            <span v-if="activeBonus.is_digital" class="px-1.5 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-blue-50 text-blue-500">DL</span>
            <span v-if="linkedProduct(activeBonus.product_id)" class="text-[11px] text-gray-400 flex items-center gap-1">
              <Package :size="10" />{{ linkedProduct(activeBonus.product_id) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Image -->
      <div v-if="activeBonus.image_url" class="mb-4 rounded-lg overflow-hidden border border-gray-100">
        <img :src="activeBonus.image_url" :alt="activeBonus.name" class="w-full object-cover max-h-60" />
      </div>

      <!-- Description -->
      <p class="text-sm leading-relaxed whitespace-pre-line" :class="activeBonus.description ? 'text-gray-600' : 'text-gray-400'">
        {{ activeBonus.description || $t('work.empty.bonus_detail') }}
      </p>

      <div class="modal-action mt-5">
        <button class="btn btn-sm" @click="detailDialog?.close()">关闭</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import type { WorkBonusWithProduct, WorkProduct } from '~/types/work'
import type { Component } from 'vue'
import {
  Gift, Disc3, Music, Image as ImageIcon, Ticket, Download,
  Package, BookOpen, Key, PenLine,
} from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  bonuses: WorkBonusWithProduct[]
  products: WorkProduct[]
}>(), {
  bonuses: () => [],
  products: () => [],
})

const detailDialog = ref<HTMLDialogElement | null>(null);
const activeBonus = ref<WorkBonusWithProduct | null>(null);

const openDetail = (bonus: WorkBonusWithProduct) => {
  activeBonus.value = bonus;
  detailDialog.value?.showModal();
};

const linkedProduct = (productId: number | null) => {
  if (!productId) return null;
  const p = props.products.find(p => p.id === productId);
  return p ? (p.name || p.edition_type) : null;
};

const getBonusIcon = (type: string) => {
  const map: Record<string, Component> = {
    BONUS_TRACK: Music,
    BONUS_DISC: Disc3,
    BOOKLET: BookOpen,
    PHOTO_ITEM: ImageIcon,
    GOODS: Package,
    DIGITAL_CONTENT: Download,
    SERIAL_CODE: Key,
    EVENT_ENTRY: Ticket,
    SIGNED_ITEM: PenLine,
  };
  return map[type] || Gift;
};

const getBonusTypeStyle = (type: string) => {
  const map: Record<string, { bg: string; icon: string; badge: string }> = {
    BONUS_TRACK:    { bg: 'bg-blue-50',    icon: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700' },
    BONUS_DISC:     { bg: 'bg-indigo-50',  icon: 'text-indigo-500', badge: 'bg-indigo-100 text-indigo-700' },
    BOOKLET:        { bg: 'bg-amber-50',   icon: 'text-amber-500',  badge: 'bg-amber-100 text-amber-700' },
    PHOTO_ITEM:     { bg: 'bg-pink-50',    icon: 'text-pink-500',   badge: 'bg-pink-100 text-pink-700' },
    GOODS:          { bg: 'bg-orange-50',  icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' },
    DIGITAL_CONTENT:{ bg: 'bg-green-50',   icon: 'text-green-500',  badge: 'bg-green-100 text-green-700' },
    SERIAL_CODE:    { bg: 'bg-cyan-50',    icon: 'text-cyan-500',   badge: 'bg-cyan-100 text-cyan-700' },
    EVENT_ENTRY:    { bg: 'bg-violet-50',  icon: 'text-violet-500', badge: 'bg-violet-100 text-violet-700' },
    SIGNED_ITEM:    { bg: 'bg-rose-50',    icon: 'text-rose-500',   badge: 'bg-rose-100 text-rose-700' },
  };
  return map[type] || { bg: 'bg-gray-50', icon: 'text-gray-400', badge: 'bg-gray-100 text-gray-600' };
};

const formatBonusType = (type: string) => {
  const map: Record<string, string> = {
    BONUS_TRACK: 'Bonus Track',
    BONUS_DISC: 'Bonus Disc',
    BOOKLET: 'Booklet',
    PHOTO_ITEM: 'Photo Item',
    GOODS: 'Goods',
    DIGITAL_CONTENT: 'Digital',
    SERIAL_CODE: 'Serial Code',
    EVENT_ENTRY: 'Event Entry',
    SIGNED_ITEM: 'Signed Item',
    OTHER: 'Other',
  };
  return map[type] || type;
};
</script>
