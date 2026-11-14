<script setup lang="ts">
/**
 * Any picture that takes a moment to load: covers, avatars, the album and artist heroes. Until it is in, its box shows
 * the skeleton colour with the light sweeping across it (or a small `placeholder` version of it, blurred, under the
 * sweep); then the picture fades in over that, or with `reveal="develop"` sharpens from a blur, for large pictures.
 * When there is no picture or it fails, the `fallback` slot shows instead (an icon, an initial).
 *
 * Size and round it with classes on the component, which is the box (`class="size-7 rounded-md"`); `img-class` goes on
 * the picture itself (a hover zoom). The loaded and failed marks (data-loaded, data-failed) are set by the <img>'s own
 * inline handlers, not by Vue: a server-rendered picture that is in before the page hydrates shows at once, and the
 * styles read the marks, so nothing waits for the app. Each address gets an <img> of its own, so a new one starts over.
 */
withDefaults(defineProps<{
  src?: string | null
  alt?: string
  /** A small version (a thumbnail), shown blurred until the picture is in. */
  placeholder?: string | null
  /**
   * The picture's other sizes (`url 600w, url 1200w`) and how wide it shows (`sizes`), for a large picture: the
   * browser then fetches the smallest one that is sharp on its screen, and `src` is for browsers without `srcset`.
   */
  srcset?: string
  sizes?: string
  /** The picture's own size in pixels, when known: the browser reads its shape from them before it has loaded. */
  width?: number | null
  height?: number | null
  /** 'fade' for small pictures; 'develop' sharpens from a blur, for large ones. */
  reveal?: 'fade' | 'develop'
  fit?: 'cover' | 'contain'
  /** Load at once and ahead of other images, for a picture on screen from the start (a hero, a hover card). */
  eager?: boolean
  /** On an always-dark surface (`bg-hero`): a faint block and sweep. */
  dark?: boolean
  /** Send no Referer, for pictures on other sites that refuse hotlinks. */
  noReferrer?: boolean
  imgClass?: unknown
}>(), {
  src: undefined,
  alt: '',
  placeholder: undefined,
  srcset: undefined,
  sizes: undefined,
  width: undefined,
  height: undefined,
  reveal: 'fade',
  fit: 'cover',
  imgClass: undefined,
})
</script>

<template>
  <span class="ui-image relative block overflow-hidden" :class="{ 'is-dark': dark }">
    <template v-if="src">
      <span class="ui-image-placeholder absolute inset-0" aria-hidden="true">
        <img v-if="placeholder && placeholder !== src" :src="placeholder" alt="" class="size-full scale-110 object-cover blur-lg">
      </span>
      <img
        :key="src"
        :src="src"
        :srcset="srcset"
        :sizes="srcset ? sizes : undefined"
        :width="width ?? undefined"
        :height="height ?? undefined"
        :alt="alt"
        :loading="eager ? 'eager' : 'lazy'"
        :fetchpriority="eager ? 'high' : undefined"
        :referrerpolicy="noReferrer ? 'no-referrer' : undefined"
        onload="this.dataset.loaded=''"
        onerror="this.dataset.failed=''"
        class="ui-image-photo relative size-full"
        :class="[fit === 'contain' ? 'object-contain' : 'object-cover', reveal === 'develop' && 'is-develop', imgClass]"
      >
      <span v-if="$slots.fallback" class="ui-image-fallback absolute inset-0 place-items-center"><slot name="fallback" /></span>
    </template>
    <span v-else-if="$slots.fallback" class="grid size-full place-items-center"><slot name="fallback" /></span>
  </span>
</template>

<style>
/* In the components layer, so utilities given through `img-class` (a hover zoom) still win. Not scoped: the marks are
   set outside Vue, and these only ever match this component's own class names.
   The layer order is restated first: in dev, Vite can inject this style before main.css, and a bare
   `@layer components` would then put components below base, so preflight's transparent button background beat .btn. */
@layer theme, base, components, utilities;

@layer components {
  .ui-image-placeholder {
    background-color: var(--skeleton);
    transition: opacity 400ms ease-out 120ms;
  }

  .ui-image-placeholder::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent, var(--skeleton-band), transparent);
    animation: skeleton-shimmer 1.4s ease-in-out infinite;
  }

  .ui-image.is-dark .ui-image-placeholder {
    background-color: rgb(255 255 255 / 0.1);
  }

  .ui-image.is-dark .ui-image-placeholder::after {
    background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.12), transparent);
  }

  .ui-image:has(.ui-image-photo[data-loaded]) .ui-image-placeholder {
    opacity: 0;
  }

  .ui-image:has(.ui-image-photo[data-loaded]) .ui-image-placeholder::after,
  .ui-image:has(.ui-image-photo[data-failed]) .ui-image-placeholder::after {
    animation: none;
  }

  /* Only the waiting state is styled: once in, the picture keeps its own opacity, filter and scale. */
  .ui-image-photo {
    transition: opacity 400ms ease-out, filter 550ms ease-out, scale 400ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .ui-image-photo:not([data-loaded]) {
    opacity: 0;
  }

  .ui-image-photo.is-develop:not([data-loaded]) {
    filter: blur(14px);
    scale: 1.04;
  }

  /* A failed picture leaves the block (its sweep stopped) with the fallback on it. */
  .ui-image-fallback {
    display: none;
  }

  .ui-image:has(.ui-image-photo[data-failed]) .ui-image-fallback {
    display: grid;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-image-placeholder::after {
    animation: none;
  }

  .ui-image-photo.is-develop:not([data-loaded]) {
    filter: none;
    scale: none;
  }
}
</style>
