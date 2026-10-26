<script setup lang="ts">
import type { AdminMailCategory, AdminMailContents, AdminMailLocale, AdminMailTemplate } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const { confirm } = useConfirm()
const { mailError, fieldErrors, localeName, categoryName, time } = useAdminMail()
// `/admin/mail/templates/new` creates a group mail template; system templates come with the site.
const creating = computed(() => route.params.id === 'new')
const { data: template, pending, error, refresh } = await useAsyncData(() => `admin-mail-template-${route.params.id}`,
  () => creating.value ? Promise.resolve(null) : $api<AdminMailTemplate>(`/v1/admin/mail/templates/${route.params.id}`), { watch: [() => route.params.id] })
const { data: categories } = await useAsyncData('admin-mail-categories-all',
  () => $api<{ mail_categories: AdminMailCategory[] }>('/v1/admin/mail/categories').then(response => response.mail_categories))

const system = computed(() => template.value?.kind === 'system')
// The API sends `[]` for an empty JSON object; the copy keeps the form apart from the loaded data.
const contentsOf = (value: unknown): AdminMailContents => (value && typeof value === 'object' && !Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : {}) as AdminMailContents
const form = reactive({ name: '', mail_category_id: null as number | null, contents: { en: { subject: '', body: '' } } as AdminMailContents })
const snapshot = () => JSON.stringify([form.name, form.mail_category_id, form.contents])
const saved = ref(snapshot())
watch(template, (value) => {
  if (!value) return
  Object.assign(form, { name: value.name, mail_category_id: value.mail_category?.id ?? null, contents: contentsOf(value.contents) })
  saved.value = snapshot()
}, { immediate: true })
const dirty = computed(() => saved.value !== snapshot())

const variables = computed(() => template.value?.variables ?? ADMIN_MAIL_CAMPAIGN_VARIABLES)
const categoryOptions = computed(() => (categories.value ?? []).filter(category => category.is_active || category.id === form.mail_category_id))
// A group template without a default category previews with the first active one, for the footer.
const target = computed(() => {
  if (system.value && template.value?.key) return { template_key: template.value.key }
  const categoryId = form.mail_category_id ?? categoryOptions.value[0]?.id
  return categoryId ? { mail_category_id: categoryId } : null
})

const busy = ref(false)
const notice = ref('')
const message = ref('')
const errors = ref<Record<string, string[]>>({})
const save = async () => {
  busy.value = true
  message.value = ''
  notice.value = ''
  errors.value = {}
  try {
    if (creating.value) {
      const created = await $api<AdminMailTemplate>('/v1/admin/mail/templates', { method: 'POST', body: { name: form.name.trim(), mail_category_id: form.mail_category_id, contents: form.contents } })
      saved.value = snapshot()
      await router.replace(`/admin/mail/templates/${created.id}`)
      return
    }
    await $api(`/v1/admin/mail/templates/${route.params.id}`, { method: 'PUT', body: system.value
      ? { contents: form.contents }
      : { name: form.name.trim(), mail_category_id: form.mail_category_id, contents: form.contents } })
    await refresh()
    notice.value = '已保存'
  } catch (failure) {
    message.value = mailError(failure)
    errors.value = fieldErrors(failure)
  } finally {
    busy.value = false
  }
}

// System templates can go back to the default text in code, one language or all of them.
const resetLocale = ref<'all' | AdminMailLocale>('all')
const reset = async () => {
  const language = resetLocale.value === 'all' ? '全部语言' : localeName(resetLocale.value)
  if (!await confirm({ title: `把${language}恢复成默认文案？`, description: '会用代码里的默认文案覆盖当前内容，覆盖后不能撤销。' })) return
  busy.value = true
  message.value = ''
  notice.value = ''
  try {
    await $api(`/v1/admin/mail/templates/${route.params.id}/reset`, { method: 'POST', body: resetLocale.value === 'all' ? {} : { locales: [resetLocale.value] } })
    await refresh()
    notice.value = `已把${language}恢复成默认文案。`
  } catch (failure) {
    message.value = mailError(failure)
  } finally {
    busy.value = false
  }
}
const remove = async () => {
  if (!await confirm({ title: `删除模板「${template.value?.name ?? ''}」？`, description: '已经用这个模板建好的群发不受影响。' })) return
  busy.value = true
  try {
    await $api(`/v1/admin/mail/templates/${route.params.id}`, { method: 'DELETE' })
    await router.push('/admin/mail/templates')
  } catch (failure) {
    message.value = mailError(failure)
  } finally {
    busy.value = false
  }
}
const locales = ADMIN_MAIL_LOCALES
const field = 'rounded-lg border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50'
useHead({ title: computed(() => creating.value ? '新建群发模板' : template.value?.name || '邮件模板') })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-5 p-4 sm:p-8">
    <header>
      <NuxtLink to="/admin/mail/templates" class="text-sm text-slate-600 underline">返回列表</NuxtLink>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <h1 class="text-3xl font-bold">{{ creating ? '新建群发模板' : template?.name }}</h1>
        <span v-if="template" class="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{{ mailTemplateKindLabels[template.kind] }}</span>
        <span v-if="template?.key" class="font-mono text-xs text-slate-400">{{ template.key }}</span>
        <span v-if="template" class="ml-auto text-xs text-slate-500">{{ time(template.updated_at) }} 由 {{ template.updated_by?.username ?? '—' }} 修改</span>
      </div>
      <p v-if="system" class="mt-2 text-sm text-slate-600">必需的变量必须出现在每种语言的正文里，保存后马上生效。模板出错时系统会改用默认文案发出。</p>
    </header>

    <p v-if="notice" role="status" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{{ notice }}</p>
    <p v-if="message" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ message }}</p>

    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <section v-if="!system" class="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm md:grid-cols-2">
        <label class="block">名称
          <input v-model="form.name" required maxlength="100" :disabled="busy" :class="[field, 'mt-1 w-full']">
          <span v-for="nameError in errors.name ?? []" :key="nameError" class="mt-1 block text-xs text-red-700">{{ nameError }}</span>
        </label>
        <label class="block">默认类型
          <select v-model="form.mail_category_id" :disabled="busy" :class="[field, 'mt-1 w-full']">
            <option :value="null">—</option>
            <option v-for="category in categoryOptions" :key="category.id" :value="category.id">{{ categoryName(category) }}</option>
          </select>
          <span class="mt-1 block text-xs text-slate-500">群发载入这个模板时，会顺带选上这个类型。</span>
        </label>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <AdminMailContentEditor v-model="form.contents" :target="target" :variables="variables" :required="template?.required" :secret="template?.secret" :errors="errors" :disabled="busy" />
      </section>

      <AdminMailTestSend :target="target" :contents="form.contents" :disabled="busy" @errors="errors = $event" />

      <section v-if="system" class="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <label class="block">恢复默认文案
          <select v-model="resetLocale" :disabled="busy" :class="[field, 'mt-1 block']">
            <option value="all">全部语言</option>
            <option v-for="locale in locales" :key="locale" :value="locale">{{ localeName(locale) }}</option>
          </select>
        </label>
        <button type="button" :disabled="busy" class="rounded-lg border px-3 py-2 disabled:opacity-40" @click="reset">恢复</button>
        <p class="w-full text-xs text-slate-500">会用代码里的默认文案覆盖当前内容，覆盖后不能撤销。</p>
      </section>

      <div class="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white/95 py-4 text-sm backdrop-blur">
        <button type="button" :disabled="busy || (!dirty && !creating)" class="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40" @click="save">{{ creating ? '新建群发模板' : '保存' }}</button>
        <span v-if="dirty && !creating" class="text-xs text-amber-700">有未保存的修改</span>
        <button v-if="template && !system" type="button" :disabled="busy" class="ml-auto rounded-lg border border-red-200 px-3 py-2 text-red-700 disabled:opacity-40" @click="remove">删除</button>
      </div>
    </AdminListState>
  </div>
</template>
