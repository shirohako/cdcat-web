export interface MetaItem {
  key: string
  value: string
}

export interface SeriesGroup {
  uid: number
  id: string
  meta: MetaItem[]
}

export interface RelatedItem {
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
