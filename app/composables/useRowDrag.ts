import type { RowId } from '~/types/document'
import { sameId } from '~/utils/documentRows'

/**
 * Reordering a list of rows: drag a row by its handle, or move it one step with its buttons. Only the row whose handle
 * is held down can be dragged, so the text in its fields stays selectable. `rows` gives the list in display order,
 * `place` puts a row before the one at an index (last when there is none).
 */
export function useRowDrag<T extends { id: RowId }>(rows: () => T[], place: (row: T, index: number) => void) {
  /** The row whose handle is held down. */
  const grabbed = ref<RowId | null>(null)
  const dragged = ref<RowId | null>(null)
  /** Where the dragged row would land: before or after this row. */
  const target = ref<{ id: RowId, after: boolean } | null>(null)

  const grab = (row: T) => { grabbed.value = row.id }
  const move = (row: T, delta: number) => {
    const index = rows().indexOf(row)
    if (index < 0 || index + delta < 0) return
    place(row, delta < 0 ? index - 1 : index + 2)
  }

  const startDrag = (row: T, event: DragEvent) => {
    dragged.value = row.id
    if (!event.dataTransfer) return
    event.dataTransfer.effectAllowed = 'move'
    // Firefox starts a drag only with some data.
    event.dataTransfer.setData('text/plain', String(row.id))
  }
  const overRow = (row: T, event: DragEvent) => {
    if (dragged.value === null) return
    event.preventDefault()
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
    target.value = { id: row.id, after: event.clientY > box.top + box.height / 2 }
  }
  const endDrag = () => {
    grabbed.value = null
    dragged.value = null
    target.value = null
  }
  const dropOn = (row: T) => {
    const moving = rows().find(item => sameId(item.id, dragged.value))
    if (moving && target.value && sameId(target.value.id, row.id)) place(moving, rows().indexOf(row) + (target.value.after ? 1 : 0))
    endDrag()
  }
  /** The edge of this row the drop line shows on; none over the dragged row itself. */
  const dropEdge = (row: T) => target.value && dragged.value !== null && !sameId(dragged.value, row.id) && sameId(target.value.id, row.id)
    ? (target.value.after ? 'after' : 'before')
    : null

  // A handle pressed and let go without dragging lets go of the row.
  const release = () => { if (dragged.value === null) grabbed.value = null }
  onMounted(() => document.addEventListener('pointerup', release))
  onBeforeUnmount(() => document.removeEventListener('pointerup', release))

  return { grabbed, dragged, grab, move, startDrag, overRow, dropOn, endDrag, dropEdge }
}
