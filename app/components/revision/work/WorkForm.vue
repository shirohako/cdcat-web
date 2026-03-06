<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 px-3 py-4 md:px-4 md:py-5">
    <!-- Tabs 导航 -->
    <div class="mb-5 -mx-3 md:-mx-4 px-3 md:px-4 border-b border-gray-100">
      <div class="flex flex-wrap gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="px-3 py-2 text-sm font-medium rounded-t-md transition-all duration-150 relative -mb-px"
          :class="
            currentTab === tab.id
              ? 'text-primary bg-primary/5 border border-gray-100 border-b-white'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-transparent'
          "
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Tab 1: Basic Information -->
      <RevisionWorkFormBasicTab
        v-show="currentTab === 'basic'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 2: Artists -->
      <RevisionWorkFormArtistsTab
        v-show="currentTab === 'artists'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 3: Discs & Tracks -->
      <RevisionWorkFormTracksTab
        v-show="currentTab === 'tracks'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 4: Credits -->
      <RevisionWorkFormCreditsTab
        v-show="currentTab === 'credits'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 5: Products -->
      <RevisionWorkFormProductsTab
        v-show="currentTab === 'products'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 6: Bonuses -->
      <RevisionWorkFormBonusesTab
        v-show="currentTab === 'bonuses'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 7: Meta -->
      <RevisionWorkFormMetaTab
        v-show="currentTab === 'meta'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 8: Links -->
      <RevisionWorkFormLinksTab
        v-show="currentTab === 'links'"
        :form-data="formData"
        @update:form-data="formData = $event"
      />

      <!-- Tab 6: JSON Editor -->
      <RevisionWorkFormJsonTab
        v-show="currentTab === 'json'"
        :json-text="jsonDraft"
        :error="jsonError"
        :success="jsonSuccess"
        @update:json-text="jsonDraft = $event"
        @apply="applyJsonDraft"
      />

      <!-- Tab 7: Preview JSON -->
      <RevisionWorkFormPreviewTab
        v-show="currentTab === 'preview'"
        :submit-data="getSubmitData()"
      />

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

    <!-- 提交错误弹窗 -->
    <dialog ref="errorDialog" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">提交失败</h3>
        <p class="py-4 text-sm whitespace-pre-line">{{ submitError }}</p>
        <div class="modal-action">
          <button class="btn" @click="errorDialog.close()">关闭</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
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
      products: [],
      bonuses: [],
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
  { id: 'products', label: 'Products' },
  { id: 'bonuses', label: 'Bonuses' },
  { id: 'meta', label: 'Meta' },
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
    products: [],
    bonuses: [],
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
      artist_id: String(credit.artist_id || ''),
      display_name: credit.display_name || '',
      role: credit.role || '',
      track: credit.meta?.track || credit.track || '',
    }));
  }

  // 处理 products
  if (data.products && Array.isArray(data.products)) {
    transformed.products = data.products.map((p, index) => ({
      id: `product-${p.id || index}`,
      product_id: p.id,
      name: p.name || '',
      edition_type: p.edition_type || 'REGULAR',
      limited_rule: p.limited_rule || '',
      limited_name: p.limited_name || '',
      release_date: p.release_date || '',
      catalog_number: p.catalog_number || '',
      barcode: p.barcode || '',
      is_available: p.is_available ?? true,
      medium: p.medium || 'PHYSICAL',
      format: p.format || '',
      is_hires: p.is_hires ?? false,
      price: p.price != null ? String(p.price) : '',
      currency: p.currency || '',
      image_url: p.image_url || '',
      sort_order: p.sort_order != null ? String(p.sort_order) : '0',
    }));
  }

  // 处理 bonuses
  if (data.bonuses && Array.isArray(data.bonuses)) {
    transformed.bonuses = data.bonuses.map((b, index) => ({
      id: `bonus-${b.id || index}`,
      bonus_id: b.id,
      type: b.type || '',
      name: b.name || '',
      description: b.description || '',
      is_digital: b.is_digital ?? false,
      image_url: b.image_url || '',
    }));
  }

  // 处理 links
  if (data.links && Array.isArray(data.links)) {
    transformed.links = data.links.map((l, index) => ({
      id: `link-${l.id || index}`,
      link_id: l.id,
      link_provider_id: l.link_provider_id ?? l.provider?.id ?? '',
      url: l.url || '',
    }));
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
    products: [],
    bonuses: [],
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
      products: [],
      bonuses: [],
      links: [],
    };
  }
}, { deep: true });

// 提交状态
const isSubmitting = ref(false);
const submitError = ref('');
const errorDialog = ref(null);

// 验证表单
const validateForm = () => {
  const missing = [];

  if (!formData.value.title || formData.value.title.trim() === '') {
    missing.push('Basic Info → 标题（Title）');
  }

  if (!formData.value.type) {
    missing.push('Basic Info → 类型（Type）');
  }

  if (!formData.value.release_date) {
    missing.push('Basic Info → 发行日期（Release Date）');
  }

  if (!formData.value.image_url || formData.value.image_url.trim() === '') {
    missing.push('Basic Info → 封面图片（Cover Image URL）');
  }

  formData.value.artists.forEach((artist, i) => {
    if (!artist.artist_id || String(artist.artist_id).trim() === '') {
      missing.push(`Artists → 第 ${i + 1} 个艺术家缺少 Artist ID`);
    }
  });

  formData.value.credits.forEach((credit, i) => {
    if (!credit.role || credit.role.trim() === '') {
      missing.push(`Credits → 第 ${i + 1} 条 Credit 缺少 Role`);
    }
  });

  formData.value.products.forEach((product, i) => {
    if (!product.name || product.name.trim() === '') {
      missing.push(`Products → 第 ${i + 1} 个产品缺少名称（Name）`);
    }
  });

  formData.value.bonuses.forEach((bonus, i) => {
    if (!bonus.type) {
      missing.push(`Bonuses → 第 ${i + 1} 个特典缺少类型（Type）`);
    }
    if (!bonus.name || bonus.name.trim() === '') {
      missing.push(`Bonuses → 第 ${i + 1} 个特典缺少名称（Name）`);
    }
  });

  if (missing.length > 0) {
    submitError.value = `请填写以下必填项：\n${missing.map(s => `• ${s}`).join('\n')}`;
    errorDialog.value?.showModal();
    return false;
  }

  return true;
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
      .filter(c => c.role)
      .map(c => {
        const creditItem = {
          artist_id: c.artist_id || null,
          display_name: c.display_name || null,
          role: c.role,
          meta: c.track ? { track: c.track } : null,
        };
        if (c.credit_id) {
          creditItem.id = c.credit_id;
        }
        return creditItem;
      });
  }

  // 添加 Products
  if (formData.value.products.length > 0) {
    payload.products = formData.value.products.map(p => {
      const item = {
        name: p.name || null,
        edition_type: p.edition_type,
        limited_rule: p.limited_rule || null,
        limited_name: p.limited_name || null,
        release_date: p.release_date || null,
        catalog_number: p.catalog_number || null,
        barcode: p.barcode || null,
        is_available: p.is_available,
        medium: p.medium,
        format: p.format || null,
        is_hires: p.is_hires,
        price: p.price !== '' ? Number(p.price) : null,
        currency: p.currency || null,
        image_url: p.image_url || null,
        sort_order: Number(p.sort_order) || 0,
      };
      if (p.product_id) item.id = p.product_id;
      return item;
    });
  }

  // 添加 Bonuses
  if (formData.value.bonuses.length > 0) {
    payload.bonuses = formData.value.bonuses.map(b => {
      const item = {
        type: b.type,
        name: b.name,
        description: b.description || null,
        is_digital: b.is_digital ?? false,
        image_url: b.image_url || null,
      };
      if (b.bonus_id) item.id = b.bonus_id;
      return item;
    });
  }

  // 添加链接
  if (formData.value.links.length > 0) {
    payload.links = formData.value.links
      .filter(l => l.link_provider_id && l.url)
      .map(l => {
        const item = { link_provider_id: l.link_provider_id, url: l.url };
        if (l.link_id) item.id = l.link_id;
        return item;
      });
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
    products: Array.isArray(payload.products)
      ? payload.products.map((p, index) => ({
          id: `product-${p.id || index}`,
          product_id: p.id,
          name: p.name || '',
          edition_type: p.edition_type || 'REGULAR',
          limited_rule: p.limited_rule || '',
          limited_name: p.limited_name || '',
          release_date: p.release_date || '',
          catalog_number: p.catalog_number || '',
          barcode: p.barcode || '',
          is_available: p.is_available ?? true,
          medium: p.medium || 'PHYSICAL',
          format: p.format || '',
          is_hires: p.is_hires ?? false,
          price: p.price != null ? String(p.price) : '',
          currency: p.currency || '',
          image_url: p.image_url || '',
          sort_order: p.sort_order != null ? String(p.sort_order) : '0',
        }))
      : [],
    bonuses: Array.isArray(payload.bonuses)
      ? payload.bonuses.map((b, index) => ({
          id: `bonus-${b.id || index}`,
          bonus_id: b.id,
          type: b.type || '',
          name: b.name || '',
          description: b.description || '',
          is_digital: b.is_digital ?? false,
          image_url: b.image_url || '',
        }))
      : [],
    links: Array.isArray(payload.links)
      ? payload.links.map((link, index) => ({
          id: `link-${link.id || index}`,
          link_id: link.id,
          link_provider_id: link.link_provider_id || '',
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
      path: '/contribute/success',
      query: {
        type: 'work',
        action: isEditMode.value ? 'update' : 'create',
      },
    });

  } catch (error) {
    console.error(`Failed to submit work ${isEditMode.value ? 'update' : 'creation'}:`, error);
    submitError.value = error.data?.message || error.message || 'Failed to submit. Please try again.';
    errorDialog.value?.showModal();
  } finally {
    isSubmitting.value = false;
  }
};
</script>
