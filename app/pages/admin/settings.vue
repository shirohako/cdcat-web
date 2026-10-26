<script setup lang="ts">
import type { AdminSiteSettings } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { data, pending, error, refresh } = await useAsyncData('admin-settings', () => $api<AdminSiteSettings>('/v1/admin/settings'))

// datetime-local works in the viewer's local time; the API stores UTC.
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
const form = reactive({ registration_open: true, content: '', level: 'info' as 'info' | 'warning', enabled: false, ends_at: '', article_content_min: 100, image_cleanup_days: 30, reason: '' })
watch(data, (value) => {
  if (!value) return
  const { registration_open, announcement, article_content_min, image_cleanup_days } = value.settings
  Object.assign(form, { registration_open, content: announcement.content, level: announcement.level, enabled: announcement.enabled, ends_at: toLocalInput(announcement.ends_at), article_content_min, image_cleanup_days, reason: '' })
}, { immediate: true })
const busy = ref(false)
const message = ref('')
const notice = ref('')
const save = async () => {
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    data.value = await $api<AdminSiteSettings>('/v1/admin/settings', { method: 'PUT', body: {
      registration_open: form.registration_open,
      announcement: { content: form.content, level: form.level, enabled: form.enabled, ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null },
      article_content_min: form.article_content_min,
      image_cleanup_days: form.image_cleanup_days,
      reason: form.reason || null,
    } })
    notice.value = '已保存'
  } catch (e) {
    message.value = adminError(e)
  } finally {
    busy.value = false
  }
}
const updated = (key: string) => {
  const meta = data.value?.updated[key]
  if (!meta?.updated_at) return ''
  const time = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(meta.updated_at))
  return `${meta.updated_by?.nickname || meta.updated_by?.username || '—'} 于 ${time} 修改`
}
const input = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2'
useHead({ title: '站点设置' })
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5 p-4 sm:p-8">
    <header>
      <h1 class="text-3xl font-bold">站点设置</h1>
      <p class="mt-2 text-sm text-slate-600">注册开关和全站公告。每次修改都会写入操作日志。</p>
    </header>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <form v-if="data" class="space-y-5 text-sm" @submit.prevent="save">
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="font-semibold">注册</h2>
          <label class="mt-3 flex items-center gap-2"><input v-model="form.registration_open" type="checkbox">开放新用户注册</label>
          <p class="mt-2 text-xs text-slate-500">关闭后注册页显示“暂停注册”，注册和注册验证码接口都会拒绝请求，已有账号不受影响。</p>
          <p v-if="updated('registration_open')" class="mt-1 text-xs text-slate-400">{{ updated('registration_open') }}</p>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="font-semibold">全站公告</h2>
          <label class="mt-3 flex items-center gap-2"><input v-model="form.enabled" type="checkbox">显示公告</label>
          <label class="mt-3 block">公告内容<textarea v-model="form.content" maxlength="2000" rows="3" :class="input" /></label>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="block">级别<select v-model="form.level" :class="input"><option value="info">提示</option><option value="warning">警告</option></select></label>
            <label class="block">结束时间（可选）<input v-model="form.ends_at" type="datetime-local" :class="input"></label>
          </div>
          <p class="mt-2 text-xs text-slate-500">当前版本 {{ data.settings.announcement.version }}。修改内容、级别或重新启用时版本加一，已关闭横幅的访客会再次看到。</p>
          <p v-if="updated('announcement')" class="mt-1 text-xs text-slate-400">{{ updated('announcement') }}</p>
          <div v-if="form.enabled && form.content.trim()" class="mt-4 rounded-lg border px-4 py-2.5" :class="form.level === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900'">
            <p class="text-xs opacity-70">预览</p>
            <p class="whitespace-pre-line">{{ form.content }}</p>
          </div>
          <p class="mt-2 text-xs text-slate-500">{{ data.public.announcement ? '公告正在前台显示。' : '前台当前没有显示公告。' }}</p>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="font-semibold">文章</h2>
          <label class="mt-3 block max-w-xs">发布所需的最少字数
            <input v-model.number="form.article_content_min" type="number" min="0" max="100000" required :class="input">
          </label>
          <p class="mt-2 text-xs text-slate-500">按正文纯文本计算（不含空白和 Markdown 标记）。发布、以及更新已发布或已隐藏的文章时检查，草稿不受限制。0 表示不限制。</p>
          <p v-if="updated('article_content_min')" class="mt-1 text-xs text-slate-400">{{ updated('article_content_min') }}</p>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-5">
          <h2 class="font-semibold">图片</h2>
          <label class="mt-3 block max-w-xs">未使用图片保留天数
            <input v-model.number="form.image_cleanup_days" type="number" min="1" max="365" required :class="input">
          </label>
          <p class="mt-2 text-xs text-slate-500">当前没有内容在用的图片，未使用超过这个天数后，会在每天的清理中删除（1–365 天）。调小后，下一次清理会删除未使用超过新天数的所有图片。</p>
          <p v-if="updated('image_cleanup_days')" class="mt-1 text-xs text-slate-400">{{ updated('image_cleanup_days') }}</p>
        </section>
        <label class="block">原因（可选，写入操作日志）<input v-model="form.reason" maxlength="2000" :class="input"></label>
        <div class="flex items-center justify-end gap-3">
          <p v-if="notice" role="status" class="mr-auto text-emerald-700">{{ notice }}</p>
          <p v-if="message" role="alert" class="mr-auto text-red-700">{{ message }}</p>
          <button type="submit" :disabled="busy" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{{ busy ? '保存中…' : '保存' }}</button>
        </div>
      </form>
    </AdminListState>
  </div>
</template>
