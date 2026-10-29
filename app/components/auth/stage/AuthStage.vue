<script setup lang="ts">
import { ARM_PIVOT, armAngle, noteGlyphSvg, polar, tonearmParts, vinylGlow, vinylStageLayout, vinylSvg, type VinylRecord } from '~/utils/vinylStage'

/**
 * The login / register stage: a marbled record turning at 33⅓ rpm under a tonearm whose stylus sits on the track of
 * the current step, a ring of ticks following a made-up spectrum, ripples on every bar, and lines of notes that light
 * up on the beat. Nothing plays; it is a picture (aria-hidden). pages/auth.vue loads it on its own, on wide screens,
 * once the page is idle.
 *
 * While it runs, only the record (its own layer, turned by CSS), the small canvas and a few note spans change. It
 * stops while the tab is hidden or the stage is off screen, and stands still when the system asks for less motion.
 * A new `record` is put on like a real one: the arm lifts and parks, the record slides out, the other slides in, and
 * the arm drops onto the track.
 */
const props = defineProps<{
  record: VinylRecord
  /** 1–5: the stylus on that track; null: parked on the arm rest */
  track: number | null
}>()

const { t } = useI18n()
const id = useId().replace(/[^\w-]/g, '')
const root = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const size = ref({ w: 0, h: 0 })
const layout = computed(() => vinylStageLayout(size.value.w, size.value.h))

// ---- running, pausing

const reduced = ref(false)
const onScreen = ref(true)
const tabHidden = ref(false)
const entered = ref(false)
const running = computed(() => entered.value && onScreen.value && !tabHidden.value && !reduced.value)

// ---- the record and the arm

const shown = ref<VinylRecord>(props.record)
const tint = computed(() => vinylGlow(shown.value))
const stepNames = computed(() => (['notice', 'terms', 'profile', 'password', 'email'] as const).map(step => t(`auth.register.steps.${step}`)))
const vinyl = computed(() => {
  const names = stepNames.value
  const label = shown.value === 'login'
    ? { title: t('auth.login.title'), tracks: [`A1 ${t('auth.login.title')} · A2 ${t('auth.forgot_password.title')}`] }
    : { title: t('auth.stage.register_title'), tracks: [names.slice(0, 3).map((n, i) => `A${i + 1} ${n}`).join(' · '), names.slice(3).map((n, i) => `A${i + 4} ${n}`).join(' · ')] }
  return vinylSvg(shown.value, { id: `${id}-${shown.value}`, ...label })
})
const parts = computed(() => tonearmParts({ id: `${id}-arm`, tint: tint.value }))

/** '' on the platter; 'is-out' sliding off to the left; 'is-in' waiting off stage to slide back in */
const disc = ref<'' | 'is-out' | 'is-in'>('')
const armTrack = ref<number | null>(null)
const lifted = ref(false)
const playing = computed(() => armTrack.value !== null && !lifted.value)

const discBox = computed(() => {
  const { k, cx, cy } = layout.value
  const d = 1000 * k
  return { left: `${cx - d / 2}px`, top: `${cy - d / 2}px`, width: `${d}px`, height: `${d}px` }
})
const viewBox = computed(() => {
  const { k, cx, cy } = layout.value
  return [-cx / k, -cy / k, size.value.w / k, size.value.h / k].map(v => v.toFixed(2)).join(' ')
})
const vars = computed(() => {
  const { k, cx, cy } = layout.value
  return {
    '--tint': tint.value,
    '--cx': `${cx}px`,
    '--cy': `${cy}px`,
    '--glow': `${1300 * k}px`,
    '--pivot': `${cx + ARM_PIVOT.x * k}px ${cy + ARM_PIVOT.y * k}px`,
  }
})
const armTurn = computed(() => `rotate(${armAngle(armTrack.value).toFixed(3)}deg)${lifted.value ? ' scale(1.02)' : ''}`)
const shadowStyle = computed(() => {
  const k = layout.value.k
  const [dx, dy, blur] = lifted.value ? [42, 54, 14] : [15, 21, 7]
  return { transform: `translate(${dx * k}px, ${dy * k}px) ${armTurn.value}`, opacity: lifted.value ? 0.34 : 0.55, filter: `blur(${blur * k}px)` }
})

// Moves run one at a time: each new one cancels the steps of the last
let motion = 0
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
async function play(track: number | null) {
  const turn = ++motion
  const live = () => turn === motion
  if (reduced.value) {
    shown.value = props.record
    disc.value = ''
    lifted.value = false
    armTrack.value = track
    return
  }
  if (props.record !== shown.value) {
    lifted.value = true
    armTrack.value = null
    await wait(800)
    if (!live()) return
    disc.value = 'is-out'
    await wait(650)
    if (!live()) return
    shown.value = props.record
    disc.value = 'is-in'
    await frame()
    if (!live()) return
    disc.value = ''
    await wait(750)
  } else {
    disc.value = ''
    if (armTrack.value === track && !lifted.value) return
    lifted.value = true
    await wait(260)
  }
  if (!live()) return
  armTrack.value = track
  await wait(1050)
  if (live()) lifted.value = false
}
watch(() => [props.record, props.track] as const, () => {
  if (entered.value) play(props.track)
})

// ---- spectrum ticks and ripples, on the canvas

const TICKS = 240
const levels = new Float32Array(TICKS)
const targets = new Float32Array(TICKS)
let ripples: { grow: number, life: number }[] = []
let phase = Math.random() * 10

function retarget(downbeat: boolean) {
  phase += 0.7 + Math.random()
  for (let i = 0; i < TICKS; i++) {
    const v = 0.45 + 0.3 * Math.sin(i * 0.23 + phase) + 0.22 * Math.sin(i * 0.061 + phase * 1.7) + 0.26 * (Math.random() - 0.5)
    targets[i] = Math.max(0, v * (downbeat ? 1.25 : 1))
  }
}

function draw() {
  const el = canvas.value
  const ctx = el?.getContext('2d')
  if (!el || !ctx) return
  const { w, h } = size.value
  const { k, cx, cy } = layout.value
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.lineWidth = 1.4
  for (const ripple of ripples) {
    ctx.strokeStyle = `rgba(255, 90, 74, ${(0.26 * (1 - ripple.life)).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(cx, cy, (515 + ripple.grow) * k, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(1.2, 4.4 * k)
  for (const major of [false, true]) {
    ctx.beginPath()
    for (let i = 0; i < TICKS; i++) {
      if ((i % 5 === 0) !== major) continue
      const a = (i / TICKS) * Math.PI * 2
      const len = (major ? 16 : 8) + levels[i]! * 46
      ctx.moveTo(cx + 512 * k * Math.cos(a), cy + 512 * k * Math.sin(a))
      ctx.lineTo(cx + (512 + len) * k * Math.cos(a), cy + (512 + len) * k * Math.sin(a))
    }
    ctx.strokeStyle = major ? 'rgba(255, 90, 74, .95)' : 'rgba(255, 90, 74, .5)'
    ctx.stroke()
  }
  const mark = polar(512 * k, -34, cx, cy)
  ctx.fillStyle = '#ff5a4a'
  ctx.beginPath()
  ctx.arc(mark.x, mark.y, 7 * k, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 90, 74, .5)'
  ctx.lineWidth = 2 * k
  ctx.beginPath()
  ctx.arc(mark.x, mark.y, 13 * k, 0, Math.PI * 2)
  ctx.stroke()
}

let raf = 0
let lastFrame = 0
function tick(now: number) {
  raf = requestAnimationFrame(tick)
  // 30 frames a second is plenty for a ring of ticks
  if (now - lastFrame < 33) return
  lastFrame = now
  for (let i = 0; i < TICKS; i++) levels[i]! += (targets[i]! - levels[i]!) * 0.22
  ripples = ripples.filter(ripple => (ripple.life += 0.018) < 1)
  for (const ripple of ripples) ripple.grow += 3.2
  draw()
}

// ---- lines of notes, a beat clock

interface Line { tag: string, tokens: string[], active: number }
const SCALE = ['c', 'eb', 'f', 'g', 'bb']
const FAN = [-30, -15, 0, 15, 30]
const random = (n: number) => Math.floor(Math.random() * n)
function phrase(tag: string): string[] {
  if (tag === 'hats') return Array.from({ length: 12 }, () => ['x', 'x', '~', '[~ x]', '[x x]'][random(5)]!)
  const note = (low: number, high: number) => `${SCALE[random(5)]}${low + random(high - low + 1)}`
  return Array.from({ length: 10 }, () => {
    const r = Math.random()
    if (r < 0.12) return '-'
    if (r < 0.3) return `[${note(4, 6)} ${note(4, 6)}]`
    return tag === 'bass' ? note(2, 3) : note(4, 6)
  })
}
const lines = ref<Line[]>(['hats', 'chords', 'drop', 'bass', 'keys'].map(tag => ({ tag, tokens: phrase(tag), active: random(6) })))
const showNotes = computed(() => layout.value.notesW >= 140)
const lineStyles = computed(() => {
  const { k, cx, cy } = layout.value
  const fontSize = Math.min(30, Math.max(14, 50 * k))
  return FAN.map((angle, i) => {
    const far = Math.abs(i - 2)
    const at = polar(610 * k, angle, cx, cy)
    return {
      left: `${at.x}px`,
      top: `${at.y}px`,
      transform: `translateY(-50%) rotate(${angle}deg)`,
      fontSize: `${(fontSize * [1, 0.82, 0.7][far]!).toFixed(1)}px`,
      filter: far ? `blur(${[0, 1.4, 3][far]}px)` : undefined,
      opacity: [1, 0.7, 0.42][far],
    }
  })
})
function tokenClass(line: Line, index: number, j: number) {
  if (index !== 2) return j === line.active ? 'is-on' : ''
  if (j === line.active) return 'is-hit'
  return j === (line.active + 1) % line.tokens.length ? 'is-next' : ''
}

const floats = ref<{ id: number, style: Record<string, string>, svg: string }[]>([])
let floatId = 0
function spawnFloat() {
  const { notesX, notesW } = layout.value
  const kind = (['q', 'e', 'b', 's'] as const)[random(4)]!
  floats.value.push({
    id: ++floatId,
    style: { left: `${notesX + Math.random() * notesW * 0.85}px`, top: `${size.value.h * (0.16 + Math.random() * 0.66)}px`, rotate: `${random(30) - 15}deg` },
    svg: noteGlyphSvg(kind, Math.random() < 0.35 ? tint.value : 'rgba(242, 238, 248, .85)'),
  })
}
const dropFloat = (floatIdToDrop: number) => {
  floats.value = floats.value.filter(note => note.id !== floatIdToDrop)
}

// 100 BPM; a ripple and a stronger spectrum on each bar
let beats = 0
let clock: ReturnType<typeof setInterval> | undefined
function beat() {
  beats++
  for (const line of lines.value) line.active = (line.active + 1) % line.tokens.length
  retarget(beats % 4 === 0)
  if (beats % 4 === 0) ripples.push({ grow: 0, life: 0 })
  if (beats % 3 === 0 && showNotes.value && floats.value.length < 6) spawnFloat()
}

watch(running, (on) => {
  if (on) {
    clock = setInterval(beat, 600)
    raf = requestAnimationFrame(tick)
  } else {
    clearInterval(clock)
    cancelAnimationFrame(raf)
    draw()
  }
})

// ---- size and the observers

function measure() {
  const el = root.value
  const c = canvas.value
  if (!el || !c) return
  size.value = { w: el.clientWidth, h: el.clientHeight }
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.width = Math.round(size.value.w * dpr)
  c.height = Math.round(size.value.h * dpr)
  draw()
}

let resizer: ResizeObserver | undefined
let watcher: IntersectionObserver | undefined
let motionQuery: MediaQueryList | undefined
const onMotion = () => {
  reduced.value = !!motionQuery?.matches
}
const onVisibility = () => {
  tabHidden.value = document.hidden
}

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  onMotion()
  motionQuery.addEventListener('change', onMotion)
  document.addEventListener('visibilitychange', onVisibility)
  onVisibility()
  resizer = new ResizeObserver(measure)
  if (root.value) resizer.observe(root.value)
  watcher = new IntersectionObserver(([entry]) => {
    onScreen.value = !!entry?.isIntersecting
  })
  if (root.value) watcher.observe(root.value)
  retarget(false)
  levels.set(targets)
  measure()
  // Fade the record in, then bring the arm over from its rest
  requestAnimationFrame(() => {
    entered.value = true
    setTimeout(() => play(props.track), reduced.value ? 0 : 450)
  })
})

onBeforeUnmount(() => {
  motion++
  clearInterval(clock)
  cancelAnimationFrame(raf)
  resizer?.disconnect()
  watcher?.disconnect()
  motionQuery?.removeEventListener('change', onMotion)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <div ref="root" class="auth-stage" :class="{ 'is-entered': entered, 'is-running': running, 'is-still': reduced }" :style="vars" aria-hidden="true">
    <div class="auth-stage-glow" />
    <canvas ref="canvas" class="auth-stage-fill" />
    <div class="auth-stage-disc-box" :class="disc" :style="discBox">
      <!-- The record and the arm below are SVG built by utils/vinylStage from fixed shapes and our own label text. -->
      <!-- eslint-disable vue/no-v-html -->
      <div class="auth-stage-disc" v-html="vinyl" />
      <div class="auth-stage-sheen" />
    </div>
    <svg class="auth-stage-fill" :viewBox="viewBox" v-html="parts.under" />
    <div class="auth-stage-arm" :style="shadowStyle"><svg :viewBox="viewBox" v-html="parts.shadow" /></div>
    <div class="auth-stage-arm" :class="{ 'is-playing': playing }" :style="{ transform: armTurn }"><svg :viewBox="viewBox" v-html="parts.arm" /></div>
    <svg class="auth-stage-fill" :viewBox="viewBox" v-html="parts.over" />
    <div v-if="showNotes" class="auth-stage-notes">
      <div v-for="(line, i) in lines" :key="line.tag" class="auth-stage-line" :style="lineStyles[i]">
        <span class="auth-stage-tag">{{ line.tag }}</span>
        <span v-for="(token, j) in line.tokens" :key="j" :class="tokenClass(line, i, j)">{{ token }}</span>
      </div>
      <span v-for="note in floats" :key="note.id" class="auth-stage-float" :style="note.style" @animationend="dropFloat(note.id)">
        <svg viewBox="0 0 28 34" v-html="note.svg" />
      </span>
    </div>
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<style scoped>
/* Fills its positioned parent. Set here, not by the parent's utility classes: this scoped rule is unlayered and
   would beat them */
.auth-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: radial-gradient(120% 90% at 30% 58%, #120d1c 0%, #07060a 62%);
}

.auth-stage-fill {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.auth-stage-glow {
  position: absolute;
  left: var(--cx);
  top: var(--cy);
  width: var(--glow);
  height: var(--glow);
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--tint) 14%, transparent), transparent);
  transition: background 0.8s;
}

.auth-stage-disc-box {
  position: absolute;
  transition: transform 0.75s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.75s;
}

.auth-stage:not(.is-entered) .auth-stage-disc-box {
  opacity: 0;
  transform: scale(0.94);
}

.auth-stage-disc-box.is-out,
.auth-stage-disc-box.is-in {
  opacity: 0;
  transform: translateX(-120%) rotate(-160deg);
}

.auth-stage-disc-box.is-out {
  transition-duration: 0.65s;
  transition-timing-function: cubic-bezier(0.6, 0, 0.8, 0.4);
}

.auth-stage-disc-box.is-in {
  transition: none;
}

/* 33⅓ rpm */
.auth-stage-disc {
  position: absolute;
  inset: 0;
  animation: auth-stage-spin 1.8s linear infinite;
  animation-play-state: paused;
  will-change: transform;
}

.auth-stage.is-running .auth-stage-disc {
  animation-play-state: running;
}

.auth-stage.is-still .auth-stage-disc {
  animation: none;
}

.auth-stage-disc :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

/* The light on the grooves stays where it is while the record turns under it */
.auth-stage-sheen {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  mix-blend-mode: screen;
  background: conic-gradient(from 16deg, transparent 0deg, rgb(255 255 255 / 6%) 12deg, rgb(255 255 255 / 20%) 24deg, rgb(255 255 255 / 6%) 36deg, transparent 48deg, transparent 180deg, rgb(255 255 255 / 6%) 192deg, rgb(255 255 255 / 20%) 204deg, rgb(255 255 255 / 6%) 216deg, transparent 228deg);
  mask: radial-gradient(circle closest-side, transparent 33.4%, #000 34.4%, #000 96.4%, transparent 97.2%);
}

.auth-stage-arm {
  position: absolute;
  inset: 0;
  transform-origin: var(--pivot);
  transition: transform 1s cubic-bezier(0.45, 0.05, 0.25, 1), opacity 0.4s, filter 0.4s;
  will-change: transform;
}

.auth-stage-arm svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.auth-stage-arm :deep(.stylus-light) {
  opacity: 0;
  transition: opacity 0.4s;
}

.auth-stage-arm.is-playing :deep(.stylus-light) {
  opacity: 1;
}

.auth-stage-notes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mask: linear-gradient(90deg, #000 calc(100% - 72px), transparent);
}

.auth-stage-line {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.55em;
  transform-origin: 0 50%;
  white-space: nowrap;
  font-family: 'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace;
  color: rgb(242 238 248 / 62%);
}

.auth-stage-line span {
  position: relative;
  border-radius: 0.22em;
  padding: 0.04em 0.28em;
  transition: color 0.2s, background-color 0.2s, box-shadow 0.2s, translate 0.2s;
}

.auth-stage-tag {
  margin-right: 0.2em;
  font-size: 0.52em;
  letter-spacing: 0.08em;
  color: #ff5a4a !important;
}

.auth-stage-line .is-on {
  color: #f2eef8;
}

.auth-stage-line .is-hit {
  color: #fff;
  background: color-mix(in srgb, var(--tint) 28%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tint) 75%, transparent);
}

.auth-stage-line .is-next {
  color: #ffe9a6;
  background: rgb(255 196 0 / 20%);
  box-shadow: inset 0 0 0 1px rgb(255 196 0 / 80%);
  translate: 0 -0.32em;
}

.auth-stage-line .is-next::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -1.15em;
  width: 0.42em;
  height: 0.42em;
  translate: -50% 0;
  rotate: 45deg;
  background: #9dff5c;
  box-shadow: 0 0 10px #9dff5c;
}

.auth-stage-float {
  position: absolute;
  width: 22px;
  animation: auth-stage-float 2.6s ease-out forwards;
}

.auth-stage-float svg {
  display: block;
  width: 100%;
}

@keyframes auth-stage-spin {
  to { transform: rotate(360deg); }
}

@keyframes auth-stage-float {
  from { opacity: 0; transform: translateY(8px) scale(0.9); }
  20% { opacity: 0.9; }
  to { opacity: 0; transform: translateY(-46px) scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .auth-stage-disc-box,
  .auth-stage-arm,
  .auth-stage-line span {
    transition: none;
  }
}
</style>
