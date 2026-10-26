<script setup lang="ts">
import type { AdminEventSeries } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()

const { data: series, pending, error, refresh } = await useAsyncData('admin-event-series',
  () => $api<AdminEventSeries[]>('/v1/admin/event-series'))

const busy = ref(false)
const message = ref('')
const notice = ref('')

// ===== Series form =====
const emptySeries = () => ({ id: 0, name: '', slug: '', location: '', website: '', banner_url: '', visual_orientation: 'portrait' as AdminEventSeries['visual_orientation'] })
const seriesForm = reactive(emptySeries())
const seriesOpen = ref(false)
const editSeries = (item?: AdminEventSeries) => {
  Object.assign(seriesForm, emptySeries(), item ? { ...item, website: item.website ?? '', banner_url: item.banner_url ?? '' } : {})
  message.value = ''
  seriesOpen.value = true
}
const saveSeries = async () => {
  busy.value = true
  message.value = ''
  try {
    const body = { name: seriesForm.name, slug: seriesForm.slug, location: seriesForm.location, website: seriesForm.website || null, banner_url: seriesForm.banner_url || null, visual_orientation: seriesForm.visual_orientation }
    await $api(seriesForm.id ? `/v1/admin/event-series/${seriesForm.id}` : '/v1/admin/event-series', { method: seriesForm.id ? 'PUT' : 'POST', body })
    seriesOpen.value = false
    notice.value = '已保存'
    await refresh()
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}

// ===== Delete =====
const deleting = ref<AdminEventSeries | null>(null)
const deleteOpen = ref(false)
const startDelete = (item: AdminEventSeries) => {
  deleting.value = item
  message.value = ''
  deleteOpen.value = true
}
const confirmDelete = async (reason: string) => {
  if (!deleting.value || busy.value) return
  busy.value = true
  try {
    await $api(`/v1/admin/event-series/${deleting.value.id}`, { method: 'DELETE', body: { reason } })
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
useHead({ title: '活动系列' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">活动系列</h1>
        <p class="mt-2 text-sm text-slate-600">维护活动所属的系列，例如 M3、Comic Market。仍有活动的系列不能删除。</p>
      </div>
      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white" @click="editSeries()">新建活动系列</button>
    </header>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message && !seriesOpen" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <section v-if="seriesOpen" class="rounded-xl border border-slate-200 bg-white p-5">
      <h2 class="font-semibold">{{ seriesForm.id ? '编辑活动系列' : '新建活动系列' }}</h2>
      <form class="mt-4 grid gap-4 text-sm sm:grid-cols-2" @submit.prevent="saveSeries">
        <label class="block">名称<input v-model="seriesForm.name" required maxlength="255" :class="input"></label>
        <label class="block">Slug<input v-model="seriesForm.slug" required maxlength="255" pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" :class="input"></label>
        <label class="block">地点<input v-model="seriesForm.location" required maxlength="255" :class="input"></label>
        <label class="block">官网<input v-model="seriesForm.website" type="url" maxlength="2048" :class="input"></label>
        <label class="block">每届配图方向<select v-model="seriesForm.visual_orientation" :class="input"><option v-for="value in ['portrait', 'landscape']" :key="value" :value="value">{{ seriesOrientationLabels[value] }}</option></select><span class="mt-1 block text-xs text-slate-500">决定前台系列页里每届活动配图的版式，同一系列统一比例。</span></label>
        <label class="block sm:col-span-2">横幅图 URL<input v-model="seriesForm.banner_url" type="url" maxlength="2048" placeholder="https://" :class="input"><span class="mt-1 block text-xs text-slate-500">建议 16:9 横图；Logo 会完整显示，不裁切。</span></label>
        <img v-if="seriesForm.banner_url" :src="seriesForm.banner_url" alt="" class="aspect-video w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 object-contain sm:col-span-2">
        <div class="flex items-end justify-end gap-2 sm:col-span-2">
          <p v-if="message" role="alert" class="mr-auto text-red-700">{{ message }}</p>
          <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2" @click="seriesOpen = false">取消</button>
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50">{{ busy ? '保存中…' : '保存' }}</button>
        </div>
      </form>
    </section>

    <section class="rounded-xl border border-slate-200 bg-white">
      <AdminListState :pending="pending" :error="error" :empty="!series?.length" @retry="refresh()">
        <div class="overflow-x-auto">
          <table class="w-full min-w-150 text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500"><tr><th class="px-4 py-3">名称</th><th class="px-4 py-3">地点</th><th class="px-4 py-3">活动数</th><th class="px-4 py-3" /></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in series" :key="item.id">
                <td class="px-4 py-3 font-medium"><div class="flex items-center gap-3"><img v-if="item.banner_url" :src="item.banner_url" alt="" loading="lazy" class="aspect-video w-16 shrink-0 rounded bg-slate-50 object-contain"><div v-else class="aspect-video w-16 shrink-0 rounded bg-slate-100" /><div>{{ item.name }}<p class="text-xs font-normal text-slate-500">{{ item.slug }} · {{ seriesOrientationLabels[item.visual_orientation] }}</p></div></div></td>
                <td class="px-4 py-3">{{ item.location }}</td>
                <td class="px-4 py-3 tabular-nums"><NuxtLink v-if="item.events_count" :to="{ path: '/admin/events', query: { series_id: item.id } }" class="underline decoration-slate-300 underline-offset-4">{{ item.events_count }}</NuxtLink><span v-else class="text-slate-400">0</span></td>
                <td class="px-4 py-3"><div class="flex justify-end gap-3 text-xs"><button type="button" class="underline" @click="editSeries(item)">编辑</button><button type="button" class="text-red-700" @click="startDelete(item)">删除</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminListState>
    </section>

    <AdminConfirmDialog v-model="deleteOpen" :busy="busy" reason-required :title="`删除“${deleting?.name ?? ''}”`" description="永久删除并写入操作日志。" @confirm="confirmDelete" />
  </div>
</template>
