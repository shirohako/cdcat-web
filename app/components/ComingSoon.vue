<template>
  <section
    class="relative isolate overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.5)] ring-1 ring-black/5 backdrop-blur-xl md:p-8"
  >
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-linear-to-br from-sky-300/35 to-cyan-200/15 blur-2xl" />
      <div class="absolute -bottom-16 -right-14 h-56 w-56 rounded-full bg-linear-to-br from-amber-300/30 to-rose-200/15 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(2,6,23,0.06)_1px,transparent_0)] bg-size-[22px_22px] opacity-25" />
    </div>

    <div class="relative">
      <h2 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        {{ titleText }}
      </h2>

      <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-[15px]">
        {{ descriptionText }}
      </p>

      <div class="mt-6 flex justify-center">
        <video
          class="h-40 w-auto rounded-xl object-contain md:h-48"
          autoplay
          loop
          muted
          playsinline
          preload="metadata"
          :aria-label="videoAriaLabel"
        >
          <source src="/media/animations/black-cat-01.webm" type="video/webm">
        </video>
      </div>

      <div class="mt-6 flex justify-center">
        <NuxtLink
          :to="backTo"
          class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
        >
          <ArrowLeft :size="15" />
          {{ backText }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ArrowLeft } from 'lucide-vue-next'

const props = defineProps({
  backTo: {
    type: String,
    default: '/'
  }
})

const titleText = '功能准备中'
const descriptionText = '穿越虚无，终将迎来黎明破晓。'
const videoAriaLabel = '加载动画'
const backText = '返回上一页'
</script>
