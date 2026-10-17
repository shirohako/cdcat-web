<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 md:px-8 py-8 max-w-6xl 2xl:max-w-7xl">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex items-center justify-center min-h-96">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- 主要内容 -->
      <template v-else>
        <!-- 页面标题 -->
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-2">Edit Album</h1>
          <p class="text-gray-600">Propose changes to album information</p>
        </div>

        <!-- 错误提示 -->
        <div v-if="loadError" class="alert alert-error mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ loadError }}</span>
        </div>

        <!-- 表单组件 -->
        <RevisionAlbumForm
          v-if="!loadError"
          :initial-data="albumData"
          :album-id="albumId"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
// 应用认证中间件，保护此页面
definePageMeta({
  middleware: 'auth'
})

const route = useRoute();
const { $api } = useNuxtApp();

// 获取专辑 ID
const albumId = route.params.id;
const isLoading = ref(true);
const loadError = ref('');

// 专辑数据
const albumData = ref(null);

// 加载专辑数据
onMounted(async () => {
  try {
    const album = await $api(`/v1/albums/${albumId}/schema`);

    if (album) {
      // 传递完整的 album 对象给 AlbumForm 组件
      albumData.value = album;
    }
  } catch (error) {
    console.error('Failed to load album data:', error);
    loadError.value = 'Failed to load album data';
  } finally {
    isLoading.value = false;
  }
});

// 设置页面元数据
useHead({
  title: 'Edit Album',
});
</script>
