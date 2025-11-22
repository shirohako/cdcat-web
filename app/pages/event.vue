<script setup lang="ts">
interface Event {
  id: number
  name: string
  [key: string]: any
}

const { data: events, pending, error, refresh } = await useAPI<Event[]>('/v1/events')
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ $t('menu.event') }}</h1>

    <!-- 加载状态 -->
    <div v-if="pending" class="bg-white rounded-lg shadow p-6">
      <p class="text-gray-600">加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="bg-red-50 rounded-lg shadow p-6">
      <p class="text-red-600">错误: {{ error.message }}</p>
      <button
        @click="refresh()"
        class="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        重试
      </button>
    </div>

    <!-- 数据为空 -->
    <div v-else-if="!events || events.length === 0" class="bg-white rounded-lg shadow p-6">
      <p class="text-gray-600">暂无活动数据</p>
    </div>

    <!-- 显示数据 -->
    <div v-else>
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <p class="text-gray-600">共 {{ events.length }} 个活动</p>
        <button
          @click="refresh()"
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          刷新数据
        </button>
      </div>

      <div class="flex flex-wrap gap-4">
        <div
          v-for="event in events"
          :key="event.id"
          class="border rounded-lg p-4 min-w-[200px] bg-white shadow hover:shadow-md transition"
        >
          <h3 class="font-semibold text-lg">{{ event.name }}</h3>
          <pre class="mt-2 text-xs text-gray-600">{{ JSON.stringify(event, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
