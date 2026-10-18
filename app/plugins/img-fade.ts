import type { Directive } from 'vue'

/**
 * `v-img-fade`: an image that loads after the page is on screen fades in instead of popping in
 * (the `.img-fade` classes in assets/css/main.css). Server-rendered images and images that are
 * already loaded are left alone. Registered on the server too, where it renders nothing.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const sources = new WeakMap<HTMLImageElement, string | null>()

  const fadeIn = (el: HTMLImageElement) => {
    sources.set(el, el.getAttribute('src'))
    if (nuxtApp.isHydrating || el.complete) return
    el.classList.remove('img-fade-in')
    el.classList.add('img-fade')
    const show = () => {
      el.classList.remove('img-fade')
      el.classList.add('img-fade-in')
    }
    el.addEventListener('load', show, { once: true })
    el.addEventListener('error', show, { once: true })
  }

  const imgFade: Directive<HTMLImageElement> = {
    getSSRProps: () => ({}),
    beforeMount: fadeIn,
    updated(el) {
      if (el.getAttribute('src') !== sources.get(el)) fadeIn(el)
    },
  }

  nuxtApp.vueApp.directive('img-fade', imgFade)
})

declare module 'vue' {
  interface GlobalDirectives {
    vImgFade: Directive<HTMLImageElement>
  }
}
