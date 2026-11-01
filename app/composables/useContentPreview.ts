import type { InjectionKey } from 'vue'

const previewKey: InjectionKey<boolean> = Symbol('content-preview')

/**
 * Marks what renders below as a preview of content that isn't published yet (the album editor's 预览): it looks
 * as it will, but nothing in it is fetched, saved or followed, as its ids aren't real.
 */
export const provideContentPreview = () => provide(previewKey, true)

/** Whether this renders inside a preview: favourites, tracking, reviews and the like then do nothing. */
export const useContentPreview = () => inject(previewKey, false)
