let counter = 0

/** A key for a new row or revision item, unique within the page: ^[A-Za-z0-9_-]{1,40}$. */
export const newKey = (prefix = 'n') => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`

/** A ref for a new revision item (at most 20 characters). */
export const newRef = (prefix = 'r') => `${prefix}${(Date.now() % 1e8).toString(36)}${(counter++).toString(36)}`.slice(0, 20)

/** Whether a row id belongs to a row that is not saved yet. */
export const isNewRow = (id: unknown) => typeof id === 'string'
