<script setup lang="ts">
import type { AdminMailTemplateSummary } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { localeName, categoryName, time } = useAdminMail()
const mailTemplateKindHelpLabels: Record<string, string> = { system: '由系统事件发出。不能删除，只能修改各语言的内容，可以恢复默认文案。', campaign: '新建群发时可以载入，内容会复制到群发里，之后再改模板不影响已有的群发。' }
const { data, pending, error, refresh } = await useAsyncData('admin-mail-templates',
  () => $api<{ mail_templates: AdminMailTemplateSummary[] }>('/v1/admin/mail/templates').then(response => response.mail_templates))
const system = computed(() => (data.value ?? []).filter(template => template.kind === 'system'))
const group = computed(() => (data.value ?? []).filter(template => template.kind === 'campaign'))
useHead({ title: '邮件模板' })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">邮件模板</h1>
        <p class="mt-2 text-sm text-slate-600">系统邮件（验证码、找回密码、欢迎等）的文案在这里修改；群发模板是可以反复使用的群发内容。</p>
      </div>
      <NuxtLink to="/admin/mail/templates/new" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">新建群发模板</NuxtLink>
    </header>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <section v-for="list in [{ key: 'system', items: system }, { key: 'campaign', items: group }]" :key="list.key" class="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-semibold">{{ mailTemplateKindLabels[list.key] }}</h2>
          <p class="mt-1 text-xs text-slate-500">{{ mailTemplateKindHelpLabels[list.key] }}</p>
        </header>
        <p v-if="!list.items.length" class="px-5 py-8 text-center text-sm text-slate-500">暂无模板</p>
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="template in list.items" :key="template.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
            <NuxtLink :to="`/admin/mail/templates/${template.id}`" class="font-medium underline">{{ template.name }}</NuxtLink>
            <span v-if="template.key" class="font-mono text-xs text-slate-400">{{ template.key }}</span>
            <span v-if="template.mail_category" class="text-xs text-slate-600">默认类型：{{ categoryName(template.mail_category) }}</span>
            <span class="flex flex-wrap gap-1">
              <span v-for="locale in template.locales" :key="locale" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{{ localeName(locale) }}</span>
            </span>
            <span class="ml-auto text-xs text-slate-500">{{ time(template.updated_at) }} 由 {{ template.updated_by?.username ?? '—' }} 修改</span>
          </li>
        </ul>
      </section>
    </AdminListState>
  </div>
</template>
