<script setup lang="ts">
const { site } = useSite()
const { t } = useI18n()
const storageKey = 'site:announcement:dismissed'
// Read after mount so the server render and hydration agree.
const dismissed = ref<number | null>(null)
onMounted(() => {
  try {
    dismissed.value = Number(localStorage.getItem(storageKey)) || null
  } catch { /* Storage may be unavailable; keep showing the banner. */ }
})
const announcement = computed(() => site.value?.announcement)
const visible = computed(() => announcement.value && announcement.value.version !== dismissed.value)
const dismiss = () => {
  if (!announcement.value) return
  dismissed.value = announcement.value.version
  try {
    localStorage.setItem(storageKey, String(announcement.value.version))
  } catch { /* Ignore storage failures; the banner stays hidden for this visit. */ }
}
</script>

<template>
  <div
    v-if="visible && announcement" role="status"
    class="flex items-start gap-3 border-b px-4 py-2.5 text-sm"
    :class="announcement.level === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900'"
  >
    <Icon :name="announcement.level === 'warning' ? 'lucide:triangle-alert' : 'lucide:info'" class="mt-0.5 size-4 shrink-0" />
    <p class="min-w-0 flex-1 whitespace-pre-line wrap-break-word">{{ announcement.content }}</p>
    <button type="button" class="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100" :aria-label="t('site.dismiss_announcement')" @click="dismiss">
      <Icon name="lucide:x" class="size-4" />
    </button>
  </div>
</template>
