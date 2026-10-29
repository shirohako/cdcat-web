<script setup lang="ts">
/**
 * A six-character mail code (letters and digits) shown as six boxes. Underneath is one ordinary input laid over the
 * boxes, so typing, pasting, autofill from the mail (one-time-code) and screen readers work as usual; what goes in
 * is upper-cased and trimmed to letters and digits. Emits `complete` once all six are there.
 */
const props = withDefaults(defineProps<{
  id?: string
  length?: number
  invalid?: boolean
  disabled?: boolean
}>(), { id: undefined, length: 6 })

const emit = defineEmits<{ complete: [code: string] }>()
const code = defineModel<string>({ required: true })
const focused = ref(false)
const input = ref<HTMLInputElement>()

function onInput(event: Event) {
  const el = event.target as HTMLInputElement
  const clean = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, props.length)
  el.value = clean
  code.value = clean
  if (clean.length === props.length) emit('complete', clean)
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      ref="input"
      :value="code"
      type="text"
      inputmode="text"
      autocomplete="one-time-code"
      autocapitalize="characters"
      spellcheck="false"
      :maxlength="length"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      class="auth-code-input absolute inset-0 z-10 w-full cursor-text opacity-0 disabled:cursor-not-allowed"
      @input="onInput"
      @focus="focused = true"
      @blur="focused = false"
    >
    <div class="flex gap-2" aria-hidden="true">
      <span
        v-for="i in length"
        :key="i"
        class="grid h-12 flex-1 place-items-center rounded-md border bg-field font-mono text-xl font-bold text-title transition-[border-color,box-shadow]"
        :class="[
          invalid ? 'border-danger' : 'border-field-line',
          focused && i - 1 === Math.min(code.length, length - 1) ? 'border-primary ring-4 ring-primary/10' : '',
          disabled ? 'opacity-60' : '',
        ]"
      >
        <template v-if="code[i - 1]">{{ code[i - 1] }}</template>
        <i v-else-if="focused && i - 1 === code.length" class="auth-code-caret" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.auth-code-input {
  caret-color: transparent;
}

.auth-code-caret {
  width: 2px;
  height: 22px;
  background: var(--primary);
  animation: auth-code-blink 1s steps(1) infinite;
}

@keyframes auth-code-blink {
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .auth-code-caret {
    animation: none;
  }
}
</style>
