<script setup lang="ts">
import type { AdminImageDetail } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { t } = useAdminI18n()
const { localizeError } = useLocalizedApiError((key, params) => params ? t(key, params) : t(key))
const id = computed(() => Number(route.params.id))
const { data: image, pending, error, refresh } = await useAsyncData(() => `admin-image-${id.value}`, () => $api<AdminImageDetail>(`/v1/admin/images/${id.value}`), { watch: [id] })

type Address = AdminImageDetail['usage']['addresses'][number]
/** Where a row that points at the image can be seen or edited. */
const addressLink = (use: Address) => {
  switch (use.type) {
    case 'album': return `/albums/${use.id}`
    case 'artist': return `/artists/${use.id}`
    case 'label': return `/labels/${use.id}`
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
const addressName = (use: Address) => use.name || (use.type === 'discussion_post' && use.floor_number ? t('admin_pages.images.floor', { floor: use.floor_number }) : `#${use.id}`)
const scope = (use: AdminImageDetail['usage']['albums'][number]) => {
  if (use.product_id) return t('admin_pages.images.scope_product', { id: use.product_id })
  if (use.bonus_id) return t('admin_pages.images.scope_bonus', { id: use.bonus_id })
  if (use.disc_id) return t('admin_pages.images.scope_disc', { id: use.disc_id })
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
    message.value = localizeError(failure, 'admin_pages.action_failed')
    deleteOpen.value = false
    await refresh()
  } finally {
    busy.value = false
  }
}

const time = (value: string | null) => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
useHead({ title: computed(() => t('admin_pages.images.detail_title', { id: id.value })) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header>
      <NuxtLink to="/admin/images" class="text-sm text-slate-600 underline">{{ t('admin_pages.back_list') }}</NuxtLink>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-3xl font-bold">{{ t('admin_pages.images.detail_title', { id }) }}</h1>
        <button
          v-if="image" type="button" :disabled="busy || image.in_use" :title="image.in_use ? t('admin_pages.images.delete_blocked') : undefined"
          class="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-40" @click="deleteOpen = true">
          {{ t('admin_pages.images.delete') }}
        </button>
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
            <h2 class="text-lg font-semibold">{{ t('admin_pages.images.usage') }}</h2>
            <p class="mt-1 text-xs text-slate-500">{{ t('admin_pages.images.usage_help') }}</p>
            <p v-if="!hasUses" class="mt-4 text-slate-600">{{ t('admin_pages.images.usage_none') }}</p>

            <template v-if="image.usage.albums.length">
              <h3 class="mt-4 font-medium">{{ t('admin_pages.images.usage_albums') }}</h3>
              <ul class="mt-2 divide-y divide-slate-100">
                <li v-for="use in image.usage.albums" :key="use.id" class="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <NuxtLink :to="`/albums/${use.album_id}`" target="_blank" class="underline">#{{ use.album_id }} {{ use.title }}</NuxtLink>
                    <span class="ml-2 text-slate-500">{{ t(`catalog.image_kind.${use.kind}`) }}<template v-if="use.label"> · {{ use.label }}</template><template v-if="scope(use)"> · {{ scope(use) }}</template></span>
                  </span>
                  <NuxtLink :to="`/contribute/album/${use.album_id}`" class="text-xs underline">{{ t('admin_pages.images.edit_album') }}</NuxtLink>
                </li>
              </ul>
            </template>

            <template v-if="image.usage.addresses.length">
              <h3 class="mt-4 font-medium">{{ t('admin_pages.images.usage_addresses') }}</h3>
              <ul class="mt-2 divide-y divide-slate-100">
                <li v-for="use in image.usage.addresses" :key="`${use.type}-${use.id}-${use.field}`" class="py-2">
                  <span class="text-slate-500">{{ t(`admin_pages.images.use_types.${use.type}`) }}</span>
                  <NuxtLink v-if="addressLink(use)" :to="addressLink(use)!" target="_blank" class="ml-2 underline">{{ addressName(use) }}</NuxtLink>
                  <span v-else class="ml-2">{{ addressName(use) }}</span>
                  <span class="ml-2 text-xs text-slate-500">{{ t(`admin_pages.images.fields.${use.field}`) }}</span>
                </li>
              </ul>
            </template>

            <template v-if="image.usage.revisions.length">
              <h3 class="mt-4 font-medium">{{ t('admin_pages.images.usage_revisions') }}</h3>
              <ul class="mt-2 divide-y divide-slate-100">
                <li v-for="revision in image.usage.revisions" :key="revision.id" class="py-2">
                  <NuxtLink :to="`/admin/revisions/${revision.id}`" class="underline">#{{ revision.id }} {{ revision.title }}</NuxtLink>
                  <span class="ml-2 text-xs text-slate-500">{{ t(`revision_page.status.${revision.status}`) }} · {{ revision.submitter ? (revision.submitter.nickname || revision.submitter.username) : '—' }} · {{ time(revision.submitted_at) }}</span>
                </li>
              </ul>
            </template>

            <p v-if="image.in_use" class="mt-4 text-xs text-amber-700">{{ t('admin_pages.images.delete_blocked') }}</p>
          </div>
        </section>

        <aside class="space-y-4">
          <section class="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <dl class="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2">
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.status') }}</dt>
              <dd>
                <span v-if="image.unused_since" class="rounded bg-amber-100 px-1.5 text-amber-800">{{ t('admin_pages.images.statuses.unused') }}</span>
                <span v-else class="rounded bg-emerald-100 px-1.5 text-emerald-800">{{ t('admin_pages.images.statuses.in_use') }}</span>
                <p v-if="image.unused_since" class="mt-1 text-xs text-slate-500">{{ t('admin_pages.images.unused_since', { time: time(image.unused_since) }) }}</p>
                <p v-if="image.cleanup_at" class="text-xs text-amber-700">{{ t('admin_pages.images.cleanup_at', { date: time(image.cleanup_at) }) }}</p>
              </dd>
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.dimensions') }}</dt><dd>{{ image.width }} × {{ image.height }}</dd>
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.size') }}</dt><dd>{{ formatBytes(image.size) }}</dd>
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.mime') }}</dt><dd>{{ image.mime }}</dd>
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.uploader') }}</dt>
              <dd>
                <NuxtLink v-if="image.uploader" :to="`/admin/users/${image.uploader.id}`" class="underline">{{ image.uploader.nickname || image.uploader.username }}</NuxtLink>
                <template v-else>—</template>
              </dd>
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.uploaded_at') }}</dt><dd>{{ time(image.created_at) }}</dd>
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.source') }}</dt>
              <dd class="break-all"><a v-if="image.source_url" :href="image.source_url" target="_blank" rel="noopener noreferrer" class="underline">{{ image.source_url }}</a><template v-else>—</template></dd>
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.sha256') }}</dt><dd class="break-all font-mono text-xs">{{ image.sha256 }}</dd>
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.path') }}</dt><dd class="break-all font-mono text-xs">{{ image.disk }}:{{ image.path }}</dd>
              <dt class="text-slate-500">{{ t('admin_pages.images.meta.files') }}</dt>
              <dd class="space-y-1">
                <a :href="image.url" target="_blank" rel="noopener" class="block underline">{{ t('admin_pages.images.original') }}</a>
                <a v-for="variant in image.variants" :key="variant.size" :href="variant.url" target="_blank" rel="noopener" class="block underline">{{ t('admin_pages.images.variant', { size: variant.size }) }}</a>
              </dd>
            </dl>
          </section>
        </aside>
      </div>
    </AdminListState>

    <AdminConfirmDialog
      v-model="deleteOpen" :busy="busy" reason-required :confirm-phrase="`#${id}`"
      :title="t('admin_pages.images.delete')" :description="t('admin_pages.images.delete_help')" @confirm="remove" />
  </div>
</template>
