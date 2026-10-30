/**
 * Drawings for the login / register stage (components/auth/stage): a marbled 12" record and a 9" S-shaped tonearm, as
 * SVG markup built once per record, and the arm's geometry. Record units: the outer radius is 490 (151 mm, so 1 mm is
 * about 3.25 units); the spindle is at 0,0 except inside the record's own 1000 × 1000 box. Everything here is
 * decoration: no audio, no data. The designs were settled on the design board of 2026-10-29.
 */

import { VINYL_TRACK_SHARES } from './vinylTracks'

const DEG = Math.PI / 180
const r2 = (v: number) => Math.round(v * 100) / 100
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const MONO = '\'JetBrains Mono\', ui-monospace, Menlo, Consolas, monospace'

export interface Point { x: number, y: number }

export const polar = (r: number, deg: number, cx = 0, cy = 0): Point => ({ x: cx + r * Math.cos(deg * DEG), y: cy + r * Math.sin(deg * DEG) })

/** A small seeded random source, so a record looks the same on every visit. */
export function seededRandom(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = polar(r, a0, cx, cy)
  const p1 = polar(r, a1, cx, cy)
  return `M${r2(p0.x)} ${r2(p0.y)}A${r2(r)} ${r2(r)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${r2(p1.x)} ${r2(p1.y)}`
}

/** A whole circle drawn clockwise from `start`, for text on a path (the tops of the letters point outward). */
function ring(cx: number, cy: number, r: number, start: number) {
  const p0 = polar(r, start, cx, cy)
  const p1 = polar(r, start + 180, cx, cy)
  return `M${r2(p0.x)} ${r2(p0.y)}A${r} ${r} 0 1 1 ${r2(p1.x)} ${r2(p1.y)}A${r} ${r} 0 1 1 ${r2(p0.x)} ${r2(p0.y)}`
}

function spiral(cx: number, cy: number, rFrom: number, rTo: number, turns: number, start: number) {
  const steps = Math.ceil(turns * 90)
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = polar(rFrom + (rTo - rFrom) * t, start + t * turns * 360, cx, cy)
    d += `${i ? 'L' : 'M'}${r2(p.x)} ${r2(p.y)}`
  }
  return d
}

// ---- the record ---------------------------------------------------------------------------------------------------

export const VINYL = { R: 490, bead: 485.6, outer: 472, inner: 196, runout: 178, label: 162, hole: 11.5 }
/** Five tracks, one per sign-up step, with uneven lengths like real songs; GAP is the smooth band between two. */
const GAP = 3.6
export const VINYL_TRACKS = (() => {
  let r = VINYL.outer
  return VINYL_TRACK_SHARES.map((share) => {
    const from = r
    r -= (VINYL.outer - VINYL.inner) * share
    return { from, to: r }
  })
})()

/** The two sign-in stage records, and the home page turntable's black one. */
export type VinylRecord = 'login' | 'register' | 'black'

interface Colourway {
  seed: number
  base: string
  inks: string[]
  groove: string
  /** Swirls of the inks through the base, as pressed coloured vinyl; off, the record is plain base colour. */
  marble?: boolean
  /** the record's own colour, for the glow behind it, the stylus light and the reflection in the chrome */
  glow: string
  label: { paper: string, paper2: string, ink: string, accent: string, side: string, no: string, etch: string }
}

const COLOURWAYS: Record<VinylRecord, Colourway> = {
  // 粉紫大理石
  login: {
    seed: 11,
    base: '#2c1569',
    inks: ['#ff4fa3', '#d8389a', '#ff8b3d', '#9a76ff', '#ffd3ea', '#5b2fd6', '#ff6f8f', '#ff4fa3'],
    groove: '#14031f',
    glow: '#ff4fa3',
    label: { paper: '#fdf4f8', paper2: '#f1dbe7', ink: '#3b1648', accent: '#ff4fa3', side: '#e2368c', no: 'CDCAT-0001', etch: 'CDCAT-0001-A1  ✳  CATALOGUED, NOT DOWNLOADED  ✳' },
  },
  // 青蓝大理石
  register: {
    seed: 29,
    base: '#0b2347',
    inks: ['#25d0c2', '#1f74e0', '#b9f24a', '#6fe3ff', '#e9fff8', '#173f9a', '#38e0a0', '#25d0c2'],
    groove: '#021120',
    glow: '#25d0c2',
    label: { paper: '#f3fcfa', paper2: '#d9efea', ink: '#0d2e44', accent: '#13b3a4', side: '#0f9a8d', no: 'CDCAT-0002', etch: 'CDCAT-0002-A1  ✳  WELCOME ABOARD  ✳' },
  },
  // 黑胶: plain black, the home page turntable's record (TeardownFigure), too small there for a marble
  black: {
    seed: 7,
    base: '#16171f',
    inks: [],
    groove: '#050609',
    marble: false,
    glow: '#f4a9bc',
    label: { paper: '#fdf4f8', paper2: '#f4dbe5', ink: '#3b1648', accent: '#f4a9bc', side: '#e2368c', no: 'CDCAT-0000', etch: 'CDCAT-0000-A1  ✳  TAKE IT APART  ✳' },
  },
}

export const vinylGlow = (record: VinylRecord) => COLOURWAYS[record].glow

const RIM = 'ALL RIGHTS OF THE PRODUCER AND OF THE OWNER OF THE RECORDED WORK RESERVED · UNAUTHORISED PUBLIC PERFORMANCE, BROADCASTING AND COPYING OF THIS RECORD PROHIBITED · '

/** CDCat's mascot (components/brand/BrandGhost.vue), in its 16 × 17.3 box. */
function ghost(ink: string) {
  return `<path d="M 0 16 C 0 11.2, -0.1 6.8, 0.4 4.2 L 1.6 0 L 4.8 2.5 C 6.9 2, 9.1 2, 11.2 2.5 L 14.4 0 L 15.6 4.2 C 16.1 6.8, 16 11.2, 16 16 Q 14 18.6 12 16 Q 10 18.6 8 16 Q 6 18.6 4 16 Q 2 18.6 0 16 Z" fill="#ffffff" stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"/>`
    + '<path d="M 1.94 1.12 L 3.54 2.37 L 1.34 3.22 Z" fill="#f6b6c6"/><path d="M 14.06 1.12 L 12.46 2.37 L 14.66 3.22 Z" fill="#f6b6c6"/>'
    + `<ellipse cx="5.2" cy="8.2" rx="1.3" ry="1.65" fill="${ink}"/><ellipse cx="10.8" cy="8.2" rx="1.3" ry="1.65" fill="${ink}"/>`
    + '<ellipse cx="3.8" cy="10.7" rx="1" ry="0.55" fill="#f6b6c6"/><ellipse cx="12.2" cy="10.7" rx="1" ry="0.55" fill="#f6b6c6"/>'
    + `<path d="M 7.2 10.1 Q 7.6 10.6 8 10.2 Q 8.4 10.6 8.8 10.1" fill="none" stroke="${ink}" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round"/>`
}

/**
 * One record as an <svg> (viewBox 0 0 1000 1000): marbled vinyl, grooves with five tracks, lead-in, run-out with an
 * etched matrix number, and the paper label. `title` and `tracks` are printed on the label in the reader's language;
 * `id` keeps the SVG's internal references apart when several records are on a page.
 */
export function vinylSvg(record: VinylRecord, o: { id: string, title: string, tracks: string[], sheen?: boolean }): string {
  const cw = COLOURWAYS[record]
  const L = cw.label
  const id = o.id
  const rnd = seededRandom(cw.seed)
  const pick = () => cw.inks[Math.floor(rnd() * cw.inks.length) % cw.inks.length]!
  const defs = [`<clipPath id="${id}-disc"><circle cx="500" cy="500" r="${VINYL.R}"/></clipPath>`]
  const out: string[] = []

  if (cw.marble === false) {
    out.push(`<circle cx="500" cy="500" r="${VINYL.R}" fill="${cw.base}"/>`)
  } else {
    // Marble: soften the colour edges first, then swirl them, so the colours blend like pressed vinyl
    defs.push(`<filter id="${id}-mb" filterUnits="userSpaceOnUse" x="-220" y="-220" width="1440" height="1440" color-interpolation-filters="sRGB">`
      + '<feGaussianBlur in="SourceGraphic" stdDeviation="9" result="soft"/>'
      + `<feTurbulence type="fractalNoise" baseFrequency="0.0028 0.0036" numOctaves="2" seed="${cw.seed}" result="n"/>`
      + '<feDisplacementMap in="soft" in2="n" scale="280" xChannelSelector="R" yChannelSelector="G"/>'
      + '<feGaussianBlur stdDeviation="1.6"/></filter>')
    let paint = `<rect x="-220" y="-220" width="1440" height="1440" fill="${cw.base}"/>`
    for (let i = 0; i < 5; i++) {
      const p = polar(120 + rnd() * 300, rnd() * 360, 500, 500)
      paint += `<circle cx="${r2(p.x)}" cy="${r2(p.y)}" r="${r2(90 + rnd() * 150)}" fill="${pick()}" opacity="${r2(0.45 + rnd() * 0.4)}"/>`
    }
    for (let i = 0; i < 64; i++) {
      const r = 30 + rnd() * 560
      const a0 = rnd() * 360
      const span = 40 + rnd() * 240
      const w = (rnd() < 0.2 ? 44 : 5) + rnd() * 34
      paint += `<path d="${arc(500, 500, r, a0, a0 + span)}" fill="none" stroke="${pick()}" stroke-width="${r2(w)}" stroke-linecap="round" opacity="${r2(0.6 + rnd() * 0.4)}"/>`
    }
    out.push(`<g clip-path="url(#${id}-disc)"><g filter="url(#${id}-mb)">${paint}</g></g>`)
  }

  // Grooves, louder passages a little brighter; nothing in the four gaps between tracks
  const inGap = (r: number) => VINYL_TRACKS.slice(0, 4).some(t => Math.abs(r - t.to) < GAP / 2 + 0.7)
  let grooves = ''
  let ridges = ''
  let n = 0
  for (let r = VINYL.outer; r > VINYL.inner; r -= 1.5) {
    if (inGap(r)) continue
    const loud = 0.5 + 0.5 * Math.sin(r * 0.061 + cw.seed) * Math.cos(r * 0.017)
    grooves += `<circle cx="500" cy="500" r="${r2(r)}" stroke-opacity="${r2(0.3 * (0.55 + 0.45 * loud) * (0.85 + 0.3 * rnd()))}"/>`
    if (n++ % 2 === 0) ridges += `<circle cx="500" cy="500" r="${r2(r + 0.75)}" stroke-opacity="${r2(0.07 * (0.6 + 0.8 * loud))}"/>`
  }
  out.push(`<g fill="none" stroke="${cw.groove}" stroke-width="0.75">${grooves}</g>`)
  out.push(`<g fill="none" stroke="#ffffff" stroke-width="0.6">${ridges}</g>`)
  for (const t of VINYL_TRACKS.slice(0, 4)) out.push(`<circle cx="500" cy="500" r="${r2(t.to)}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="${GAP}"/>`)
  out.push(`<g fill="none" stroke="${cw.groove}" stroke-opacity=".45" stroke-width="1">${[474.8, 478.6, 481.8].map(r => `<circle cx="500" cy="500" r="${r}"/>`).join('')}</g>`)
  out.push(`<circle cx="500" cy="500" r="${r2((VINYL.inner + VINYL.label) / 2 + 2)}" fill="none" stroke="${cw.groove}" stroke-opacity=".32" stroke-width="${VINYL.inner - VINYL.label - 4}"/>`)
  out.push(`<path d="${spiral(500, 500, VINYL.inner - 0.5, VINYL.runout + 1.6, 1.4, 24)}" fill="none" stroke="${cw.groove}" stroke-opacity=".5" stroke-width="0.9"/>`)
  out.push(`<circle cx="500" cy="500" r="${VINYL.runout}" fill="none" stroke="${cw.groove}" stroke-opacity=".57" stroke-width="1.2"/>`)
  defs.push(`<path id="${id}-etch" d="${ring(500, 500, 167.5, 118)}"/>`)
  out.push(`<text font-family="${MONO}" font-size="7" letter-spacing="1.3" fill="rgba(255,255,255,.55)"><textPath href="#${id}-etch">${esc(L.etch)}</textPath></text>`)
  out.push(`<circle cx="500" cy="500" r="${VINYL.bead}" fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="2.6"/>`)
  out.push(`<circle cx="500" cy="500" r="${VINYL.R - 0.9}" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1.8"/>`)
  // A still record's light: two pale arcs across the grooves on opposite sides.
  if (o.sheen) {
    for (const [a0, a1] of [[200, 250], [20, 70]] as const) {
      for (const [i, r] of [300, 340, 380, 420].entries()) {
        out.push(`<path d="${arc(500, 500, r, a0 - i * 2, a1 + i * 2)}" fill="none" stroke="#ffffff" stroke-opacity="${r2(0.42 - i * 0.05)}" stroke-width="7" stroke-linecap="round"/>`)
      }
    }
  }

  // The paper label
  defs.push(`<radialGradient id="${id}-paper" cx="42%" cy="36%" r="78%"><stop offset="0" stop-color="${L.paper}"/><stop offset="1" stop-color="${L.paper2}"/></radialGradient>`)
  out.push(`<circle cx="500" cy="500" r="${VINYL.label + 2.6}" fill="none" stroke="#000" stroke-opacity=".32" stroke-width="2"/>`)
  out.push(`<circle cx="500" cy="500" r="${VINYL.label}" fill="url(#${id}-paper)"/>`)
  out.push(`<circle cx="500" cy="500" r="${VINYL.label - 6.5}" fill="none" stroke="${L.accent}" stroke-width="6"/>`)
  out.push(`<circle cx="500" cy="500" r="${VINYL.label - 14}" fill="none" stroke="${L.ink}" stroke-opacity=".3" stroke-width=".8"/>`)
  defs.push(`<path id="${id}-rim" d="${ring(500, 500, 139, 180)}"/>`)
  out.push(`<text font-size="7" letter-spacing=".7" fill="${L.ink}" fill-opacity=".72"><textPath href="#${id}-rim">${esc(RIM)}</textPath></text>`)
  out.push(`<g transform="translate(475.2 375) scale(3.1)">${ghost(L.ink)}</g>`)
  const T = (x: number, y: number, size: number, text: string, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" ${extra}>${esc(text)}</text>`
  out.push(`<g fill="${L.ink}">`
    + T(500, 467, 31, 'CDCat', 'font-weight="900" letter-spacing="-0.6"')
    + T(500, 481.5, 7, 'MUSIC CATALOGUE', 'letter-spacing="2.4" fill-opacity=".7"')
    + T(431, 509, 17, '33⅓', 'font-weight="800"')
    + T(431, 527, 6.4, 'RPM', 'letter-spacing="1.8" fill-opacity=".7"')
    + `<text x="569" y="515" font-size="35" font-weight="900" text-anchor="middle" fill="${L.side}">A</text>`
    + T(569, 527, 6.4, 'SIDE', 'letter-spacing="1.8" fill-opacity=".7"')
    + T(500, 538, 7, 'STEREO', 'letter-spacing="2.6" fill-opacity=".75"')
    + T(500, 552, 8.4, L.no, 'font-weight="700" letter-spacing="1.2"')
    + T(500, 570, 11.5, o.title, 'font-weight="700"')
    + o.tracks.map((line, i) => T(500, 587 + i * 11.5, 7, line, 'fill-opacity=".82"')).join('')
    + T(500, 622, 6, '℗ 2026 CDCat · NOT FOR SALE', 'letter-spacing=".8" fill-opacity=".6"')
    + '</g>')
  // Spindle hole, with the platter's spindle showing through
  defs.push(`<radialGradient id="${id}-pin" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#b9bec7"/><stop offset="1" stop-color="#5d626b"/></radialGradient>`)
  out.push(`<circle cx="500" cy="500" r="${VINYL.hole + 4.5}" fill="none" stroke="${L.ink}" stroke-opacity=".25" stroke-width="1"/>`)
  out.push(`<circle cx="500" cy="500" r="${VINYL.hole}" fill="#1b1b20"/><circle cx="500" cy="500" r="7" fill="url(#${id}-pin)"/>`)

  return `<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs.join('')}</defs>${out.join('')}</svg>`
}

// ---- the tonearm --------------------------------------------------------------------------------------------------
// A 9" S-shaped arm: pivot 211 mm from the spindle, 229 mm effective length, and the S bend turns the headshell 22° in.
// Arm-local coordinates: the pivot at 0,0, the stylus roughly along +x, the record's centre on the +y side, which is
// also the side the light (from the stage's top left) falls on.

const ARM_OFFSET = 22
const ARM_DIR = { x: Math.cos(ARM_OFFSET * DEG), y: Math.sin(ARM_OFFSET * DEG) }
const ARM_JOINT = { x: 597, y: -8 }
const ARM_TIP = 156
const ARM_STYLUS = { x: ARM_JOINT.x + ARM_TIP * ARM_DIR.x, y: ARM_JOINT.y + ARM_TIP * ARM_DIR.y }
const ARM_TUBE: Point[] = [{ x: 46, y: 0 }, { x: 246, y: -46 }, { x: r2(ARM_JOINT.x - 168 * ARM_DIR.x), y: r2(ARM_JOINT.y - 168 * ARM_DIR.y) }, ARM_JOINT]
const ARM_RHO = Math.hypot(ARM_STYLUS.x, ARM_STYLUS.y)
const ARM_BETA = Math.atan2(ARM_STYLUS.y, ARM_STYLUS.x) / DEG
/** Where the arm turns, from the spindle. */
export const ARM_PIVOT = polar(685, -70)
/** Parked, the stylus would sit this far out, past the record's edge. */
const REST_R = 640

function bezier(p: Point[], t: number): Point {
  const u = 1 - t
  const [a, b, c, d] = p as [Point, Point, Point, Point]
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  }
}

/** The point of the tube at local x, with the tube's direction there in degrees. */
function tubeAt(x: number) {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 32; i++) {
    const m = (lo + hi) / 2
    if (bezier(ARM_TUBE, m).x < x) lo = m
    else hi = m
  }
  const t = (lo + hi) / 2
  const a = bezier(ARM_TUBE, Math.max(0, t - 0.002))
  const b = bezier(ARM_TUBE, Math.min(1, t + 0.002))
  return { ...bezier(ARM_TUBE, t), angle: Math.atan2(b.y - a.y, b.x - a.x) / DEG }
}

/** The arm's turn (degrees) that puts the stylus on the groove `r` units from the spindle. */
function armAngleFor(r: number) {
  const P = ARM_PIVOT
  const d = Math.hypot(P.x, P.y)
  const g = Math.acos(Math.max(-1, Math.min(1, (d * d + r * r - ARM_RHO * ARM_RHO) / (2 * d * r)))) / DEG
  const S = polar(r, Math.atan2(P.y, P.x) / DEG + g)
  return Math.atan2(S.y - P.y, S.x - P.x) / DEG - ARM_BETA
}

/** The arm's turn with the stylus a little way into a track (1–5), or parked over its rest (null). */
export function armAngle(track: number | null): number {
  if (track === null) return armAngleFor(REST_R)
  const t = VINYL_TRACKS[Math.min(Math.max(track, 1), 5) - 1]!
  return armAngleFor(t.from - (t.from - t.to) * 0.2)
}

const PLATE = 'M 32 -9.5 L 50 -10.5 Q 57 -24.5 72 -24.5 L 112 -22.5 Q 121 -22 121 -14 L 121 14 Q 121 22 112 22.5 L 72 24.5 Q 57 24.5 50 10.5 L 32 9.5 Z'
const NOSE = 'M 117 -16 L 139 -12.6 Q 147 -11.6 147 -6 L 147 6 Q 147 11.6 139 12.6 L 117 16 Z'
const LIFT = 'M 96 -22 C 101 -38, 116 -54, 145 -60'
const TUBE_D = `M 20 0 L ${ARM_TUBE[0]!.x} ${ARM_TUBE[0]!.y} C ${ARM_TUBE[1]!.x} ${ARM_TUBE[1]!.y}, ${ARM_TUBE[2]!.x} ${ARM_TUBE[2]!.y}, ${ARM_TUBE[3]!.x} ${ARM_TUBE[3]!.y}`
const STUB_D = 'M -30 0 L -160 0'

export interface TonearmParts {
  /** fixed, under the arm: base, height ring, arm rest, cue lever, anti-skate dial (spindle at 0,0) */
  under: string
  /** the arm itself, drawn unturned at the pivot; turn it about ARM_PIVOT */
  arm: string
  /** the arm's outline in black, for its shadow; turn it with the arm */
  shadow: string
  /** fixed, over the arm: the bearing housing, which is round, so its highlight stays put while the arm turns */
  over: string
}

/** The tonearm's layers as SVG content. `tint` is the record's colour: the stylus light and the chrome's reflection. */
export function tonearmParts(o: { id: string, tint: string }): TonearmParts {
  const id = o.id
  const P = ARM_PIVOT
  const tint = o.tint
  const defs: string[] = []
  const stops = (list: [number, string][]) => list.map(([at, c]) => `<stop offset="${at}" stop-color="${c}"/>`).join('')
  const lin = (gid: string, list: [number, string][], h: number) => {
    defs.push(`<linearGradient id="${id}-${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="${-h}" x2="0" y2="${h}">${stops(list)}</linearGradient>`)
    return `url(#${id}-${gid})`
  }
  const rad = (gid: string, list: [number, string][], cx = '36%', cy = '30%', r = '78%') => {
    defs.push(`<radialGradient id="${id}-${gid}" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient>`)
    return `url(#${id}-${gid})`
  }
  // Polished metal across a part: darkest on the far (-y) side, brightest a little past the middle on the lit side
  const CHROME: [number, string][] = [[0, '#34373d'], [0.3, '#81868f'], [0.62, '#dde1e6'], [0.74, '#ffffff'], [0.87, '#b5bac2'], [1, '#4a4e56']]
  const ball = rad('ball', [[0, '#ffffff'], [0.45, '#c3c8cf'], [1, '#585d65']])
  const knurl = (x0: number, x1: number, h: number, gap: number, colour = '#ffffff', op = 0.18) => {
    let s = ''
    for (let x = x0; x <= x1; x += gap) s += `<line x1="${r2(x)}" y1="${-h}" x2="${r2(x)}" y2="${h}"/>`
    return `<g stroke="${colour}" stroke-opacity="${op}" stroke-width="1">${s}</g>`
  }
  const metalTube = (d: string, w: number) => '<g fill="none">'
    + `<path d="${d}" stroke="#2b2e34" stroke-width="${w}"/>`
    + `<path d="${d}" stroke="#7d828c" stroke-width="${r2(w * 0.84)}"/>`
    + `<path d="${d}" stroke="#b9bec6" stroke-width="${r2(w * 0.6)}" transform="translate(0 ${r2(w * 0.065)})"/>`
    + `<path d="${d}" stroke="#e9ecf0" stroke-width="${r2(w * 0.32)}" transform="translate(0 ${r2(w * 0.14)})"/>`
    + `<path d="${d}" stroke="#ffffff" stroke-opacity=".95" stroke-width="${r2(w * 0.1)}" transform="translate(0 ${r2(w * 0.185)})"/>`
    + `<path d="${d}" stroke="${tint}" stroke-opacity=".13" stroke-width="${r2(w * 0.2)}" transform="translate(0 ${r2(-w * 0.13)})"/>`
    + `<path d="${d}" stroke="#4b4f57" stroke-opacity=".85" stroke-width="${r2(w * 0.09)}" transform="translate(0 ${r2(-w * 0.27)})"/>`
    + '</g>'
  const at = (p: Point) => `${r2(p.x)} ${r2(p.y)}`

  // ---- fixed parts, under the arm
  let under = ''
  under += `<circle cx="${r2(P.x)}" cy="${r2(P.y)}" r="106" fill="${rad('base', [[0, '#34373d'], [0.7, '#1b1c20'], [1, '#0f1012']], '42%', '38%', '70%')}"/>`
  under += `<circle cx="${r2(P.x)}" cy="${r2(P.y)}" r="104.6" fill="none" stroke="#4a4d55" stroke-width="2"/>`
  under += `<path d="${arc(P.x, P.y, 101, 196, 282)}" fill="none" stroke="#ffffff" stroke-opacity=".2" stroke-width="2.4" stroke-linecap="round"/>`
  // Height ring, knurled, with its scale printed on the base
  under += `<circle cx="${r2(P.x)}" cy="${r2(P.y)}" r="74" fill="none" stroke="#25272c" stroke-width="16"/>`
  let ticks = ''
  for (let a = 0; a < 360; a += 4) {
    const p0 = polar(67, a, P.x, P.y)
    const p1 = polar(81, a, P.x, P.y)
    ticks += `<line x1="${r2(p0.x)}" y1="${r2(p0.y)}" x2="${r2(p1.x)}" y2="${r2(p1.y)}"/>`
  }
  under += `<g stroke="#6d717a" stroke-opacity=".55" stroke-width="1.1">${ticks}</g>`
  under += `<circle cx="${r2(P.x)}" cy="${r2(P.y)}" r="82.4" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="1"/>`
  for (let k = 0; k <= 6; k++) {
    const p = polar(93.5, 200 + k * 13, P.x, P.y)
    under += `<text x="${r2(p.x)}" y="${r2(p.y + 3)}" font-size="8.5" font-family="${MONO}" fill="#8f949d" text-anchor="middle">${k}</text>`
  }
  for (const a of [40, 160, 310]) {
    const c = polar(95, a, P.x, P.y)
    const hex = Array.from({ length: 6 }, (_, i) => polar(4.4, i * 60 + 10, c.x, c.y)).map((q, i) => `${i ? 'L' : 'M'}${at(q)}`).join('') + 'Z'
    under += `<path d="${hex}" fill="#9da2ab" stroke="#2a2c31" stroke-width=".8"/>`
  }
  // Arm rest: a post with two rubber-lined jaws, lined up with the parked tube
  const restAngle = armAngle(null)
  const restAt = tubeAt(392)
  const restWorld = polar(Math.hypot(restAt.x, restAt.y), restAngle + Math.atan2(restAt.y, restAt.x) / DEG, P.x, P.y)
  under += `<g transform="translate(${at(restWorld)}) rotate(${r2(restAngle + restAt.angle)})">`
    + `<circle r="22" fill="${rad('restBase', [[0, '#5b5f67'], [0.7, '#24262b'], [1, '#141518']])}" stroke="#4a4d55" stroke-width="1.4"/>`
    + '<rect x="-11" y="-32" width="22" height="64" rx="6" fill="#1c1d21" stroke="#4a4d55" stroke-width="1.2"/>'
    + '<rect x="-8" y="-29" width="16" height="13" rx="3.5" fill="#6b5145"/><rect x="-8" y="16" width="16" height="13" rx="3.5" fill="#6b5145"/>'
    + '<rect x="-6" y="-13" width="12" height="26" rx="3" fill="#0b0b0d"/>'
    + '<path d="M -9 -30 L 9 -30" stroke="#ffffff" stroke-opacity=".35" stroke-width="1.2"/>'
    + '</g>'
  // Cue lever: pivot block, rod and ridged paddle
  const cue = polar(150, 4, P.x, P.y)
  defs.push(`<linearGradient id="${id}-cueRod" gradientUnits="userSpaceOnUse" x1="-4.5" y1="0" x2="4.5" y2="0">${stops(CHROME)}</linearGradient>`)
  under += `<g transform="translate(${at(cue)}) rotate(122)">`
    + '<rect x="-15" y="-13" width="30" height="26" rx="6" fill="#18191c" stroke="#3a3d44" stroke-width="1.2"/>'
    + `<rect x="-4.5" y="-76" width="9" height="68" rx="4.5" fill="url(#${id}-cueRod)"/>`
    + `<rect x="-14" y="-100" width="28" height="30" rx="8" fill="${ball}" stroke="#3a3d44" stroke-width="1"/>`
    + [-91, -85, -79].map(y => `<line x1="-8" y1="${y}" x2="8" y2="${y}" stroke="#5f646c" stroke-opacity=".6"/>`).join('')
    + '</g>'
  // Anti-skate dial with its 0–3 scale
  const dial = polar(158, -54, P.x, P.y)
  let dialTicks = ''
  for (let k = 0; k <= 12; k++) {
    const a = 135 + k * 22.5
    const p0 = polar(27, a, dial.x, dial.y)
    const p1 = polar(k % 4 === 0 ? 34 : 31, a, dial.x, dial.y)
    dialTicks += `<line x1="${r2(p0.x)}" y1="${r2(p0.y)}" x2="${r2(p1.x)}" y2="${r2(p1.y)}"/>`
    if (k % 4 === 0) {
      const pt = polar(42, a, dial.x, dial.y)
      dialTicks += `<text x="${r2(pt.x)}" y="${r2(pt.y + 3)}" font-size="8.5" font-family="${MONO}" fill="#8f949d" stroke="none" text-anchor="middle">${k / 4}</text>`
    }
  }
  under += `<circle cx="${r2(dial.x)}" cy="${r2(dial.y)}" r="25" fill="#151619" stroke="#3a3d44" stroke-width="1.2"/>`
  under += `<g stroke="#9aa0a9" stroke-width="1.3">${dialTicks}</g>`
  under += `<circle cx="${r2(dial.x)}" cy="${r2(dial.y)}" r="19" fill="${ball}"/>`
  under += `<circle cx="${r2(dial.x)}" cy="${r2(dial.y)}" r="19" fill="none" stroke="#2b2e34" stroke-opacity=".6" stroke-width="2.4" stroke-dasharray="1.2 2.2"/>`
  const pointer = polar(14, 135 + 6 * 22.5, dial.x, dial.y)
  under += `<line x1="${r2(dial.x)}" y1="${r2(dial.y)}" x2="${r2(pointer.x)}" y2="${r2(pointer.y)}" stroke="#1b1c20" stroke-width="2.6" stroke-linecap="round"/>`

  // ---- the arm
  let arm = ''
  // Counterweight: knurled grip, tracking-force ring (0–3 g), end cap
  arm += `<rect x="-276" y="-47" width="118" height="94" rx="9" fill="${lin('cw', [[0, '#111214'], [0.28, '#3a3d44'], [0.62, '#888d97'], [0.74, '#b7bcc4'], [0.87, '#474a52'], [1, '#131416']], 47)}"/>`
  arm += knurl(-270, -228, 46, 3.1)
  arm += '<rect x="-228" y="-47" width="3" height="94" fill="#0b0c0e" fill-opacity=".7"/>'
  arm += `<rect x="-180" y="-49" width="22" height="98" rx="3" fill="${lin('ring', [[0, '#8e939c'], [0.55, '#eef0f3'], [0.75, '#ffffff'], [1, '#989da6']], 49)}"/>`
  let gauge = ''
  for (let k = 0; k <= 12; k++) gauge += `<line x1="-180" y1="${-42 + k * 7}" x2="${k % 4 === 0 ? -169 : -174}" y2="${-42 + k * 7}"/>`
  arm += `<g stroke="#1f2125" stroke-width="1">${gauge}</g>`
  arm += ['0', '1', '2', '3'].map((n, k) => `<text x="-163.5" y="${-39 + k * 28}" font-size="8" font-family="${MONO}" font-weight="700" fill="#1f2125" text-anchor="middle">${n}</text>`).join('')
  arm += `<rect x="-288" y="-38" width="14" height="76" rx="4" fill="${lin('cap', CHROME, 38)}"/>`
  // Rear stub with the thread the weight turns on, then the S tube
  arm += metalTube(STUB_D, 19)
  arm += knurl(-158, -128, 9, 3, '#1d1f23', 0.5)
  arm += metalTube(TUBE_D, 25)
  // Bearing ears either side of the housing, and the collar where the tube leaves it
  arm += `<rect x="-12" y="-63" width="24" height="20" rx="7" fill="${ball}" stroke="#2b2e34" stroke-width="1"/><rect x="-12" y="43" width="24" height="20" rx="7" fill="${ball}" stroke="#2b2e34" stroke-width="1"/>`
  const base = tubeAt(66)
  arm += `<g transform="translate(${at(base)}) rotate(${r2(base.angle)})"><rect x="-16" y="-16.5" width="34" height="33" rx="5" fill="${lin('collar', CHROME, 16.5)}"/>${knurl(-13, 15, 15.5, 2.6, '#1d1f23', 0.45)}</g>`
  // Headshell: leads, the cartridge and its stylus assembly, the plate, screws, finger lift, connector, cantilever
  let hs = ''
  for (const [c, y] of [['#e5484d', -13], ['#f2f2f2', -5.5], ['#35b46a', 5.5], ['#3d7fe0', 13]] as [string, number][]) {
    const lead = `M 30 ${r2(y * 0.85)} C 40 ${r2(y * 1.25)}, 49 ${r2(y * 1.2)}, 60 ${r2(y * 0.8)}`
    hs += `<path d="${lead}" fill="none" stroke="#0b0b0d" stroke-width="3.6" stroke-linecap="round"/><path d="${lead}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`
  }
  hs += '<rect x="56" y="-17" width="70" height="34" rx="3" fill="#121214"/>'
  hs += `<path d="${NOSE}" fill="${lin('nose', [[0, '#b3206a'], [0.45, '#ff4fa3'], [0.72, '#ffd4e8'], [0.84, '#ff4fa3'], [1, '#b3206a']], 16)}"/>`
  hs += [127, 131, 135].map(x => `<line x1="${x}" y1="-12" x2="${x}" y2="12" stroke="#b3206a" stroke-opacity=".55" stroke-width="1"/>`).join('')
  hs += `<path d="${PLATE}" fill="${lin('plate', [[0, '#0e0f11'], [0.55, '#1e2024'], [0.8, '#33363c'], [1, '#141518']], 25)}" stroke="#55595f" stroke-width="1.1"/>`
  hs += '<path d="M 54 12.4 Q 60 23.2 72 23.2 L 111.5 21.4" fill="none" stroke="#cfd4db" stroke-opacity=".7" stroke-width="1.3"/>'
  for (const y of [-12, 12]) {
    hs += `<rect x="64" y="${y - 2.9}" width="44" height="5.8" rx="2.9" fill="#050506"/>`
    hs += `<circle cx="84" cy="${y}" r="4.9" fill="${ball}" stroke="#2b2e34" stroke-width=".7"/><line x1="81" y1="${y - 1.8}" x2="87" y2="${y + 1.8}" stroke="#4f545c" stroke-width="1.1"/>`
  }
  hs += [100, 106, 112].map(x => `<line x1="${x}" y1="-21.4" x2="${x}" y2="-18.6" stroke="#d6dae0" stroke-opacity=".8"/><line x1="${x}" y1="18.6" x2="${x}" y2="21.4" stroke="#d6dae0" stroke-opacity=".8"/>`).join('')
  hs += '<text x="95" y="2.5" font-size="6.6" font-weight="700" letter-spacing="1.2" fill="#eceef2" fill-opacity=".5" text-anchor="middle">CDCAT</text>'
  hs += `<path d="${LIFT}" fill="none" stroke="#34373d" stroke-width="9.4" stroke-linecap="round"/>`
  hs += `<path d="${LIFT}" fill="none" stroke="#b6bbc3" stroke-width="6.6" stroke-linecap="round"/>`
  hs += `<path d="${LIFT}" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="1.8" stroke-linecap="round" transform="translate(.6 1.6)"/>`
  hs += `<ellipse cx="147" cy="-60.5" rx="9.5" ry="6.4" transform="rotate(-8 147 -60.5)" fill="${ball}" stroke="#34373d" stroke-width="1.1"/>`
  hs += `<rect x="-16" y="-11" width="14" height="22" rx="2" fill="${lin('fer', CHROME, 11)}"/>`
  hs += `<rect x="-4" y="-15.5" width="20" height="31" rx="3.5" fill="${lin('lock', [[0, '#1a1b1f'], [0.6, '#4b4f57'], [0.75, '#6c717a'], [1, '#1d1e22']], 15.5)}"/>` + knurl(-2, 14, 15, 2.5, '#ffffff', 0.16)
  hs += `<rect x="16" y="-14" width="18" height="28" rx="3" fill="${lin('con', CHROME, 14)}"/>`
  // Cantilever and diamond, and the faint light where the diamond meets the groove (hidden while parked)
  defs.push(`<radialGradient id="${id}-glow"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".35" stop-color="${tint}" stop-opacity=".35"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient>`)
  hs += `<line x1="141" y1="0" x2="${ARM_TIP - 0.6}" y2="0" stroke="#e8dcae" stroke-width="1.9" stroke-linecap="round"/>`
  hs += `<circle class="stylus-light" cx="${ARM_TIP}" cy="0" r="11" fill="url(#${id}-glow)"/><circle cx="${ARM_TIP}" cy="0" r="1.7" fill="#ffffff"/>`
  arm += `<g transform="translate(${ARM_JOINT.x} ${ARM_JOINT.y}) rotate(${ARM_OFFSET})">${hs}</g>`

  // ---- the bearing housing, over the arm
  let over = ''
  over += `<circle cx="${r2(P.x)}" cy="${r2(P.y)}" r="47" fill="#1c1d21"/>`
  over += `<circle cx="${r2(P.x)}" cy="${r2(P.y)}" r="43" fill="${rad('hous', [[0, '#ffffff'], [0.35, '#dadde3'], [0.75, '#80868f'], [1, '#3d4047']])}"/>`
  over += `<circle cx="${r2(P.x)}" cy="${r2(P.y)}" r="31" fill="${rad('top', [[0, '#e7eaee'], [0.6, '#a9aeb7'], [1, '#6b707a']], '40%', '35%')}" stroke="#2c2e33" stroke-opacity=".5" stroke-width="1.2"/>`
  over += `<circle cx="${r2(P.x)}" cy="${r2(P.y)}" r="11.5" fill="#18191c"/>`
  over += `<path d="${Array.from({ length: 6 }, (_, i) => polar(5.4, i * 60, P.x, P.y)).map((q, i) => `${i ? 'L' : 'M'}${at(q)}`).join('')}Z" fill="#050506"/>`
  over += `<path d="${arc(P.x, P.y, 37.5, 196, 262)}" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="2.6" stroke-linecap="round"/>`

  // ---- the arm's outline, for the shadow it casts
  const shadow = `<path d="${TUBE_D}" fill="none" stroke="#000" stroke-width="25"/><path d="${STUB_D}" fill="none" stroke="#000" stroke-width="19"/>`
    + '<rect x="-288" y="-47" width="130" height="94" rx="9"/><circle r="47"/>'
    + `<g transform="translate(${ARM_JOINT.x} ${ARM_JOINT.y}) rotate(${ARM_OFFSET})"><rect x="-16" y="-15.5" width="50" height="31"/><path d="${PLATE}"/><path d="${NOSE}"/><path d="${LIFT}" fill="none" stroke="#000" stroke-width="9.4" stroke-linecap="round"/></g>`

  const pivot = `translate(${at(P)})`
  return {
    under: `<defs>${defs.join('')}</defs>${under}`,
    arm: `<g transform="${pivot}">${arm}</g>`,
    shadow: `<g transform="${pivot}" fill="#000">${shadow}</g>`,
    over,
  }
}

// ---- placing it all ------------------------------------------------------------------------------------------------

export interface StageLayout {
  /** px per record unit */
  k: number
  /** the spindle, in px from the stage's top left */
  cx: number
  cy: number
  /** where the note lines may start and how wide they may run, in px */
  notesX: number
  notesW: number
}

/**
 * Fits the record, the arm and its parts (about 1060 units from the left of the tick ring to the cue lever) into a
 * stage of w × h px, the record taking up to 58 % of the height, and centres the group with the notes beside it.
 */
export function vinylStageLayout(w: number, h: number): StageLayout {
  const k = Math.max(0.05, Math.min((0.29 * h) / VINYL.R, (w - 32) / 1100))
  const group = 1060 * k
  const notesW = Math.min(560, Math.max(0, w - group - 24))
  const cx = 590 * k + Math.max(0, (w - group - notesW) / 2)
  return { k, cx, cy: Math.min(h * 0.6, h - 590 * k), notesX: cx + 600 * k, notesW }
}

/** A note glyph in a 28 × 34 box: 'q' quarter, 'e' eighth, 'b' two beamed eighths, 's' two beamed sixteenths. */
export function noteGlyphSvg(kind: 'q' | 'e' | 'b' | 's', colour: string): string {
  const head = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="5.6" ry="4.1" transform="rotate(-22 ${x} ${y})" fill="${colour}"/>`
  const stem = (x: number, y0: number, y1: number) => `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${colour}" stroke-width="1.9"/>`
  if (kind === 'q') return head(9, 27) + stem(14.2, 26, 4)
  if (kind === 'e') return head(9, 27) + stem(14.2, 26, 4) + `<path d="M14.2 4 C 20 8, 23.5 12.5, 19.5 20" fill="none" stroke="${colour}" stroke-width="2"/>`
  const beams = kind === 's'
    ? `<path d="M12.6 3 L27 0.2 L27 4 L12.6 6.8 Z" fill="${colour}"/><path d="M12.6 9 L27 6.2 L27 10 L12.6 12.8 Z" fill="${colour}"/>`
    : `<path d="M12.6 3 L27 0.2 L27 4.2 L12.6 7 Z" fill="${colour}"/>`
  return head(7.6, 28) + head(22, 25) + stem(12.8, 27, 3.4) + stem(27.2, 24, 0.8) + beams
}
