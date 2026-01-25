<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
    <form @submit.prevent="handleSubmit">
      <!-- 基本信息 -->
      <div class="space-y-6">
        <!-- 艺术家名称 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Artist Name <span class="text-red-500">*</span></span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="Enter artist name"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.name }"
            required
          />
          <label v-if="errors.name" class="label">
            <span class="label-text-alt text-error">{{ errors.name }}</span>
          </label>
        </div>

        <!-- 艺术家类型 -->
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
            <option value="person">Person</option>
            <option value="circle">Circle</option>
            <option value="other">Other</option>
          </select>
          <label v-if="errors.type" class="label">
            <span class="label-text-alt text-error">{{ errors.type }}</span>
          </label>
        </div>

        <!-- 地区 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Region</span>
          </label>
          <input
            v-model="formData.region"
            type="text"
            placeholder="e.g., Japan, China, Korea"
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">Country or region where the artist is based</span>
          </label>
        </div>

        <!-- 头像 URL -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Image URL</span>
          </label>
          <input
            v-model="formData.image_url"
            type="url"
            placeholder="https://example.com/image.jpg"
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">URL to the artist's profile image</span>
          </label>
          <!-- 图片预览 -->
          <div v-if="formData.image_url" class="mt-4">
            <p class="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <div class="flex items-center justify-center w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
              <img
                :src="formData.image_url"
                alt="Preview"
                class="w-full h-full object-cover"
                @error="imageError = true"
              />
            </div>
            <p v-if="imageError" class="text-xs text-error mt-1">Failed to load image</p>
          </div>
        </div>

        <!-- 简介 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Biography</span>
          </label>
          <textarea
            v-model="formData.bio"
            class="textarea textarea-bordered w-full resize-none"
            rows="5"
            placeholder="Brief description about the artist..."
          ></textarea>
          <label class="label">
            <span class="label-text-alt text-gray-500">Optional biography or description</span>
          </label>
        </div>
      </div>

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
          <span v-else>{{ isEditMode ? 'Submit Update' : 'Submit' }}</span>
        </button>
        <button
          type="button"
          class="btn btn-outline"
          @click="togglePreview"
        >
          Preview JSON
        </button>
      </div>

      <!-- JSON 预览区域 -->
      <div v-if="showPreview" class="border border-blue-100 bg-blue-50/50 rounded-lg p-4 space-y-3 mt-6">
        <h3 class="text-lg font-semibold text-gray-900">Preview JSON Data</h3>
        <div class="rounded-lg border border-blue-100 bg-gray-900 text-green-400 p-4 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">{{ previewJson }}</div>
      </div>
    </form>
  </div>
</template>

<script setup>
const props = defineProps({
  // 初始数据（编辑模式使用）
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      type: '',
      region: '',
      image_url: '',
      bio: '',
    }),
  },
  // 艺术家 ID（编辑模式使用）
  artistId: {
    type: [String, Number],
    default: null,
  },
});

const router = useRouter();

// 判断是否为编辑模式
const isEditMode = computed(() => !!props.artistId);

// 初始化表单数据
const initFormData = () => {
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    return {
      artist_id: props.initialData.id, // 保存原始 artist ID
      name: props.initialData.name || '',
      type: props.initialData.type || '',
      region: props.initialData.region || '',
      image_url: props.initialData.image_url || '',
      bio: props.initialData.bio || '',
    };
  }
  return {
    artist_id: null,
    name: '',
    type: '',
    region: '',
    image_url: '',
    bio: '',
  };
};

// 表单数据
const formData = ref(initFormData());

// 监听 initialData 变化（用于编辑模式数据加载）
watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    formData.value = {
      artist_id: newData.id, // 保存原始 artist ID
      name: newData.name || '',
      type: newData.type || '',
      region: newData.region || '',
      image_url: newData.image_url || '',
      bio: newData.bio || '',
    };
  }
}, { deep: true });

// 表单验证错误
const errors = ref({
  name: '',
  type: '',
});

// 提交状态
const isSubmitting = ref(false);
const submitError = ref('');
const imageError = ref(false);
const showPreview = ref(false);

// 监听图片 URL 变化，重置错误状态
watch(() => formData.value.image_url, () => {
  imageError.value = false;
});

// 验证表单
const validateForm = () => {
  let isValid = true;
  errors.value = {
    name: '',
    type: '',
  };

  if (!formData.value.name || formData.value.name.trim() === '') {
    errors.value.name = 'Artist name is required';
    isValid = false;
  }

  if (!formData.value.type) {
    errors.value.type = 'Artist type is required';
    isValid = false;
  }

  return isValid;
};

// 准备提交数据
const getSubmitPayload = () => {
  const payload = {
    name: formData.value.name.trim(),
    type: formData.value.type,
  };

  // 如果是编辑模式，添加 artist ID
  if (formData.value.artist_id) {
    payload.id = formData.value.artist_id;
  }

  // 添加可选字段
  if (formData.value.region) {
    payload.region = formData.value.region.trim();
  }
  if (formData.value.image_url) {
    payload.image_url = formData.value.image_url.trim();
  }
  if (formData.value.bio) {
    payload.bio = formData.value.bio.trim();
  }

  return payload;
};

// 预览 JSON
const previewJson = computed(() => JSON.stringify(getSubmitPayload(), null, 2));

// 切换预览
const togglePreview = () => {
  showPreview.value = !showPreview.value;
};

// 提交表单
const handleSubmit = async () => {
  // 重置提示
  submitError.value = '';

  // 验证表单
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    // 准备提交数据 - 使用 FormData
    const payload = getSubmitPayload();
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('payload', JSON.stringify(payload));
    formDataToSubmit.append('resource_type', 'artist');
    formDataToSubmit.append('action', isEditMode.value ? 'update' : 'create');

    // 发送到 revisions 接口
    const { $api } = useNuxtApp();
    await $api('/v1/revisions', {
      method: 'POST',
      body: formDataToSubmit,
    });

    // 提交成功，跳转到成功页面
    router.push({
      path: '/contribute/success',
      query: {
        type: 'artist',
        action: isEditMode.value ? 'update' : 'create',
      },
    });

  } catch (error) {
    console.error(`Failed to ${isEditMode.value ? 'update' : 'create'} artist:`, error);
    submitError.value = error.data?.message || error.message || `Failed to ${isEditMode.value ? 'update' : 'create'} artist. Please try again.`;
  } finally {
    isSubmitting.value = false;
  }
};
</script>
