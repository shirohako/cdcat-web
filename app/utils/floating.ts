import type { Placement } from '@floating-ui/dom'
import type { Theme } from '~/composables/useAppearance'

/**
 * Helpers for the layers placed with floating-ui (UiSelect, UiTooltip, UiPopover): they are teleported out of the
 * page, so these find where they go and keep focus moving as if they sat right after their trigger.
 */

/** Where a layer goes: into the open modal <dialog> the anchor sits in (the rest of the page is inert then), else <body>. */
export const floatingLayer = (anchor: Element): HTMLElement | 'body' => anchor.closest<HTMLElement>('dialog[open]') ?? 'body'

/**
 * The element a trigger wrapper (UiTooltip's or UiPopover's box-less `data-ui-trigger` span) stands for: its first
 * element, looking through wrappers nested in it, e.g. an icon-only UiButton (which has a tooltip) as a popover's trigger.
 */
export const triggerIn = (wrapper: Element | null) => {
  let element = wrapper?.firstElementChild ?? null
  while (element?.hasAttribute('data-ui-trigger')) element = element.firstElementChild
  return element
}

/** The theme opposite to the one the anchor is shown in, for layers that invert it. */
export const invertedTheme = (anchor: Element): Theme =>
  anchor.closest('[data-theme]')?.getAttribute('data-theme') === 'light' ? 'dark' : 'light'

/** The transform origin that makes a layer grow out of its anchor, for the side it ended up on. */
export const placementOrigin = (placement: Placement) => {
  const side = placement.split('-')[0]
  return side === 'top' ? 'bottom center' : side === 'left' ? 'center right' : side === 'right' ? 'center left' : 'top center'
}

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), '
  + 'textarea:not([disabled]), summary, [contenteditable]:not([contenteditable=false]), [tabindex]'

/** The elements Tab stops at inside root, in document order. */
export const tabbableIn = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>(TABBABLE)]
  .filter(element => element.tabIndex >= 0 && !element.closest('[inert]') && element.getClientRects().length > 0)

/** Focuses what Tab would reach after `from` (or `from` itself when nothing follows), skipping anything inside `skip`. */
export const focusAfter = (from: HTMLElement, skip?: Element | null) => {
  const next = tabbableIn(document).find(element => !from.contains(element) && !skip?.contains(element)
    && Boolean(from.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING))
  const target = next ?? from
  target.focus()
}
