import type { ComputedRef, InjectionKey } from 'vue'
import type { CatalogReferences } from '~/types/catalog'
import type { FieldError } from './useAlbumEditor'

export type EntityType = 'artist' | 'label' | 'work' | 'entry' | 'franchise'

/** What the single-entity editor (components/editor/EntityEditor.vue) shares with its fields. */
export interface EntityEditorContext {
  type: EntityType
  id: number | null
  // Documents of five types share the editor; each fields component knows its own shape.
  doc: ComputedRef<Record<string, unknown>>
  references: CatalogReferences
  remember: (type: string, id: number, row: object) => void
  /** The error at items.main.<path>, if the last submit reported one. */
  errorAt: (...path: Array<string | number>) => string | null
  errorsIn: (collection: string) => FieldError[]
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
}

export const entityEditorKey: InjectionKey<EntityEditorContext> = Symbol('entity-editor')

export const useEntityEditor = () => {
  const context = inject(entityEditorKey)
  if (!context) throw new Error('useEntityEditor() is only available inside EntityEditor')
  return context
}

/** A document with no content yet, as the API's defaults would fill it. */
export const emptyDocument = (type: EntityType): Record<string, unknown> => {
  const dates = { begin_date: null, begin_date_precision: 'day', end_date: null, end_date_precision: 'day' }
  switch (type) {
    case 'artist':
      return { name: '', slug: null, type: null, is_active: true, bio: null, image_url: null, titles: [], links: [], attributes: [], relations: [] }
    case 'label':
      return { name: '', slug: null, parent_id: null, country: null, description: null, image_url: null, ...dates, catalog_prefixes: [], titles: [], links: [], attributes: [] }
    case 'work':
      return { title: '', description: null, titles: [], credits: [], relations: [], entries: [], links: [], attributes: [] }
    case 'entry':
      return {
        name: '', slug: null, type: 'anime', format: null, platforms: [], release_date: null, release_date_precision: 'day',
        description: null, image_url: null, banner_url: null, titles: [], links: [], albums: [], relations: [],
      }
    case 'franchise':
      return { name: '', slug: null, parent_id: null, description: null, image_url: null, banner_url: null, sort_order: 0, titles: [], links: [], entries: [], albums: [] }
  }
}
