<script setup lang="ts">
import type { AdminMailTemplateSummary } from '~/types/admin'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $api } = useNuxtApp()
const { t, localeName, categoryName, time } = useAdminMail()
const { data, pending, error, refresh } = await useAsyncData('admin-mail-templates',
  () => $api<{ mail_templates: AdminMailTemplateSummary[] }>('/v1/admin/mail/templates').then(response => response.mail_templates))
const system = computed(() => (data.value ?? []).filter(template => template.kind === 'system'))
const group = computed(() => (data.value ?? []).filter(template => template.kind === 'campaign'))
useHead({ title: computed(() => t('admin_pages.mail.templates.title')) })
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin_pages.mail.templates.title') }}</h1>
        <p class="mt-2 text-sm text-slate-600">{{ t('admin_pages.mail.templates.description') }}</p>
      </div>
      <NuxtLink to="/admin/mail/templates/new" class="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">{{ t('admin_pages.mail.templates.create') }}</NuxtLink>
    </header>
    <AdminListState :pending="pending" :error="error" @retry="refresh()">
      <section v-for="list in [{ key: 'system', items: system }, { key: 'campaign', items: group }]" :key="list.key" class="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-semibold">{{ t(`admin_pages.mail.templates.kind.${list.key}`) }}</h2>
          <p class="mt-1 text-xs text-slate-500">{{ t(`admin_pages.mail.templates.kind_help.${list.key}`) }}</p>
        </header>
        <p v-if="!list.items.length" class="px-5 py-8 text-center text-sm text-slate-500">{{ t('admin_pages.mail.templates.none') }}</p>
        <ul v-else class="divide-y divide-slate-100">
          <li v-for="template in list.items" :key="template.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
            <NuxtLink :to="`/admin/mail/templates/${template.id}`" class="font-medium underline">{{ template.name }}</NuxtLink>
            <span v-if="template.key" class="font-mono text-xs text-slate-400">{{ template.key }}</span>
            <span v-if="template.mail_category" class="text-xs text-slate-600">{{ t('admin_pages.mail.templates.default_category') }}：{{ categoryName(template.mail_category) }}</span>
            <span class="flex flex-wrap gap-1">
              <span v-for="locale in template.locales" :key="locale" class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{{ localeName(locale) }}</span>
            </span>
            <span class="ml-auto text-xs text-slate-500">{{ t('admin_pages.mail.templates.updated', { time: time(template.updated_at), user: template.updated_by?.username ?? '—' }) }}</span>
          </li>
        </ul>
      </section>
    </AdminListState>
  </div>
</template>
