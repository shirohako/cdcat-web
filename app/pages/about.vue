<template>
  <div class="relative min-h-[calc(100vh-4rem)] overflow-hidden">
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-linear-to-br from-sky-200/45 to-indigo-200/20 blur-3xl" />
      <div class="absolute top-20 -right-24 h-80 w-80 rounded-full bg-linear-to-br from-orange-200/35 to-pink-200/15 blur-3xl" />
      <div class="absolute -bottom-52 left-1/3 h-120 w-120 rounded-full bg-linear-to-br from-emerald-200/35 to-cyan-200/15 blur-3xl" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.08)_1px,transparent_0)] bg-size-[24px_24px] opacity-35" />
    </div>

    <div class="relative container mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-6 md:py-14">
      <section class="rounded-3xl border border-sky-100/80 bg-linear-to-br from-white via-sky-50/70 to-indigo-50/80 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.5)] ring-1 ring-black/5 backdrop-blur-xl md:p-8">
        <div class="max-w-4xl">
          <p class="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-100/65 px-3 py-1 text-xs font-semibold tracking-wide text-sky-700">
            <Icon name="lucide:cat" class="h-3.5 w-3.5" />
            ABOUT CDCAT
          </p>
          <h1 class="mt-4 flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            <span class="inline-flex rounded-xl bg-amber-100 p-1.5 md:p-2">
              <Icon name="lucide:sparkles" class="h-5 w-5 text-amber-600 md:h-6 md:w-6" />
            </span>
            CDCAT
          </h1>
          <p class="mt-4 text-[15px] leading-7 text-slate-700 md:text-base">
            CDCAT 是一个面向重度听歌用户的音乐资料站点。
          </p>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <div
            v-for="(item, index) in highlights"
            :key="item.title"
            class="rounded-2xl border bg-white/90 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            :class="[item.tone, index === 0 ? 'sm:col-span-2 2xl:col-span-3' : '']"
          >
            <div class="mb-2 inline-flex rounded-lg p-1.5" :class="item.iconBg">
              <Icon :name="item.icon" class="h-4 w-4" :class="item.iconTone" />
            </div>
            <p class="text-base font-semibold text-slate-900">{{ item.title }}</p>
            <p class="mt-2 text-[13px] leading-6 text-slate-600">{{ item.desc }}</p>
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-blue-100/80 bg-linear-to-br from-white via-blue-50/70 to-sky-50/80 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] ring-1 ring-black/5 backdrop-blur-xl md:p-8">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <span class="inline-flex rounded-lg bg-blue-100 p-1.5">
                <Icon name="lucide:book-open-check" class="h-5 w-5 text-blue-700" />
              </span>
              使用说明
            </h2>
            <p class="mt-2 text-sm text-slate-600">
              如果您想参与编辑，可能需要了解下面的内容。
            </p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-3">
          <article
            v-for="guide in usageGuides"
            :key="guide.title"
            class="group rounded-2xl border bg-white/90 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            :class="guide.tone"
          >
            <div class="inline-flex rounded-lg p-1.5" :class="guide.iconBg">
              <Icon :name="guide.icon" class="h-4 w-4" :class="guide.iconTone" />
            </div>
            <p class="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-600">{{ guide.tag }}</p>
            <h3 class="mt-2 text-lg font-semibold text-slate-900">{{ guide.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-700">{{ guide.desc }}</p>
            <NuxtLink
              :to="guide.link"
              class="mt-4 inline-flex items-center text-sm font-medium text-slate-900 transition-colors duration-150 group-hover:text-sky-700"
            >
              查看
            </NuxtLink>
          </article>
        </div>
      </section>

      <section class="space-y-6">
        <article class="rounded-3xl border border-indigo-100/80 bg-linear-to-br from-white via-indigo-50/75 to-blue-50/70 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] ring-1 ring-black/5 backdrop-blur-xl">
          <h2 class="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <span class="inline-flex rounded-lg bg-indigo-100 p-1.5">
              <Icon name="lucide:file-code-2" class="h-5 w-5 text-indigo-700" />
            </span>
            文档与仓库
          </h2>
          <p class="mt-2 text-sm text-slate-600">常用文档入口。</p>
          <div class="mt-5 space-y-3">
            <NuxtLink
              v-for="doc in docs"
              :key="doc.name"
              :to="doc.link"
              class="flex items-center justify-between rounded-xl border border-indigo-100/90 bg-white/85 px-4 py-3 transition-all duration-150 hover:border-indigo-200 hover:bg-indigo-50/55"
            >
              <div class="flex items-start gap-2.5">
                <div class="rounded-md p-1.5" :class="doc.iconBg">
                  <Icon :name="doc.icon" class="h-4 w-4" :class="doc.iconTone" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-900">{{ doc.name }}</p>
                  <p class="text-xs text-slate-500">{{ doc.desc }}</p>
                </div>
              </div>
              <span class="text-xs font-medium text-indigo-600">查看</span>
            </NuxtLink>
          </div>
        </article>

        <article class="rounded-3xl border border-rose-100/80 bg-linear-to-br from-white via-rose-50/70 to-orange-50/70 p-6 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.45)] ring-1 ring-black/5 backdrop-blur-xl">
          <h2 class="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <span class="inline-flex rounded-lg bg-rose-100 p-1.5">
              <Icon name="lucide:messages-square" class="h-5 w-5 text-rose-700" />
            </span>
            交流群与反馈
          </h2>
          <p class="mt-2 text-sm text-slate-600">功能反馈与问题讨论。</p>
          <div class="mt-5 space-y-3">
            <div
              v-for="group in communities"
              :key="group.name"
              class="rounded-xl border bg-white/85 px-4 py-3"
              :class="group.tone"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2.5">
                  <div class="rounded-md p-1.5" :class="group.iconBg">
                    <Icon :name="group.icon" class="h-4 w-4" :class="group.iconTone" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-slate-900">{{ group.name }}</p>
                    <p class="text-xs text-slate-500">{{ group.code }}</p>
                  </div>
                </div>
                <NuxtLink :to="group.link" class="text-xs font-medium text-rose-700 hover:text-rose-800">
                  查看
                </NuxtLink>
              </div>
            </div>
          </div>
        </article>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
const highlights = [
  {
    title: '音乐档案馆',
    desc: 'CDCAT希望保存每一个存在过的音乐信息数据，提供一个可查询的音乐数据库。互联网流媒体提供了便利生活，即使如此一些音乐资料越来越难找了，甚至消失在了时间的夹缝中，特别是同人等小众音乐，随着社团解散，大部分连官网都无法访问。我们希望将它们归档再整理，记录它们的存在。',
    icon: 'lucide:book-marked',
    tone: 'border-slate-200/80',
    iconBg: 'bg-sky-100',
    iconTone: 'text-sky-700'
  },
  {
    title: '时间胶囊',
    desc: '用户可以记录自己听过的、喜欢的歌曲。就像时光机器一样，我们把各种流媒体和音乐数据库功能加强整合，在这里你可以记录你的音乐轨迹。CDCAT不是资源分享类型网站，不会像某些流媒体没了版权就下架。你也可以用来分享你喜欢的歌曲/艺术家。ß',
    icon: 'lucide:disc-3',
    tone: 'border-slate-200/80',
    iconBg: 'bg-indigo-100',
    iconTone: 'text-indigo-700'
  },
  {
    title: '创作者友好',
    desc: '音乐不光是跨越国界的语言，它同样也是商品。一个专辑可能有通常版本，初回限定版本，受注限定生成版本，Hi-Res版本。各种店铺特典还不同，可能还存在DL曲目。我们希望把他们整理归类，在专辑详情页，让各种关系简单易懂。并且能关联作者委托店铺或社交链接，让你更容易支持他们的作品。',
    icon: 'lucide:badge-check',
    tone: 'border-slate-200/80',
    iconBg: 'bg-emerald-100',
    iconTone: 'text-emerald-700'
  },
  {
    title: '开发者友好',
    desc: '作为公开数据库，CDCAT 会提供公开 API 和文档，也欢迎任何人贡献编辑资料。CDCAT 不会采集其他网站数据作为基础数据，即便从零开始非常困难。我相信谁也不需要一个其他数据库的镜像网站。任何人都可以用我们的接口找歌词，匹配封面，甚至构建您自己的应用。',
    icon: 'lucide:file-code-2',
    tone: 'border-slate-200/80',
    iconBg: 'bg-amber-100',
    iconTone: 'text-amber-700'
  },
  {
    title: '关联友好',
    desc: '音乐往往和游戏、动漫、电影、电视剧等内容一起被创作出来。我们设计条目和系列等功能，方便从各个视角切入查看。音乐以外的关联条目，将依赖于别的数据库API接口生成导入维护，用户也可以自行创建编辑。',
    icon: 'lucide:list-checks',
    tone: 'border-slate-200/80',
    iconBg: 'bg-rose-100',
    iconTone: 'text-rose-700'
  },
  {
    title: '综合音乐交流平台',
    desc: '除了音乐以外，之后还会提供耳机音响外设等交流。我们希望推广实体CD收藏和黑胶。如果有机会拿到数字音乐贩卖权，也会提供DL版本购买和展示乐库，如果能像Steam那样喜加一也不错。对于独立音乐制作人和业余爱好者，希望能给他们提供一个技术，创作分享的平台。',
    icon: 'lucide:headphones',
    tone: 'border-slate-200/80',
    iconBg: 'bg-violet-100',
    iconTone: 'text-violet-700'
  },
  {
    title: '深度了解音乐',
    desc: '面向核心用户，后续会提供更多核心功能，关联音乐创作者访谈文章、上传 Booklet 等能力，挖掘音乐创作背后的故事。也会提供用户上传歌词功能，让所有人无障碍便利听歌。',
    icon: 'lucide:mic-2',
    tone: 'border-slate-200/80',
    iconBg: 'bg-cyan-100',
    iconTone: 'text-cyan-700'
  }
]

const usageGuides = [
  {
    tag: '站点基础',
    title: '用户组，权限，审核流程',
    desc: '了解CDCAT的基本工作流程',
    link: '#',
    icon: 'lucide:plus-circle',
    tone: 'border-slate-200/80',
    iconBg: 'bg-cyan-100',
    iconTone: 'text-cyan-700'
  },
  {
    tag: '收集资料',
    title: '如何从互联网寻找音乐资料',
    desc: '贡献数据前，您应该先了解音乐',
    link: '#',
    icon: 'lucide:scan-search',
    tone: 'border-slate-200/80',
    iconBg: 'bg-blue-100',
    iconTone: 'text-blue-700'
  },
  {
    tag: '提交规范',
    title: '提交新专辑/更正错误',
    desc: '了解CDCAT如何处理音乐资料',
    link: '#',
    icon: 'lucide:badge-check',
    tone: 'border-slate-200/80',
    iconBg: 'bg-teal-100',
    iconTone: 'text-teal-700'
  },
]

const docs = [
  { name: 'API 文档', desc: '接口说明', link: '#', icon: 'lucide:braces', iconBg: 'bg-indigo-100', iconTone: 'text-indigo-700' },
  { name: '前端仓库（Git）', desc: 'Nuxt 项目', link: '#', icon: 'lucide:github', iconBg: 'bg-blue-100', iconTone: 'text-blue-700' }
]

const communities = [
  {
    name: 'QQ 交流群',
    code: '群号：1007357274',
    link: '#',
    icon: 'lucide:message-circle',
    tone: 'border-slate-200/80',
    iconBg: 'bg-rose-100',
    iconTone: 'text-rose-700'
  },
  {
    name: 'Telegram 交流群',
    code: '敬请期待',
    link: '#',
    icon: 'lucide:send',
    tone: 'border-slate-200/80',
    iconBg: 'bg-orange-100',
    iconTone: 'text-orange-700'
  },
  {
    name: 'Discord 社区',
    code: '敬请期待',
    link: '#',
    icon: 'lucide:messages-square',
    tone: 'border-slate-200/80',
    iconBg: 'bg-pink-100',
    iconTone: 'text-pink-700'
  }
]

useHead({
  title: 'About | CDCAT'
})
</script>
