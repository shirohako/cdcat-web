/** A small drawing of a part of the album page, with the piece the field fills marked. */
export type EditorHelpMock =
  | { page: 'hero', mark: 'cover' | 'tags' | 'title' | 'byline' | 'catalog' | 'date' | 'event' }
  | { page: 'edition', mark: 'name' | 'limited' | 'hires' | 'sold_out' | 'catalog' | 'note' | 'format' | 'discs' | 'region' | 'date' | 'price' }
  | { page: 'track', mark: 'disc_title' | 'disc_format' | 'number' | 'title' | 'duration' | 'instrumental' | 'credit' | 'detail' | 'role_label' | 'original' }

/**
 * What the tooltip of one field in the editor says, always in this order, every part optional: how to fill it, a table
 * (ways of writing it, or the parts of a group of fields), examples, what not to do, and where it shows.
 */
export interface EditorHelpEntry {
  text?: string
  rows?: Array<[string, string]>
  examples?: string[]
  dont?: string[]
  where?: string
  mock?: EditorHelpMock
}
