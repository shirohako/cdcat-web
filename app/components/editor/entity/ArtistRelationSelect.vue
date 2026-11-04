<template>
  <UiDialogSelect
    v-model="model"
    :options="options"
    :title="$t('editor.entity.relation_title')"
    :description="$t('editor.entity.relation_intro')"
    :placeholder="$t('editor.entity.relation_placeholder')"
    size="sm"
  />
</template>

<script setup lang="ts">
import type { UiDialogSelectOption } from '~/components/ui/DialogSelect.vue'
import type { ArtistRelation } from '~/types/artist'
import { ARTIST_RELATIONS, relationsFor } from '~/types/artist'

/**
 * The relation of an artist row, picked in a dialog that explains each option. It offers what fits the artist's `type`,
 * plus the row's own value if that no longer fits (the type changed). `name` puts the artist into the explanations.
 */
const props = defineProps<{ type?: string | null, name?: string | null }>()
const model = defineModel<string>({ required: true })

const { t } = useI18n()
const { enumLabel } = useCatalogDisplay()
const { labelEn } = useEnglishLabels()

/** The two sides of a pair share a colour. */
const TONES: Record<ArtistRelation, UiDialogSelectOption['tone']> = {
  member_of: 'blue',
  has_member: 'blue',
  voice_of: 'pink',
  voiced_by: 'pink',
  alias: 'amber',
  related: 'teal',
}

const options = computed<UiDialogSelectOption<string>[]>(() => {
  const name = props.name?.trim() || t('editor.entity.relation_this_artist')
  const offered = relationsFor(props.type)
  const own = ARTIST_RELATIONS.filter(value => value === model.value && !offered.includes(value))
  return [...offered, ...own].map((value) => {
    const label = enumLabel('artist_relation', value)
    const english = labelEn('artist_relation', value)
    return {
      value,
      label,
      hint: english === label ? undefined : english,
      summary: t(`editor.entity.relation_options.${value}.summary`, { name }),
      description: t(`editor.entity.relation_options.${value}.description`),
      content: t(`editor.entity.relation_options.${value}.content`).split('\n'),
      span: 3,
      tone: TONES[value],
    }
  })
})
</script>
