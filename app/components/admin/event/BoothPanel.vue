<script setup lang="ts">
import type { AdminPagination } from '~/types/admin'

/**
 * The booths of one event for the admin to check (docs/events/README.md#后台核对): what the import
 * linked or suggested, and the artists an admin settles on, existing or new.
 */
interface BoothArtist { id: number, name: string, type: string | null, image_url: string | null }
interface AdminBooth {
  id: number
  space_code: string | null
  event_space_id: number | null
  name: string
  name_kana: string | null
  name_parts: string[] | null
  genre: string | null
  twitter_handle: string | null
  image_url: string | null
  description: string | null
  links: { type: string, url: string }[] | null
  artists: (BoothArtist & { linked_by: 'auto' | 'manual' })[]
  suggestions: { artist: BoothArtist, by: 'handle' | 'url' | 'name' | 'part' }[]
  artists_confirmed_at: string | null
}
/** One artist the editor will link: an existing one, or a new circle artist. */
type BoothPick = { kind: 'existing', artist: BoothArtist } | { kind: 'new', name: string, name_kana: string, links: string[] }

const props = defineProps<{ eventId: number }>()
const { $api } = useNuxtApp()
const boothStateLabels: Record<string, string> = {
  '': '全部', 'pending': '待核对', 'suspect': '名字可疑', 'suggested': '有建议', 'unlinked': '未关联', 'linked': '已关联', 'confirmed': '已核对',
}
const suggestionLabels: Record<string, string> = { handle: 'X 账号相同', url: '链接相同', name: '同名', part: '名字片段同名' }

const query = reactive({ search: '', state: 'pending', page: 1 })
const { data, pending, error, refresh } = useAsyncData(`admin-event-booths-${props.eventId}`,
  () => $api<{ booths: AdminBooth[], pagination: AdminPagination }>(`/v1/admin/events/${props.eventId}/booths`, {
    query: { search: query.search || undefined, state: query.state || undefined, page: query.page, per_page: 50 },
  }), { watch: [() => query.state, () => query.page] })
const search = () => {
  query.page = 1
  refresh()
}
defineExpose({ refresh })

const busy = ref(false)
const message = ref('')
const notice = ref('')

// ===== Selecting booths for new artists =====
const selected = ref(new Set<number>())
watch(data, () => { selected.value = new Set() })
const selectable = (booth: AdminBooth) => !booth.artists_confirmed_at && !booth.artists.length && (booth.name_parts?.length ?? 0) < 2
const toggleSelected = (id: number) => {
  const next = new Set(selected.value)
  if (!next.delete(id)) next.add(id)
  selected.value = next
}
const selectPage = () => {
  selected.value = new Set((data.value?.booths ?? []).filter(selectable).map(booth => booth.id))
}
const createSelected = async () => {
  const ids = [...selected.value]
  if (!ids.length || !window.confirm(`为选中的 ${ids.length} 个摊位各新建一个社团艺术家？同名的摊位共用一个，建好后这些摊位标为已核对。`)) return
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    const result = await $api<{ created: number, linked: number, skipped: { id: number, name: string, reason: string }[] }>(
      `/v1/admin/events/${props.eventId}/booths/create-artists`, { method: 'POST', body: { booth_ids: ids } })
    notice.value = `新建 ${result.created} 个艺术家，关联了 ${result.linked} 个摊位。`
      + (result.skipped.length ? ` 跳过 ${result.skipped.length} 个：${result.skipped.map(s => `${s.name}（${s.reason}）`).join('、')}` : '')
    await refresh()
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}

// ===== Editing one booth =====
const editing = ref<number | null>(null)
const picks = ref<BoothPick[]>([])
const artistQuery = ref('')
const artistResults = ref<BoothArtist[]>([])
let searchToken = 0
watch(artistQuery, async (value) => {
  const token = ++searchToken
  if (!value.trim()) {
    artistResults.value = []
    return
  }
  try {
    const found = await $api<{ artists: BoothArtist[] }>('/v1/artists', { query: { search: value.trim(), per_page: 8 }, progress: false })
    if (token === searchToken) artistResults.value = found.artists
  } catch {
    artistResults.value = []
  }
})
const startEdit = (booth: AdminBooth) => {
  editing.value = booth.id
  picks.value = booth.artists.map(artist => ({ kind: 'existing', artist }))
  artistQuery.value = ''
  message.value = ''
}
const picked = (id: number) => picks.value.some(pick => pick.kind === 'existing' && pick.artist.id === id)
const addExisting = (artist: BoothArtist) => {
  if (!picked(artist.id)) picks.value.push({ kind: 'existing', artist })
}
// A new artist takes the reading only when the name is the booth's own (or the booth's without its reading).
const addNew = (booth: AdminBooth, name: string) => {
  const own = name === booth.name || (booth.name_parts?.length === 1 && name === booth.name_parts[0])
  const single = !booth.name_parts || booth.name_parts.length === 1
  picks.value.push({ kind: 'new', name, name_kana: own ? booth.name_kana ?? '' : '', links: single ? (booth.links ?? []).map(link => link.url) : [] })
}
const toggleLink = (pick: Extract<BoothPick, { kind: 'new' }>, url: string) => {
  pick.links = pick.links.includes(url) ? pick.links.filter(u => u !== url) : [...pick.links, url]
}
const save = async (booth: AdminBooth, chosen: BoothPick[]) => {
  if (chosen.some(pick => pick.kind === 'new' && !pick.name.trim())) {
    message.value = '新建的艺术家要有名字。'
    return
  }
  busy.value = true
  message.value = ''
  try {
    await $api(`/v1/admin/event-booths/${booth.id}/artists`, {
      method: 'PUT',
      body: {
        artists: chosen.map(pick => pick.kind === 'existing'
          ? { id: pick.artist.id }
          : { name: pick.name.trim(), name_kana: pick.name_kana.trim() || null, links: pick.links }),
      },
    })
    editing.value = null
    await refresh()
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}
const confirmAsIs = (booth: AdminBooth) => save(booth, booth.artists.map(artist => ({ kind: 'existing', artist })))
const setNone = (booth: AdminBooth) => window.confirm(`把「${booth.name}」标为不关联艺术家？以后的导入不会再给它关联。`) && save(booth, [])
const linkLabel = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
</script>

<template>
  <div class="space-y-4">
    <p class="max-w-3xl text-sm text-slate-600">
      导入只关联有把握的艺术家，其余给出建议，不会新建。合办的摊位可以关联几个艺术家；核对过的摊位以后的导入不再改动。
      没有作品的社团不必建艺术家，等采集到专辑时再建也可以。
    </p>
    <form class="flex flex-wrap items-end gap-3 text-sm" @submit.prevent="search">
      <label class="block">搜索<input v-model="query.search" type="search" class="mt-1 w-64 rounded-lg border border-slate-300 px-3 py-2" placeholder="名称、摊位号或 X 账号"></label>
      <label class="block">状态
        <select v-model="query.state" class="mt-1 rounded-lg border border-slate-300 px-3 py-2" @change="query.page = 1">
          <option v-for="(label, value) in boothStateLabels" :key="value" :value="value">{{ label }}</option>
        </select>
      </label>
      <button type="submit" class="rounded-lg border border-slate-300 px-4 py-2">搜索</button>
      <span class="ml-auto flex items-center gap-2">
        <button type="button" class="rounded-lg border border-slate-300 px-3 py-2" @click="selectPage">选中本页可新建的</button>
        <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50" :disabled="busy || !selected.size" @click="createSelected">
          为选中的 {{ selected.size }} 个摊位新建艺术家
        </button>
      </span>
    </form>
    <p v-if="notice" role="status" class="text-sm text-emerald-700">{{ notice }}</p>
    <p v-if="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <AdminListState :pending="pending && !data" :error="error" :empty="!data?.booths.length" @retry="refresh()">
      <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
            <tr><th class="w-8 px-3 py-3" /><th class="px-4 py-3">摊位</th><th class="px-4 py-3">位置</th><th class="px-4 py-3">艺术家</th><th class="px-4 py-3" /></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="booth in data?.booths" :key="booth.id">
              <tr class="align-top">
                <td class="px-3 py-3">
                  <input type="checkbox" :checked="selected.has(booth.id)" :disabled="!selectable(booth)" :aria-label="`选中 ${booth.name}`" @change="toggleSelected(booth.id)">
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-start gap-3">
                    <img v-if="booth.image_url" :src="booth.image_url" alt="" loading="lazy" class="size-12 shrink-0 rounded object-cover">
                    <div class="min-w-0">
                      <p class="font-medium">{{ booth.name }}</p>
                      <p class="text-xs text-slate-500">{{ booth.name_kana }}</p>
                      <p v-if="booth.name_parts" class="mt-1 text-xs text-amber-700">
                        {{ booth.name_parts.length > 1 ? '可能是几个名字：' : '去掉读音：' }}{{ booth.name_parts.join(' · ') }}
                      </p>
                      <p v-if="booth.twitter_handle" class="mt-1 text-xs"><a :href="`https://x.com/${booth.twitter_handle}`" target="_blank" rel="noopener" class="text-sky-700 hover:underline">@{{ booth.twitter_handle }}</a></p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 font-mono text-xs">{{ booth.space_code ?? '场外' }}<span v-if="booth.space_code && !booth.event_space_id" class="ml-1 text-red-600" title="平面图上没有这个摊位">!</span></td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <span v-for="artist in booth.artists" :key="artist.id" class="inline-flex items-center gap-1">
                      <NuxtLink :to="`/artists/${artist.id}`" target="_blank" class="underline">{{ artist.name }}</NuxtLink>
                      <span class="rounded px-1.5 py-0.5 text-[11px]" :class="artist.linked_by === 'auto' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'">{{ artist.linked_by === 'auto' ? '自动' : '手动' }}</span>
                    </span>
                    <span v-if="!booth.artists.length" class="text-slate-400">{{ booth.artists_confirmed_at ? '不关联' : '未关联' }}</span>
                    <span v-if="booth.artists_confirmed_at" class="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">已核对</span>
                  </div>
                  <p v-if="booth.suggestions.length && !booth.artists_confirmed_at" class="mt-1 text-xs text-slate-500">
                    建议：<span v-for="(suggestion, n) in booth.suggestions" :key="suggestion.artist.id">{{ n ? '、' : '' }}{{ suggestion.artist.name }}（{{ suggestionLabels[suggestion.by] }}）</span>
                  </p>
                </td>
                <td class="whitespace-nowrap px-4 py-3 text-right text-xs">
                  <button type="button" class="rounded-lg border border-slate-300 px-2.5 py-1" @click="editing === booth.id ? (editing = null) : startEdit(booth)">{{ editing === booth.id ? '收起' : '设置' }}</button>
                  <template v-if="!booth.artists_confirmed_at">
                    <button v-if="booth.artists.length" type="button" class="ml-1 rounded-lg border border-slate-300 px-2.5 py-1" :disabled="busy" @click="confirmAsIs(booth)">确认</button>
                    <button type="button" class="ml-1 rounded-lg border border-slate-300 px-2.5 py-1 text-red-700" :disabled="busy" @click="setNone(booth)">不关联</button>
                  </template>
                </td>
              </tr>
              <tr v-if="editing === booth.id">
                <td />
                <td colspan="4" class="px-4 pb-4">
                  <div class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p v-if="booth.description" class="line-clamp-3 whitespace-pre-line text-xs text-slate-600">{{ booth.description }}</p>
                    <div>
                      <p class="text-xs font-medium text-slate-500">要关联的艺术家（按顺序）</p>
                      <p v-if="!picks.length" class="mt-1 text-sm text-slate-400">还没有选。保存一个空列表等于「不关联」。</p>
                      <ul class="mt-1 space-y-2">
                        <li v-for="(pick, n) in picks" :key="n" class="rounded-lg border border-slate-200 bg-white p-2 text-sm">
                          <div class="flex items-center gap-2">
                            <template v-if="pick.kind === 'existing'">
                              <span class="font-medium">{{ pick.artist.name }}</span>
                              <span class="text-xs text-slate-400">#{{ pick.artist.id }} · {{ pick.artist.type }}</span>
                            </template>
                            <template v-else>
                              <span class="rounded bg-violet-50 px-1.5 py-0.5 text-[11px] text-violet-700">新建</span>
                              <input v-model="pick.name" class="w-56 rounded border border-slate-300 px-2 py-1" placeholder="名字">
                              <input v-model="pick.name_kana" class="w-48 rounded border border-slate-300 px-2 py-1" placeholder="读音（可空）">
                            </template>
                            <button type="button" class="ml-auto text-xs text-slate-500 underline" @click="picks.splice(n, 1)">移除</button>
                          </div>
                          <div v-if="pick.kind === 'new' && booth.links?.length" class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                            <span class="text-slate-500">带上链接：</span>
                            <label v-for="link in booth.links" :key="link.url" class="inline-flex items-center gap-1">
                              <input type="checkbox" :checked="pick.links.includes(link.url)" @change="toggleLink(pick, link.url)">{{ linkLabel(link.url) }}
                            </label>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <div v-if="booth.suggestions.length" class="flex flex-wrap items-center gap-2 text-xs">
                      <span class="text-slate-500">建议：</span>
                      <button v-for="suggestion in booth.suggestions" :key="suggestion.artist.id" type="button" class="rounded-lg border border-slate-300 bg-white px-2 py-1 disabled:opacity-40" :disabled="picked(suggestion.artist.id)" @click="addExisting(suggestion.artist)">
                        + {{ suggestion.artist.name }} <span class="text-slate-400">#{{ suggestion.artist.id }} · {{ suggestionLabels[suggestion.by] }}</span>
                      </button>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                      <span class="text-slate-500">新建：</span>
                      <button v-for="part in booth.name_parts ?? []" :key="part" type="button" class="rounded-lg border border-slate-300 bg-white px-2 py-1" @click="addNew(booth, part)">+ {{ part }}</button>
                      <button type="button" class="rounded-lg border border-slate-300 bg-white px-2 py-1" @click="addNew(booth, booth.name)">+ 按整个名字</button>
                      <button type="button" class="rounded-lg border border-slate-300 bg-white px-2 py-1" @click="addNew(booth, '')">+ 空白</button>
                    </div>
                    <div class="w-96 max-w-full">
                      <input v-model="artistQuery" type="search" class="w-full rounded border border-slate-300 px-2 py-1 text-sm" placeholder="搜索已有的艺术家">
                      <button v-for="artist in artistResults" :key="artist.id" type="button" class="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-white disabled:opacity-40" :disabled="picked(artist.id)" @click="addExisting(artist)">
                        <span class="truncate">{{ artist.name }}</span><span class="text-xs text-slate-400">#{{ artist.id }} · {{ artist.type }}</span>
                      </button>
                    </div>
                    <div class="flex gap-2">
                      <button type="button" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50" :disabled="busy" @click="save(booth, picks)">保存并标为已核对</button>
                      <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm" @click="editing = null">取消</button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <CommonPagination v-if="data" class="mt-4" :page="query.page" :total-pages="data.pagination.last_page" @update:page="query.page = $event" />
    </AdminListState>
  </div>
</template>
