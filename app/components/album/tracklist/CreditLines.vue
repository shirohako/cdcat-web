<script setup lang="ts">
import type { TracklistMergedCredit } from '~/utils/tracklistView'

/**
 * Credits as lines, each the role tags of a set of roles held by the same people (mergeSamePeople) and then their
 * names: 表格 · 完整's 其他人员 cell, and a row's credits once the rows turn into blocks.
 */
defineProps<{ credits: TracklistMergedCredit[] }>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <div v-for="credit in credits" :key="credit.key" class="flex min-w-0 items-start gap-1.5">
      <span class="flex flex-wrap gap-1 pt-px">
        <CatalogRoleTag v-for="role in credit.roles" :key="role.key" :label="role.label" :tip="role.tip" :category="role.category" />
      </span>
      <AlbumTracklistPeople :people="credit.people" class="min-w-0 pt-px" />
    </div>
  </div>
</template>
