<script setup lang="ts">
import type { TracklistDensity } from '~/utils/tracklistView'

/**
 * A small schematic of one tracklist 样式 (a layout at a density), drawn in grey bars, for the 样式 menu and the
 * settings dialog: titles dark, numbers and lengths mid, names light, role tags tinted. Only the styles on offer are
 * drawn; a new layout adds its drawing here. 96 × 64, scaled to the width the caller gives it with a class.
 */
const props = defineProps<{ layout: string, density: TracklistDensity }>()

interface Bar { x: number, y: number, w: number, h: number, tone: 'title' | 'meta' | 'faint' | 'tag' | 'number', r?: number }
interface Rule { x1: number, x2: number, y: number, dotted?: boolean }

// Title lengths, so the rows don't look ruled
const WIDTHS = [44, 30, 52, 38, 26, 48, 34, 41]

const drawing = computed(() => {
  const bars: Bar[] = []
  const rules: Rule[] = []
  const bar = (x: number, y: number, w: number, h: number, tone: Bar['tone'], r = 1) => bars.push({ x, y, w, h, tone, r })
  // A role tag and the names after it
  const credit = (x: number, y: number, names: number) => {
    bar(x, y, 8, 3.4, 'tag')
    bar(x + 10, y + 0.2, names, 3, 'faint')
  }
  const { layout, density } = props

  if (layout === 'list') {
    // Number, heart, title, length
    const line = (y: number, i: number) => {
      bar(5, y + 0.3, 4, 3, 'meta')
      bar(12, y - 0.1, 3.4, 3.4, 'faint', 1.7)
      bar(18, y, WIDTHS[i % 8]!, 3.6, 'title')
      bar(82, y + 0.3, 9, 3, 'meta')
    }
    if (density === 'compact') {
      // Ruled rows: number, title, then the heart beside the length
      for (let i = 0; i < 6; i++) {
        const y = 6 + i * 9.6
        bar(5, y, 4, 3, 'meta')
        bar(13, y - 0.2, WIDTHS[i]!, 3.4, 'title')
        bar(77, y - 0.2, 3.4, 3.4, 'faint', 1.7)
        bar(84, y, 7, 3, 'meta')
        if (i < 5) rules.push({ x1: 5, x2: 91, y: y + 6.3 })
      }
    } else if (density === 'comfy') {
      for (let i = 0; i < 4; i++) {
        const y = 6 + i * 14.5
        line(y, i)
        credit(18, y + 6, 14)
        credit(46, y + 6, 12)
      }
    } else {
      for (let i = 0; i < 2; i++) {
        const y = 5 + i * 29
        line(y, i)
        for (const [j, names] of [22, 14, 30].entries()) credit(18, y + 6.5 + j * 6, names)
      }
    }
  }

  if (layout === 'booklet') {
    // Light large numbers, the title, and a liner: credits on the left, notes on the right, joined by dotted leaders
    for (let i = 0; i < 2; i++) {
      const y = 5 + i * 30
      if (i) rules.push({ x1: 5, x2: 91, y: y - 4 })
      bar(5, y - 1, 7, 9, 'number', 1.5)
      bar(17, y, WIDTHS[i + 2]! - 6, 4, 'title')
      bar(84, y + 0.3, 7, 3, 'meta')
      const liner = (x: number, values: number[]) => values.forEach((value, j) => {
        const yy = y + 8 + j * 5.5
        bar(x, yy, 6, 2.8, 'meta')
        rules.push({ x1: x + 7.5, x2: x + 19, y: yy + 2, dotted: true })
        bar(x + 20, yy, value, 2.8, 'faint')
      })
      liner(17, [13, 10, 15])
      liner(58, [14, 10])
    }
  }

  if (layout === 'table') {
    // A header row, then the columns: 舒适 演唱, 编曲, lyrics; 完整 the four role columns and 其他人员
    const columns = density === 'comfy' ? [5, 13, 48, 64, 78, 85] : [5, 11, 32, 44, 56, 68, 80, 88]
    columns.forEach((x, k) => bar(x, 4, k === 1 ? 8 : 5, 2.6, 'meta'))
    rules.push({ x1: 5, x2: 91, y: 9.5 })
    for (let i = 0; i < 5; i++) {
      const y = 14 + i * 10
      bar(5, y, 3, 3, 'meta')
      bar(columns[1]!, y - 0.2, WIDTHS[i]! * (density === 'comfy' ? 0.62 : 0.42), 3.4, 'title')
      if (density === 'comfy') {
        bar(48, y - 0.2, 11, 3.4, 'faint')
        bar(64, y - 0.2, 10, 3.4, 'faint')
        bar(78, y - 0.4, 4, 4, 'tag')
        bar(85, y, 6, 3, 'meta')
      } else {
        for (const x of [32, 44, 56, 68]) bar(x, y - 0.2, 9, 3.4, 'faint')
        bar(80, y - 0.2, 7, 3.4, 'faint')
        bar(88, y - 0.2, 6, 3.4, 'faint')
      }
      if (i < 4) rules.push({ x1: 5, x2: 91, y: y + 6.5 })
    }
  }

  return { bars, rules }
})
</script>

<template>
  <svg viewBox="0 0 96 64" class="block aspect-[3/2] h-auto rounded-[0.25rem] bg-sunken" aria-hidden="true">
    <line v-for="(rule, index) in drawing.rules" :key="`r${index}`" :x1="rule.x1" :x2="rule.x2" :y1="rule.y" :y2="rule.y" :class="rule.dotted ? 'dotted' : 'rule'" />
    <rect v-for="(bar, index) in drawing.bars" :key="`b${index}`" :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" :rx="bar.r" :class="bar.tone" />
  </svg>
</template>

<style scoped>
.title { fill: var(--title); opacity: 0.78; }
.meta { fill: var(--meta); opacity: 0.75; }
.faint { fill: var(--faint); opacity: 0.55; }
.number { fill: var(--faint); opacity: 0.28; }
.tag { fill: var(--accent-text); opacity: 0.5; }
.rule { stroke: var(--line); stroke-width: 0.8; }
.dotted { stroke: var(--faint); stroke-width: 0.9; stroke-dasharray: 0.9 1.6; opacity: 0.7; }
</style>
