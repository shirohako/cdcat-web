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
      <div v-show="currentTab === 'basic'" class="space-y-6">
        <h2 class="text-xl font-bold text-gray-900">Basic Information</h2>

        <!-- 作品标题 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Title <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model="formData.title"
            type="text"
            placeholder="Enter work title"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.title }"
            required
          />
          <label v-if="errors.title" class="label">
            <span class="label-text-alt text-error">{{ errors.title }}</span>
          </label>
        </div>

        <!-- 作品类型 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Type <span class="text-red-500">*</span></span>
          </label>
          <select
            v-model="formData.type"
            class="select select-bordered w-full"
            :class="{ 'select-error': errors.type }"
            required
          >
            <option value="">Select type</option>
            <option value="album">Album</option>
            <option value="single">Single</option>
            <option value="ep">EP</option>
            <option value="compilation">Compilation</option>
          </select>
          <label v-if="errors.type" class="label">
            <span class="label-text-alt text-error">{{ errors.type }}</span>
          </label>
        </div>

        <!-- 目录编号 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Catalog Number</span>
          </label>
          <input
            v-model="formData.catalog_number"
            type="text"
            placeholder="e.g., ABCD-1234"
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">The catalog number for this work</span>
          </label>
        </div>

        <!-- 发行日期 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Release Date</span>
          </label>
          <input
            v-model="formData.release_date"
            type="date"
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">When was this work released</span>
          </label>
        </div>

        <!-- 封面图片 URL -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Cover Image URL</span>
          </label>
          <input
            v-model="formData.image_url"
            type="url"
            placeholder="https://example.com/cover.jpg"
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">URL to the work's cover image</span>
          </label>
          <!-- 封面图片预览 -->
          <div v-if="formData.image_url" class="mt-4">
            <p class="text-sm font-medium text-gray-700 mb-2">Cover Preview:</p>
            <div class="flex items-center justify-center w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
              <img
                :src="formData.image_url"
                alt="Cover Preview"
                class="w-full h-full object-cover"
                @error="imageError = true"
              />
            </div>
            <p v-if="imageError" class="text-xs text-error mt-1">Failed to load image</p>
          </div>
        </div>

        <!-- 横幅图片 URL -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Banner Image URL</span>
          </label>
          <input
            v-model="formData.banner_url"
            type="url"
            placeholder="https://example.com/banner.jpg"
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">URL to the work's banner image (optional, used for background)</span>
          </label>
          <!-- 横幅图片预览 -->
          <div v-if="formData.banner_url" class="mt-4">
            <p class="text-sm font-medium text-gray-700 mb-2">Banner Preview:</p>
            <div class="flex items-center justify-center w-full h-32 rounded-lg overflow-hidden border border-gray-200">
              <img
                :src="formData.banner_url"
                alt="Banner Preview"
                class="w-full h-full object-cover"
                @error="bannerError = true"
              />
            </div>
            <p v-if="bannerError" class="text-xs text-error mt-1">Failed to load banner</p>
          </div>
        </div>

        <!-- 简介 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Description</span>
          </label>
          <textarea
            v-model="formData.description"
            class="textarea textarea-bordered w-full resize-none"
            rows="5"
            placeholder="Brief description about the work..."
          ></textarea>
          <label class="label">
            <span class="label-text-alt text-gray-500">Optional description or notes about this work</span>
          </label>
        </div>
      </div>

      <!-- Tab 2: Discs & Tracks -->
      <div v-show="currentTab === 'tracks'" class="space-y-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">Discs & Tracks</h2>
          <button type="button" class="btn btn-sm btn-primary" @click="addDisc">
            <Plus :size="16" />
            Add Disc
          </button>
        </div>

        <div v-if="formData.structure.length === 0" class="text-center py-8 text-gray-500">
          No discs added yet. Click "Add Disc" to start.
        </div>

        <!-- Disc List -->
        <div v-for="(disc, discIndex) in formData.structure" :key="disc.id" class="border border-gray-200 rounded-lg p-4 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-lg">Disc {{ discIndex + 1 }}</h3>
            <button type="button" class="btn btn-sm btn-error btn-outline" @click="removeDisc(discIndex)">
              <Trash2 :size="16" />
              Remove Disc
            </button>
          </div>

          <!-- Disc Title -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Disc Title (Optional)</span>
            </label>
            <input
              v-model="disc.disc_title"
              type="text"
              placeholder="e.g., Main Album, Bonus Disc"
              class="input input-bordered input-sm w-full"
            />
          </div>

          <!-- Tracks -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-medium">Tracks</span>
              <button type="button" class="btn btn-xs btn-outline" @click="addTrack(discIndex)">
                <Plus :size="14" />
                Add Track
              </button>
            </div>

            <div v-if="disc.songs.length === 0" class="text-sm text-gray-500 py-4 text-center">
              No tracks yet. Click "Add Track" to add.
            </div>

            <div v-for="(song, songIndex) in disc.songs" :key="song.id" class="bg-gray-50 rounded p-3 space-y-2">
              <div class="flex items-start gap-2">
                <span class="text-sm font-medium text-gray-600 mt-2">{{ songIndex + 1 }}.</span>
                <div class="flex-1 space-y-2">
                  <input
                    v-model="song.title"
                    type="text"
                    placeholder="Track title"
                    class="input input-bordered input-sm w-full"
                  />
                  <div class="grid grid-cols-2 gap-2">
                    <input
                      v-model="song.duration"
                      type="text"
                      placeholder="Duration (e.g., 3:45)"
                      class="input input-bordered input-sm w-full"
                    />
                    <input
                      v-model="song.composer"
                      type="text"
                      placeholder="Composer (optional)"
                      class="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>
                <button type="button" class="btn btn-xs btn-ghost text-error" @click="removeTrack(discIndex, songIndex)">
                  <X :size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: Artists -->
      <div v-show="currentTab === 'artists'" class="space-y-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">Associated Artists</h2>
          <button type="button" class="btn btn-sm btn-primary" @click="addArtist">
            <Plus :size="16" />
            Add Artist
          </button>
        </div>

        <div v-if="formData.artists.length === 0" class="text-center py-8 text-gray-500">
          No artists associated yet. Click "Add Artist" to start.
        </div>

        <div v-for="(artist, index) in formData.artists" :key="artist.id" class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-start gap-4">
            <div class="flex-1 space-y-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Artist ID or Name</span>
                </label>
                <input
                  v-model="artist.artist_id"
                  type="text"
                  placeholder="Enter artist ID or search name"
                  class="input input-bordered input-sm w-full"
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Role</span>
                </label>
                <select v-model="artist.role" class="select select-bordered select-sm w-full">
                  <option value="main">Main Artist</option>
                  <option value="featured">Featured</option>
                  <option value="composer">Composer</option>
                  <option value="arranger">Arranger</option>
                  <option value="lyricist">Lyricist</option>
                  <option value="producer">Producer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-error btn-outline" @click="removeArtist(index)">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 4: Credits -->
      <div v-show="currentTab === 'credits'" class="space-y-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">Credits</h2>
          <button type="button" class="btn btn-sm btn-primary" @click="addCredit">
            <Plus :size="16" />
            Add Credit
          </button>
        </div>

        <div v-if="formData.credits.length === 0" class="text-center py-8 text-gray-500">
          No credits added yet. Click "Add Credit" to start.
        </div>

        <div v-for="(credit, index) in formData.credits" :key="credit.id" class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-start gap-4">
            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Name</span>
                </label>
                <input
                  v-model="credit.name"
                  type="text"
                  placeholder="Person or artist name"
                  class="input input-bordered input-sm w-full"
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Role</span>
                </label>
                <input
                  v-model="credit.role"
                  type="text"
                  placeholder="e.g., Vocal, Guitar, Mix"
                  class="input input-bordered input-sm w-full"
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Track (Optional)</span>
                </label>
                <input
                  v-model="credit.track"
                  type="text"
                  placeholder="Specific track or leave blank for all"
                  class="input input-bordered input-sm w-full"
                />
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-error btn-outline" @click="removeCredit(index)">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 5: Links -->
      <div v-show="currentTab === 'links'" class="space-y-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">External Links</h2>
          <button type="button" class="btn btn-sm btn-primary" @click="addLink">
            <Plus :size="16" />
            Add Link
          </button>
        </div>

        <div v-if="formData.links.length === 0" class="text-center py-8 text-gray-500">
          No links added yet. Click "Add Link" to start.
        </div>

        <div v-for="(link, index) in formData.links" :key="link.id" class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-start gap-4">
            <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">Platform</span>
                </label>
                <select v-model="link.platform" class="select select-bordered select-sm w-full">
                  <option value="spotify">Spotify</option>
                  <option value="apple_music">Apple Music</option>
                  <option value="youtube">YouTube</option>
                  <option value="bandcamp">Bandcamp</option>
                  <option value="soundcloud">SoundCloud</option>
                  <option value="official_site">Official Site</option>
                  <option value="twitter">Twitter</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold">URL</span>
                </label>
                <input
                  v-model="link.url"
                  type="url"
                  placeholder="https://..."
                  class="input input-bordered input-sm w-full"
                />
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-error btn-outline" @click="removeLink(index)">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 6: Preview JSON -->
      <div v-show="currentTab === 'preview'" class="space-y-6">
        <h2 class="text-xl font-bold text-gray-900">Preview JSON Data</h2>
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
          <pre>{{ JSON.stringify(getSubmitData(), null, 2) }}</pre>
        </div>
      </div>

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
import { Plus, Trash2, X } from 'lucide-vue-next';

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
  { id: 'tracks', label: 'Discs & Tracks' },
  { id: 'artists', label: 'Artists' },
  { id: 'credits', label: 'Credits' },
  { id: 'links', label: 'Links' },
  { id: 'preview', label: 'Preview' },
];

const currentTab = ref('basic');

// 判断是否为编辑模式
const isEditMode = computed(() => !!props.workId);

// 表单数据
const formData = ref({
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
  ...props.initialData,
});

// 监听 initialData 变化
watch(() => props.initialData, (newData) => {
  formData.value = {
    structure: [],
    artists: [],
    credits: [],
    links: [],
    ...newData
  };
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
const imageError = ref(false);
const bannerError = ref(false);

// 监听图片 URL 变化
watch(() => formData.value.image_url, () => {
  imageError.value = false;
});

watch(() => formData.value.banner_url, () => {
  bannerError.value = false;
});

// Disc 管理
let discIdCounter = 0;
const addDisc = () => {
  formData.value.structure.push({
    id: `disc-${discIdCounter++}`,
    disc_number: formData.value.structure.length + 1,
    disc_title: '',
    songs: [],
  });
};

const removeDisc = (index) => {
  formData.value.structure.splice(index, 1);
  // 重新编号
  formData.value.structure.forEach((disc, i) => {
    disc.disc_number = i + 1;
  });
};

// Track 管理
let trackIdCounter = 0;
const addTrack = (discIndex) => {
  const disc = formData.value.structure[discIndex];
  disc.songs.push({
    id: `track-${trackIdCounter++}`,
    track_number: disc.songs.length + 1,
    title: '',
    duration: '',
    composer: '',
  });
};

const removeTrack = (discIndex, trackIndex) => {
  const disc = formData.value.structure[discIndex];
  disc.songs.splice(trackIndex, 1);
  // 重新编号
  disc.songs.forEach((song, i) => {
    song.track_number = i + 1;
  });
};

// Artist 管理
let artistIdCounter = 0;
const addArtist = () => {
  formData.value.artists.push({
    id: `artist-${artistIdCounter++}`,
    artist_id: '',
    role: 'main',
  });
};

const removeArtist = (index) => {
  formData.value.artists.splice(index, 1);
};

// Credit 管理
let creditIdCounter = 0;
const addCredit = () => {
  formData.value.credits.push({
    id: `credit-${creditIdCounter++}`,
    name: '',
    role: '',
    track: '',
  });
};

const removeCredit = (index) => {
  formData.value.credits.splice(index, 1);
};

// Link 管理
let linkIdCounter = 0;
const addLink = () => {
  formData.value.links.push({
    id: `link-${linkIdCounter++}`,
    platform: 'official_site',
    url: '',
  });
};

const removeLink = (index) => {
  formData.value.links.splice(index, 1);
};

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

  // 添加结构化数据
  if (formData.value.structure.length > 0) {
    payload.structure = formData.value.structure.map((disc, discIndex) => ({
      disc_number: discIndex + 1,
      disc_title: disc.disc_title || null,
      songs: disc.songs.map((song, songIndex) => ({
        track_number: songIndex + 1,
        title: song.title,
        duration: song.duration || null,
        composer: song.composer || null,
      })),
    }));
  }

  // 添加艺术家关联
  if (formData.value.artists.length > 0) {
    payload.artists = formData.value.artists
      .filter(a => a.artist_id)
      .map(a => ({
        artist_id: a.artist_id,
        role: a.role,
      }));
  }

  // 添加 Credits
  if (formData.value.credits.length > 0) {
    payload.credits = formData.value.credits
      .filter(c => c.name && c.role)
      .map(c => ({
        name: c.name,
        role: c.role,
        track: c.track || null,
      }));
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
    const payload = getSubmitData();
    const { $api } = useNuxtApp();
    let response;

    if (isEditMode.value) {
      response = await $api(`/v1/works/${props.workId}`, {
        method: 'PUT',
        body: payload,
      });
    } else {
      response = await $api('/v1/works', {
        method: 'POST',
        body: payload,
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
