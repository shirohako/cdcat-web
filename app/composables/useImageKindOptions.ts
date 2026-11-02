import type { UiSelectOption } from '~/components/ui/Select.vue'
import { IMAGE_KIND_GROUPS } from '~/types/album'

/**
 * The album editor's image kind options, grouped (IMAGE_KIND_GROUPS) and named 封面 (Cover): scans are labelled in
 * English on VGMdb and most sources, so other languages add the English name. Kinds the schema has but the
 * groups don't go last. Giving an image the kind 封面 or 横幅 does not make it the main one; 用作封面 does.
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

  return (): UiSelectOption<string>[] => {
    const kinds: string[] = schema.value?.enums?.image_kind ?? []
    const grouped = IMAGE_KIND_GROUPS.map(group => ({ key: group.key, kinds: group.kinds.filter(kind => kinds.includes(kind)) as string[] }))
    const known = new Set(grouped.flatMap(group => group.kinds))
    grouped.at(-1)!.kinds.push(...kinds.filter(kind => !known.has(kind)))
    return grouped.flatMap(group => group.kinds.map(kind => ({
      value: kind, label: label(kind), group: t(`editor.image.kind_group.${group.key}`),
    })))
  }
}
