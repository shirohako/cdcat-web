<script setup lang="ts">
import type { AdminEvent, AdminEventSeries, AdminPagination } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const eventOrientationLabels: Record<string, string> = { portrait: '竖图', landscape: '横图', square: '方图' }

const search = ref(String(route.query.search ?? ''))
const seriesFilter = ref(String(route.query.series_id ?? ''))
const visualFilter = ref(String(route.query.visual ?? ''))
const page = computed({
  get: () => Math.max(1, Number.parseInt(String(route.query.page || '1')) || 1),
  set: value => { router.push({ query: { ...route.query, page: value > 1 ? value : undefined } }) },
})
const applyFilters = () => router.push({ query: { search: search.value.trim() || undefined, series_id: seriesFilter.value || undefined, visual: visualFilter.value || undefined } })
const query = computed(() => ({ page: page.value, search: route.query.search || undefined, series_id: route.query.series_id || undefined, visual: route.query.visual || undefined }))

const { data: events, pending, error, refresh } = await useAsyncData('admin-events',
  () => $api<{ events: AdminEvent[], pagination: AdminPagination }>('/v1/admin/events', { query: query.value }), { watch: [query] })
const { data: series } = await useAsyncData('admin-event-series',
  () => $api<AdminEventSeries[]>('/v1/admin/event-series'))

const busy = ref(false)
const message = ref('')
const notice = ref('')

// ===== Event form =====
const emptyEvent = () => ({ id: 0, event_series_id: '', name: '', slug: '', start_date: '', end_date: '', start_time: '', end_time: '', venue: '', location: '', website_url: '', main_visual_url: '', main_visual_width: null as number | null, main_visual_height: null as number | null })
const eventForm = reactive(emptyEvent())
const eventOpen = ref(false)
const editEvent = (event?: AdminEvent) => {
  Object.assign(eventForm, emptyEvent(), event ? {
    ...event, event_series_id: event.event_series_id ? String(event.event_series_id) : '', end_date: event.end_date ?? '', venue: event.venue ?? '',
    location: event.location ?? '', main_visual_url: event.main_visual_url ?? '',
    start_time: event.start_time ?? '', end_time: event.end_time ?? '', website_url: event.website_url ?? '',
    main_visual_width: event.main_visual_width ?? null, main_visual_height: event.main_visual_height ?? null,
  } : {})
  message.value = ''
  visualError.value = ''
  eventOpen.value = true
}
const saveEvent = async () => {
  busy.value = true
  message.value = ''
  try {
    const body = {
      event_series_id: eventForm.event_series_id ? Number(eventForm.event_series_id) : null, name: eventForm.name, slug: eventForm.slug, start_date: eventForm.start_date,
      end_date: eventForm.end_date || null, venue: eventForm.venue || null, location: eventForm.location || null, main_visual_url: eventForm.main_visual_url || null,
      start_time: eventForm.start_time || null, end_time: eventForm.end_time || null, website_url: eventForm.website_url || null,
      main_visual_width: eventForm.main_visual_url ? eventForm.main_visual_width : null, main_visual_height: eventForm.main_visual_url ? eventForm.main_visual_height : null,
    }
    await $api(eventForm.id ? `/v1/admin/events/${eventForm.id}` : '/v1/admin/events', { method: eventForm.id ? 'PUT' : 'POST', body })
    eventOpen.value = false
    notice.value = '已保存'
    await refresh()
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}

// The visual's pixel size is read from the preview, so editors never pick an orientation by hand.
const readVisualSize = (e: Event) => {
  const image = e.target as HTMLImageElement
  eventForm.main_visual_width = image.naturalWidth || null
  eventForm.main_visual_height = image.naturalHeight || null
}
const clearVisualSize = () => {
  eventForm.main_visual_width = null
  eventForm.main_visual_height = null
}
// An uploaded visual is stored on this site (POST /v1/images); its size comes with it.
const { limits: imageLimits, upload: uploadImage } = useImageUpload()
const visualUploading = ref(false)
const visualError = ref('')
const uploadVisual = async (e: Event) => {
  const picker = e.target as HTMLInputElement
  const file = picker.files?.[0]
  picker.value = ''
  visualError.value = ''
  if (!file) return
  if (file.size > imageLimits.value.maxBytes) {
    visualError.value = `图片太大，最多 ${Math.floor(imageLimits.value.maxBytes / 1024 / 1024)} MB。`
    return
  }
  visualUploading.value = true
  try {
    const image = await uploadImage(file, file.name)
    eventForm.main_visual_url = image.url
    eventForm.main_visual_width = image.width
    eventForm.main_visual_height = image.height
  } catch (err) {
    visualError.value = adminError(err)
  } finally {
    visualUploading.value = false
  }
}
const removeVisual = () => {
  eventForm.main_visual_url = ''
  visualError.value = ''
  clearVisualSize()
}
// Layout follows the series orientation, so flag a visual that would be letterboxed in its series.
const seriesOrientation = computed(() => series.value?.find(item => String(item.id) === eventForm.event_series_id)?.visual_orientation)
const visualMismatch = computed(() => {
  const orientation = imageOrientation(eventForm.main_visual_width, eventForm.main_visual_height)
  return Boolean(eventForm.main_visual_url && seriesOrientation.value && (orientation === 'portrait' || orientation === 'landscape') && orientation !== seriesOrientation.value)
})
const visualSizeText = computed(() => {
  if (!eventForm.main_visual_url) return '这一届的场刊封面或主视觉：上传图片，或者填图片地址。会自动识别图片尺寸和横竖方向。'
  const orientation = imageOrientation(eventForm.main_visual_width, eventForm.main_visual_height)
  return orientation
    ? `${eventForm.main_visual_width} × ${eventForm.main_visual_height} · ${eventOrientationLabels[orientation]}`
    : '图片加载后自动识别尺寸；加载失败时不记录尺寸。'
})

// ===== Delete =====
const deleting = ref<AdminEvent | null>(null)
const deleteOpen = ref(false)
const startDelete = (event: AdminEvent) => {
  deleting.value = event
  message.value = ''
  deleteOpen.value = true
}
const confirmDelete = async (reason: string) => {
  if (!deleting.value || busy.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/events/${deleting.value.id}`, { method: 'DELETE', body: { reason } })
    deleteOpen.value = false
    await refresh()
  } catch (e) {
    const blockers = (e as { details?: { details?: { blockers?: string[] } } }).details?.details?.blockers
    message.value = blockers?.length ? blockers.join(' ') : adminError(e)
    deleteOpen.value = false
  } finally {
    busy.value = false
  }
}
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: '活动' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">活动</h1>
        <p class="mt-2 text-sm text-slate-600">维护单场活动。活动可以不属于任何系列，无系列的活动不会出现在前台活动页。仍被专辑引用的活动不能删除。</p>
      </div>
      <div class="flex gap-2">
        <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="editEvent()">新建活动</button>
      </div>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !eventOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="eventOpen" class="rounded-xl border border-slate-200 bg-white p-5">
      <h2 class="font-semibold">{{ eventForm.id ? '编辑活动' : '新建活动' }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="saveEvent">
        <label class="block">活动系列<select v-model="eventForm.event_series_id" :class="input"><option value="">无系列</option><option v-for="item in series" :key="item.id" :value="String(item.id)">{{ item.name }}</option></select></label>
        <label class="block">名称<input v-model="eventForm.name" required maxlength="255" :class="input"></label>
        <label class="block">别名（slug）<input v-model="eventForm.slug" required maxlength="255" pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" placeholder="M3-58" :class="input"><span class="mt-1 block text-xs text-slate-500">活动的短名，例如 M3-58。显示在活动页标题旁，也用来对应采集器和导入包。只能用字母、数字和连字符。</span></label>
        <label class="block">开始日期<input v-model="eventForm.start_date" required type="date" :class="input"></label>
        <label class="block">结束日期<input v-model="eventForm.end_date" type="date" :min="eventForm.start_date" :class="input"></label>
        <label class="block">开场时间<input v-model="eventForm.start_time" type="time" :class="input"></label>
        <label class="block">结束时间<input v-model="eventForm.end_time" type="time" :class="input"></label>
        <label class="block">场馆<input v-model="eventForm.venue" maxlength="255" :class="input"></label>
        <label class="block">地点<input v-model="eventForm.location" maxlength="255" :class="input"></label>
        <label class="block sm:col-span-2">本届官网<input v-model="eventForm.website_url" type="url" maxlength="2048" placeholder="https://" :class="input"></label>
        <div class="sm:col-span-2">
          <label for="event-visual-url">主视觉 / 场刊封面</label>
          <div class="mt-1 flex flex-wrap gap-2">
            <input id="event-visual-url" v-model="eventForm.main_visual_url" type="url" maxlength="2048" placeholder="https://" class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" :disabled="visualUploading" @input="clearVisualSize">
            <label class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2" :class="visualUploading || busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'">
              <Icon name="lucide:upload" class="size-4" />{{ visualUploading ? '正在上传…' : '上传图片' }}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="sr-only" :disabled="visualUploading || busy" @change="uploadVisual">
            </label>
            <button v-if="eventForm.main_visual_url" type="button" class="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-slate-600 hover:text-red-700" :disabled="visualUploading" @click="removeVisual">清除</button>
          </div>
          <span class="mt-1 block text-xs text-slate-500">{{ visualSizeText }}</span>
          <span v-if="visualError" role="alert" class="mt-1 block text-xs text-red-700">{{ visualError }}</span>
          <span v-if="visualMismatch" class="mt-1 block text-xs text-amber-700">图片方向和系列设定的「{{ seriesOrientationLabels[seriesOrientation ?? ''] }}」不一致，前台会按系列比例留白显示。</span>
        </div>
        <img v-if="eventForm.main_visual_url" :src="eventForm.main_visual_url" alt="" class="max-h-56 w-auto max-w-full justify-self-start rounded-lg border border-slate-200 bg-slate-50 object-contain sm:col-span-2" @load="readVisualSize" @error="clearVisualSize">
        <div class="flex items-end justify-end gap-2 sm:col-span-2">
          <p v-if="message" role="alert" class="mr-auto text-red-700">{{ message }}</p>
          <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2" @click="eventOpen = false">取消</button>
          <button type="submit" :disabled="busy || visualUploading" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{{ busy ? '保存中…' : '保存' }}</button>
        </div>
      </form>
    </section>

    <AdminFilterBar>
      <form class="flex flex-wrap items-end gap-2 text-sm" @submit.prevent="applyFilters">
        <input v-model="search" type="search" maxlength="100" placeholder="搜索名称或别名" aria-label="搜索名称或别名" class="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2">
        <select v-model="seriesFilter" aria-label="活动系列" class="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">全部系列</option><option value="none">无系列</option><option v-for="item in series" :key="item.id" :value="String(item.id)">{{ item.name }}</option></select>
        <select v-model="visualFilter" aria-label="配图" class="rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">全部配图</option><option value="missing">缺配图</option></select>
        <button type="submit" class="rounded-lg bg-slate-900 px-3 py-2 text-white">应用</button>
      </form>
    </AdminFilterBar>
    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!events?.events.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-200 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500"><tr><th class="px-4 py-3">名称</th><th class="px-4 py-3">别名（slug）</th><th class="px-4 py-3">活动系列</th><th class="px-4 py-3">开始日期</th><th class="px-4 py-3">发行专辑</th><th class="px-4 py-3" /></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="event in events?.events" :key="event.id">
                <td class="px-4 py-3 font-medium"><div class="flex items-center gap-3"><img v-if="event.main_visual_url" :src="event.main_visual_url" alt="" loading="lazy" :style="{ aspectRatio: imageAspectRatio(event.main_visual_width, event.main_visual_height) }" class="h-12 w-auto max-w-20 shrink-0 rounded bg-slate-50 object-contain"><div>{{ event.name }}<p v-if="event.venue" class="text-xs font-normal text-slate-500">{{ event.venue }}</p></div></div></td>
                <td class="whitespace-nowrap px-4 py-3 font-mono text-xs">{{ event.slug }}</td>
                <td class="px-4 py-3">{{ event.series?.name ?? '—' }}</td>
                <td class="px-4 py-3 tabular-nums">{{ event.start_date }}<template v-if="event.end_date && event.end_date !== event.start_date"> ~ {{ event.end_date }}</template></td>
                <td class="px-4 py-3 tabular-nums">{{ event.released_albums_count }}</td>
                <td class="px-4 py-3"><div class="flex justify-end gap-3 text-xs"><NuxtLink :to="`/admin/events/${event.id}`" class="underline">会场与社团</NuxtLink><button type="button" class="underline" @click="editEvent(event)">编辑</button><button type="button" class="text-red-700" @click="startDelete(event)">删除</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer v-if="events" class="border-t border-slate-100 px-5 py-3"><CommonPagination v-model:page="page" :total-pages="events.pagination.last_page" :disabled="pending" /></footer>
      </AdminListState>
    </section>
    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="`删除“${deleting?.name ?? ''}”`" description="永久删除并写入操作日志。" @confirm="confirmDelete" />
  </div>
</template>
