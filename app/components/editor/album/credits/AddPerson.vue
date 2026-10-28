<script setup lang="ts">
import type { CreditPerson } from '~/utils/creditLines'

/**
 * Adds people to a credit: a dashed "+" that opens an artist search in its place. A pick adds the artist; a name
 * not found can make a new artist (its type picked later on its tag) or stay a printed name only. The search stays
 * open for the next person and closes when focus leaves it or on Escape. `startOpen` opens it at once, for a line
 * that has no one yet.
 */
const props = defineProps<{ label?: string, startOpen?: boolean }>()
const emit = defineEmits<{ add: [person: CreditPerson] }>()

const { t } = useI18n()
const people = useCreditPeople()
const adding = ref(!!props.startOpen)
const wrapper = useTemplateRef<HTMLElement>('wrapper')

watch(adding, async (value) => {
  if (!value) return
  await nextTick()
  wrapper.value?.querySelector('input')?.focus()
}, { immediate: true })

const leave = (event: FocusEvent) => {
  if (!wrapper.value?.contains(event.relatedTarget as Node | null)) adding.value = false
}
</script>

<template>
  <span v-if="adding" ref="wrapper" class="inline-block w-56 max-w-full" @focusout="leave" @keydown.esc="adding = false">
    <EditorEntityPicker
      kind="artist"
      allow-create
      allow-name
      :placeholder="t('editor.credits.pick_artist')"
      @select="emit('add', people.picked($event))"
      @create="emit('add', people.created($event))"
      @name="emit('add', people.printed($event))"
    />
  </span>
  <UiButton
    v-else
    variant="add"
    size="xs"
    icon="lucide:plus"
    :label="label ? undefined : t('editor.credits.add_person')"
    class="gap-1"
    @click="adding = true"
  >{{ label }}</UiButton>
</template>
