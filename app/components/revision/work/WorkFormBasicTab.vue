<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-gray-900">Basic Information</h2>

    <!-- 作品标题 -->
    <div class="form-control">
      <div class="px-3 py-2.5 rounded-lg bg-gray-50 flex flex-col gap-1">
        <span class="text-sm font-semibold text-gray-700">Title <span class="text-red-500">*</span></span>
        <p class="text-xs text-gray-400 leading-relaxed tracking-wide">专辑主标题。若有译名或多个标题，请在「属性」中补充。</p>
        <input
          :value="formData.title"
          type="text"
          placeholder="Enter work title"
          class="input input-bordered input-sm w-full bg-white mt-1"
          :class="{ 'input-error': errors.title }"
          required
          @input="$emit('update:formData', { ...formData, title: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <label v-if="errors.title" class="label">
        <span class="label-text-alt text-error">{{ errors.title }}</span>
      </label>
    </div>

    <!-- 作品类型 -->
    <div class="form-control">
      <div class="px-3 py-2.5 rounded-lg bg-gray-50 flex flex-col gap-1 mb-2">
        <span class="text-sm font-semibold text-gray-700">Type <span class="text-red-500">*</span></span>
        <p class="text-xs text-gray-400 leading-relaxed tracking-wide">选择作品的发行类型。不同类型决定了作品的结构与归类方式。</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-6 gap-2">
        <button
          v-for="opt in workTypes"
          :key="opt.value"
          type="button"
          class="group flex flex-col items-start gap-3 py-4 px-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer"
          :class="[
            opt.span,
            formData.type === opt.value
              ? [opt.c.border, opt.c.bg, 'shadow-sm']
              : opt.c.idle
          ]"
          @click="$emit('update:formData', { ...formData, type: opt.value })"
        >
          <!-- 标题 + 选中标记 -->
          <div class="flex items-center justify-between w-full">
            <div>
              <p class="text-sm font-bold leading-tight" :class="formData.type === opt.value ? opt.c.title : 'text-gray-800'">{{ opt.label }}</p>
              <p class="text-xs mt-0.5" :class="formData.type === opt.value ? opt.c.summary : 'text-gray-400'">{{ opt.summary }}</p>
            </div>
            <div
              class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              :class="formData.type === opt.value ? opt.c.check : 'border-gray-300'"
            >
              <svg v-if="formData.type === opt.value" class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <!-- 详细说明 -->
          <div class="border-t w-full pt-3 space-y-3" :class="formData.type === opt.value ? opt.c.divider : 'border-gray-100'">
            <!-- 描述 -->
            <div>
              <span
                class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mb-1.5 tracking-wider"
                :class="formData.type === opt.value ? opt.c.badge : 'bg-gray-100 text-gray-500'"
              >描述</span>
              <p class="text-xs leading-relaxed whitespace-pre-line" :class="formData.type === opt.value ? 'text-gray-600' : 'text-gray-400'">{{ opt.description }}</p>
            </div>
            <!-- 内容 -->
            <div>
              <span
                class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mb-1.5 tracking-wider"
                :class="formData.type === opt.value ? opt.c.badge : 'bg-gray-100 text-gray-500'"
              >内容</span>
              <ul class="space-y-1">
                <li v-for="item in opt.content" :key="item" class="text-xs flex items-start gap-2" :class="formData.type === opt.value ? 'text-gray-600' : 'text-gray-400'">
                  <span class="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-current opacity-50 translate-y-0.75" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </button>
      </div>
      <label v-if="errors.type" class="label">
        <span class="label-text-alt text-error">{{ errors.type }}</span>
      </label>
    </div>

    <!-- 目录编号 -->
    <div class="form-control">
      <div class="px-3 py-2.5 rounded-lg bg-gray-50 flex flex-col gap-1">
        <span class="text-sm font-semibold text-gray-700">Catalog Number</span>
        <p class="text-xs text-gray-400 leading-relaxed tracking-wide">作品的唯一发行编号，通常印刷在 CD 封面或背面，格式如 ABCD-1234。</p>
        <input
          :value="formData.catalog_number"
          type="text"
          placeholder="e.g., ABCD-1234"
          class="input input-bordered input-sm w-full bg-white mt-1"
          @input="$emit('update:formData', { ...formData, catalog_number: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>

    <!-- 发行日期 -->
    <div class="form-control">
      <div class="px-3 py-2.5 rounded-lg bg-gray-50 flex flex-col gap-1">
        <span class="text-sm font-semibold text-gray-700">Release Date <span class="text-red-500">*</span></span>
        <p class="text-xs text-gray-400 leading-relaxed tracking-wide">作品的首次公开发行日期。</p>
        <input
          :value="formData.release_date"
          type="date"
          class="input input-bordered input-sm w-full bg-white mt-1"
          :class="{ 'input-error': errors.release_date }"
          required
          @input="$emit('update:formData', { ...formData, release_date: ($event.target as HTMLInputElement).value })"
        />
      </div>
      <label v-if="errors.release_date" class="label">
        <span class="label-text-alt text-error">{{ errors.release_date }}</span>
      </label>
    </div>

    <!-- 图片 -->
    <div class="form-control">
      <div class="px-3 py-2.5 rounded-lg bg-gray-50 flex flex-col gap-4">
        <span class="text-sm font-semibold text-gray-700">Images</span>

        <!-- Cover -->
        <div class="flex flex-col gap-1">
          <span class="text-xs font-semibold text-gray-600">Cover <span class="text-red-500">*</span></span>
          <p class="text-xs text-gray-400 leading-relaxed">作品封面图片链接，建议使用高清正方形图片。</p>
          <input
            :value="formData.image_url"
            type="url"
            placeholder="https://example.com/cover.jpg"
            class="input input-bordered input-sm w-full bg-white mt-1"
            :class="{ 'input-error': errors.image_url }"
            required
            @input="$emit('update:formData', { ...formData, image_url: ($event.target as HTMLInputElement).value })"
          />
          <div v-if="formData.image_url" class="mt-1 w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
            <img :src="formData.image_url" alt="Cover Preview" class="w-full h-full object-cover" @error="imageError = true" />
          </div>
          <p v-if="errors.image_url" class="text-xs text-error">{{ errors.image_url }}</p>
          <p v-else-if="imageError" class="text-xs text-error">Failed to load image</p>
        </div>

        <div class="border-t border-gray-200" />

        <!-- Banner -->
        <div class="flex flex-col gap-1">
          <span class="text-xs font-semibold text-gray-600">Banner</span>
          <p class="text-xs text-gray-400 leading-relaxed">作品页面的横幅背景图片链接，建议使用宽幅高清图片。</p>
          <input
            :value="formData.banner_url"
            type="url"
            placeholder="https://example.com/banner.jpg"
            class="input input-bordered input-sm w-full bg-white mt-1"
            @input="$emit('update:formData', { ...formData, banner_url: ($event.target as HTMLInputElement).value })"
          />
          <div v-if="formData.banner_url" class="mt-1 w-full h-24 rounded-lg overflow-hidden border border-gray-200">
            <img :src="formData.banner_url" alt="Banner Preview" class="w-full h-full object-cover" @error="bannerError = true" />
          </div>
          <p v-if="bannerError" class="text-xs text-error">Failed to load banner</p>
        </div>
      </div>
    </div>

    <!-- 简介 -->
    <div class="form-control">
      <div class="px-3 py-2.5 rounded-lg bg-gray-50 flex flex-col gap-1">
        <span class="text-sm font-semibold text-gray-700">Description</span>
        <p class="text-xs text-gray-400 leading-relaxed tracking-wide">关于作品的简短介绍或备注，选填。</p>
        <textarea
          :value="formData.description"
          class="textarea textarea-bordered w-full resize-none bg-white mt-1"
          rows="5"
          placeholder="Brief description about the work..."
          @input="$emit('update:formData', { ...formData, description: ($event.target as HTMLTextAreaElement).value })"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FormData {
  title: string
  type: string
  catalog_number: string
  release_date: string
  image_url: string
  banner_url: string
  description: string
  [key: string]: unknown
}

interface Errors {
  title?: string
  type?: string
  release_date?: string
  image_url?: string
}

defineProps<{
  formData: FormData
  errors: Errors
}>()

defineEmits<{
  'update:formData': [value: FormData]
}>()

const imageError = ref(false)
const bannerError = ref(false)

const workTypes = [
  {
    value: 'album', label: 'Album', span: 'col-span-1 md:col-span-6',
    summary: '完整音乐专辑',
    description: 'Album 是音乐发行中最标准、最常见的作品形式。\n通常包含艺术家在某一时期创作的一组完整歌曲，\n可能围绕特定主题或概念进行制作。\n大多数正式音乐专辑都属于此类型。',
    content: ['同一艺术家或团体的完整作品集合'],
    c: { idle: 'border-blue-100 hover:border-blue-300 hover:bg-blue-50/40', border: 'border-blue-400', bg: 'bg-blue-50', title: 'text-blue-600', summary: 'text-blue-400', check: 'border-blue-400 bg-blue-400', divider: 'border-blue-100', badge: 'bg-blue-100 text-blue-600' },
  },
  {
    value: 'ep', label: 'EP', span: 'col-span-1 md:col-span-2',
    summary: '迷你专辑',
    description: 'EP（Extended Play）是一种长度介于 Single 和 Album 之间的发行形式。\n通常包含多首新歌曲，但规模不足以成为完整专辑。\n常用于发布小型作品或专辑前的过渡发行。',
    content: ['多首歌曲', '小型音乐作品集合'],
    c: { idle: 'border-violet-100 hover:border-violet-300 hover:bg-violet-50/40', border: 'border-violet-400', bg: 'bg-violet-50', title: 'text-violet-600', summary: 'text-violet-400', check: 'border-violet-400 bg-violet-400', divider: 'border-violet-100', badge: 'bg-violet-100 text-violet-600' },
  },
  {
    value: 'single', label: 'Single', span: 'col-span-1 md:col-span-2',
    summary: '以一首主打歌为核心的发行',
    description: 'Single 的发行目的通常是推广一首主打歌曲。\n除主打曲外，可能包含 B-side 或 instrumental 等附加曲目。',
    content: ['主打歌曲'],
    c: { idle: 'border-pink-100 hover:border-pink-300 hover:bg-pink-50/40', border: 'border-pink-400', bg: 'bg-pink-50', title: 'text-pink-600', summary: 'text-pink-400', check: 'border-pink-400 bg-pink-400', divider: 'border-pink-100', badge: 'bg-pink-100 text-pink-600' },
  },
  {
    value: 'compilation', label: 'Compilation', span: 'col-span-1 md:col-span-2',
    summary: '精选集',
    description: 'Compilation 是将来自不同作品或不同艺术家的歌曲整理成一个专辑的发行形式。\n常见于精选集、合集、主题合集或厂牌合集。',
    content: ['已发布歌曲', '可能来自多个专辑或多个艺术家'],
    c: { idle: 'border-amber-100 hover:border-amber-300 hover:bg-amber-50/40', border: 'border-amber-400', bg: 'bg-amber-50', title: 'text-amber-600', summary: 'text-amber-400', check: 'border-amber-400 bg-amber-400', divider: 'border-amber-100', badge: 'bg-amber-100 text-amber-600' },
  },
  {
    value: 'drama', label: 'Drama CD', span: 'col-span-1 md:col-span-3',
    summary: '声优剧情 CD',
    description: 'Drama CD 是以剧情表演为核心的音频作品。\n通过声优对白、背景音乐和音效来演绎故事，\n类似没有画面的动画或广播剧。\n常见于动画、游戏、轻小说等作品的衍生内容。',
    content: ['角色对白', '剧情故事', 'BGM', '场景音效'],
    c: { idle: 'border-purple-100 hover:border-purple-300 hover:bg-purple-50/40', border: 'border-purple-400', bg: 'bg-purple-50', title: 'text-purple-600', summary: 'text-purple-400', check: 'border-purple-400 bg-purple-400', divider: 'border-purple-100', badge: 'bg-purple-100 text-purple-600' },
  },
  {
    value: 'radio', label: 'Radio', span: 'col-span-1 md:col-span-3',
    summary: '广播节目 CD',
    description: 'Radio CD 是将广播节目或网络电台节目整理并发行的音频作品。\n内容通常是声优聊天、访谈或互动环节。',
    content: ['声优聊天', '嘉宾访谈', '听众投稿', '互动环节'],
    c: { idle: 'border-teal-100 hover:border-teal-300 hover:bg-teal-50/40', border: 'border-teal-400', bg: 'bg-teal-50', title: 'text-teal-600', summary: 'text-teal-400', check: 'border-teal-400 bg-teal-400', divider: 'border-teal-100', badge: 'bg-teal-100 text-teal-600' },
  },
]
</script>
