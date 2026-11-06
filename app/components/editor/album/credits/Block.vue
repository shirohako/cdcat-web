<template>
  <section class="rounded-lg border border-line">
    <header class="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-t-lg border-b border-line bg-sunken px-3 py-2">
      <h3 class="text-sm font-semibold text-title">{{ title }}</h3>
      <span class="rounded px-1.5 text-[11px] font-semibold leading-[1.125rem]" :class="scope === 'album' ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info'">{{ t(`editor.credits.scope_${scope}`) }}</span>
      <div class="ml-auto flex items-center gap-2">
        <UiButton v-if="$slots.hint && closed" :icon="CircleHelp" icon-class="size-3" size="xs" class="gap-1 ring-1 ring-inset ring-line" @click="setClosed(false)">{{ t('editor.credits.show_hint') }}</UiButton>
        <slot name="actions" />
      </div>
    </header>
    <div class="p-3">
      <UiCollapse v-if="$slots.hint" :open="!closed">
        <div class="pb-3"><EditorAlbumCreditsHint @close="setClosed(true)"><slot name="hint" /></EditorAlbumCreditsHint></div>
      </UiCollapse>
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { CircleHelp } from '@lucide/vue'

/**
 * One of the three parts of 参与创作的人: its title, whether it is about the album or its tracks, and its content. The
 * `hint` slot is a notice on what goes in it that can be closed for good, by `name`; a button in the header brings it back.
 */
const props = defineProps<{ name: string, title: string, scope: 'album' | 'tracks' }>()

const { t } = useI18n()
const { closed, setClosed } = useCreditHint(props.name)
</script>
