export interface DiscussionNoticeState {
  id: number
  message: string
  tone: 'success' | 'error'
}

let timer: ReturnType<typeof setTimeout> | undefined

/** A short message for discussion actions, shown by `<DiscussionNotice />` wherever the page renders it. */
export const useDiscussionNotice = () => {
  const notice = useState<DiscussionNoticeState | null>('discussion:notice', () => null)
  const show = (message: string, tone: DiscussionNoticeState['tone']) => {
    notice.value = { id: Date.now(), message, tone }
    clearTimeout(timer)
    timer = setTimeout(() => { notice.value = null }, 3500)
  }

  return { notice, success: (message: string) => show(message, 'success'), error: (message: string) => show(message, 'error') }
}
