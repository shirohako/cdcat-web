export const useToast = () => {
  const toast = reactive({
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  })

  let timer: ReturnType<typeof setTimeout> | null = null

  const show = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (timer) clearTimeout(timer)
    toast.show = true
    toast.message = message
    toast.type = type
    timer = setTimeout(() => { toast.show = false }, 3000)
  }

  return { toast: readonly(toast), showToast: show }
}
