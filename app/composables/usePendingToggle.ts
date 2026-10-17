/**
 * The "show pending" switch of a catalog list, kept in the URL as ?pending=1. Lists send it as
 * include_pending; content awaiting review is left out otherwise (docs/catalog/editing.md#待审内容).
 */
export const usePendingToggle = () => {
  const route = useRoute()
  const router = useRouter()
  const includePending = computed(() => route.query.pending === '1')
  const setIncludePending = (on: boolean) => router.push({ query: { ...route.query, pending: on ? '1' : undefined, page: undefined } })

  return { includePending, setIncludePending }
}
