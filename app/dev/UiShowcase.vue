<script setup lang="ts">
import type { MarkdownEnv } from '~/utils/markdown'

/**
 * /dev/ui: every base component (components/ui) and primitive (assets/css/ui.css) in every variant, the theme
 * tokens, rendered Markdown and the editor. Registered only for `nuxt dev` (nuxt.config.ts), so production builds
 * have no such route. Switch the theme and colour with the navbar's appearance panel.
 */
useHead({ title: 'UI', meta: [{ name: 'robots', content: 'noindex' }] })

const { showToast, add: addToast, update: updateToast } = useToast()

const toastDemos = {
  colors: () => {
    addToast({ title: '已保存', color: 'success' })
    addToast({ title: '提交了修订 #128', description: '审核通过后会出现在专辑页。', color: 'info' })
    addToast({ title: '图片太大', description: '超过 10 MB 的图片没有上传。', color: 'warning' })
    addToast({ title: '请求失败', description: '请稍后再试。', color: 'error' })
  },
  actions: () => addToast({
    title: '已删除 3 条曲目',
    description: '可以在 10 秒内撤销。',
    color: 'neutral',
    icon: 'lucide:trash-2',
    duration: 10000,
    actions: [{ label: '撤销', icon: 'lucide:undo-2', onClick: () => showToast('已撤销', 'info') }],
  }),
  horizontal: () => addToast({
    title: '有新版本',
    orientation: 'horizontal',
    icon: 'lucide:sparkles',
    actions: [{ label: '刷新', onClick: () => showToast('刷新中…', 'info') }],
  }),
  sticky: () => addToast({ title: '这条不会自动关闭', description: 'duration: 0，只能手动关掉。', duration: 0, icon: 'lucide:pin' }),
  progress: () => {
    const toast = addToast({ title: '正在上传…', icon: 'lucide:loader-circle', duration: 0, close: false })
    setTimeout(() => updateToast(toast.id, { title: '上传完成', icon: undefined, color: 'success', duration: 4000, close: true }), 2000)
  },
  duplicate: () => addToast({ id: 'demo-duplicate', title: '同一个 id 只会跳一下', color: 'primary' }),
}
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
const language = ref('ja')
const bio = ref('')
const agree = ref(true)
const kinds = ref<(string | number)[]>(['cd'])
const choice = ref<string | number | boolean | null>('a')
const notify = ref(true)
const dialog = ref(false)
const confirmDialog = ref(false)
const tooltipSides = ['top', 'right', 'bottom', 'left'] as const
const shortcuts = [['/', '搜索'], ['Esc', '关闭弹出层'], ['↑ ↓', '在列表里移动'], ['Enter', '选择']] as const
const shareFormat = ref<string | number | boolean | null>('link')
const shareOptions = [{ value: 'link', label: '链接' }, { value: 'markdown', label: 'Markdown' }, { value: 'bbcode', label: 'BBCode' }]
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
      <UiSectionTitle title="按钮与链接" description="按钮静止时都有底色或描边；悬停只换背景和颜色，不上浮、不加阴影。" />
      <div class="flex flex-wrap items-center gap-2">
        <UiButton>默认</UiButton>
        <UiButton variant="primary">主要</UiButton>
        <UiButton variant="outline">描边</UiButton>
        <UiButton variant="danger">删除</UiButton>
        <UiButton variant="danger-soft" icon="lucide:trash-2">移除</UiButton>
        <UiButton variant="add" icon="lucide:plus">添加一行</UiButton>
        <UiButton icon="lucide:heart" :pressed="true">已收藏</UiButton>
        <UiButton loading>保存中</UiButton>
        <UiButton disabled>不可用</UiButton>
        <UiButton icon-right="lucide:arrow-right" to="/albums">链接按钮</UiButton>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton size="lg" variant="primary">大号</UiButton>
        <UiButton size="lg">大号</UiButton>
        <UiButton size="sm" variant="primary" icon="lucide:plus">小号</UiButton>
        <UiButton size="sm">小号</UiButton>
        <UiButton size="xs" variant="primary">超小</UiButton>
        <UiButton size="xs" icon="lucide:pencil">编辑</UiButton>
        <UiButton size="xs" variant="danger-soft">删除</UiButton>
        <UiButton size="xs" variant="add" icon="lucide:plus">添加</UiButton>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton icon="lucide:settings" label="设置" size="lg" />
        <UiButton icon="lucide:settings" label="设置" />
        <UiButton icon="lucide:heart" label="收藏" :pressed="true" />
        <UiButton icon="lucide:plus" label="新建" variant="primary" />
        <UiButton icon="lucide:pencil" label="编辑" variant="outline" size="sm" />
        <UiButton icon="lucide:trash-2" label="删除" variant="danger-soft" size="sm" />
        <UiButton icon="lucide:share-2" label="分享" size="xs" round />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs text-meta">ghost 静止时没有底色，只用于导航栏图标、编辑器工具栏、对话框和提示的关闭 ×、输入框里的图标：</span>
        <UiButton variant="ghost" icon="lucide:menu" label="菜单" />
        <UiButton variant="ghost" icon="lucide:x" label="关闭" size="xs" round />
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
            <template #actions><UiButton to="/albums" size="xs">全部</UiButton></template>
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
        <UiAvatar src="/icon.png" name="CDCat" size="xl" />
      </div>
      <div class="flex flex-wrap items-end gap-4">
        <UiCover src="/icon.png" alt="封面" class="size-24" />
        <UiCover class="size-24" />
        <UiCover src="/icon.png" alt="封面" class="size-24" rounded="xl">
          <template #overlay>
            <UiBadge variant="overlay" class="absolute bottom-1.5 right-1.5">CD</UiBadge>
          </template>
        </UiCover>
        <div class="rounded-2xl bg-hero p-3">
          <UiCover src="/icon.png" alt="封面" class="size-18" rounded="xl" dark />
        </div>
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
        <template #actions><UiButton size="xs">查看修订</UiButton></template>
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
        <UiField label="语言（可搜索）">
          <template #default="{ id }">
            <UiLanguageSelect :id="id" v-model="language" readings />
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

    <!-- Toasts -->
    <section class="card space-y-4 p-5">
      <UiSectionTitle title="Toast" description="useToast()：右下角弹出，悬停暂停倒计时，向右滑动可关闭，重复的 id 会跳动而不是叠加。" />
      <div class="flex flex-wrap gap-2">
        <UiButton size="sm" @click="toastDemos.colors">四种状态</UiButton>
        <UiButton size="sm" @click="toastDemos.actions">带操作</UiButton>
        <UiButton size="sm" @click="toastDemos.horizontal">横向操作</UiButton>
        <UiButton size="sm" @click="toastDemos.sticky">不自动关闭</UiButton>
        <UiButton size="sm" @click="toastDemos.progress">更新同一条</UiButton>
        <UiButton size="sm" @click="toastDemos.duplicate">重复 id</UiButton>
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
            <UiButton icon="lucide:ellipsis" label="菜单" v-bind="attrs" @click="toggle" />
          </template>
          <UiMenuItem>右对齐菜单</UiMenuItem>
          <UiMenuItem disabled>不可用</UiMenuItem>
        </UiMenu>
      </div>
    </section>

    <!-- Tooltips and popovers -->
    <section class="card space-y-5 p-5">
      <UiSectionTitle
        title="Tooltip 与弹出卡片"
        description="UiTooltip 反色、只做展示：悬停或键盘聚焦时显示，触屏上点按（按钮和链接上长按）。要点的内容放进点击打开的 UiPopover。"
      />
      <div class="flex flex-wrap items-center gap-2">
        <UiTooltip v-for="side in tooltipSides" :key="side" :text="`placement: ${side}`" :placement="side">
          <UiButton size="sm">{{ side }}</UiButton>
        </UiTooltip>
        <UiButton icon="lucide:heart" label="收藏" />
        <UiButton icon="lucide:share-2" label="分享" />
        <UiButton icon="lucide:search" label="搜索" tooltip="按 / 搜索" />
        <UiTooltip text="这是一段比较长的提示文字，超出宽度会自动换行，靠近屏幕边缘时会翻到另一侧。">
          <span class="link text-sm">长文字</span>
        </UiTooltip>
        <UiTooltip text="触屏上点一下就显示，点别处收起。">
          <span class="text-sm text-meta underline decoration-dotted underline-offset-4">普通文字（触屏点按）</span>
        </UiTooltip>
        <UiTooltip text="触屏上要长按才显示，点按照常跳转。">
          <NuxtLink to="/albums" class="link text-sm">链接（触屏长按）</NuxtLink>
        </UiTooltip>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiTooltip class="w-72">
          <UiButton size="sm" icon="lucide:disc-3">复杂排版：专辑</UiButton>
          <template #content>
            <div class="flex gap-3">
              <UiCover src="/icon.png" alt="" class="size-16 shrink-0" />
              <div class="min-w-0">
                <p class="line-clamp-2 font-semibold leading-snug text-title">東方紅魔郷 ～ the Embodiment of Scarlet Devil</p>
                <p class="mt-0.5 text-xs text-meta">上海アリス幻樂団 · 2002-08-11</p>
                <div class="mt-1.5 flex flex-wrap gap-1">
                  <UiBadge size="xs" tone="primary">CD</UiBadge>
                  <UiBadge size="xs" tone="success" dot>已发布</UiBadge>
                </div>
              </div>
            </div>
            <p class="mt-2.5 border-t border-line pt-2.5 text-xs leading-5">气泡带着相反的 data-theme，里面的 token 和 Ui 组件不写 dark: 也是对的。</p>
          </template>
        </UiTooltip>
        <UiTooltip placement="bottom">
          <UiButton size="sm" icon="lucide:keyboard">复杂排版：快捷键</UiButton>
          <template #content>
            <p class="mb-2 text-xs font-semibold text-title">快捷键</p>
            <dl class="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1.5 text-xs">
              <template v-for="[key, action] in shortcuts" :key="key">
                <dt><kbd class="rounded bg-btn px-1.5 py-0.5 font-mono text-[11px] text-btn-content">{{ key }}</kbd></dt>
                <dd>{{ action }}</dd>
              </template>
            </dl>
          </template>
        </UiTooltip>
        <UiPopover label="分享" class="w-80">
          <template #trigger="{ toggle, attrs }">
            <UiButton size="sm" icon="lucide:share-2" v-bind="attrs" @click="toggle">弹出卡片</UiButton>
          </template>
          <template #default="{ close }">
            <p class="font-semibold text-title">分享这张专辑</p>
            <p class="mt-1 text-xs text-meta">卡片里可以放链接、按钮和表单；点外面、按 Esc 或离开页面就会关闭。</p>
            <UiSelect v-model="shareFormat" :options="shareOptions" size="sm" class="mt-3 w-full" />
            <div class="mt-3 flex items-center gap-2">
              <NuxtLink to="/albums" class="link text-xs">打开专辑页</NuxtLink>
              <UiButton size="sm" variant="primary" class="ml-auto" @click="close(); showToast('已复制链接', 'success')">复制链接</UiButton>
            </div>
          </template>
        </UiPopover>
        <UiPopover placement="right-start" class="w-64">
          <template #trigger="{ toggle, attrs }">
            <UiButton icon="lucide:info" label="弹出卡片（右侧）" v-bind="attrs" @click="toggle" />
          </template>
          <p class="text-xs leading-5">靠近屏幕边缘时翻到另一侧，高度不够时卡片里面滚动。触发器是带 Tooltip 的图标按钮（给了 label 的 UiButton）。</p>
        </UiPopover>
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
        <UiButton @click="dialog = false">取消</UiButton>
        <UiButton type="submit" variant="primary">保存</UiButton>
      </template>
    </UiDialog>

    <CommonConfirmDialog v-model="confirmDialog" title="删除这张专辑？" description="删除后需要管理员才能恢复。" confirm-phrase="#12" @confirm="showToast('已删除')" />
  </div>
</template>
