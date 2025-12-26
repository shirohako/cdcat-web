<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-4xl">
      <!-- 页面标题 -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">Contribute New Work</h1>
        <p class="text-gray-600">Add a new album, single, or compilation to the database</p>
      </div>

      <!-- 表单组件 -->
      <WorkForm />
    </div>
  </div>
</template>

<script setup>
// 设置页面元数据
useHead({
  title: 'Contribute New Work',
});
</script>
