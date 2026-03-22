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

      <button type="button" title="链接" class="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors shrink-0" @click="insertLink">🔗</button>
      <button type="button" title="图片" class="px-2 py-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors shrink-0" @click="insertImage">🖼</button>
    </div>

    <!-- 编辑区 -->
    <textarea
      ref="editorRef"
      :value="modelValue"
      spellcheck="false"
      placeholder="开始写作…"
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

const editorRef = ref(null)

const toolbar = [
  { label: '标题 H2',  icon: 'H2',  syntax: { prefix: '## ',  block: true } },
  { label: '标题 H3',  icon: 'H3',  syntax: { prefix: '### ', block: true } },
  { label: '加粗',     icon: '𝐁',   syntax: { wrap: '**' } },
  { label: '斜体',     icon: '𝐼',   syntax: { wrap: '_' } },
  { label: '删除线',   icon: 'S̶',   syntax: { wrap: '~~' } },
  { label: '行内代码', icon: '`',   syntax: { wrap: '`' } },
  { label: '代码块',   icon: '{ }', syntax: { prefix: '```\n', suffix: '\n```', block: true } },
  { label: '引用',     icon: '❝',   syntax: { prefix: '> ', block: true } },
  { label: '无序列表', icon: '•',   syntax: { prefix: '- ', block: true } },
  { label: '有序列表', icon: '1.',  syntax: { prefix: '1. ', block: true } },
  { label: '分割线',   icon: '—',   syntax: { replace: '\n---\n' } },
]

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
    replacement = `${syntax.wrap}${selected || '文字'}${syntax.wrap}`
  } else if (syntax.prefix) {
    replacement = syntax.prefix + (selected || (syntax.suffix ? '内容' : ''))
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
  const selected = props.modelValue.slice(start, end) || '链接文字'
  const replacement = `[${selected}](https://)`
  emit('update:modelValue', props.modelValue.slice(0, start) + replacement + props.modelValue.slice(end))
  nextTick(() => el.focus())
}

function insertImage() {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const replacement = `![图片描述](https://)`
  emit('update:modelValue', props.modelValue.slice(0, start) + replacement + props.modelValue.slice(start))
  nextTick(() => el.focus())
}
</script>
