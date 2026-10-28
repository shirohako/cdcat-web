<script setup lang="ts">
/**
 * 链接与关联: the three cards of the section, filled in: an entry linked as the opening theme with a note, three links
 * whose sites were recognised from the address, and one attribute.
 */
defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const LINKS = [
  { provider: 'VGMdb', url: 'vgmdb.net/album/123456' },
  { provider: 'Bandcamp', url: 'stellanote.bandcamp.com/album/atlas' },
  { provider: 'X', url: 'x.com/stellanote' },
]
</script>

<template>
  <div class="grid gap-3 md:grid-cols-2" aria-hidden="true">
    <GuideMockPanel :title="t('catalog.collection.entries')" icon="lucide:clapperboard" class="md:col-span-2">
      <p class="flex items-center gap-2 rounded-md bg-sunken px-2 py-1.5">
        <span class="grid size-8 shrink-0 place-items-center rounded-md bg-(--accent-soft) text-(--accent)"><Icon name="lucide:tv" class="size-4" /></span>
        <span class="min-w-0 flex-1">
          <span class="flex flex-wrap items-center gap-1.5">
            <span class="truncate text-xs font-semibold text-title">銀河鉄道の放課後</span>
            <GuideMockChip :label="t('catalog.album_relation.opening')" tone="soft" />
          </span>
          <span class="block truncate text-[10px] text-meta">{{ text.note }}</span>
        </span>
        <Icon name="lucide:pencil-line" class="size-3.5 shrink-0 text-faint" />
      </p>
      <p class="mt-2"><GuideMockButton :label="t('editor.dialog.entry_add')" icon="lucide:plus" variant="add" /></p>
    </GuideMockPanel>

    <GuideMockPanel :title="t('catalog.collection.links')" icon="lucide:link-2">
      <ul class="space-y-1">
        <li v-for="link in LINKS" :key="link.url" class="flex items-center gap-2 rounded-md bg-sunken px-2 py-1.5 text-[11px]">
          <span class="w-16 shrink-0 truncate font-semibold text-title">{{ link.provider }}</span>
          <span class="min-w-0 flex-1 truncate text-meta">{{ link.url }}</span>
          <Icon name="lucide:external-link" class="size-3 shrink-0 text-faint" />
        </li>
      </ul>
      <p class="mt-2"><GuideMockButton :label="t('editor.add_link')" icon="lucide:plus" variant="add" /></p>
    </GuideMockPanel>

    <GuideMockPanel :title="t('catalog.collection.attributes')" icon="lucide:list-checks">
      <p class="flex items-center gap-2 rounded-md bg-sunken px-2 py-1.5 text-[11px]">
        <span class="shrink-0 font-semibold text-title">{{ text.attribute }}</span>
        <span class="min-w-0 flex-1 truncate text-body">ルナ</span>
      </p>
      <p class="mt-2"><GuideMockButton :label="t('editor.add_attribute')" icon="lucide:plus" variant="add" /></p>
    </GuideMockPanel>
  </div>
</template>
