<script setup lang="ts">
import type { AdminImageDetail } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const imageFieldLabels: Record<string, string> = {
  image_url: '图片',
  banner_url: '横幅',
  description: '简介',
  main_visual_url: '主视觉',
  key_visuals: '视觉图',
  avatar_url: '头像',
  bio: '个人简介',
  cover_url: '封面',
  content: '正文',
  raw: '正文',
}
const imageKindLabels: Record<string, string> = {
  cover: '封面',
  front: '正面',
  back: '背面',
  booklet: '歌词本',
  disc: '碟面',
  disc_back: '碟背',
  obi_front: '侧标',
  obi_back: '侧标背面',
  tray: '托盘',
  box: '外盒',
  sticker: '贴纸',
  bonus_item: '特典',
  illustration: '插图',
  other: '其他',
}
const imageUseTypeLabels: Record<string, string> = {
  album: '专辑',
  artist: '艺术家',
  entry: '条目',
  franchise: '系列',
  event: '活动',
  event_series: '活动系列',
  user: '用户',
  article: '文章',
  album_review: '评价',
  discussion_post: '讨论帖',
}
const revisionPageStatusLabels: Record<string, string> = { pending: '待审核', changes_requested: '需要修改', approved: '已通过', rejected: '已驳回', withdrawn: '已撤回' }
const id = computed(() => Number(route.params.id))
const { data: image, pending, error, refresh } = await useAsyncData(() => `admin-image-${id.value}`, () => $api<AdminImageDetail>(`/v1/admin/images/${id.value}`), { watch: [id] })

type Address = AdminImageDetail['usage']['addresses'][number]
/** Where a row that points at the image can be seen or edited. */
const addressLink = (use: Address) => {
  switch (use.type) {
    case 'album': return `/albums/${use.id}`
    case 'artist': return `/artists/${use.id}`
    case 'entry': return `/entries/${use.id}`
    case 'franchise': return `/franchises/${use.id}`
    case 'event': return '/admin/events'
    case 'event_series': return `/event-series/${use.id}`
    case 'user': return `/admin/users/${use.id}`
    case 'article': return `/admin/articles/${use.id}`
    case 'album_review': return use.album_id ? `/albums/${use.album_id}` : null
    case 'discussion_post': return use.topic_id ? `/discussions/${use.topic_id}` : null
  }
  return null
}
const addressName = (use: Address) => use.name || (use.type === 'discussion_post' && use.floor_number ? `${use.floor_number} 楼` : `#${use.id}`)
const scope = (use: AdminImageDetail['usage']['albums'][number]) => {
  if (use.product_id) return `版本 #${use.product_id}`
  if (use.bonus_id) return `特典 #${use.bonus_id}`
  if (use.disc_id) return `碟 #${use.disc_id}`
  return ''
}
const hasUses = computed(() => Boolean(image.value && (image.value.usage.albums.length || image.value.usage.addresses.length || image.value.usage.revisions.length)))

const deleteOpen = ref(false)
const busy = ref(false)
const message = ref('')
const remove = async (reason: string) => {
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/images/${id.value}`, { method: 'DELETE', body: { reason } })
    deleteOpen.value = false
    await router.push('/admin/images')
  } catch (failure) {
    message.value = adminError(failure, '操作失败，请重试。')
    deleteOpen.value = false
    await refresh()
  } finally {
    busy.value = false
  }
}

const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: computed(() => `图片 #${id.value}`) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <NuxtLink to="/admin/images" class="text-sm text-slate-600 underline">返回列表</NuxtLink>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-3xl font-bold">图片 #{{ id }}</h1>
        <!-- The hint sits on a wrapper: a disabled button takes no pointer events, so it would show no title. -->
        <span v-if="image" :title="image.in_use ? '这张图片还在使用中，不能删除。请先在上面列出的地方把它换掉。' : undefined">
          <UiButton variant="danger-soft" size="sm" :disabled="busy || image.in_use" @click="deleteOpen = true">删除图片</UiButton>
        </span>
      </div>
    </header>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <div v-if="image" class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="space-y-4">
          <a :href="image.url" target="_blank" rel="noopener" class="block overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <img :src="image.medium_url" alt="" class="mx-auto max-h-[36rem] object-contain">
          </a>

          <div class="rounded-xl border border-slate-200 bg-white p-5 text-sm">
            <h2 class="text-lg font-semibold">用在哪里</h2>
            <p class="mt-1 text-xs text-slate-500">实时查询专辑图片、各处图片地址和正文、未结束的修订。历史版本和已结束的修订不算。</p>
            <p v-if="!hasUses" class="mt-4 text-slate-600">当前没有内容在用。</p>

            <template v-if="image.usage.albums.length">
              <h3 class="mt-4 font-medium">专辑图片</h3>
              <ul class="mt-2 divide-y divide-slate-100">
                <li v-for="use in image.usage.albums" :key="use.id" class="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <NuxtLink :to="`/albums/${use.album_id}`" target="_blank" class="underline">#{{ use.album_id }} {{ use.title }}</NuxtLink>
                    <span class="ml-2 text-slate-500">{{ imageKindLabels[use.kind] }}<template v-if="use.label"> · {{ use.label }}</template><template v-if="scope(use)"> · {{ scope(use) }}</template></span>
                  </span>
                  <UiButton :to="`/contribute/album/${use.album_id}`" size="xs">编辑专辑</UiButton>
                </li>
              </ul>
            </template>

            <template v-if="image.usage.addresses.length">
              <h3 class="mt-4 font-medium">图片地址和正文</h3>
              <ul class="mt-2 divide-y divide-slate-100">
                <li v-for="use in image.usage.addresses" :key="`${use.type}-${use.id}-${use.field}`" class="py-2">
                  <span class="text-slate-500">{{ imageUseTypeLabels[use.type] }}</span>
                  <NuxtLink v-if="addressLink(use)" :to="addressLink(use)!" target="_blank" class="ml-2 underline">{{ addressName(use) }}</NuxtLink>
                  <span v-else class="ml-2">{{ addressName(use) }}</span>
                  <span class="ml-2 text-xs text-slate-500">{{ imageFieldLabels[use.field] }}</span>
                </li>
              </ul>
            </template>

            <template v-if="image.usage.revisions.length">
              <h3 class="mt-4 font-medium">未结束的修订</h3>
              <ul class="mt-2 divide-y divide-slate-100">
                <li v-for="revision in image.usage.revisions" :key="revision.id" class="py-2">
                  <NuxtLink :to="`/admin/revisions/${revision.id}`" class="underline">#{{ revision.id }} {{ revision.title }}</NuxtLink>
                  <span class="ml-2 text-xs text-slate-500">{{ revisionPageStatusLabels[revision.status] }} · {{ revision.submitter ? (revision.submitter.nickname || revision.submitter.username) : '—' }} · {{ time(revision.submitted_at) }}</span>
                </li>
              </ul>
            </template>

            <p v-if="image.in_use" class="mt-4 text-xs text-amber-700">这张图片还在使用中，不能删除。请先在上面列出的地方把它换掉。</p>
          </div>
        </section>

        <aside class="space-y-4">
          <section class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <dl class="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2">
              <dt class="text-slate-500">状态</dt>
              <dd>
                <span v-if="image.unused_since" class="rounded bg-amber-100 px-1.5 text-amber-800">未使用</span>
                <span v-else class="rounded bg-emerald-100 px-1.5 text-emerald-800">在用</span>
                <p v-if="image.unused_since" class="mt-1 text-xs text-slate-500">{{ time(image.unused_since) }} 起未使用</p>
                <p v-if="image.cleanup_at" class="text-xs text-amber-700">{{ time(image.cleanup_at) }} 后清理</p>
              </dd>
              <template v-if="image.conversion">
                <dt class="text-slate-500">转换</dt>
                <dd>
                  <span :class="image.conversion === 'failed' ? 'rounded bg-red-100 px-1.5 text-red-800' : 'rounded bg-slate-100 px-1.5 text-slate-700'">{{ imageConversionLabels[image.conversion] }}</span>
                  <p v-if="image.conversion_error" class="mt-1 break-words text-xs text-red-700">{{ image.conversion_error }}</p>
                </dd>
              </template>
              <dt class="text-slate-500">尺寸</dt><dd>{{ image.width }} × {{ image.height }}</dd>
              <dt class="text-slate-500">大小</dt><dd>{{ formatBytes(image.size) }}</dd>
              <dt class="text-slate-500">格式</dt><dd>{{ image.mime }}</dd>
              <dt class="text-slate-500">上传人</dt>
              <dd>
                <NuxtLink v-if="image.uploader" :to="`/admin/users/${image.uploader.id}`" class="underline">{{ image.uploader.nickname || image.uploader.username }}</NuxtLink>
                <template v-else>—</template>
              </dd>
              <dt class="text-slate-500">上传时间</dt><dd>{{ time(image.created_at) }}</dd>
              <dt class="text-slate-500">来源链接</dt>
              <dd class="break-all"><a v-if="image.source_url" :href="image.source_url" target="_blank" rel="noopener noreferrer" class="underline">{{ image.source_url }}</a><template v-else>—</template></dd>
              <dt class="text-slate-500">sha256</dt><dd class="break-all font-mono text-xs">{{ image.sha256 }}</dd>
              <dt class="text-slate-500">路径</dt><dd class="break-all font-mono text-xs">{{ image.disk }}:{{ image.path }}</dd>
              <dt class="text-slate-500">文件</dt>
              <dd class="space-y-1">
                <a :href="image.url" target="_blank" rel="noopener" class="block underline">原图</a>
                <a v-for="variant in image.variants" :key="variant.size" :href="variant.url" target="_blank" rel="noopener" class="block underline">{{ variant.size }} px 缩略图</a>
              </dd>
            </dl>
          </section>
        </aside>
      </div>
    </AdminListState>

    <AdminConfirmDialog
      v-model="deleteOpen" :busy="busy" reason-required :confirm-phrase="`#${id}`"
      title="删除图片" description="永久删除这张图片和它的缩略图。如果历史版本或已结束的修订用过它，之后恢复到这些版本会被拒绝。" @confirm="remove" />
  </div>
</template>
