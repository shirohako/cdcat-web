<template>
  <section class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
        <FileText :size="16" class="text-sky-500" />
      </div>
      <h2 class="text-base font-bold text-gray-900">Description</h2>
    </div>

    <!-- Content -->
    <div
      class="px-6 py-5 prose prose-sm max-w-none text-gray-700"
      v-html="renderedMarkdown"
    />
  </section>
</template>

<script setup>
import { FileText } from "lucide-vue-next";
import MarkdownIt from "markdown-it";

const props = defineProps({
  description: {
    type: String,
    default: "",
  },
});

const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
});

const DOMPurify = import.meta.client ? (await import('dompurify')).default : null;

const renderedMarkdown = computed(() => {
  const text = props.description;
  if (!text) return "";

  const rendered = md.render(text);

  if (DOMPurify) {
    return DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  }

  return rendered;
});
</script>
