<script setup lang="ts">
import type { DeletionImpact } from '~/types/revision'
defineProps<{ impact: DeletionImpact }>()
</script>

<template>
  <section class="my-4 rounded-lg border border-slate-200 p-4">
    <h3 class="text-sm font-semibold">删除影响</h3>
    <dl class="mt-2 space-y-1 text-sm">
      <div v-for="item in impact.counts" :key="item.label" class="flex justify-between gap-4"><dt>{{ item.label }}</dt><dd>{{ item.count }}</dd></div>
    </dl>
    <div v-if="impact.blockers.length" role="alert" class="mt-3 text-sm text-red-700">
      <p>存在受保护的引用，不能删除。</p>
      <ul class="mt-1 list-inside list-disc"><li v-for="blocker in impact.blockers" :key="blocker">{{ blocker }}</li></ul>
    </div>
  </section>
</template>
