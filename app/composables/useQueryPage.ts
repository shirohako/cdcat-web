/**
 * A list's page number kept in the URL as `?page=` (left out for page 1), so going back to the list
 * returns to the same page. Setting it pushes a history entry; other query parameters are kept.
 */
export const useQueryPage = (name = 'page') => {
  const route = useRoute()
  const router = useRouter()
  return computed({
    get: () => Math.max(1, Number.parseInt(String(route.query[name] ?? '')) || 1),
    set: (value: number) => {
      void router.push({ query: { ...route.query, [name]: value > 1 ? String(value) : undefined } })
    },
  })
}
