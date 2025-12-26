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
            <option value="artist">Artist</option>
            <option value="circle">Circle</option>
            <option value="band">Band</option>
            <option value="label">Label</option>
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

        <!-- 活动开始年份 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Active Since</span>
          </label>
          <input
            v-model="formData.active_since"
            type="number"
            placeholder="e.g., 2010"
            class="input input-bordered w-full"
            min="1900"
            :max="new Date().getFullYear()"
          />
          <label class="label">
            <span class="label-text-alt text-gray-500">Year when the artist became active</span>
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

      <!-- 成功提示 -->
      <div v-if="submitSuccess" class="alert alert-success mt-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ isEditMode ? 'Artist updated successfully!' : 'Artist created successfully!' }}</span>
      </div>

      <!-- 操作按钮 -->
      <div class="mt-8">
        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
          <span v-else>{{ isEditMode ? 'Update Artist' : 'Create Artist' }}</span>
        </button>
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
      active_since: null,
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

// 表单数据
const formData = ref({ ...props.initialData });

// 监听 initialData 变化（用于编辑模式数据加载）
watch(() => props.initialData, (newData) => {
  formData.value = { ...newData };
}, { deep: true });

// 表单验证错误
const errors = ref({
  name: '',
  type: '',
});

// 提交状态
const isSubmitting = ref(false);
const submitError = ref('');
const submitSuccess = ref(false);
const imageError = ref(false);

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

// 提交表单
const handleSubmit = async () => {
  // 重置提示
  submitError.value = '';
  submitSuccess.value = false;

  // 验证表单
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    // 准备提交数据
    const payload = {
      name: formData.value.name.trim(),
      type: formData.value.type,
    };

    // 添加可选字段
    if (formData.value.region) {
      payload.region = formData.value.region.trim();
    }
    if (formData.value.active_since) {
      payload.active_since = parseInt(formData.value.active_since);
    }
    if (formData.value.image_url) {
      payload.image_url = formData.value.image_url.trim();
    }
    if (formData.value.bio) {
      payload.bio = formData.value.bio.trim();
    }

    // 根据模式发送不同的请求
    const { $api } = useNuxtApp();
    let response;

    if (isEditMode.value) {
      // 更新艺术家 - PUT 请求
      response = await $api(`/v1/artists/${props.artistId}`, {
        method: 'PUT',
        body: payload,
      });
    } else {
      // 创建艺术家 - POST 请求
      response = await $api('/v1/artists', {
        method: 'POST',
        body: payload,
      });
    }

    // 显示成功提示
    submitSuccess.value = true;

    // 1.5 秒后跳转到艺术家详情页
    setTimeout(() => {
      const targetId = isEditMode.value ? props.artistId : response.id;
      if (targetId) {
        router.push(`/artists/${targetId}`);
      } else {
        router.push('/artists');
      }
    }, 1500);

  } catch (error) {
    console.error(`Failed to ${isEditMode.value ? 'update' : 'create'} artist:`, error);
    submitError.value = error.data?.message || error.message || `Failed to ${isEditMode.value ? 'update' : 'create'} artist. Please try again.`;
  } finally {
    isSubmitting.value = false;
  }
};
</script>
