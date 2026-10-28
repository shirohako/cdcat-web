<script setup lang="ts">
/**
 * The Markdown text of a section on a page of numbered sections (the legal documents, the guides), as RichContent
 * renders it at the article size, with framed tables that stack row by row once the text is too narrow for them.
 */
defineProps<{ content: string }>()
</script>

<template>
  <div class="prose-host">
    <RichContent :content="content" format="markdown" size="base" />
  </div>
</template>

<style scoped>
/*
 * Tables in the text: framed, full width, a tinted header row, the first column naming each row. Once the text is
 * too narrow for the columns, each row stacks into a block of its own, the values named by the cells' data-label
 * (set by the Markdown renderer).
 */
.prose-host {
  container: doc-prose / inline-size;
}

.prose-host :deep(table) {
  display: table;
  width: 100%;
  border: 1px solid var(--line);
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.65;
}

.prose-host :deep(:is(th, td)) {
  padding: 0.7rem 0.9rem;
}

.prose-host :deep(th) {
  border-bottom: 1px solid var(--line);
  padding-block: 0.5rem;
  background: var(--sunken);
  color: var(--meta);
  font-size: 12px;
  font-weight: 600;
}

/* The header's tint stays inside the frame's rounded corners. */
.prose-host :deep(th:first-child) {
  border-top-left-radius: 5px;
}

.prose-host :deep(th:last-child) {
  border-top-right-radius: 5px;
}

.prose-host :deep(td) {
  border-bottom: 1px solid var(--line);
  color: var(--body);
}

.prose-host :deep(tr:last-child td) {
  border-bottom: 0;
}

.prose-host :deep(td:first-child) {
  min-width: 6em;
  color: var(--title);
  font-weight: 600;
}

@container doc-prose (max-width: 34rem) {
  .prose-host :deep(:is(table, tbody, tr, td)) {
    display: block;
  }

  .prose-host :deep(thead) {
    display: none;
  }

  .prose-host :deep(tr) {
    padding: 0.75rem 0.9rem;
    border-bottom: 1px solid var(--line);
  }

  .prose-host :deep(tr:last-child) {
    border-bottom: 0;
  }

  .prose-host :deep(td) {
    padding: 0;
    border: 0;
  }

  .prose-host :deep(td + td) {
    margin-top: 0.5rem;
  }

  .prose-host :deep(td:not(:first-child)[data-label]::before) {
    content: attr(data-label);
    display: block;
    color: var(--meta);
    font-size: 12px;
    font-weight: 600;
  }
}
</style>
