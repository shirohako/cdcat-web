<script setup lang="ts">
import { sectionNumber, sectionShift } from '~/documents/sections'
import type { LegalSection } from '~/legal'

/**
 * One numbered section of a legal document, on its own card: its badge and heading in the section's own colour, a
 * button that copies a link to it, the plain-language summary, then the full text.
 * `flash` briefly lights the badge up after a jump from the table of contents.
 */
const props = defineProps<{ section: LegalSection, index: number, flash: boolean }>()

const { t } = useI18n()
const { showToast } = useToast()

async function copyLink() {
  const url = `${window.location.origin}${window.location.pathname}#${props.section.id}`
  try {
    await navigator.clipboard.writeText(url)
    showToast(t('legal.link_copied'))
  }
  catch {
    showToast(t('legal.copy_failed', { url }), 'error')
  }
}
</script>

<template>
  <!-- Below lg the sticky contents bar (60px) sits under the navbar, so sections stop lower there. -->
  <section
    :id="section.id"
    class="group/section accent scroll-mt-36 rounded-lg bg-card p-5 md:p-7 lg:scroll-mt-20"
    :style="{ '--shift': sectionShift(index) }"
  >
    <header class="flex items-start gap-3">
      <span
        class="badge grid size-9 shrink-0 place-items-center rounded-md bg-(--accent-soft) font-mono text-sm font-semibold tabular-nums text-(--accent)"
        :class="{ 'is-flashing': flash }"
        aria-hidden="true"
      >
        {{ sectionNumber(index) }}
      </span>
      <h2 class="min-w-0 flex-1 pt-1 text-xl font-bold leading-7 text-title md:text-[22px]">{{ section.title }}</h2>
      <UiButton
        icon="lucide:link"
        :label="t('legal.copy_link')"
        size="sm"
        class="shrink-0 lg:opacity-0 lg:transition-opacity lg:duration-150 lg:group-hover/section:opacity-100 lg:focus-visible:opacity-100"
        @click="copyLink"
      />
    </header>

    <!-- In the section's colour, kept faint so a page of them doesn't shout; the label carries the colour. -->
    <p class="summary mt-4 rounded-md px-4 py-3 text-[13px] leading-[1.375rem] text-meta">
      <span class="mr-2 mt-px inline-flex items-center gap-1 rounded-sm bg-(--accent-soft) px-1.5 align-top text-xs font-semibold leading-5 text-(--accent)">
        <Icon name="lucide:lightbulb" class="size-3" />
        {{ t('legal.in_short') }}
      </span>{{ section.summary }}
    </p>

    <DocProse :content="section.body" class="mt-5" />
  </section>
</template>

<style scoped>
.badge {
  transition: background-color 200ms ease-out, color 200ms ease-out;
}

.badge.is-flashing {
  animation: flash 900ms ease-out;
}

.summary {
  border: 1px solid color-mix(in oklab, var(--accent) 18%, transparent);
  background: color-mix(in oklab, var(--accent) 4%, transparent);
}

@keyframes flash {
  20% {
    background-color: var(--accent);
    color: var(--on-accent);
    scale: 1.12;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge.is-flashing {
    animation: none;
  }
}
</style>
