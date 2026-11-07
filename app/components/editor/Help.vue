<template>
  <UiTooltip v-if="entry" :placement="placement" :delay="120" class="w-[min(22rem,calc(100vw-1rem))]">
    <!-- Inside a <label>, a click must not move on to the field, and a tap has to open the tooltip (data-tooltip-tap).
         No tab stop, so Tab keeps going from field to field; the fields stay named by their labels alone. -->
    <span class="inline-flex cursor-help transition-[color,opacity] duration-150" :class="tagged ? 'opacity-70 hover:opacity-100' : 'ml-1 align-[-2px] text-faint hover:text-primary'" data-tooltip-tap aria-hidden="true" @click.prevent>
      <CircleHelp :size="tagged ? 11 : 13" />
    </span>
    <template #content>
      <div class="space-y-2 text-xs leading-5">
        <p v-if="entry.text" class="whitespace-pre-line text-title">{{ entry.text }}</p>

        <table v-if="entry.rows" class="w-full border-collapse">
          <tbody>
            <tr v-for="[name, meaning] in entry.rows" :key="name" class="border-t border-line first:border-t-0">
              <th scope="row" class="whitespace-nowrap py-1 pr-3 text-left align-top font-medium text-title">{{ name }}</th>
              <td class="py-1 align-top text-body">{{ meaning }}</td>
            </tr>
          </tbody>
        </table>

        <p v-if="entry.examples" class="flex flex-wrap items-center gap-1">
          <span class="mr-0.5 text-meta">{{ t('editor.help.examples') }}</span>
          <span v-for="example in entry.examples" :key="example" class="rounded bg-black/[0.06] px-1.5 text-title dark:bg-white/[0.1]">{{ example }}</span>
        </p>

        <ul v-if="entry.dont" class="space-y-0.5">
          <li v-for="item in entry.dont" :key="item" class="flex gap-1.5 text-body">
            <X :size="13" class="mt-1 shrink-0 text-danger" />{{ item }}
          </li>
        </ul>

        <div v-if="entry.where || entry.mock" class="space-y-1.5 border-t border-line pt-2">
          <p v-if="entry.where" class="flex gap-1.5 text-body">
            <MapPin :size="13" class="mt-1 shrink-0 text-primary" />{{ entry.where }}
          </p>
          <EditorHelpMock v-if="entry.mock" :mock="entry.mock" />
        </div>
      </div>
    </template>
  </UiTooltip>
</template>

<script setup lang="ts">
import type { Placement } from '@floating-ui/dom'
import { CircleHelp, MapPin, X } from '@lucide/vue'
import { editorHelp } from '~/editorHelp'

/** The small ? after a field's label: on hover, or a tap, how to fill the field and where it shows. Text in app/editorHelp. */
const props = withDefaults(defineProps<{
  id: string
  placement?: Placement
  /** Inside a EditorRequiredTag: smaller, in the tag's colour */
  tagged?: boolean
}>(), { placement: 'top' })

const { t, locale } = useI18n()
const entry = computed(() => editorHelp(locale.value, props.id))
</script>
