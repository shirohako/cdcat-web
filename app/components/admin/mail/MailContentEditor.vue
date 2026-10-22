<script setup lang="ts">
import type { AdminMailContents, AdminMailLocale, AdminMailPreview, AdminMailTarget } from '~/types/admin'

/**
 * A mail's subject and Markdown body in each language, beside the mail exactly as it would be
 * sent: the server renders the preview (POST /v1/admin/mail/preview) with sample values.
 */
const props = withDefaults(defineProps<{
  /** The system template or group mail category the preview renders as; null shows no preview. */
  target: AdminMailTarget | null
  variables: string[]
  /** Variables every language's body must contain. */
  required?: string[]
  /** Variables that may not go in the subject. */
  secret?: string[]
  /** Messages of the last save, keyed `contents.{locale}.{field}`. */
  errors?: Record<string, string[]>
  disabled?: boolean
}>(), { required: () => [], secret: () => [], errors: () => ({}), disabled: false })
const contents = defineModel<AdminMailContents>({ required: true })

const { $api } = useNuxtApp()
const { t, localeName, mailError } = useAdminMail()
const locales = ADMIN_MAIL_LOCALES
const active = ref<AdminMailLocale>('en')
const version = computed(() => contents.value[active.value] ?? { subject: '', body: '' })
const update = (field: 'subject' | 'body', value: string) => {
  contents.value = { ...contents.value, [active.value]: { ...version.value, [field]: value } }
}
const subject = computed({ get: () => version.value.subject, set: value => update('subject', value) })
const body = computed({ get: () => version.value.body, set: value => update('body', value) })
const written = (locale: AdminMailLocale) => Boolean(contents.value[locale]?.subject.trim() || contents.value[locale]?.body.trim())
const hasErrors = (locale: AdminMailLocale) => Object.keys(props.errors).some(key => key === `contents.${locale}` || key.startsWith(`contents.${locale}.`))
const messagesFor = (field: 'subject' | 'body') => props.errors[`contents.${active.value}.${field}`] ?? []
const localeMessages = computed(() => props.errors[`contents.${active.value}`] ?? [])
/** Drops a translation, so readers of that language get the English version. */
const removeLocale = () => {
  if (active.value === 'en') return
  contents.value = Object.fromEntries(Object.entries(contents.value).filter(([locale]) => locale !== active.value))
}

// Variables go where the cursor was last: the subject or the body.
const token = (name: string) => `{{${name}}}`
const editor = useTemplateRef<{ insert: (text: string) => void }>('editor')
const subjectInput = useTemplateRef<HTMLInputElement>('subjectInput')
const lastField = ref<'subject' | 'body'>('body')
const insertVariable = async (name: string) => {
  const text = token(name)
  const input = subjectInput.value
  if (lastField.value === 'subject' && input) {
    const start = input.selectionStart ?? input.value.length
    const end = input.selectionEnd ?? start
    subject.value = input.value.slice(0, start) + text + input.value.slice(end)
    await nextTick()
    input.focus()
    input.setSelectionRange(start + text.length, start + text.length)
    return
  }
  editor.value?.insert(text)
}

const preview = ref<AdminMailPreview | null>(null)
const previewError = ref('')
const previewing = ref(false)
const showText = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let latest = 0
watch(() => [props.target, active.value, version.value.subject, version.value.body], () => {
  clearTimeout(timer)
  if (!props.target) {
    preview.value = null
    return
  }
  timer = setTimeout(async () => {
    const request = ++latest
    previewing.value = true
    try {
      const result = await $api<AdminMailPreview>('/v1/admin/mail/preview', {
        method: 'POST', progress: false,
        body: { ...props.target, locale: active.value, subject: version.value.subject, body: version.value.body },
      })
      if (request === latest) {
        preview.value = result
        previewError.value = ''
      }
    } catch (failure) {
      if (request === latest) previewError.value = mailError(failure)
    } finally {
      if (request === latest) previewing.value = false
    }
  }, 500)
}, { immediate: true, deep: true })
onBeforeUnmount(() => clearTimeout(timer))
const previewProblems = computed(() => [...(preview.value?.problems.subject ?? []), ...(preview.value?.problems.body ?? [])])
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2" role="tablist" :aria-label="t('admin_pages.mail.editor.languages')">
      <button
        v-for="locale in locales" :key="locale" type="button" role="tab" :aria-selected="active === locale"
        class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm" :class="active === locale ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white'"
        @click="active = locale"
      >
        {{ localeName(locale) }}<span v-if="locale === 'en'" :class="active === locale ? 'text-amber-300' : 'text-red-600'">*</span>
        <span v-if="hasErrors(locale)" class="size-2 rounded-full bg-red-500" :title="t('admin_pages.mail.editor.has_errors')" />
        <span v-else-if="written(locale)" class="size-2 rounded-full bg-emerald-500" :title="t('admin_pages.mail.editor.written')" />
      </button>
    </div>
    <p class="text-xs text-slate-500">{{ active === 'en' ? t('admin_pages.mail.editor.english_help') : t('admin_pages.mail.editor.fallback_help') }}</p>
    <p v-for="message in localeMessages" :key="message" role="alert" class="text-sm text-red-700">{{ message }}</p>

    <div class="grid gap-5 xl:grid-cols-2">
      <div class="min-w-0 space-y-3">
        <label class="block text-sm">{{ t('admin_pages.mail.editor.subject') }}
          <input ref="subjectInput" v-model="subject" :disabled="disabled" maxlength="200" class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50" @focus="lastField = 'subject'">
        </label>
        <p v-for="message in messagesFor('subject')" :key="message" class="text-xs text-red-700">{{ message }}</p>
        <div v-if="!disabled" class="rounded-lg border border-dashed border-slate-300 p-3 text-xs">
          <p class="text-slate-500">{{ t('admin_pages.mail.editor.variables_help') }}</p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="name in variables" :key="name" type="button" class="rounded-md border px-2 py-1 font-mono"
              :class="required.includes(name) ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700'"
              :title="secret.includes(name) ? t('admin_pages.mail.editor.secret_variable') : required.includes(name) ? t('admin_pages.mail.editor.required_variable') : undefined"
              @click="insertVariable(name)"
            >
              {{ token(name) }}<Icon v-if="secret.includes(name)" name="lucide:lock" class="ml-1 inline size-3" />
            </button>
          </div>
          <p v-if="required.length" class="mt-2 text-amber-800">{{ t('admin_pages.mail.editor.required_list', { names: required.map(token).join('、') }) }}</p>
          <p v-if="secret.length" class="mt-1 text-slate-500">{{ t('admin_pages.mail.editor.secret_list', { names: secret.map(token).join('、') }) }}</p>
        </div>
        <div class="text-sm" @focusin="lastField = 'body'">
          <span>{{ t('admin_pages.mail.editor.body') }}</span>
          <div class="mt-1">
            <MarkdownEditor :key="active" ref="editor" v-model="body" mode="edit" :guide-url="null" :disabled="disabled" :max-length="50000" />
          </div>
        </div>
        <p v-for="message in messagesFor('body')" :key="message" class="text-xs text-red-700">{{ message }}</p>
        <p class="text-xs text-slate-500">{{ t('admin_pages.mail.editor.markdown_help') }}</p>
        <button v-if="active !== 'en' && written(active) && !disabled" type="button" class="text-xs text-red-700 underline" @click="removeLocale">
          {{ t('admin_pages.mail.editor.remove_locale', { language: localeName(active) }) }}
        </button>
      </div>

      <section class="min-w-0 space-y-2" :aria-label="t('admin_pages.mail.editor.preview')">
        <div class="flex items-center justify-between gap-2 text-sm">
          <h3 class="font-medium">{{ t('admin_pages.mail.editor.preview') }}<span v-if="previewing" class="ml-2 text-xs font-normal text-slate-400">{{ t('admin_pages.mail.editor.rendering') }}</span></h3>
          <button v-if="preview" type="button" class="text-xs underline" @click="showText = !showText">{{ showText ? t('admin_pages.mail.editor.show_html') : t('admin_pages.mail.editor.show_text') }}</button>
        </div>
        <p v-if="!target" class="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{{ t('admin_pages.mail.editor.no_preview') }}</p>
        <p v-else-if="previewError" role="alert" class="text-sm text-red-700">{{ previewError }}</p>
        <template v-if="target && preview">
          <p class="rounded-lg bg-slate-50 px-3 py-2 text-sm"><span class="text-slate-500">{{ t('admin_pages.mail.editor.subject') }}：</span>{{ preview.subject || '—' }}</p>
          <ul v-if="previewProblems.length" class="space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <li v-for="problem in previewProblems" :key="problem">{{ problem }}</li>
          </ul>
          <pre v-if="showText" class="max-h-[640px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-xs">{{ preview.text }}</pre>
          <iframe v-else :srcdoc="preview.html" sandbox="" :title="t('admin_pages.mail.editor.preview')" class="h-[640px] w-full rounded-lg border border-slate-200 bg-white" />
          <p class="text-xs text-slate-500">{{ t('admin_pages.mail.editor.sample_help') }}</p>
        </template>
      </section>
    </div>
  </div>
</template>
