<template>
  <div class="flex flex-col min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="shrink-0 px-5 py-2 text-xs font-medium text-gray-400 border-b border-gray-100">
      预览
    </div>
    <div class="flex-1 overflow-y-auto px-8 py-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ title || '（无标题）' }}</h1>
      <article
        class="butterfly-post prose max-w-none
               prose-headings:font-bold prose-headings:text-gray-900
               prose-h1:text-2xl prose-h2:text-xl
               prose-p:text-gray-600 prose-p:leading-[1.9]
               prose-a:text-violet-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
               prose-strong:text-gray-800
               prose-blockquote:not-italic prose-blockquote:text-gray-500
               prose-code:text-violet-600 prose-code:bg-violet-50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
               prose-pre:bg-gray-900 prose-pre:rounded-xl
               prose-li:text-gray-600 prose-li:marker:text-violet-400
               prose-hr:border-gray-100 prose-img:rounded-xl prose-img:shadow-md"
        v-html="renderedContent"
      />
    </div>
  </div>
</template>

<script setup>
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import hexoTagPlugin from '~/utils/markdownTagPlugin.js'

const props = defineProps({
  title:   { type: String, default: '' },
  content: { type: String, default: '' },
})

const md = new MarkdownIt({ html: false, breaks: true, linkify: true })
  .use(anchor, {
    slugify: (s) => s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, ''),
  })
  .use(hexoTagPlugin)

const DOMPurify = import.meta.client ? (await import('dompurify')).default : null

const renderedContent = computed(() => {
  if (!props.content) return ''
  const html = md.render(props.content)
  return DOMPurify
    ? DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote',
          'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'div', 'span', 'i'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'id', 'class', 'src', 'alt'],
      })
    : html
})
</script>

<style scoped>
:deep(.butterfly-post h2) {
  padding-left: 0.75rem;
  border-left: 4px solid #7c3aed;
  margin-top: 2rem;
}
:deep(.butterfly-post blockquote) {
  background: #faf5ff;
  border-left: 4px solid #a78bfa;
  border-radius: 0 0.5rem 0.5rem 0;
  padding: 0.75rem 1rem;
}
</style>
