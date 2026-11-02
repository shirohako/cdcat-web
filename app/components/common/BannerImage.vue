<template>
  <!-- Fills its positioned parent. A banner of another shape than the strip is stretched (or squeezed) towards it by at
       most --banner-stretch, and what still does not fit is cropped to the middle; never any blank sides. -->
  <div class="banner-image absolute inset-0 overflow-hidden" :style="{ '--banner-ratio': image.width / image.height }">
    <img
      v-img-fade
      :src="image.medium_url"
      :srcset="`${image.medium_url} ${mediumWidth}w, ${image.url} ${image.width}w`"
      :sizes="sizes"
      alt=""
      class="banner-image-picture"
    >
  </div>
</template>

<script setup lang="ts">
import type { CatalogImage } from '~/types/catalog'

const props = withDefaults(defineProps<{ image: CatalogImage, sizes?: string }>(), { sizes: '100vw' })

// The medium thumbnail is at most 1200 px on its longest side, so a tall banner's is narrower than that.
const mediumWidth = computed(() => Math.round(props.image.width * Math.min(1, 1200 / Math.max(props.image.width, props.image.height))))
</script>

<style scoped>
.banner-image {
  --banner-stretch: 1.25;
  container-type: size;
}

/* object-fit: fill; the box is the strip itself unless that would distort the image by more than --banner-stretch,
   then it grows past the strip in the other direction and is cropped. */
.banner-image-picture {
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  max-width: none;
  width: max(100cqw, calc(100cqh * var(--banner-ratio) / var(--banner-stretch)));
  height: max(100cqh, calc(100cqw / var(--banner-ratio) / var(--banner-stretch)));
}
</style>
