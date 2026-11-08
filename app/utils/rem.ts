/**
 * `value` rem in pixels at the page's current root size, for JS that needs pixels (IntersectionObserver margins,
 * scroll offsets, measured heights) to stay in step with sizes the CSS writes in rem. On the server, where there is no
 * page to read, a rem is 16px.
 */
export const remToPx = (value: number) => {
  if (!import.meta.client) return value * 16
  return value * (Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
}
