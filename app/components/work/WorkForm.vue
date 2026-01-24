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

      <!-- Tab 6: JSON Editor -->
      <WorkFormJsonTab
        v-show="currentTab === 'json'"
        :json-text="jsonDraft"
        :error="jsonError"
        :success="jsonSuccess"
        @update:json-text="jsonDraft = $event"
        @apply="applyJsonDraft"
      />

      <!-- Tab 7: Preview JSON -->
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
  { id: 'json', label: 'JSON Editor' },
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
      const discSongs = (data.related_songs || data.songs)
        ? (data.related_songs || data.songs)
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
        title: disc.title || null,
        catalog_number: disc.catalog_number || null,
        length: disc.length || null,
        is_bonus: disc.is_bonus ?? false,
        is_counted: disc.is_counted ?? true,
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
const jsonDraft = ref('');
const jsonError = ref('');
const jsonSuccess = ref('');
const isApplyingJson = ref(false);

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
        title: disc.title || null,
        catalog_number: disc.catalog_number || null,
        length: disc.length || null,
        is_bonus: disc.is_bonus ?? false,
        is_counted: disc.is_counted ?? true,
      };
      if (disc.structure_id) {
        structureItem.id = disc.structure_id;
      }
      return structureItem;
    });

    const relatedSongs = formData.value.structure.flatMap((disc, discIndex) =>
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
    payload.related_songs = relatedSongs;
  }

  // 添加艺术家关联
  if (formData.value.artists.length > 0) {
    payload.related_artists = formData.value.artists
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

const syncJsonDraft = (clearSuccess = true) => {
  jsonDraft.value = JSON.stringify(getSubmitData(), null, 2);
  jsonError.value = '';
  if (clearSuccess) {
    jsonSuccess.value = '';
  }
};

watch(formData, () => {
  syncJsonDraft(!isApplyingJson.value);
}, { deep: true, immediate: true });

const validateJsonPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'JSON must be an object.';
  }
  if (!payload.title || typeof payload.title !== 'string') {
    return 'Field "title" is required.';
  }
  if (!payload.type || typeof payload.type !== 'string') {
    return 'Field "type" is required.';
  }
  if (payload.structure && !Array.isArray(payload.structure)) {
    return 'Field "structure" must be an array.';
  }
  if (payload.songs && !Array.isArray(payload.songs)) {
    return 'Field "songs" must be an array.';
  }
  if (payload.related_songs && !Array.isArray(payload.related_songs)) {
    return 'Field "related_songs" must be an array.';
  }
  if (payload.artists && !Array.isArray(payload.artists)) {
    return 'Field "artists" must be an array.';
  }
  if (payload.related_artists && !Array.isArray(payload.related_artists)) {
    return 'Field "related_artists" must be an array.';
  }
  if (payload.credits && !Array.isArray(payload.credits)) {
    return 'Field "credits" must be an array.';
  }
  if (payload.links && !Array.isArray(payload.links)) {
    return 'Field "links" must be an array.';
  }
  return '';
};

const transformPayloadToFormData = (payload) => {
  const structure = Array.isArray(payload.structure) ? payload.structure : [];
  const songsSource = payload.related_songs ?? payload.songs;
  const songs = Array.isArray(songsSource) ? songsSource : [];
  const discNumberSet = new Set();
  const normalizeNumber = (value, fallback) => {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : fallback;
  };

  structure.forEach((disc, index) => {
    const discNumber = normalizeNumber(disc.disc_number ?? disc.discNumber, index + 1);
    discNumberSet.add(discNumber);
  });

  songs.forEach((song) => {
    const discNumber = normalizeNumber(song.disc_number, 1);
    discNumberSet.add(discNumber);
  });

  const discNumbers = Array.from(discNumberSet).sort((a, b) => a - b);
  const structureMap = new Map();
  structure.forEach((disc, index) => {
    const discNumber = normalizeNumber(disc.disc_number ?? disc.discNumber, index + 1);
    structureMap.set(discNumber, disc);
  });

  const mappedStructure = discNumbers.map((discNumber, discIndex) => {
    const disc = structureMap.get(discNumber) || {};
    const discSongs = songs
      .filter((song) => normalizeNumber(song.disc_number, 1) === discNumber)
      .sort((a, b) => normalizeNumber(a.track_number, 0) - normalizeNumber(b.track_number, 0))
      .map((song, songIndex) => ({
        id: `track-${song.id ?? `${discNumber}-${songIndex}`}`,
        song_id: song.id,
        track_number: normalizeNumber(song.track_number, songIndex + 1),
        title: song.title ? String(song.title) : '',
        duration: song.duration ? String(song.duration) : '',
      }));

    return {
      id: `disc-${disc.disc_number ?? discNumber ?? discIndex + 1}`,
      structure_id: disc.id,
      disc_number: discNumber || discIndex + 1,
      title: disc.title || null,
      catalog_number: disc.catalog_number || null,
      length: disc.length || null,
      is_bonus: disc.is_bonus ?? false,
      is_counted: disc.is_counted ?? true,
      songs: discSongs,
    };
  });

  return {
    work_id: payload.id ?? null,
    title: payload.title ? String(payload.title) : '',
    type: payload.type ? String(payload.type) : '',
    catalog_number: payload.catalog_number ? String(payload.catalog_number) : '',
    release_date: payload.release_date ? String(payload.release_date) : '',
    image_url: payload.image_url ? String(payload.image_url) : '',
    banner_url: payload.banner_url ? String(payload.banner_url) : '',
    description: payload.description ? String(payload.description) : '',
    structure: mappedStructure,
    artists: Array.isArray(payload.related_artists ?? payload.artists)
      ? (payload.related_artists ?? payload.artists).map((artist, index) => ({
          id: `artist-${artist.artist_id || artist.id || index}`,
          artist_id: String(artist.artist_id || artist.id || ''),
        }))
      : [],
    credits: Array.isArray(payload.credits)
      ? payload.credits.map((credit, index) => ({
        id: `credit-${credit.id || index}`,
        credit_id: credit.id,
        name: credit.name || '',
        role: credit.role || '',
        track: credit.track || '',
      }))
      : [],
    links: Array.isArray(payload.links)
      ? payload.links.map((link) => ({
        platform: link.platform || '',
        url: link.url || '',
      }))
      : [],
  };
};

const applyJsonDraft = () => {
  jsonError.value = '';
  jsonSuccess.value = '';

  let payload;
  try {
    payload = JSON.parse(jsonDraft.value || '{}');
  } catch (error) {
    jsonError.value = `Invalid JSON: ${error.message}`;
    return;
  }

  if (payload && typeof payload === 'object' && payload.payload) {
    try {
      payload = typeof payload.payload === 'string'
        ? JSON.parse(payload.payload)
        : payload.payload;
    } catch (error) {
      jsonError.value = `Invalid payload field: ${error.message}`;
      return;
    }
  }

  const validationError = validateJsonPayload(payload);
  if (validationError) {
    jsonError.value = validationError;
    return;
  }

  isApplyingJson.value = true;
  formData.value = transformPayloadToFormData(payload);
  jsonSuccess.value = 'JSON applied to form data.';
  nextTick(() => {
    isApplyingJson.value = false;
  });
};

// 提交表单
const handleSubmit = async () => {
  submitError.value = '';

  if (!validateForm()) {
    currentTab.value = 'basic';
    return;
  }

  isSubmitting.value = true;

  try {
    const payload = getSubmitData();
    const { $api } = useNuxtApp();

    // 构建 revision 请求数据
    const revisionData = {
      resource_type: 'work',
      action: isEditMode.value ? 'update' : 'create',
      payload: JSON.stringify(payload),
    };

    // 如果是更新，添加 resource_id
    if (isEditMode.value && props.workId) {
      revisionData.resource_id = props.workId;
    }

    await $api('/v1/revisions', {
      method: 'POST',
      body: revisionData,
      headers: { Accept: 'application/json' },
    });

    // 提交成功，跳转到成功页面
    router.push({
      path: '/works/submit-success',
      query: {
        action: isEditMode.value ? 'update' : 'create',
      },
    });

  } catch (error) {
    console.error(`Failed to submit work ${isEditMode.value ? 'update' : 'creation'}:`, error);
    submitError.value = error.data?.message || error.message || `Failed to submit. Please try again.`;
  } finally {
    isSubmitting.value = false;
  }
};
</script>
