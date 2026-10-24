<script setup lang="ts">
import type { MarkdownEnv } from '~/utils/markdown'

/**
 * /dev/ui: every base component (components/ui) and primitive (assets/css/ui.css) in every variant, the theme
 * tokens, rendered Markdown and the editor. Registered only for `nuxt dev` (nuxt.config.ts), so production builds
 * have no such route. Switch the theme and colour with the navbar's appearance panel.
 */
useHead({ title: 'UI', meta: [{ name: 'robots', content: 'noindex' }] })

const { toast, showToast } = useToast()
const { confirm } = useConfirm()

const surfaces = [
  ['page', 'bg-page'], ['card', 'bg-card'], ['card-hover', 'bg-card-hover'], ['popover', 'bg-popover'],
  ['sunken', 'bg-sunken'], ['field', 'bg-field'], ['ghost-hover', 'bg-ghost-hover'], ['btn', 'bg-btn'],
  ['btn-hover', 'bg-btn-hover'], ['code', 'bg-code'], ['codeblock', 'bg-codeblock'], ['badge', 'bg-badge'],
  ['primary', 'bg-primary'], ['primary-strong', 'bg-primary-strong'], ['hero', 'bg-hero'], ['scrim', 'bg-scrim'],
] as const
const texts = [['title', 'text-title'], ['body', 'text-body'], ['meta', 'text-meta'], ['faint', 'text-faint']] as const
const statuses = [['success', 'bg-success'], ['warning', 'bg-warning'], ['danger', 'bg-danger'], ['info', 'bg-info']] as const

const tones = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'] as const
const badgeVariants = ['soft', 'solid', 'outline'] as const

const pill = ref<'all' | 'cd' | 'vinyl' | 'digital'>('all')
const view = ref<'albums' | 'tracks'>('albums')
const page = ref(4)
const name = ref('')
const email = ref('bad@')
const format = ref<string | number | null>('cd')
const bio = ref('')
const agree = ref(true)
const kinds = ref<(string | number)[]>(['cd'])
const choice = ref<string | number | boolean | null>('a')
const notify = ref(true)
const dialog = ref(false)
const confirmDialog = ref(false)
const editorText = ref('## 编辑器\n\n**粗体**、*斜体*、`代码`，还有 [链接](https://example.com)。\n\n::: tip 提示\n切换主题时编辑器跟着变。\n:::\n')

const askConfirm = async () => {
  const yes = await confirm({ title: '删除这条记录？', description: '删除后可以在修订历史里恢复。', confirmText: '删除' })
  showToast(yes ? '已确认' : '已取消', yes ? 'success' : 'info')
}

const markdownSample = [
  '# 一级标题 Title',
  '## 二级标题',
  '### 三级标题',
  '',
  '正文里有 **粗体**、*斜体*、~~删除线~~、==高亮==、`行内代码`、[一个链接](https://example.com)，还有 ||隐藏的剧透||。',
  '',
  '[红色文字]{color=red} [蓝色]{color=blue} [紫色加大]{color=purple size=large} [下划线]{underline=green}',
  '',
  '- 无序列表',
  '- 第二项',
  '  - 嵌套项',
  '',
  '1. 有序列表',
  '2. 第二项',
  '',
  '- [x] 已完成的任务',
  '- [ ] 未完成的任务',
  '',
  '> 引用：vivia 的引用是平的色块，没有左边的竖线。',
  '',
  '| 曲目 | 时长 |',
  '| --- | :---: |',
  '| 1. Opening | 3:21 |',
  '| 2. Ending | 4:05 |',
  '',
  '```js',
  'const theme = useAppearance()',
  '```',
  '',
  '---',
  '',
  '@example_user 提到了 [[album:1]]：',
  '',
  '[[album:1]]',
  '',
  '::: quote post:1024',
  '被引用的楼层内容。',
  ':::',
  '',
  '::: info 信息',
  '一般说明。',
  ':::',
  '',
  '::: tip 提示',
  '小技巧。',
  ':::',
  '',
  '::: warning 注意',
  '需要留意的地方。',
  ':::',
  '',
  '::: danger 危险',
  '不可撤销的操作。',
  ':::',
  '',
  '::: details 点击展开',
  '折叠起来的内容。',
  ':::',
  '',
  '::: spoiler 结局',
  '剧透内容。',
  ':::',
  '',
  '::: checklist 收集清单',
  '- [x] 初回限定盘',
  '- [ ] 通常盘',
  ':::',
  '',
  '::: steps',
  '1. 第一步',
  '2. 第二步',
  ':::',
].join('\n')

const markdownEnv: MarkdownEnv = {
  references: {
    users: { example_user: { id: 0, username: 'example_user', nickname: '示例用户', avatar_url: null } },
    posts: { 1024: { id: 1024, topic_id: 1, topic_title: '', floor: 12, parent_floor: null, user: { username: 'example_user', nickname: '示例用户' }, status: 'visible' } },
    albums: { 1: { type: 'album', id: 1, title: '示例专辑', image_url: null, date: '2002-08-11' } },
  },
}
</script>

<template>
  <div class="container mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
    <UiPageHeader title="UI 组件" subtitle="components/ui 与 assets/css/ui.css。右上角的外观面板切换暗色/亮色和主题色。" :back="{ to: '/', label: '首页' }">
      <template #actions>
        <UiButton icon="lucide:bell" @click="showToast('已保存', 'success')">提示</UiButton>
        <UiButton variant="primary" icon="lucide:plus" @click="dialog = true">对话框</UiButton>
      </template>
    </UiPageHeader>

    <!-- Tokens -->
    <section class="card space-y-5 p-5">
      <UiSectionTitle title="颜色 token" description="theme.css；每个表面都带主题色相。" />
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <div v-for="[label, swatch] in surfaces" :key="label">
          <div class="h-12 rounded-lg ring-1 ring-line" :class="swatch" />
          <p class="mt-1.5 text-xs text-meta">{{ label }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span v-for="[label, color] in texts" :key="label" class="text-sm font-semibold" :class="color">{{ label }} 文字</span>
        <span v-for="[label, swatch] in statuses" :key="label" class="inline-flex items-center gap-2 text-sm text-body">
          <span class="size-3 rounded-full" :class="swatch" />{{ label }}
        </span>
      </div>
    </section>

    <!-- Actions -->
    <section class="card space-y-5 p-5">
      <UiSectionTitle title="按钮与链接" description="悬停只换背景和颜色，不上浮、不加阴影。" />
      <div class="flex flex-wrap items-center gap-2">
        <UiButton>默认</UiButton>
        <UiButton variant="primary">主要</UiButton>
        <UiButton variant="ghost">文字</UiButton>
        <UiButton variant="outline">描边</UiButton>
        <UiButton variant="danger">删除</UiButton>
        <UiButton icon="lucide:heart" :pressed="true">已收藏</UiButton>
        <UiButton loading>保存中</UiButton>
        <UiButton disabled>不可用</UiButton>
        <UiButton icon-right="lucide:arrow-right" to="/albums">链接按钮</UiButton>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton size="sm" variant="primary" icon="lucide:plus">小号</UiButton>
        <UiButton size="sm">小号</UiButton>
        <UiButton size="xs" variant="primary">超小</UiButton>
        <UiButton size="xs" variant="ghost" icon="lucide:pencil">编辑</UiButton>
        <button type="button" class="btn btn-sm btn-add"><Icon name="lucide:plus" class="size-4" />添加一行</button>
        <UiIconButton icon="lucide:settings" label="设置" />
        <UiIconButton icon="lucide:heart" label="收藏" variant="default" :pressed="true" />
        <UiIconButton icon="lucide:trash-2" label="删除" variant="danger" size="sm" />
        <UiIconButton icon="lucide:x" label="关闭" size="xs" round />
      </div>
      <p class="text-sm text-body">
        正文里的 <UiLink to="/albums">主题色链接</UiLink>，
        <UiLink to="/artists" muted>弱化链接</UiLink>，
        和外部的 <UiLink to="https://example.com" external>外部链接</UiLink>。
      </p>
    </section>

    <!-- Surfaces and titles -->
    <section class="grid gap-4 md:grid-cols-3">
      <UiCard>
        <UiSectionTitle title="卡片" size="sm" />
        <p class="mt-2 text-sm text-body">vivia 的卡片：16px 圆角，没有边框和阴影。</p>
      </UiCard>
      <UiCard to="/albums">
        <UiSectionTitle title="链接卡片" icon="lucide:disc-3" size="sm" />
        <p class="mt-2 text-sm text-body">整张卡片是链接，悬停变亮。</p>
      </UiCard>
      <UiCard padding="none" class="overflow-hidden">
        <div class="p-5 pb-3">
          <UiSectionTitle title="列表" :count="3" size="sm">
            <template #actions><UiLink to="/albums" class="text-xs">全部</UiLink></template>
          </UiSectionTitle>
        </div>
        <div class="space-y-0.5 px-3 pb-3">
          <UiListItem to="/albums" icon="lucide:disc-3" :count="128">专辑</UiListItem>
          <UiListItem to="/artists" icon="lucide:mic-2" :count="42" active>艺术家</UiListItem>
          <UiListItem to="/events" icon="lucide:calendar" :count="7">活动</UiListItem>
        </div>
      </UiCard>
    </section>

    <!-- Navigation -->
    <section class="card space-y-5 p-5">
      <UiSectionTitle title="导航" description="筛选用 pills，同一内容的不同视图用 segmented。" />
      <UiTabs
        v-model="pill"
        label="格式"
        :items="[
          { value: 'all', label: '全部', count: 128 },
          { value: 'cd', label: 'CD', count: 96 },
          { value: 'vinyl', label: '黑胶', count: 20 },
          { value: 'digital', label: '数字', count: 12, disabled: true },
        ]"
      />
      <UiTabs v-model="pill" size="sm" :items="[{ value: 'all', label: '全部' }, { value: 'cd', label: 'CD' }, { value: 'vinyl', label: '黑胶' }]" />
      <UiTabs
        v-model="view"
        variant="segmented"
        :items="[{ value: 'albums', label: '专辑', icon: 'lucide:disc-3' }, { value: 'tracks', label: '曲目', icon: 'lucide:list-music' }]"
      />
      <div class="flex flex-wrap items-center gap-2">
        <UiTag to="/albums">东方Project</UiTag>
        <UiTag to="/albums">同人音乐</UiTag>
        <UiTag active>已选标签</UiTag>
        <UiTag size="sm">小标签</UiTag>
        <UiTag size="sm" :dot="false">无圆点</UiTag>
      </div>
      <CommonPagination v-model:page="page" :total-pages="12" />
      <CommonPagination v-model:page="page" :total-pages="12" size="sm" />
      <UiPrevNext :prev="{ to: '/tracks/1', title: '01. 少女綺想曲 ～ Dream Battle' }" :next="{ to: '/tracks/3', title: '03. 恋色マスタースパーク' }" />
    </section>

    <!-- Data display -->
    <section class="card space-y-5 p-5">
      <UiSectionTitle title="标签、头像与封面" />
      <div v-for="variant in badgeVariants" :key="variant" class="flex flex-wrap items-center gap-2">
        <UiBadge v-for="tone in tones" :key="tone" :tone="tone" :variant="variant">{{ tone }}</UiBadge>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiBadge tone="success" dot>已发布</UiBadge>
        <UiBadge tone="warning" icon="lucide:clock">待审核</UiBadge>
        <UiBadge size="xs" tone="primary">NEW</UiBadge>
        <UiBadge size="md" tone="danger" variant="solid">已删除</UiBadge>
        <UiCount :value="12" />
        <UiCount :value="3" size="sm" />
        <span class="badge">.badge</span>
        <span class="badge badge-primary">.badge-primary</span>
      </div>
      <div class="flex flex-wrap items-end gap-3">
        <UiAvatar name="Reimu" size="xs" />
        <UiAvatar name="Marisa" size="sm" />
        <UiAvatar name="Sakuya" />
        <UiAvatar name="Remilia" size="lg" />
        <UiAvatar src="/icon.png" name="CDCAT" size="xl" />
      </div>
      <div class="flex flex-wrap items-end gap-4">
        <UiCover src="/icon.png" alt="封面" class="size-24" />
        <UiCover class="size-24" />
        <UiCover src="/icon.png" alt="封面" class="size-24" rounded="xl">
          <template #overlay>
            <UiBadge variant="overlay" class="absolute bottom-1.5 right-1.5">CD</UiBadge>
          </template>
        </UiCover>
        <div class="flex gap-2">
          <UiIconTile v-for="tone in tones" :key="tone" icon="lucide:disc-3" :tone="tone" />
        </div>
      </div>
      <UiEmpty title="还没有收藏" description="在专辑页点一下收藏，就会出现在这里。" icon="lucide:heart">
        <template #actions>
          <UiButton to="/albums" variant="primary" size="sm">去看看专辑</UiButton>
        </template>
      </UiEmpty>
    </section>

    <!-- Feedback -->
    <section class="card space-y-4 p-5">
      <UiSectionTitle title="提示与加载" />
      <UiAlert tone="info" title="信息">普通说明，例如编辑规则。</UiAlert>
      <UiAlert tone="success">修改已保存。</UiAlert>
      <UiAlert tone="warning" title="待审核" dismissible>这条修改要等审核通过才会公开。
        <template #actions><UiButton size="xs" variant="ghost">查看修订</UiButton></template>
      </UiAlert>
      <UiAlert tone="danger" title="出错了">请求失败，请稍后再试。</UiAlert>
      <CommonLoadError @retry="showToast('重试中…', 'info')" />
      <div class="alert alert-warning">.alert .alert-warning</div>
      <div class="flex flex-wrap items-center gap-4">
        <UiSpinner size="xs" />
        <UiSpinner />
        <UiSpinner size="md" />
        <UiSpinner size="lg" label="加载中" />
        <UiButton size="sm" @click="showToast('出错了', 'error')">错误提示</UiButton>
        <UiButton size="sm" @click="askConfirm">确认对话框</UiButton>
        <UiButton size="sm" variant="danger" @click="confirmDialog = true">删除确认</UiButton>
        <span class="tooltip" data-tip="提示文字"><UiButton size="sm" variant="ghost">悬停看提示</UiButton></span>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="skeleton h-24 rounded-xl" />
        <div class="space-y-2">
          <div class="skeleton h-4 w-3/4 rounded" />
          <div class="skeleton h-4 w-1/2 rounded" />
          <div class="skeleton h-4 w-2/3 rounded" />
        </div>
        <div class="grid place-items-center rounded-xl bg-hero p-4">
          <div class="skeleton skeleton-dark h-12 w-full rounded-lg" />
        </div>
      </div>
    </section>

    <!-- Forms -->
    <section class="card space-y-5 p-5">
      <UiSectionTitle title="表单" />
      <div class="grid gap-4 md:grid-cols-2">
        <UiField label="名称" hint="至少两个字。" required>
          <template #default="{ id, describedBy }">
            <UiInput :id="id" v-model="name" icon="lucide:search" placeholder="搜索或输入名称" :aria-describedby="describedBy" />
          </template>
        </UiField>
        <UiField label="邮箱" error="邮箱格式不对。">
          <template #default="{ id, describedBy, invalid }">
            <UiInput :id="id" v-model="email" type="email" :invalid="invalid" :aria-describedby="describedBy" />
          </template>
        </UiField>
        <UiField label="格式">
          <template #default="{ id }">
            <UiSelect :id="id" v-model="format" :options="[{ value: 'cd', label: 'CD' }, { value: 'vinyl', label: '黑胶' }, { value: 'digital', label: '数字' }]" />
          </template>
        </UiField>
        <UiField label="小号输入框">
          <template #default="{ id }">
            <div class="flex gap-2">
              <UiInput :id="id" size="sm" placeholder=".input-sm" class="flex-1" />
              <UiSelect size="sm" :options="[{ value: 1, label: '选项' }]" />
              <UiButton size="sm" variant="primary">确定</UiButton>
            </div>
          </template>
        </UiField>
        <UiField label="简介" class="md:col-span-2">
          <template #default="{ id }">
            <UiTextarea :id="id" v-model="bio" placeholder="写点什么……" />
          </template>
        </UiField>
      </div>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
        <UiCheckbox v-model="agree">同意条款</UiCheckbox>
        <UiCheckbox v-model="kinds" value="cd">CD</UiCheckbox>
        <UiCheckbox v-model="kinds" value="vinyl">黑胶</UiCheckbox>
        <UiCheckbox disabled>不可用</UiCheckbox>
        <UiRadio v-model="choice" value="a" name="demo">选项 A</UiRadio>
        <UiRadio v-model="choice" value="b" name="demo">选项 B</UiRadio>
        <UiSwitch v-model="notify">邮件通知</UiSwitch>
        <UiSwitch disabled>不可用</UiSwitch>
      </div>
    </section>

    <!-- Menus -->
    <section class="card space-y-4 p-5">
      <UiSectionTitle title="菜单" />
      <div class="flex flex-wrap gap-3">
        <UiMenu label="更多操作">
          <template #trigger="{ toggle, attrs }">
            <UiButton icon-right="lucide:chevron-down" v-bind="attrs" @click="toggle">更多操作</UiButton>
          </template>
          <UiMenuItem icon="lucide:pencil">编辑</UiMenuItem>
          <UiMenuItem icon="lucide:share-2" active>分享</UiMenuItem>
          <UiMenuItem icon="lucide:history" to="/revisions">修订历史</UiMenuItem>
          <UiMenuDivider />
          <UiMenuItem icon="lucide:trash-2" danger>删除</UiMenuItem>
        </UiMenu>
        <UiMenu align="end" width="w-40">
          <template #trigger="{ toggle, attrs }">
            <UiIconButton icon="lucide:ellipsis" label="菜单" v-bind="attrs" @click="toggle" />
          </template>
          <UiMenuItem>右对齐菜单</UiMenuItem>
          <UiMenuItem disabled>不可用</UiMenuItem>
        </UiMenu>
      </div>
    </section>

    <!-- Markdown -->
    <section class="grid gap-4 lg:grid-cols-2">
      <div class="card p-5">
        <UiSectionTitle title="Markdown（评论，sm）" size="sm" class="mb-4" />
        <RichContent :content="markdownSample" :env="markdownEnv" format="markdown" />
      </div>
      <div class="card p-5">
        <UiSectionTitle title="Markdown（文章，base）" size="sm" class="mb-4" />
        <RichContent :content="markdownSample" :env="markdownEnv" format="markdown" size="base" />
      </div>
    </section>

    <section class="card p-5">
      <UiSectionTitle title="编辑器" class="mb-4" />
      <ClientOnly>
        <MarkdownEditor v-model="editorText" :max-length="2000" />
      </ClientOnly>
    </section>

    <UiDialog v-model="dialog" title="编辑专辑信息" description="对话框：桌面居中，手机从底部滑出。" icon="lucide:disc-3" as="form" @submit="dialog = false; showToast('已保存')">
      <UiField label="标题">
        <template #default="{ id }">
          <UiInput :id="id" v-model="name" class="w-full" data-autofocus />
        </template>
      </UiField>
      <template #footer>
        <UiButton variant="ghost" @click="dialog = false">取消</UiButton>
        <UiButton type="submit" variant="primary">保存</UiButton>
      </template>
    </UiDialog>

    <CommonConfirmDialog v-model="confirmDialog" title="删除这张专辑？" description="删除后需要管理员才能恢复。" confirm-phrase="#12" @confirm="showToast('已删除')" />
    <CommonToast :toast="toast" />
  </div>
</template>
