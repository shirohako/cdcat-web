/**
 * The home page's exploded drawings. tools/teardown/build-landing.cjs renders each device into public/landing/teardown:
 * every part drawn on its own in its assembled place, in paper millimetres, plus the offset (`shift`) it slides by as
 * the device comes apart. t runs from 0 (assembled) to 1 (apart); these helpers place everything for a given t.
 * Each part is shown on a layer of its own (TeardownFigure), so moving it is a transform, never a repaint.
 */
export type TeardownRole = 'outline' | 'edge' | 'detail' | 'texture' | 'axis'
export type TeardownLines = Partial<Record<TeardownRole, string>>

export interface TeardownPart {
  id: string
  name: string
  /** See-through, such as a clear cover: drawn with a frosted fill that dims what lies behind it. */
  glass: boolean
  shift: [number, number]
  /** 0 starts moving first, 1 last. */
  delay: number
  /** Assembled bounding box in model millimetres, [x0, y0, z0, x1, y1, z1], and the 3D travel. */
  box: number[]
  exp: number[]
  fill: string | null
  lines: TeardownLines
  /** Drawn over the part: a disc's rainbow arcs, a label, or a record's art mapped onto it by `matrix`. */
  overlays: ({ kind: 'arcs' | 'label', paths: string[] } | { kind: 'vinyl', matrix: number[] })[]
  /** Where its layer sits when assembled, [x, y, width, height] in the drawing's units, strokes included. */
  extent: [number, number, number, number]
}

/** A container's walls that face the viewer, drawn again over the parts still inside it. */
export interface TeardownSkirt {
  of: string
  box: number[]
  extent: [number, number, number, number]
  fill: string
  contents: string[]
}

export interface TeardownData {
  name: string
  bounds: [number, number, number, number]
  /** In painting order once the device is apart. */
  parts: TeardownPart[]
  skirts: TeardownSkirt[]
  /**
   * The exact assembled drawing, for devices whose layers can't show it (an obi wrapped round its case): each part's
   * visible fill and lines, in painting order.
   */
  assembled: { part: string, fill: string | null, lines: TeardownLines }[] | null
  trails: { a: [number, number], b: [number, number], from?: string, to?: string }[]
  anchors: Record<string, { part: string, at: [number, number] }>
}

export type TeardownTone = 'pink' | 'butter' | 'mint' | 'sky' | 'lilac' | 'coral' | 'silver' | 'white' | 'night'

/** A sticker naming a part, with a dotted leader to it, or a numbered balloon (TeardownFigure's `marks`). */
export interface TeardownLabel {
  /** An anchor of the drawing, at the part it names. */
  anchor: string
  /** The part's English name, whatever the page language. */
  text: string
  /** Where the sticker sits once the device is apart, in the drawing's units, and which of its sides is there. */
  at: [number, number]
  align: 'start' | 'center' | 'end'
  tone: TeardownTone
  /** As a balloon: its number (the label's place in the list by default), and whether it marks the faulty part. */
  n?: number
  hot?: boolean
}

export type TeardownLayer =
  | { kind: 'part', key: string, extent: TeardownPart['extent'], part: TeardownPart }
  | { kind: 'skirt', key: string, extent: TeardownSkirt['extent'], skirt: TeardownSkirt }

/** The share of the run a part may wait before it starts; the last one still gets the remaining 60%. */
const STAGGER = 0.4

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
// cubic-bezier(.65, 0, .35, 1): slow at both ends, so parts ease apart.
const ease = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2)

/** Each part's own eased progress at t. */
export function partProgress(data: TeardownData, t: number): Map<string, number> {
  return new Map(data.parts.map(p => [p.id, ease(clamp01((t - p.delay * STAGGER) / (1 - STAGGER)))]))
}

/** Where a point drawn on a part sits when that part has gone `p` of its way. */
export const moved = (at: [number, number], shift: [number, number], p: number): [number, number] =>
  [at[0] + shift[0] * p, at[1] + shift[1] * p]

/** Whether two boxes, each carried along its travel by its progress, still overlap. */
function overlapping(a: number[], ea: number[], pa: number, b: number[], eb: number[], pb: number) {
  for (let i = 0; i < 3; i++) {
    const lo = Math.max(a[i]! + ea[i]! * pa, b[i]! + eb[i]! * pb)
    const hi = Math.min(a[i + 3]! + ea[i]! * pa, b[i + 3]! + eb[i]! * pb)
    if (hi - lo <= 0.05) return false
  }
  return true
}

/**
 * The painting order at a moment: the build's order, except that parts still inside a container come straight after
 * it, followed by the container's front walls. The walls then hide what is inside and nothing that has left.
 */
export function layersAt(data: TeardownData, progress: Map<string, number>): TeardownLayer[] {
  const byId = new Map(data.parts.map(p => [p.id, p]))
  const rank = new Map(data.parts.map((p, i) => [p.id, i]))
  const inside = new Map<string, string[]>()
  for (const skirt of data.skirts) {
    const k = byId.get(skirt.of)
    if (!k) continue
    const nested = skirt.contents.filter((id) => {
      const c = byId.get(id)
      return !!c && overlapping(c.box, c.exp, progress.get(id) ?? 0, skirt.box, k.exp, progress.get(k.id) ?? 0)
    })
    inside.set(skirt.of, nested.sort((a, b) => rank.get(a)! - rank.get(b)!))
  }
  const held = new Set([...inside.values()].flat())
  const layers: TeardownLayer[] = []
  for (const part of data.parts) {
    if (held.has(part.id)) continue
    layers.push({ kind: 'part', key: part.id, extent: part.extent, part })
    const nested = inside.get(part.id)
    if (!nested?.length) continue
    for (const id of nested) {
      const inner = byId.get(id)!
      layers.push({ kind: 'part', key: id, extent: inner.extent, part: inner })
    }
    const skirt = data.skirts.find(s => s.of === part.id)!
    layers.push({ kind: 'skirt', key: `${skirt.of}-front`, extent: skirt.extent, skirt })
  }
  return layers
}

const cache = new Map<string, Promise<TeardownData>>()

/**
 * On the server the files are read from the bundle: a fetch of a public file from the server doesn't reach it under
 * `nuxt dev`. The branch is dropped from the browser's bundle.
 */
const bundled = import.meta.server
  ? import.meta.glob<TeardownData>('../../public/landing/teardown/*.json', { import: 'default' })
  : {}

/** One fetch per device per visit (on the server, one read for all requests); the files are static. */
export function loadTeardown(device: string): Promise<TeardownData> {
  let request = cache.get(device)
  if (!request) {
    const read = bundled[`../../public/landing/teardown/${device}.json`]
    request = read ? read() : $fetch<TeardownData>(`/landing/teardown/${device}.json`)
    request.catch(() => cache.delete(device))
    cache.set(device, request)
  }
  return request
}
