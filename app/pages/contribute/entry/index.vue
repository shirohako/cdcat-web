<script setup lang="ts">
import { ArrowRight, Download, Film, PenLine } from '@lucide/vue'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()
useHead({ title: computed(() => t('catalog.contribute.entry_title')) })

const router = useRouter()
const { $api } = useNuxtApp()
// Hands the Bangumi preview to the create page without stuffing it into the URL.
const importedEntry = useState<Record<string, unknown> | null>('entry-import', () => null)

const showBangumiModal = ref(false)
const bangumiId = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const existingEntryId = ref<number | null>(null)

const canImport = computed(() => !isLoading.value && bangumiId.value.trim().length > 0)

const openBangumiModal = () => {
  bangumiId.value = ''
  errorMessage.value = ''
  existingEntryId.value = null
  showBangumiModal.value = true
}

const importFromBangumi = async () => {
  const id = bangumiId.value.trim().match(/\d+/)?.[0]
  if (!id) {
    errorMessage.value = t('catalog.contribute.bangumi_required')
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  existingEntryId.value = null
  try {
    const response = await $api<{ entry: Record<string, unknown>, existing_entry_id: number | null }>('/v1/entries/preview/bangumi', {
      query: { subject_id: id },
    })
    if (response.existing_entry_id) {
      existingEntryId.value = response.existing_entry_id
      return
    }
    importedEntry.value = response.entry
    await router.push({ path: '/contribute/entry/create', query: { from: 'bangumi' } })
  } catch {
    errorMessage.value = t('catalog.contribute.bangumi_failed')
  } finally {
    isLoading.value = false
  }
}

const createFromScratch = () => {
  importedEntry.value = null
  router.push('/contribute/entry/create')
}
</script>

<template>
  <div class="min-h-screen">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl 2xl:max-w-7xl">
      <div class="mb-12 text-center">
        <div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Film class="h-8 w-8 text-primary" />
        </div>
        <h1 class="mb-3 text-3xl font-bold text-title">{{ $t('catalog.contribute.entry_title') }}</h1>
        <p class="mx-auto max-w-md text-body">{{ $t('catalog.contribute.entry_desc') }}</p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <button
          type="button"
          class="card group cursor-pointer p-8 text-left transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
          @click="openBangumiModal"
        >
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-pink-100 transition-colors group-hover:bg-pink-200 dark:bg-pink-400/20 dark:group-hover:bg-pink-400/30">
              <Download class="h-7 w-7 text-pink-600 dark:text-pink-400" />
            </div>
            <div class="flex-1">
              <h2 class="mb-2 flex items-center gap-2 text-xl font-semibold text-title">
                {{ $t('catalog.contribute.import_title') }}
                <ArrowRight class="h-5 w-5 text-meta transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </h2>
              <p class="text-sm leading-relaxed text-body">{{ $t('catalog.contribute.import_desc') }}</p>
              <span class="mt-4 inline-block rounded-full bg-btn px-2 py-1 text-xs text-btn-content">{{ $t('catalog.contribute.import_badge') }}</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          class="card group cursor-pointer p-8 text-left transition-colors duration-150 ease-out hover:bg-card-hover active:bg-card-active"
          @click="createFromScratch"
        >
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/15 transition-colors group-hover:bg-primary/25">
              <PenLine class="h-7 w-7 text-primary" />
            </div>
            <div class="flex-1">
              <h2 class="mb-2 flex items-center gap-2 text-xl font-semibold text-title">
                {{ $t('catalog.contribute.scratch_title') }}
                <ArrowRight class="h-5 w-5 text-meta transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </h2>
              <p class="text-sm leading-relaxed text-body">{{ $t('catalog.contribute.scratch_desc') }}</p>
            </div>
          </div>
        </button>
      </div>

      <p class="mt-8 text-center text-sm text-meta">{{ $t('catalog.contribute.review_notice') }}</p>
    </div>

    <dialog :class="['modal', { 'modal-open': showBangumiModal }]">
      <div class="modal-box">
        <h3 class="mb-4 text-lg font-bold">{{ $t('catalog.contribute.import_title') }}</h3>

        <div class="space-y-4">
          <label class="form-control">
            <span class="label-text mb-1">{{ $t('catalog.contribute.bangumi_id') }}</span>
            <input
              v-model="bangumiId"
              type="text"
              :placeholder="$t('catalog.contribute.bangumi_placeholder')"
              class="input w-full"
              :disabled="isLoading"
              @keyup.enter="importFromBangumi"
            >
            <span class="mt-1 text-xs text-meta">{{ $t('catalog.contribute.bangumi_hint') }}</span>
          </label>

          <div v-if="existingEntryId" class="alert alert-warning">
            <span>{{ $t('catalog.contribute.already_imported') }}</span>
            <UiButton :to="`/entries/${existingEntryId}`" size="sm">{{ $t('catalog.contribute.view_existing') }}</UiButton>
          </div>
          <div v-if="errorMessage" class="alert alert-error">
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <div class="modal-action">
          <UiButton :disabled="isLoading" @click="showBangumiModal = false">
            {{ $t('common.cancel') }}
          </UiButton>
          <UiButton variant="primary" :loading="isLoading" :disabled="!canImport" @click="importFromBangumi">
            {{ isLoading ? $t('catalog.contribute.importing') : $t('catalog.contribute.import') }}
          </UiButton>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="showBangumiModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
