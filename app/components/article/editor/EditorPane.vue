<template>
  <div class="flex flex-col min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <!-- 工具栏 -->
    <div class="shrink-0 flex items-center gap-0.5 px-3 py-1.5 border-b border-gray-100 overflow-x-auto">
      <button
        v-for="t in toolbar"
        :key="t.label"
        type="button"
        :title="t.label"
        class="px-2 py-1 text-xs font-mono text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors shrink-0"
        @click="insert(t.syntax)"
      >{{ t.icon }}</button>

      <div class="w-px h-4 bg-gray-200 mx-1 shrink-0" />

      <button type="button" :title="t('article_ui.link')" class="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors shrink-0" @click="insertLink">🔗</button>
      <button type="button" :title="t('article_ui.image')" class="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors shrink-0" @click="insertImage">🖼</button>
    </div>

    <!-- 编辑区 -->
    <textarea
      ref="editorRef"
      :value="modelValue"
      spellcheck="false"
      :placeholder="t('article_ui.start_writing')"
      class="flex-1 resize-none px-6 py-5 font-mono text-sm leading-relaxed text-gray-800 outline-none placeholder:text-gray-300"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const editorRef = ref(null)

const toolbar = computed(() => [
  { label: t('article_ui.toolbar.h2'), icon: 'H2', syntax: { prefix: '## ', block: true } },
  { label: t('article_ui.toolbar.h3'), icon: 'H3', syntax: { prefix: '### ', block: true } },
  { label: t('article_ui.toolbar.bold'), icon: '𝐁', syntax: { wrap: '**' } },
  { label: t('article_ui.toolbar.italic'), icon: '𝐼', syntax: { wrap: '_' } },
  { label: t('article_ui.toolbar.strike'), icon: 'S̶', syntax: { wrap: '~~' } },
  { label: t('article_ui.toolbar.inline_code'), icon: '`', syntax: { wrap: '`' } },
  { label: t('article_ui.toolbar.code_block'), icon: '{ }', syntax: { prefix: '```\n', suffix: '\n```', block: true } },
  { label: t('article_ui.toolbar.quote'), icon: '❝', syntax: { prefix: '> ', block: true } },
  { label: t('article_ui.toolbar.unordered_list'), icon: '•', syntax: { prefix: '- ', block: true } },
  { label: t('article_ui.toolbar.ordered_list'), icon: '1.', syntax: { prefix: '1. ', block: true } },
  { label: t('article_ui.toolbar.divider'), icon: '—', syntax: { replace: '\n---\n' } },
])

function insert(syntax) {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = props.modelValue.slice(start, end)
  let replacement = ''

  if (syntax.replace) {
    replacement = syntax.replace
  } else if (syntax.wrap) {
    replacement = `${syntax.wrap}${selected || t('article_ui.sample_text')}${syntax.wrap}`
  } else if (syntax.prefix) {
    replacement = syntax.prefix + (selected || (syntax.suffix ? t('article_ui.sample_content') : ''))
    if (syntax.suffix) replacement += syntax.suffix
  }

  const newValue = props.modelValue.slice(0, start) + replacement + props.modelValue.slice(end)
  emit('update:modelValue', newValue)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + replacement.length, start + replacement.length)
  })
}

function insertLink() {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = props.modelValue.slice(start, end) || t('article_ui.link_text')
  const replacement = `[${selected}](https://)`
  emit('update:modelValue', props.modelValue.slice(0, start) + replacement + props.modelValue.slice(end))
  nextTick(() => el.focus())
}

function insertImage() {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const replacement = `![${t('article_ui.image_alt')}](https://)`
  emit('update:modelValue', props.modelValue.slice(0, start) + replacement + props.modelValue.slice(start))
  nextTick(() => el.focus())
}
</script>
