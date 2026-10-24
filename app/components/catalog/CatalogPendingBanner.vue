<template>
  <div v-if="pending" :class="inline ? 'mb-6 rounded-xl border border-warning/25 bg-warning/10' : 'border-b border-warning/25 bg-warning/10'" role="status">
    <div
      class="flex flex-wrap items-start gap-3 py-3 text-sm text-body"
      :class="inline ? 'px-4' : 'container mx-auto max-w-6xl px-4 md:px-12 lg:px-20 xl:px-8 2xl:max-w-7xl'"
    >
      <ShieldAlert :size="18" class="mt-0.5 shrink-0 text-warning" />
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-title">{{ $t('pending.notice') }}</p>
        <p v-if="revision && !canReview" class="mt-0.5 text-body">{{ $t('pending.notice_own') }}</p>
      </div>
      <NuxtLink
        v-if="revision"
        :to="canReview ? `/admin/revisions/${revision.id}` : `/revisions/${revision.id}`"
        class="shrink-0 rounded-md border border-warning/40 px-2.5 py-1 text-xs font-semibold text-warning transition-colors hover:bg-warning/15"
      >
        {{ canReview ? $t('pending.review', { id: revision.id }) : $t('pending.view_revision', { id: revision.id }) }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// The VGMdb-style notice on pages of content awaiting review (docs/catalog/editing.md#待审内容).
// `revision` is only sent to the submitter and to revisions.view; reviewers get a shortcut to the
// review center. `inline` fits the notice into a page's container instead of spanning the width.
import { ShieldAlert } from '@lucide/vue'

const props = defineProps<{ pending?: boolean, revision?: { id: number, status: string } | null, inline?: boolean }>()

const { hasPermission } = useAuth()
const canReview = computed(() => hasPermission('revisions.review'))

// Unreviewed pages stay out of search engines.
useHead(() => (props.pending ? { meta: [{ name: 'robots', content: 'noindex' }] } : {}))
</script>
