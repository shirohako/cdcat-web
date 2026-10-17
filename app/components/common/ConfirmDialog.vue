<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @mousedown.self="onCancel"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        <!-- Dialog -->
        <Transition
          enter-active-class="transition-all duration-150"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-100"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            class="relative z-10 w-full bg-white rounded-2xl shadow-xl p-6"
            :class="wide ? 'max-w-lg' : 'max-w-sm'"
          >
            <!-- Icon -->
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              :class="variant === 'warning' ? 'bg-warning/10' : 'bg-error/10'"
            >
              <AlertTriangle v-if="variant === 'warning'" :size="18" class="text-warning" />
              <Trash2 v-else :size="18" class="text-error" />
            </div>

            <!-- Title -->
            <h3 class="text-base font-semibold text-gray-900 mb-1">{{ title }}</h3>

            <!-- Description -->
            <p class="text-sm text-gray-500">{{ description }}</p>
            <slot />

            <!-- Second confirmation: type the phrase (e.g. #12) before a deletion can go ahead -->
            <label v-if="confirmPhrase" class="mt-4 block text-sm text-gray-700">
              {{ $t('common.type_to_confirm', { phrase: confirmPhrase }) }}
              <input v-model="typed" type="text" class="input input-sm mt-1.5 w-full font-mono" autocomplete="off" :placeholder="confirmPhrase">
            </label>

            <!-- Actions -->
            <div class="flex gap-2 mt-5 justify-end">
              <template v-if="variant === 'warning'">
                <button
                  type="button"
                  class="btn btn-sm btn-warning"
                  @click="onConfirm"
                >
                  {{ $t('common.got_it') }}
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="btn btn-sm btn-ghost text-gray-500"
                  @click="onCancel"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-error"
                  :disabled="!phraseMatches"
                  @click="onConfirm"
                >
                  {{ confirmText ?? $t('common.confirm_delete') }}
                </button>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Trash2, AlertTriangle } from '@lucide/vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  description?: string
  variant?: 'delete' | 'warning'
  confirmText?: string
  /** The text to type before confirming, for deletions that are hard to undo. */
  confirmPhrase?: string
  wide?: boolean
}>()

const typed = ref('')
watch(() => props.modelValue, () => { typed.value = '' })
const phraseMatches = computed(() => !props.confirmPhrase || typed.value.trim() === props.confirmPhrase)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const onConfirm = () => {
  if (!phraseMatches.value) return
  emit('confirm')
  emit('update:modelValue', false)
}

const onCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>
