<template>
  <div class="auth-page flex min-h-[calc(100vh-3.5rem)] bg-card" :class="`is-${record}`">
    <!-- The record stage: a picture only, from lg up. Its code loads on its own once the form is up and the browser is
         idle, and it stays mounted while the reader moves between login, register and reset. -->
    <div class="sticky top-14 hidden h-[calc(100vh-3.5rem)] min-w-0 flex-1 lg:block" aria-hidden="true">
      <div class="auth-stage-ground absolute inset-0" />
      <Transition enter-from-class="opacity-0" enter-active-class="transition-opacity duration-700">
        <AuthStage v-if="showStage" :record="record" :track="track" />
      </Transition>
    </div>
    <div class="flex w-full min-w-0 justify-center lg:w-[27rem] lg:shrink-0 xl:w-[30rem] 2xl:w-[34rem]">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VinylRecord } from '~/utils/vinylStage'

// Wraps /auth/login, /auth/register and /auth/forgot-password, which move the stylus through useAuthStageTrack.
const AuthStage = defineAsyncComponent(() => import('~/components/auth/stage/AuthStage.vue'))

const route = useRoute()
// Sign-up has its own record; login and reset share the other
const record = computed<VinylRecord>(() => (route.name === 'auth-register' ? 'register' : 'login'))
const track = useAuthStageTrack()
const showStage = ref(false)

let wide: MediaQueryList | undefined
const load = () => {
  if (showStage.value || !wide?.matches) return
  const show = () => {
    showStage.value = true
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(show, { timeout: 2000 })
  else setTimeout(show, 300)
}
onMounted(() => {
  wide = window.matchMedia('(min-width: 64rem)')
  load()
  wide.addEventListener('change', load)
})
onBeforeUnmount(() => wide?.removeEventListener('change', load))
</script>

<style scoped>
/* What shows before the stage arrives: its night-time ground */
.auth-stage-ground {
  background: radial-gradient(120% 90% at 30% 58%, #120d1c 0%, #07060a 62%);
}

/* The record's colour, for the step bars and the like beside it */
.auth-page {
  --auth-tint: #d62f84;
}

.auth-page.is-register {
  --auth-tint: #0e8f83;
}

[data-theme='dark'] .auth-page {
  --auth-tint: #ff72b4;
}

[data-theme='dark'] .auth-page.is-register {
  --auth-tint: #3fd3c4;
}
</style>
