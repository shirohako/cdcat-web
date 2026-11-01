import type { UiSelectOption } from '~/components/ui/Select.vue'
import { IMAGE_KIND_GROUPS } from '~/types/album'

/**
 * The album editor's image kind options, grouped (IMAGE_KIND_GROUPS) and named 封面 (Cover): scans are labelled in
 * English on VGMdb and most sources, so other languages add the English name. Kinds the schema has but the
 * groups don't go last. The album cover has a slot of its own, so `cover` is offered only to a row that already is
 * one (a cover of one edition, from before).
 */
export function useImageKindOptions() {
  const { t } = useI18n()
  const { schema } = useCatalogSchema()
  const { enumLabel } = useCatalogDisplay()
  const { labelEn } = useEnglishLabels()

  const label = (kind: string) => {
    const english = labelEn('image_kind', kind)
    return english ? `${enumLabel('image_kind', kind)} (${english})` : enumLabel('image_kind', kind)
  }

  /** The options for a row of kind `current` (none for a new image). */
  return (current?: string): UiSelectOption<string>[] => {
    const kinds: string[] = (schema.value?.enums?.image_kind ?? []).filter((kind: string) => kind !== 'cover' || current === 'cover')
    const grouped = IMAGE_KIND_GROUPS.map(group => ({ key: group.key, kinds: group.kinds.filter(kind => kinds.includes(kind)) as string[] }))
    const known = new Set(grouped.flatMap(group => group.kinds))
    grouped.at(-1)!.kinds.push(...kinds.filter(kind => !known.has(kind)))
    return grouped.flatMap(group => group.kinds.map(kind => ({
      value: kind, label: label(kind), group: t(`editor.image.kind_group.${group.key}`),
    })))
  }
}
