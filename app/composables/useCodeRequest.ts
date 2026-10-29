/**
 * Asking for a mail code (sign-up, password reset) and what came of it, for the page to show beside the email field:
 * sending, where it went and how long the code lasts (`expires_in`), the wait before another one (`resend_in`, else
 * 60 s), or why it failed (`failure.code` is the API's error name, such as MAIL_SEND_FAILED or EMAIL_ALREADY_REGISTERED).
 */
export const useCodeRequest = () => {
  const { localizeError } = useLocalizedApiError()
  const sending = ref(false)
  const sentTo = ref<string | null>(null)
  const minutes = ref<number | null>(null)
  const countdown = ref(0)
  const failure = ref<{ code: string | null, message: string } | null>(null)
  let timer: ReturnType<typeof setInterval> | undefined

  const wait = (seconds: number) => {
    clearInterval(timer)
    countdown.value = seconds
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  }

  /** Runs `request` for `email`; true once the API says the code is on its way. */
  async function send(email: string, request: () => Promise<unknown>, fallbackKey: string): Promise<boolean> {
    if (sending.value || countdown.value > 0) return false
    sending.value = true
    failure.value = null
    try {
      const result = (await request()) as { expires_in?: number, resend_in?: number } | null | undefined
      sentTo.value = email
      minutes.value = result?.expires_in ?? null
      wait(result?.resend_in ?? 60)
      return true
    } catch (error) {
      const name = (error as { name?: string })?.name
      failure.value = { code: name && /^[A-Z_]+$/.test(name) ? name : null, message: localizeError(error, fallbackKey) }
      return false
    } finally {
      sending.value = false
    }
  }

  /** Forget the last request, as when the address is changed. */
  const reset = () => {
    sentTo.value = null
    minutes.value = null
    failure.value = null
  }

  onScopeDispose(() => clearInterval(timer))

  return { sending, sentTo, minutes, countdown, failure, send, reset }
}

/** sh***@example.com, to show where a code went without spelling the address out. */
export const maskEmail = (email: string) => {
  const at = email.lastIndexOf('@')
  if (at < 1) return email
  return `${email.slice(0, Math.min(2, at))}***${email.slice(at)}`
}
