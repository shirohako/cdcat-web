<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
    <!-- Tabs 导航 -->
    <div class="border-b border-gray-200 mb-6 -mx-6 md:-mx-8 px-6 md:px-8">
      <div class="flex flex-wrap gap-2 md:gap-4">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="px-4 py-3 font-medium text-sm transition-colors relative"
          :class="
            currentTab === tab.id
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-300'
          "
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Tab 1: Basic Information -->
      <WorkFormBasicTab
        v-show="currentTab === 'basic'"
        :form-data="formData"
        :errors="errors"
        @update:form-data="formData = $event"
      />

      <!-- Tab 2: Artists -->
      <WorkFormArtistsTab
        v-show="currentTab === 'artists'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 3: Discs & Tracks -->
      <WorkFormTracksTab
        v-show="currentTab === 'tracks'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 4: Credits -->
      <WorkFormCreditsTab
        v-show="currentTab === 'credits'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 5: Links -->
      <WorkFormLinksTab
        v-show="currentTab === 'links'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 6: Preview JSON -->
      <WorkFormPreviewTab
        v-show="currentTab === 'preview'"
        :submit-data="getSubmitData()"
      />

      <!-- 错误提示 -->
      <div v-if="submitError" class="alert alert-error mt-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ submitError }}</span>
      </div>

      <!-- 成功提示 -->
      <div v-if="submitSuccess" class="alert alert-success mt-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ isEditMode ? 'Work updated successfully!' : 'Work created successfully!' }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="mt-8 flex gap-3">
        <button
          type="submit"
          class="btn btn-primary flex-1"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          <span v-else>{{ isEditMode ? 'Update Work' : 'Create Work' }}</span>
        </button>
        <button
          type="button"
          class="btn btn-outline"
          @click="currentTab = 'preview'"
        >
          Preview JSON
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      title: '',
      type: '',
      catalog_number: '',
      release_date: '',
      image_url: '',
      banner_url: '',
      description: '',
      structure: [],
      artists: [],
      credits: [],
      links: [],
    }),
  },
  workId: {
    type: [String, Number],
    default: null,
  },
});

const router = useRouter();

// Tabs
const tabs = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'artists', label: 'Artists' },
  { id: 'tracks', label: 'Discs & Tracks' },
  { id: 'credits', label: 'Credits' },
  { id: 'links', label: 'Links' },
  { id: 'preview', label: 'Preview' },
];

const currentTab = ref('basic');

// 判断是否为编辑模式
const isEditMode = computed(() => !!props.workId);

// 转换后端数据到表单格式
const transformBackendData = (data) => {
  const transformed = {
    work_id: data.id,
    title: data.title || '',
    type: data.type || '',
    catalog_number: data.catalog_number || '',
    release_date: data.release_date || '',
    image_url: data.image_url || '',
    banner_url: data.banner_url || '',
    description: data.description || '',
    structure: [],
    artists: [],
    credits: [],
    links: [],
  };

  // 处理 structure - 合并 disc 结构和 songs
  if (data.structure && Array.isArray(data.structure)) {
    transformed.structure = data.structure.map((disc, index) => {
      const discSongs = data.songs
        ? data.songs
            .filter(song => song.disc_number === disc.disc_number)
            .sort((a, b) => a.track_number - b.track_number)
            .map((song, songIndex) => ({
              id: `track-${song.id || songIndex}`,
              song_id: song.id,
              track_number: song.track_number,
              title: song.title || '',
              duration: song.duration || '',
            }))
        : [];

      return {
        id: `disc-${disc.disc_number || index}`,
        structure_id: disc.id,
        disc_number: disc.disc_number,
        disc_title: disc.title || '',
        songs: discSongs,
      };
    });
  }

  // 处理 artists - 提取 artist_id
  if (data.artists && Array.isArray(data.artists)) {
    transformed.artists = data.artists.map((artist, index) => ({
      id: `artist-${artist.id || index}`,
      artist_id: String(artist.id || artist.artist_id || ''),
    }));
  }

  // 处理 credits
  if (data.credits && Array.isArray(data.credits)) {
    transformed.credits = data.credits.map((credit, index) => ({
      id: `credit-${credit.id || index}`,
      credit_id: credit.id,
      name: credit.name || '',
      role: credit.role || '',
      track: credit.track || '',
    }));
  }

  // 处理 links
  if (data.links && Array.isArray(data.links)) {
    transformed.links = data.links;
  }

  return transformed;
};

// 初始化表单数据
const initFormData = () => {
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    return transformBackendData(props.initialData);
  }
  return {
    work_id: null,
    title: '',
    type: '',
    catalog_number: '',
    release_date: '',
    image_url: '',
    banner_url: '',
    description: '',
    structure: [],
    artists: [],
    credits: [],
    links: [],
  };
};

// 表单数据
const formData = ref(initFormData());

// 监听 initialData 变化
watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    formData.value = transformBackendData(newData);
  } else {
    formData.value = {
      work_id: null,
      title: '',
      type: '',
      catalog_number: '',
      release_date: '',
      image_url: '',
      banner_url: '',
      description: '',
      structure: [],
      artists: [],
      credits: [],
      links: [],
    };
  }
}, { deep: true });

// 表单验证错误
const errors = ref({
  title: '',
  type: '',
});

// 提交状态
const isSubmitting = ref(false);
const submitError = ref('');
const submitSuccess = ref(false);

// 验证表单
const validateForm = () => {
  let isValid = true;
  errors.value = {
    title: '',
    type: '',
  };

  if (!formData.value.title || formData.value.title.trim() === '') {
    errors.value.title = 'Work title is required';
    isValid = false;
  }

  if (!formData.value.type) {
    errors.value.type = 'Work type is required';
    isValid = false;
  }

  return isValid;
};

// 准备提交数据
const getSubmitData = () => {
  const payload = {
    title: formData.value.title.trim(),
    type: formData.value.type,
  };

  // 如果是编辑模式，添加 work ID
  if (formData.value.work_id) {
    payload.id = formData.value.work_id;
  }

  // 添加可选字段
  if (formData.value.catalog_number) {
    payload.catalog_number = formData.value.catalog_number.trim();
  }
  if (formData.value.release_date) {
    payload.release_date = formData.value.release_date;
  }
  if (formData.value.image_url) {
    payload.image_url = formData.value.image_url.trim();
  }
  if (formData.value.banner_url) {
    payload.banner_url = formData.value.banner_url.trim();
  }
  if (formData.value.description) {
    payload.description = formData.value.description.trim();
  }

  // 计算碟片和曲目数量
  payload.disc_count = formData.value.structure.length;
  payload.track_count = formData.value.structure.reduce((total, disc) => total + disc.songs.length, 0);

  // 添加结构化数据 - 分开 structure 和 songs
  if (formData.value.structure.length > 0) {
    payload.structure = formData.value.structure.map((disc, discIndex) => {
      const structureItem = {
        disc_number: discIndex + 1,
        disc_title: disc.disc_title || null,
      };
      if (disc.structure_id) {
        structureItem.id = disc.structure_id;
      }
      return structureItem;
    });

    payload.songs = formData.value.structure.flatMap((disc, discIndex) =>
      disc.songs.map((song, songIndex) => {
        const songItem = {
          disc_number: discIndex + 1,
          track_number: songIndex + 1,
          title: song.title,
          duration: song.duration || null,
        };
        if (song.song_id) {
          songItem.id = song.song_id;
        }
        return songItem;
      })
    );
  }

  // 添加艺术家关联
  if (formData.value.artists.length > 0) {
    payload.artists = formData.value.artists
      .filter(a => a.artist_id)
      .map(a => ({
        artist_id: a.artist_id,
      }));
  }

  // 添加 Credits
  if (formData.value.credits.length > 0) {
    payload.credits = formData.value.credits
      .filter(c => c.name && c.role)
      .map(c => {
        const creditItem = {
          name: c.name,
          role: c.role,
          track: c.track || null,
        };
        if (c.credit_id) {
          creditItem.id = c.credit_id;
        }
        return creditItem;
      });
  }

  // 添加链接
  if (formData.value.links.length > 0) {
    payload.links = formData.value.links
      .filter(l => l.url)
      .map(l => ({
        platform: l.platform,
        url: l.url,
      }));
  }

  return payload;
};

// 提交表单
const handleSubmit = async () => {
  submitError.value = '';
  submitSuccess.value = false;

  if (!validateForm()) {
    currentTab.value = 'basic';
    return;
  }

  isSubmitting.value = true;

  try {
    // 准备提交数据 - 使用 FormData
    const payload = getSubmitData();
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('payload', JSON.stringify(payload));

    const { $api } = useNuxtApp();
    let response;

    if (isEditMode.value) {
      response = await $api(`/v1/works/${props.workId}`, {
        method: 'PUT',
        body: formDataToSubmit,
      });
    } else {
      response = await $api('/v1/works', {
        method: 'POST',
        body: formDataToSubmit,
      });
    }

    submitSuccess.value = true;

    setTimeout(() => {
      const targetId = isEditMode.value ? props.workId : response.id;
      if (targetId) {
        router.push(`/works/${targetId}`);
      } else {
        router.push('/works');
      }
    }, 1500);

  } catch (error) {
    console.error(`Failed to ${isEditMode.value ? 'update' : 'create'} work:`, error);
    submitError.value = error.data?.message || error.message || `Failed to ${isEditMode.value ? 'update' : 'create'} work. Please try again.`;
  } finally {
    isSubmitting.value = false;
  }
};
</script>
