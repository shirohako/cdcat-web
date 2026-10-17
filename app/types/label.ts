// Labels (厂牌). Backend: docs/api/labels.md.

import type { DatePrecision } from './entry'
import type { CatalogAttribute, CatalogLink, CatalogTitle, PendingFields } from './catalog'

export interface Label extends PendingFields {
  id: number
  name: string
  slug: string | null
  country: string | null
  image_url: string | null
  albums_count: number
  description: string | null
  begin_date: string | null
  begin_date_precision: DatePrecision | null
  end_date: string | null
  end_date_precision: DatePrecision | null
  catalog_prefixes: string[]
  parent?: { id: number, name: string, slug: string | null } | null
  children?: Array<{ id: number, name: string, slug: string | null }>
  titles?: CatalogTitle[]
  links?: CatalogLink[]
  attributes?: CatalogAttribute[]
  version: number
  created_at: string
  updated_at: string
}
