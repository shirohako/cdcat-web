<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-gray-900 mb-4">Preview JSON Data</h2>

    <!-- 完整数据预览 -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-semibold mb-2">Complete Payload</h3>
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
          <pre>{{ JSON.stringify(submitData, null, 2) }}</pre>
        </div>
      </div>

      <!-- 分开显示 Structure 和 Songs -->
      <div v-if="submitData.structure && submitData.structure.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 class="text-lg font-semibold mb-2">Structure (Discs)</h3>
          <div class="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-auto max-h-64 font-mono text-sm">
            <pre>{{ JSON.stringify(submitData.structure, null, 2) }}</pre>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-semibold mb-2">Related Songs (Tracks)</h3>
          <div class="bg-gray-900 text-yellow-400 p-4 rounded-lg overflow-auto max-h-64 font-mono text-sm">
            <pre>{{ JSON.stringify(submitData.related_songs, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  submitData: Record<string, unknown>
}>()
</script>
