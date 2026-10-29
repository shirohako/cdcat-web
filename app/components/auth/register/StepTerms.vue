<script setup lang="ts">
/**
 * Sign-up step 2: one card per document, a box to agree to it and its name, which opens it (a tint rises behind the
 * name on hover), nothing more. The model is true once both are ticked. The documents open in a new tab, so reading
 * them doesn't lose what has been filled in.
 */
const accepted = defineModel<boolean>({ required: true })
const emit = defineEmits<{ next: [], prev: [] }>()
const { t } = useI18n()

const DOCUMENTS = [
  { key: 'terms', to: '/terms', icon: 'lucide:file-text' },
  { key: 'privacy', to: '/privacy', icon: 'lucide:shield-check' },
] as const
// Coming back to this step after agreeing finds both still ticked
const ticks = reactive({ terms: accepted.value, privacy: accepted.value })
watch(ticks, () => { accepted.value = ticks.terms && ticks.privacy })
</script>

<template>
  <div class="flex flex-col gap-5">
    <ul class="flex flex-col gap-3">
      <li v-for="doc in DOCUMENTS" :key="doc.key">
        <UiSplashCheckbox v-model="ticks[doc.key]" class="w-full rounded-xl border border-line bg-sunken/50 px-5 py-3.5 has-checked:border-primary/40">
          <i18n-t keypath="auth.register.terms.agree" tag="span" scope="global" class="min-w-0 leading-7">
            <template #doc>
              <NuxtLink
                :to="doc.to"
                target="_blank"
                class="group/doc rounded-md bg-[linear-gradient(var(--link-hover),var(--link-hover))] bg-bottom bg-no-repeat box-decoration-clone px-1.5 py-0.5 font-bold text-title transition-[background-size,color] duration-300 ease-out [background-size:100%_0%] hover:text-primary hover:[background-size:100%_100%] focus-visible:[background-size:100%_100%] motion-reduce:transition-none"
              >
                <UiIcon :icon="doc.icon" class="mr-1.5 inline-block size-4 align-[-0.2em] text-meta transition-colors group-hover/doc:text-primary" />{{ t(`auth.register.terms.${doc.key}`) }}</NuxtLink>
            </template>
          </i18n-t>
        </UiSplashCheckbox>
      </li>
    </ul>
    <div class="flex gap-2.5">
      <UiButton icon="lucide:arrow-left" class="rounded-md" @click="emit('prev')">{{ t('auth.register.prev') }}</UiButton>
      <UiButton variant="primary" icon-right="lucide:arrow-right" class="flex-1 rounded-md" :disabled="!accepted" @click="emit('next')">{{ t('auth.register.next') }}</UiButton>
    </div>
  </div>
</template>
