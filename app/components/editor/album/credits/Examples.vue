<template>
  <div>
    <!-- The two levels a credit can be on, in the colours of their blocks. -->
    <div class="grid gap-1.5 sm:grid-cols-2">
      <div v-for="level in LEVELS" :key="level.scope" class="rounded-md bg-black/[0.05] px-2 py-1.5 dark:bg-white/[0.08]">
        <span class="inline-block rounded px-1.5 text-[11px] font-semibold leading-5" :class="level.tone">{{ t(`editor.credits.scope_${level.scope}`) }}</span>
        <p class="mt-1 text-body">{{ t(`editor.credits.level_${level.scope}`) }}</p>
      </div>
    </div>
    <ul class="mt-2 divide-y divide-line border-t border-line">
      <li v-for="row in rows" :key="row.key" class="py-2">
        <p class="flex items-center gap-1.5 font-semibold">
          <component :is="row.icon" :size="13" class="shrink-0 text-blue-600 dark:text-blue-300" />{{ t(`editor.credits.album_examples.${row.key}`) }}
        </p>
        <!-- When to use it, then the cases, each its ways of filling it in with what the album page draws; a closing note. -->
        <div class="pl-[1.1875rem]">
          <!-- The printed jobs in question first, then what to do about them. -->
          <div v-if="row.intro" class="mb-2 mt-1 border-l-2 border-blue-300 pl-2.5 dark:border-blue-400/40">
            <p class="flex flex-wrap items-center gap-1.5">
              <span v-for="job in row.jobs" :key="job" class="rounded bg-blue-100 dark:bg-blue-400/20 px-1.5 font-medium text-title">{{ job }}</span>
              <span class="font-semibold">{{ t('editor.credits.album_examples.job_lead') }}</span>
            </p>
            <p class="mt-1 text-body">{{ t(`editor.credits.album_examples.${row.intro}`) }}</p>
          </div>
          <div v-for="part in row.parts" :key="part.text" class="mt-2 first:mt-0">
            <p class="mt-0.5 whitespace-pre-line text-body">{{ t(`editor.credits.album_examples.${part.text}`) }}</p>
            <EditorAlbumCreditsExampleOption v-for="(option, index) in part.options" :key="index" :option="option" />
          </div>
          <p v-if="row.outro" class="mt-2 whitespace-pre-line text-meta">{{ t(`editor.credits.album_examples.${row.outro}`) }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { ExampleOptionData, ExampleTag } from './ExampleOption.vue'
import { Guitar, Mic, PenLine, Tag, UsersRound } from '@lucide/vue'

/** When each way of filling in a credit is for: the recommended way first, then the ones that aren't, each with what the album page shows. Role names are in English in every language. */
const LEVELS = [
  { scope: 'album', tone: 'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200' },
  { scope: 'tracks', tone: 'bg-rose-100/60 text-rose-700 dark:bg-rose-400/12 dark:text-rose-200' },
]

const tag = (role: string, label: string, name: string): ExampleTag => ({ role, label, name })

const { t } = useI18n()

const rows = computed<Array<{ key: string, icon: Component, intro?: string, jobs?: string[], outro?: string, parts: Array<{ text: string, options: ExampleOptionData[] }> }>>(() => {
  const role = t('editor.credits.roles_label')
  const person = t('editor.credits.album_examples.person')
  const job = t('catalog.field.role_label')
  const name = t('editor.dialog.credited_as')
  const nameOnly = t('editor.dialog.name_only')
  const parent = t('editor.credits.parent')
  return [
    {
      key: 'job', icon: Tag, intro: 'job_intro', jobs: ['Character Designer', 'Package Designer', 'Puzzle Designer'], outro: 'job_outro',
      parts: [
        {
          text: 'job_text',
          options: [
            { recommended: true, shown: [tag('designer', 'Website Designer', 'Pastel Design')], fill: [[role, 'Designer'], [person, 'Pastel Design'], [job, 'Website Designer', true]] },
            { shown: [tag('designer', 'Designer', 'Pastel Design')], fill: [[role, 'Designer'], [person, 'Pastel Design']] },
            { shown: [tag('other', 'Other', 'Pastel Design')], fill: [[role, 'Other'], [person, 'Pastel Design']] },
          ],
        },
        {
          text: 'job_other_text',
          options: [
            { recommended: true, shown: [tag('other', 'Crossfade Video', 'Elegant Sister')], fill: [[role, 'Other'], [nameOnly, 'Elegant Sister'], [job, 'Crossfade Video', true]] },
            { shown: [tag('other', 'Other', 'Elegant Sister')], fill: [[role, 'Other'], [nameOnly, 'Elegant Sister']] },
          ],
        },
      ],
    },
    {
      key: 'instrument', icon: Guitar,
      parts: [{
        text: 'instrument_text',
        options: [
          { recommended: true, shown: [tag('performer', 'Flute', 'ぱとり')], fill: [[role, 'Performer'], [person, 'ぱとり'], [job, 'Flute', true]] },
          { shown: [tag('performer', 'Performer', 'ぱとり')], fill: [[role, 'Performer'], [person, 'ぱとり']] },
        ],
      }],
    },
    {
      key: 'name', icon: PenLine,
      parts: [{
        text: 'name_text',
        options: [
          { recommended: true, shown: [tag('special_thanks', 'Special Thanks', 'Mao Enokizu')], fill: [[role, 'Special Thanks'], [person, '榎津まお'], [name, 'Mao Enokizu', true]] },
          { shown: [tag('special_thanks', 'Special Thanks', 'Mao Enokizu')], fill: [[role, 'Special Thanks'], [nameOnly, 'Mao Enokizu']] },
        ],
      }],
    },
    {
      key: 'cv', icon: Mic,
      parts: [{
        text: 'cv_text',
        options: [
          { recommended: true, shown: [tag('artist', 'Artist', 'リコ(CV:富田美憂)')], fill: [[role, 'Artist'], [person, '富田美憂'], [name, 'リコ(CV:富田美憂)', true]] },
          { shown: [tag('artist', 'Artist', 'リコ'), tag('artist', 'Artist', '富田美憂')], fill: [[role, 'Artist'], [person, 'リコ'], [person, '富田美憂']] },
        ],
      }],
    },
    {
      key: 'feat', icon: UsersRound,
      parts: [{
        text: 'feat_text',
        options: [
          { recommended: true, shown: [tag('composer', 'Composer', '雨部冷キザミ'), tag('vocals', 'Vocals', '宮舞モカ')], fill: [[role, 'Composer'], [person, '雨部冷キザミ'], [role, 'Vocals'], [person, '宮舞モカ']] },
          { recommended: true, shown: [tag('artist', 'Artist', '雨部冷キザミ feat. 宮舞モカ')], fill: [[role, 'Artist'], [person, '雨部冷キザミ'], [role, 'Featuring'], [person, '宮舞モカ'], [parent, '雨部冷キザミ', true]] },
        ],
      }],
    },
  ]
})
</script>
