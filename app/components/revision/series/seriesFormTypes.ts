export interface MetaItem {
  key: string
  value: string
  json?: boolean
}

export interface SeriesGroup {
  uid: number
  name?: string | null
  order?: number
  id: string
  meta: MetaItem[]
}

export interface RelatedItem {
  order?: number
  id: string
  group_id: string
  meta: MetaItem[]
}

export interface SeriesCreateForm {
  name: string
  image_url: string
  meta: MetaItem[]
  groups: SeriesGroup[]
  relatedEntries: RelatedItem[]
  relatedWorks: RelatedItem[]
}
