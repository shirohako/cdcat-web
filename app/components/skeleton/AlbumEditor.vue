<template>
  <SkeletonStatus page>
    <!-- The header: what is being edited, the album's title, its links and the save state. -->
    <div class="card mb-4 flex flex-wrap items-end gap-3 px-5 py-4">
      <div class="min-w-0 flex-1">
        <div class="skeleton h-3 w-20 rounded-full" />
        <div class="skeleton mt-2 h-7 w-72 max-w-full rounded-md" />
      </div>
      <div class="flex gap-2">
        <div v-for="index in 3" :key="index" class="skeleton h-8 w-24 rounded-lg" />
      </div>
      <div class="w-full border-t border-line pt-3">
        <div class="skeleton h-3 w-64 max-w-full rounded-full" />
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside class="space-y-4">
        <div class="card flex gap-1 overflow-hidden p-1.5 lg:flex-col">
          <div v-for="(width, index) in NAV_WIDTHS" :key="index" class="flex shrink-0 items-center gap-2 px-3 py-2">
            <div class="skeleton size-[15px] shrink-0 rounded" />
            <div class="skeleton h-3 rounded-full" :class="width" />
          </div>
        </div>
        <div class="card hidden space-y-2.5 p-4 lg:block">
          <div class="skeleton mb-3 h-3 w-12 rounded-full" />
          <div v-for="(width, index) in ['w-16', 'w-20', 'w-24', 'w-14', 'w-16']" :key="index" class="flex items-center gap-2">
            <div class="skeleton size-3.5 shrink-0 rounded-full" />
            <div class="skeleton h-3 rounded-full" :class="width" />
          </div>
        </div>
      </aside>

      <div class="min-w-0 space-y-6">
        <!-- 基本信息: the cover beside the main fields, then artists, other names and more options. -->
        <div class="card overflow-hidden">
          <div class="flex items-center gap-2.5 px-5 pb-2 pt-4">
            <div class="skeleton size-4 rounded" />
            <div class="skeleton h-4 w-20 rounded-full" />
          </div>
          <div class="grid gap-6 p-5 md:grid-cols-[13rem_1fr]">
            <div class="space-y-1.5">
              <div class="skeleton h-3 w-10 rounded-full" />
              <div class="skeleton aspect-square w-full rounded-xl" />
            </div>
            <div class="min-w-0 space-y-4">
              <div class="space-y-1.5">
                <div class="skeleton h-3 w-12 rounded-full" />
                <div class="skeleton h-10 w-full rounded-lg" />
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-for="width in ['w-16', 'w-10']" :key="width" class="space-y-1.5">
                  <div class="skeleton h-3 rounded-full" :class="width" />
                  <div class="skeleton h-9 w-full rounded-lg" />
                </div>
              </div>
              <div class="space-y-1.5">
                <div class="skeleton h-3 w-16 rounded-full" />
                <div class="skeleton h-9 w-full max-w-sm rounded-lg" />
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div v-for="width in ['w-14', 'w-12']" :key="width" class="space-y-1.5">
                  <div class="skeleton h-3 rounded-full" :class="width" />
                  <div class="skeleton h-9 w-full rounded-lg" />
                </div>
              </div>
              <div class="space-y-1.5">
                <div class="skeleton h-3 w-10 rounded-full" />
                <div class="flex flex-wrap gap-1.5">
                  <div v-for="width in ['w-14', 'w-16', 'w-12', 'w-20', 'w-14']" :key="width" class="skeleton h-7 rounded-full" :class="width" />
                </div>
              </div>
              <div class="space-y-1.5">
                <div class="skeleton h-3 w-10 rounded-full" />
                <div class="skeleton h-28 w-full rounded-lg" />
              </div>
            </div>
          </div>
          <!-- 艺术家与发行 -->
          <div class="border-t border-line px-5 py-4">
            <div class="skeleton h-3.5 w-20 rounded-full" />
            <div class="skeleton mt-1.5 h-3 w-4/5 rounded-full" />
            <div class="mt-3 space-y-1.5">
              <div v-for="index in 2" :key="index" class="skeleton h-11 w-full rounded-lg" />
              <div class="skeleton h-9 w-32 rounded-lg" />
            </div>
          </div>
          <div class="space-y-3 border-t border-line px-5 py-4">
            <div class="skeleton h-3.5 w-16 rounded-full" />
            <div class="skeleton h-9 w-36 rounded-lg" />
          </div>
          <div class="space-y-3 border-t border-line px-5 py-4">
            <div class="skeleton h-3.5 w-16 rounded-full" />
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="skeleton h-9 w-full rounded-lg" />
              <div class="skeleton h-9 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </SkeletonStatus>
</template>

<script setup lang="ts">
/**
 * The album editor's placeholder while the editor's code and the album load: its header, section list and
 * required-items cards, and the 基本信息 section it opens on (artists included), laid out as the editor lays them
 * out. The page wraps it in the editor's container and `cards-raised`, as the editor wraps itself.
 */
const NAV_WIDTHS = ['w-16', 'w-20', 'w-24', 'w-8', 'w-8', 'w-8', 'w-20', 'w-20', 'w-8']
</script>
