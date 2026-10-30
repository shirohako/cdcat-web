import type { AsyncData, AsyncDataOptions, NuxtApp, NuxtError } from '#app'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { User } from '~/types/user'
import { pageCache } from '~/utils/pageCache'

export interface PageFetchContext {
  signal: AbortSignal
  /** A background refresh of data the page already shows: keep it off the progress bar. */
  background: boolean
}

export interface PageDataOptions<T> extends Omit<AsyncDataOptions<T>, 'lazy' | 'default' | 'getCachedData'> {
  /**
   * Show the data from an earlier visit (within ten minutes, same user) right away and refresh it in the
   * background. Pages about the viewer themselves (notifications, drafts, revisions…) pass false.
   */
  cache?: boolean
  /**
   * For a page's main record: a 404 means what the address names doesn't exist, so the site's not-found page
   * (app/error.vue) takes over the page and the server answers 404, instead of the page's own error state.
   */
  notFound?: boolean
}

export interface PageDataState<T> {
  /** Nothing to show yet: render the skeleton. */
  loading: ComputedRef<boolean>
  /** A refetch the reader asked for (filter, page) while older data is shown: dim it. */
  refetching: ComputedRef<boolean>
  /** A background refresh of data from an earlier visit: change nothing on screen. */
  revalidating: Readonly<Ref<boolean>>
  /** For a list's results container: changes when new results replace the old ones, so they fade in again. */
  revealKey: Readonly<Ref<number>>
  /** `content-reveal` when the content should fade in, i.e. it replaces a skeleton or older results. */
  revealClass: ComputedRef<string>
  /** Updates the data in place (and in the revisit cache), e.g. after the reader favourites something. */
  mutate: (update: (value: T) => T) => void
}

/** useAsyncData's fields, without its own promise (awaiting a page's data gives this whole object). */
type AsyncDataFields<T> = Pick<AsyncData<T | undefined, NuxtError | undefined>, 'data' | 'pending' | 'status' | 'error' | 'refresh' | 'execute' | 'clear'>

export type PageData<T> = AsyncDataFields<T> & PageDataState<T>

/**
 * A page's main data. Client-side navigation renders the page at once, with `loading` true until the data
 * arrives (the server still waits for it, so server-rendered HTML is complete). Keep the `await`: it waits
 * on the server only, so code after it can still read the data while rendering there.
 *
 * Template order: content when there is data, then the error when `status === 'error'`, then the skeleton.
 */
export function usePageData<T>(
  key: MaybeRefOrGetter<string>,
  fetcher: (context: PageFetchContext) => Promise<T>,
  options: PageDataOptions<T> = {},
): PageData<T> & Promise<PageData<T>> {
  const { cache = true, notFound = false, ...asyncOptions } = options
  const nuxtApp = useNuxtApp()
  const user = useState<User | null>('auth:user')
  const userId = () => user.value?.id ?? null
  const currentKey = () => toValue(key)
  const caching = import.meta.client && cache

  const revalidating = ref(false)
  /** The last data this page showed. Nuxt resets the data to `default` when a request fails, so this keeps it on screen. */
  let lastGood: T | undefined
  /** Keys this page was served from the cache; each gets one background refresh. */
  const stale = new Set<string>()
  let active = true

  /** Notes that `k` holds fresh data, and drops whatever that pushes out of the cache. */
  const remember = (k: string) => {
    for (const dropped of pageCache.touch(k, userId())) nuxtApp.runWithContext(() => clearNuxtData(dropped))
  }

  const readCache = (k: string, app: NuxtApp, context: { cause: string }) => {
    if (import.meta.server) return undefined
    const cached = app.payload.data[k] as T | undefined
    if (app.isHydrating) {
      if (cached !== undefined) remember(k)
      return cached
    }
    if (context.cause !== 'initial' || cached === undefined || app.payload._errors[k] || !pageCache.isFresh(k, userId())) return undefined
    stale.add(k)
    return cached
  }

  const result = useAsyncData(key, async (_app, { signal }): Promise<T> => {
    const requested = currentKey()
    const value = await fetcher({ signal, background: revalidating.value })
    // Counted from a successful response, so failed or cancelled requests don't extend an entry's life.
    if (caching) remember(requested)
    return value
  }, {
    ...asyncOptions,
    lazy: true,
    default: () => lastGood,
    ...(caching ? { getCachedData: readCache } : {}),
  })

  const revalidate = async (k: string) => {
    if (!active || k !== currentKey() || !stale.delete(k)) return
    revalidating.value = true
    try {
      await result.refresh()
    } finally {
      if (active && k === currentKey()) {
        // A failed background refresh changes nothing on screen.
        if (result.status.value === 'error' && result.data.value != null) {
          result.error.value = undefined
          result.status.value = 'success'
        }
        revalidating.value = false
      }
    }
  }

  const revealKey = ref(0)
  /** Content fades in when this page started out with a skeleton in the browser, never in server-rendered HTML. */
  const startedEmpty = import.meta.client && !nuxtApp.isHydrating && result.data.value == null
  let keyChanged = false

  if (import.meta.client) {
    let held = currentKey()
    if (caching) pageCache.retain(held)
    watch(currentKey, (next) => {
      if (caching) {
        pageCache.release(held)
        pageCache.retain(next)
      }
      held = next
      keyChanged = true
      revalidating.value = false
      void nextTick(() => revalidate(next))
    })
    watch(result.data, (value) => {
      if (value != null) lastGood = value as T
      if (!keyChanged || revalidating.value) return
      keyChanged = false
      revealKey.value++
    }, { immediate: true })
    // Registered after useAsyncData, so this runs once Nuxt has put the cached data in place.
    onBeforeMount(() => revalidate(currentKey()))
    onScopeDispose(() => {
      active = false
      // Nuxt keeps `default` with its entry after this page has gone; don't let it hold on to the data.
      lastGood = undefined
      if (caching) pageCache.release(held)
    })
  }

  const state: PageDataState<T> = {
    loading: computed(() => result.data.value == null && (result.status.value === 'idle' || result.status.value === 'pending')),
    refetching: computed(() => result.pending.value && result.data.value != null && !revalidating.value),
    revalidating: readonly(revalidating),
    revealKey: readonly(revealKey),
    revealClass: computed(() => (startedEmpty || revealKey.value > 0 ? 'content-reveal' : '')),
    mutate(update) {
      const current = result.data.value
      if (current == null) return
      const next = update(current as T)
      result.data.value = next
      if (import.meta.client) nuxtApp.payload.data[currentKey()] = next
      // A request already on its way may carry the state from before this change: ask again.
      if (result.pending.value) void result.refresh()
    },
  }

  // A failed background refresh keeps the data on screen, so only a 404 with nothing to show counts as missing.
  const missing = () => notFound && result.error.value?.statusCode === 404 && result.data.value == null
  if (import.meta.client && notFound) {
    watch(missing, (gone) => {
      if (gone) void nuxtApp.runWithContext(() => showError({ statusCode: 404, fatal: true }))
    })
  }

  const { data, pending, status, error, refresh, execute, clear } = result
  const page = { data, pending, status, error, refresh, execute, clear, ...state } as PageData<T>
  return Object.assign(result.then(() => {
    // The server waits for the data, so it can answer with the not-found page straight away.
    if (import.meta.server && missing()) throw createError({ statusCode: 404, fatal: true })
    return page
  }), page)
}

export interface PageAPIOptions<T> extends PageDataOptions<T> {
  query?: MaybeRefOrGetter<Record<string, unknown> | undefined>
}

/** `usePageData` for a GET on the API, keyed by the URL and query. */
export function usePageAPI<T>(url: MaybeRefOrGetter<string>, options: PageAPIOptions<T> = {}) {
  const { query, ...rest } = options
  const { $api } = useNuxtApp()
  return usePageData<T>(
    () => `api:${toValue(url)}${queryKey(toValue(query))}`,
    ({ signal, background }) => $api<T>(toValue(url), { query: toValue(query), signal, progress: !background }),
    rest,
  )
}

/** The query as a stable string: sorted, without empty values. */
function queryKey(query: Record<string, unknown> | undefined) {
  const pairs = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => [name, String(value)])
  return pairs.length ? `?${new URLSearchParams(pairs)}` : ''
}
