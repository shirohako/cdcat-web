<script setup lang="ts">
/**
 * 粘贴人员表: the dialog with the guide's booklet pasted in, and the table it reads out of it: each line's roles
 * (with the words as written), the name and what it becomes (an artist found by name, a new artist, or, for a name
 * two artists share, a pick still to make, in yellow), and the tracks. The button counts the credits it will add.
 * Role names come from the guide's text, as in the by-role figure.
 */
const props = defineProps<{ text: Record<string, string> }>()
const { t } = useI18n()

const role = (key: string) => props.text[key] ?? key
const PASTED = ['発売元：ステラノート', 'Vocal：星野あかり（M1, M2）', '作詞：ミナト（M1, M2）', '作曲・編曲：ミナト（M1–M3）、Yuki（M4）', 'Illustration：mochi', 'Mastering：Hoshi Studio']
const ROWS = [
  { roles: ['publisher'], source: '発売元', name: 'ステラノート', match: 'existing', tracks: '' },
  { roles: ['vocals'], source: 'Vocal', name: '星野あかり', match: 'existing', tracks: 'Disc 1 Track 1–2' },
  { roles: ['lyricist'], source: '作詞', name: 'ミナト', match: 'existing', tracks: 'Disc 1 Track 1–2' },
  { roles: ['composer', 'arranger'], source: '作曲・編曲', name: 'ミナト', match: 'existing', tracks: 'Disc 1 Track 1–3' },
  { roles: ['composer', 'arranger'], source: '作曲・編曲', name: 'Yuki', match: 'new', tracks: 'Disc 1 Track 4' },
  { roles: ['illustrator'], source: 'Illustration', name: 'mochi', match: 'namesakes', tracks: '' },
  { roles: ['mastering_engineer'], source: 'Mastering', name: 'Hoshi Studio', match: 'new', tracks: '' },
]
/** What the 添加 button counts: a credit per role of every settled row. */
const count = ROWS.filter(row => row.match !== 'namesakes').reduce((sum, row) => sum + row.roles.length, 0)
</script>

<template>
  <div class="mx-auto max-w-2xl overflow-hidden rounded-lg bg-popover shadow-overlay ring-1 ring-line" aria-hidden="true">
    <p class="flex items-center gap-2 border-b border-line px-3 py-2 text-[13px] font-semibold text-title">
      <Icon name="lucide:clipboard-paste" class="size-3.5 text-primary" />{{ t('editor.paste_credits.title') }}
    </p>
    <div class="space-y-2.5 p-3">
      <div class="rounded-md border border-field-line bg-field px-2 py-1.5 font-mono text-[10px] leading-4 text-title">
        <p v-for="line in PASTED" :key="line" class="truncate">{{ line }}</p>
      </div>
      <div class="overflow-x-auto rounded-md ring-1 ring-line">
        <table class="w-full min-w-[30rem] border-separate border-spacing-0 text-[11px]">
          <thead class="bg-sunken text-[10px] text-meta">
            <tr>
              <th class="px-2.5 py-1 text-left font-semibold">{{ t('editor.paste_credits.col_role') }}</th>
              <th class="px-2.5 py-1 text-left font-semibold">{{ t('editor.paste_credits.col_who') }}</th>
              <th class="px-2.5 py-1 text-left font-semibold">{{ t('editor.paste_credits.col_tracks') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in ROWS" :key="index" :class="{ 'bg-warning/10': row.match === 'namesakes' }">
              <td class="border-t border-line px-2.5 py-1">
                <span class="block font-medium text-title">{{ row.roles.map(role).join('、') }}</span>
                <span class="block text-[9px] text-faint">{{ row.source }}</span>
              </td>
              <td class="border-t border-line px-2.5 py-1">
                <span class="flex items-center gap-2">
                  <span class="min-w-0 truncate font-medium text-title">{{ row.name }}</span>
                  <span
                    class="ml-auto inline-flex h-5 w-28 shrink-0 items-center justify-between gap-1 rounded-md border px-1.5 text-[10px]"
                    :class="row.match === 'namesakes' ? 'border-danger/50 bg-field text-faint' : 'border-field-line bg-field text-title'"
                  >
                    <span class="truncate">{{ row.match === 'existing' ? row.name : row.match === 'new' ? t('editor.paste_credits.new') : t('editor.paste_credits.namesakes', { count: 2 }) }}</span>
                    <Icon name="lucide:chevron-down" class="size-2.5 shrink-0 text-meta" />
                  </span>
                </span>
              </td>
              <td class="border-t border-line px-2.5 py-1 text-body">{{ row.tracks || t('editor.credits.whole_album') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-end gap-1.5 border-t border-line bg-sunken/60 px-3 py-2">
      <span class="mr-auto text-[10px] text-meta">{{ t('editor.paste_credits.unsettled') }}</span>
      <GuideMockButton :label="t('common.cancel')" />
      <GuideMockButton :label="t('editor.paste_credits.apply', { count })" variant="primary" />
    </div>
  </div>
</template>
