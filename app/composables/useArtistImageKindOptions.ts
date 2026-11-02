import type { UiSelectOption } from '~/components/ui/Select.vue'

/** The kinds an artist image can take. Giving an image the kind 头像 or 横幅 does not make it the main one; 用作头像 does. */
export function useArtistImageKindOptions() {
  const { schema } = useCatalogSchema()
  const { enumLabel } = useCatalogDisplay()

  return (): UiSelectOption<string>[] => (schema.value?.enums?.artist_image_kind ?? ['avatar', 'banner', 'photo', 'illustration', 'other'])
    .map((kind: string) => ({ value: kind, label: enumLabel('artist_image_kind', kind) }))
}
