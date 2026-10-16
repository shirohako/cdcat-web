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
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 md:px-8 py-10 max-w-6xl 2xl:max-w-7xl">
      <div class="mb-12 text-center">
        <div class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Film class="h-8 w-8 text-primary" />
        </div>
        <h1 class="mb-3 text-3xl font-bold text-gray-900">{{ $t('catalog.contribute.entry_title') }}</h1>
        <p class="mx-auto max-w-md text-gray-600">{{ $t('catalog.contribute.entry_desc') }}</p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <button
          type="button"
          class="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
          @click="openBangumiModal"
        >
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-pink-100 transition-colors group-hover:bg-pink-200">
              <Download class="h-7 w-7 text-pink-600" />
            </div>
            <div class="flex-1">
              <h2 class="mb-2 flex items-center gap-2 text-xl font-semibold text-gray-900">
                {{ $t('catalog.contribute.import_title') }}
                <ArrowRight class="h-5 w-5 text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </h2>
              <p class="text-sm leading-relaxed text-gray-600">{{ $t('catalog.contribute.import_desc') }}</p>
              <span class="mt-4 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">{{ $t('catalog.contribute.import_badge') }}</span>
            </div>
          </div>
        </button>

        <button
          type="button"
          class="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
          @click="createFromScratch"
        >
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-100 transition-colors group-hover:bg-blue-200">
              <PenLine class="h-7 w-7 text-blue-600" />
            </div>
            <div class="flex-1">
              <h2 class="mb-2 flex items-center gap-2 text-xl font-semibold text-gray-900">
                {{ $t('catalog.contribute.scratch_title') }}
                <ArrowRight class="h-5 w-5 text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </h2>
              <p class="text-sm leading-relaxed text-gray-600">{{ $t('catalog.contribute.scratch_desc') }}</p>
            </div>
          </div>
        </button>
      </div>

      <p class="mt-8 text-center text-sm text-gray-500">{{ $t('catalog.contribute.review_notice') }}</p>
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
              class="input input-bordered w-full"
              :disabled="isLoading"
              @keyup.enter="importFromBangumi"
            >
            <span class="mt-1 text-xs text-gray-500">{{ $t('catalog.contribute.bangumi_hint') }}</span>
          </label>

          <div v-if="existingEntryId" class="alert alert-warning">
            <span>{{ $t('catalog.contribute.already_imported') }}</span>
            <NuxtLink :to="`/entries/${existingEntryId}`" class="btn btn-sm">{{ $t('catalog.contribute.view_existing') }}</NuxtLink>
          </div>
          <div v-if="errorMessage" class="alert alert-error">
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" :disabled="isLoading" @click="showBangumiModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" :disabled="!canImport" @click="importFromBangumi">
            <span v-if="isLoading" class="loading loading-spinner loading-sm" />
            {{ isLoading ? $t('catalog.contribute.importing') : $t('catalog.contribute.import') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="showBangumiModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
