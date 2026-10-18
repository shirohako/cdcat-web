export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

/** The question on screen; AppConfirm shows it. Only set in the browser, so it is never shared between requests. */
const request = shallowRef<ConfirmRequest | null>(null)

/**
 * Asks for confirmation in the site's dialog instead of the browser's: `if (!await confirm({ title })) return`.
 * A new question answers an open one with no.
 */
export function useConfirm() {
  const confirm = (options: ConfirmOptions) => new Promise<boolean>((resolve) => {
    request.value?.resolve(false)
    request.value = { ...options, resolve }
  })
  return { confirm, request: readonly(request) }
}

/** Settles the open question; used by AppConfirm. */
export function answerConfirm(confirmed: boolean) {
  const open = request.value
  request.value = null
  open?.resolve(confirmed)
}
