<template>
  <div ref="page" class="container mx-auto max-w-6xl space-y-14 px-4 py-10 md:space-y-16 md:px-8 md:py-16 2xl:max-w-7xl">
    <section class="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_15rem] lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
      <div class="max-w-2xl">
        <p class="flex items-center gap-2.5 text-sm font-medium text-title">
          <span class="h-px w-6 bg-primary" aria-hidden="true" />
          {{ content.eyebrow }}
        </p>
        <h1 class="mt-5 text-balance text-3xl font-black leading-tight tracking-tight text-title md:text-[2.875rem] md:leading-[1.2]">
          {{ content.title.before }}<em class="accent highlight not-italic">{{ content.title.em }}</em>{{ content.title.after }}
        </h1>
        <p class="mt-5 text-base leading-8 text-body md:text-lg md:leading-9">{{ content.lead }}</p>
        <ul class="mt-6 flex flex-wrap gap-2.5 text-sm text-title">
          <li v-for="stat in stats" :key="stat" class="inline-flex h-9 items-center rounded-lg bg-card px-3 ring-1 ring-line ring-inset">
            {{ stat }}
          </li>
        </ul>
        <p v-if="!translated" class="mt-4 flex items-center gap-1.5 text-sm text-meta">
          <Icon name="lucide:languages" class="size-4" />
          {{ t('join_page.source_language') }}
        </p>
      </div>

      <!-- A staff pass on a lanyard with an empty photo; hovering the hero turns it straight. -->
      <div class="pass relative mx-auto hidden aspect-3/4 w-full md:block" aria-hidden="true">
        <span class="absolute top-0 left-1/2 h-[18%] w-5 -translate-x-1/2 rounded-t-sm bg-primary" />
        <div class="pass-back accent absolute inset-[14%_8%_0] rounded-2xl bg-(--accent-soft)" style="--shift: 30" />
        <div class="pass-front absolute inset-[14%_8%_0] flex flex-col gap-2.5 rounded-2xl bg-card p-5 shadow-[0_20px_40px_-24px_rgb(0_0_0/0.5)] ring-1 ring-line">
          <span class="h-1.5 w-11 self-center rounded-full bg-sunken ring-1 ring-line" />
          <div class="photo mt-2 grid aspect-square place-items-center rounded-xl ring-1 ring-line">
            <span class="text-4xl font-black text-faint">?</span>
          </div>
          <span class="mt-1 font-mono text-[11px] font-semibold tracking-[0.12em] text-meta">{{ content.badge.role }}</span>
          <span class="text-xl font-bold text-title">{{ content.badge.name }}</span>
        </div>
      </div>
    </section>

    <section v-for="group in content.groups" :id="group.id" :key="group.id" class="scroll-mt-20">
      <h2 class="flex items-baseline gap-3">
        <span class="text-lg font-bold text-title">{{ group.name }}</span>
        <span class="text-sm text-meta">{{ group.desc }}</span>
      </h2>
      <ul class="mt-3.5 grid gap-3" :class="GRID_COLUMNS[group.roles.length]">
        <li
          v-for="(role, index) in group.roles"
          :key="role.name"
          class="accent flex flex-col gap-2.5 rounded-lg bg-card p-5"
          :style="{ '--shift': group.shift + index * 18, '--i': index }"
          data-reveal
        >
          <div class="flex items-center gap-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-(--accent-soft) text-(--accent)">
              <Icon :name="role.icon" class="size-4.5" />
            </span>
            <div class="min-w-0">
              <h3 class="font-semibold text-title">{{ role.name }}</h3>
              <p v-if="role.sub" class="text-xs text-meta">{{ role.sub }}</p>
            </div>
          </div>
          <p class="text-sm leading-7 text-body">{{ role.desc }}</p>
        </li>
      </ul>
    </section>

    <!-- 管理员: an all-access pass, dark in both themes. A punched foil strip down the left, then the requirements,
         then every role above in its card's colour, since any one of them will do. -->
    <section class="admin-pass grid grid-cols-[3rem_minmax(0,1fr)] overflow-hidden rounded-2xl md:grid-cols-[4.5rem_minmax(0,1fr)_auto]" data-reveal>
      <div class="foil relative flex flex-col items-center gap-4 py-4 md:py-5" aria-hidden="true">
        <span class="size-4 rounded-full bg-page shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)] md:size-4.5" />
        <span class="font-mono text-[11px] font-semibold tracking-[0.32em] [writing-mode:vertical-rl] md:text-xs">{{ content.admin.pass }}</span>
      </div>
      <div class="flex min-w-0 flex-col justify-center gap-3.5 p-5 md:px-7 md:py-6.5">
        <p class="font-mono text-[11px] font-semibold tracking-[0.16em] opacity-60">{{ content.admin.eyebrow }}</p>
        <h2 class="flex flex-wrap items-center gap-3 text-[1.75rem] font-black leading-tight tracking-wide md:text-3xl">
          {{ content.admin.name }}
          <span class="inline-flex h-6.5 items-center rounded-full bg-white/14 px-2.5 text-xs font-medium tracking-normal">{{ content.admin.tag }}</span>
        </h2>
        <ul class="grid gap-2">
          <li v-for="requirement in content.admin.requirements" :key="requirement" class="flex items-center gap-2.5 text-[15px]">
            <span class="grid size-5.5 shrink-0 place-items-center rounded-full bg-white/14">
              <Icon name="lucide:check" class="size-3.5" />
            </span>
            {{ requirement }}
          </li>
        </ul>
      </div>
      <div class="col-start-2 flex flex-col justify-center gap-2.5 px-5 pb-6 md:col-start-auto md:items-end md:py-6.5 md:pr-7 md:pl-0">
        <ul class="grid grid-cols-[repeat(5,2rem)] gap-1.5" aria-hidden="true">
          <template v-for="group in content.groups" :key="group.id">
            <li
              v-for="(role, index) in group.roles"
              :key="role.name"
              class="role-tile grid size-8 place-items-center rounded-lg"
              :style="{ '--shift': group.shift + index * 18 }"
            >
              <Icon :name="role.icon" class="size-4" />
            </li>
          </template>
        </ul>
        <p class="text-xs opacity-60">{{ adminRoles }}</p>
      </div>
    </section>

    <section id="how">
      <h2 class="flex items-baseline gap-3">
        <span class="text-lg font-bold text-title">{{ content.join.title }}</span>
        <span class="text-sm text-meta">{{ content.join.desc }}</span>
      </h2>
      <ol class="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(step, index) in content.join.steps" :key="step.title" class="flex flex-col gap-1.5 rounded-lg bg-card p-5" :style="{ '--i': index }" data-reveal>
          <span class="font-mono text-xs font-semibold tabular-nums text-meta">{{ String(index + 1).padStart(2, '0') }}</span>
          <h3 class="font-semibold text-title">{{ step.title }}</h3>
          <p class="text-sm leading-6 text-body">{{ step.desc }}</p>
        </li>
      </ol>
      <div class="mt-4 flex flex-wrap gap-2.5">
        <UiButton :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" variant="primary" icon="simple-icons:telegram" class="min-h-11 px-5">
          {{ t('join_page.telegram') }}
        </UiButton>
        <!-- On the card surface with a border, since the plain button colour almost matches the light page. The number
             stands out; the icon at the end says a click copies it, then turns into a tick once it has. -->
        <UiButton
          variant="outline"
          icon="simple-icons:qq"
          class="group/qq min-h-11 pr-4 pl-4 [--ui-btn-active:var(--card-active)] [--ui-btn-bg:var(--card)] [--ui-btn-hover:var(--card-hover)]"
          @click="copyQq"
        >
          <span class="font-medium text-meta">{{ t('join_page.qq') }}</span>
          <span class="font-mono font-semibold tracking-wide tabular-nums text-title">{{ QQ_GROUP }}</span>
          <span
            class="ml-1 inline-flex transition-colors duration-150 ease-out"
            :class="qqCopied ? 'text-success' : 'text-faint group-hover/qq:text-meta'"
            aria-live="polite"
          >
            <Icon :name="qqCopied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
            <span class="sr-only">{{ qqCopied ? t('join_page.copied') : t('join_page.copy') }}</span>
          </span>
        </UiButton>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import content from '~/join/zh-Hans'

const { t, locale } = useI18n()
const { showToast } = useToast()
useRevealOnScroll(useTemplateRef('page'))

/** The page is only written in Simplified Chinese so far; other languages show that text with a note. */
const translated = computed(() => locale.value === 'zh-Hans')

// Every group's cards fill whole rows on wide screens.
const GRID_COLUMNS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 md:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

const roleCount = content.groups.reduce((sum, group) => sum + group.roles.length, 0)
const adminRoles = content.admin.roles.replace('{count}', String(roleCount))

// The roles count 管理员 too.
const stats = computed(() => [
  content.stats.roles.replace('{count}', String(roleCount + 1)),
  content.stats.groups.replace('{count}', String(content.groups.length)),
  content.stats.spare,
])

// The QQ button says 已复制 for a moment after a copy; a failed copy says so in a toast, with the number.
const qqCopied = ref(false)
let qqCopiedTimer: ReturnType<typeof setTimeout> | undefined
async function copyQq() {
  try {
    await navigator.clipboard.writeText(QQ_GROUP)
    qqCopied.value = true
    clearTimeout(qqCopiedTimer)
    qqCopiedTimer = setTimeout(() => { qqCopied.value = false }, 2000)
  }
  catch {
    showToast(t('join_page.qq_copy_failed', { number: QQ_GROUP }), 'error')
  }
}
onBeforeUnmount(() => clearTimeout(qqCopiedTimer))

usePageSeo({
  title: () => t('about_page.recruit'),
  description: () => t('seo.pages.join'),
  breadcrumbs: () => [{ name: t('menu.about'), path: '/about' }, { name: t('about_page.recruit'), path: '/join' }],
})
</script>

<style scoped>
/* A highlighter stroke behind the title's phrase, in a colour turned from the theme hue. */
.highlight {
  --shift: 40;
  background: linear-gradient(transparent 62%, color-mix(in oklab, var(--accent) 38%, transparent) 0);
}

.photo {
  background: repeating-linear-gradient(135deg, var(--sunken) 0 8px, transparent 8px 16px), var(--card);
}

.pass-front {
  rotate: -4deg;
  transition: rotate 500ms cubic-bezier(0.34, 1.4, 0.64, 1);
}

.pass-back {
  rotate: 5deg;
  translate: 12px -6px;
  transition: rotate 500ms cubic-bezier(0.34, 1.4, 0.64, 1);
}

section:hover > .pass .pass-front {
  rotate: -1deg;
}

section:hover > .pass .pass-back {
  rotate: 8deg;
}

/* 管理员's pass keeps a dark surface in both themes, from the reader's hue. */
.admin-pass {
  --pass-bg: oklch(0.27 0.03 var(--hue));
  color: oklch(1 0 0 / 0.92);
  background: var(--pass-bg);
  box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.1);
}

:global([data-theme="light"]) .admin-pass {
  --pass-bg: oklch(0.21 0.03 var(--hue));
}

/* Holographic foil that drifts slowly, with a perforated edge in the pass's colour. */
.foil {
  color: oklch(0.22 0.03 var(--hue));
  background: linear-gradient(165deg, oklch(0.86 0.09 200), oklch(0.83 0.11 300), oklch(0.9 0.09 80), oklch(0.85 0.1 160), oklch(0.83 0.11 300));
  background-size: 100% 260%;
  animation: foil 7s ease-in-out infinite alternate;
}

.foil::after {
  content: "";
  position: absolute;
  inset: 0 -1px 0 auto;
  border-right: 2px dashed var(--pass-bg);
  opacity: 0.55;
}

.role-tile {
  color: oklch(0.88 0.07 calc(var(--hue) + var(--shift)));
  background: oklch(0.72 0.12 calc(var(--hue) + var(--shift)) / 0.26);
}

@keyframes foil {
  to { background-position: 0 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .pass-front,
  .pass-back {
    transition: none;
  }

  .foil {
    animation: none;
  }
}
</style>
