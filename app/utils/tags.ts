import type { TagSummary } from '~/types/article'

/** Characters in a tag name typed while writing (config/tags.php name_max on the API). */
export const TAG_NAME_MAX = 30

/** A name as the API stores it: spaces trimmed and collapsed. */
export const cleanTagName = (name: string) => name.trim().replace(/\s+/g, ' ')

/** What makes two names the same tag, as on the API: case, full/half width and spacing do not count. */
export const tagKey = (name: string) => cleanTagName(name.normalize('NFKC').toLowerCase())

/** A tag typed in a picker that the library lacks; it has a negative id until it is saved. */
export const isNewTag = (tag: TagSummary) => tag.id < 0

let nextNewId = -1
export const newTag = (name: string): TagSummary => ({ id: nextNewId--, name: cleanTagName(name), slug: '', translations: null, is_staff_only: false })

/** The request fields for a tag list: existing tags by id, new ones by name. Send both together. */
export const tagPayload = (tags: TagSummary[]) => ({
  tag_ids: tags.filter(tag => !isNewTag(tag)).map(tag => tag.id),
  new_tags: tags.filter(isNewTag).map(tag => tag.name),
})

const TAG_ERRORS: Array<[RegExp, string]> = [
  [/at most \d+ characters/i, 'article_ui.tags.errors.too_long'],
  [/not allowed/i, 'article_ui.tags.errors.blocked'],
  [/only be applied by moderators/i, 'article_ui.tags.errors.staff'],
  [/tags a day/i, 'article_ui.tags.errors.daily'],
  [/at most \d+ tags/i, 'article_ui.tags.errors.full'],
]

/**
 * The message key for a validation error on `tag_ids` or `new_tags`, from the API's messages
 * (App\Services\TagLibrary); null when `details` has no tag error.
 */
export const tagErrorKey = (details: Record<string, string[]> | undefined): string | null => {
  const message = details?.new_tags?.[0] ?? details?.tag_ids?.[0]
  if (!message) return null
  return TAG_ERRORS.find(([pattern]) => pattern.test(message))?.[1] ?? 'article_ui.tags.errors.other'
}
