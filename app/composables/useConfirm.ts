export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  /** `delete` (the default): red, a bin and 确认删除. `confirm`: anything else that deserves a second thought. */
  variant?: 'delete' | 'confirm'
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

/** The question on screen; AppConfirm shows it. Only set in the browser, so it is never shared between requests. */
const request = shallowRef<ConfirmRequest | null>(null)

/**
 * Asks for confirmation in the site's dialog instead of the browser's: `if (!await confirm({ title })) return`. Pass
 * `variant: 'confirm'` unless it deletes something.
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
