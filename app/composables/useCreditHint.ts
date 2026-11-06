/** Whether a notice of 参与创作的人 is closed: for good in this browser, until its 说明 button brings it back. */
export const useCreditHint = (name: string) => {
  const key = `cdcat:album-editor:credits-hint-closed:${name}`
  const read = () => {
    try {
      return localStorage.getItem(key) === '1'
    }
    catch {
      return false
    }
  }
  // The editor is drawn in the browser only, so the stored choice is there from the start.
  const closed = ref(import.meta.client ? read() : false)
  const setClosed = (value: boolean) => {
    closed.value = value
    try {
      if (value) localStorage.setItem(key, '1')
      else localStorage.removeItem(key)
    }
    catch { /* the choice is a convenience */ }
  }
  return { closed, setClosed }
}
