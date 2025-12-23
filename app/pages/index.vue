<template>
  <div class="min-h-screen relative overflow-hidden bg-linear-to-br from-amber-50 via-slate-50 to-sky-50 text-slate-900">
    <div class="pointer-events-none absolute inset-0">
      <div class="floating-blob blob-1"></div>
      <div class="floating-blob blob-2"></div>
      <div class="glow-ring"></div>
    </div>

    <div class="relative z-10 container mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24 space-y-16">
      <!-- Hero -->
      <section class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div class="space-y-6">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-white/70 shadow-sm backdrop-blur-sm animate-fade-in">
            <Sparkles :size="16" class="text-amber-500" />
            <span class="text-sm font-semibold text-slate-700">CDCAT 音乐情报门户</span>
          </div>
          <div class="space-y-4 animate-rise">
            <h1 class="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900">
              探索日系音乐宇宙，找到属于你的声音坐标
            </h1>
            <p class="text-lg text-slate-600 max-w-2xl">
              CDCAT 汇集同人音乐、VOCALOID、动漫与游戏配乐的全景信息。用更美的导航、精选专题与实时更新，让每一次发现都更顺畅。
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 animate-rise-delayed">
            <NuxtLink
              to="/works"
              class="group inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-sky-500 to-emerald-500 px-6 py-3 text-white font-semibold shadow-lg shadow-sky-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Music :size="20" />
              浏览作品
              <ArrowRight :size="18" class="transition-transform duration-300 group-hover:translate-x-1" />
            </NuxtLink>
            <NuxtLink
              to="/artists"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-800 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
            >
              <Users :size="20" />
              发现艺术家
            </NuxtLink>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-rise-slower">
            <div class="glass-card">
              <div class="flex items-center gap-2 text-emerald-600 font-semibold">
                <Disc3 :size="18" />
                <span>精选专题</span>
              </div>
              <p class="text-sm text-slate-600 mt-1">东方 Project / VOCALOID / 游戏音乐</p>
            </div>
            <div class="glass-card">
              <div class="flex items-center gap-2 text-sky-600 font-semibold">
                <Search :size="18" />
                <span>快速索引</span>
              </div>
              <p class="text-sm text-slate-600 mt-1">目录编号、曲目、社团一键直达</p>
            </div>
            <div class="glass-card">
              <div class="flex items-center gap-2 text-amber-600 font-semibold">
                <Radio :size="18" />
                <span>持续更新</span>
              </div>
              <p class="text-sm text-slate-600 mt-1">新作情报与活动档期同步上线</p>
            </div>
          </div>
        </div>

        <div class="relative">
          <div class="hero-panel">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Live Pulse</p>
                <p class="text-3xl font-black text-slate-900 mt-1">CDCAT</p>
              </div>
              <div class="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold">
                <Sparkles :size="14" />
                <span>Focus Mode</span>
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <div class="rounded-2xl bg-white/70 border border-white/60 shadow-sm p-4">
                <div class="flex items-center justify-between mb-3">
                  <p class="text-sm font-semibold text-slate-700">你想找什么？</p>
                  <div class="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                    <Sparkles :size="14" />
                    <span>智能提示</span>
                  </div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)]">
                  <Search :size="18" class="text-slate-500" />
                  <span class="text-sm text-slate-500">例如：东方红魔乡 / 初音未来 / M3-53</span>
                </div>
                <div class="flex flex-wrap gap-2 mt-3">
                  <span class="chip">专辑编号</span>
                  <span class="chip">社团名</span>
                  <span class="chip">角色曲</span>
                  <span class="chip">活动档期</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="mini-card">
                  <div class="flex items-center gap-2 text-sky-600 font-semibold">
                    <Library :size="16" />
                    <span>作品库</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">按专辑、单曲、合辑筛选</p>
                </div>
                <div class="mini-card">
                  <div class="flex items-center gap-2 text-amber-600 font-semibold">
                    <Mic2 :size="16" />
                    <span>艺术家</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">制作人 / Vocal / 场景音乐人</p>
                </div>
                <div class="mini-card">
                  <div class="flex items-center gap-2 text-emerald-600 font-semibold">
                    <CalendarDays :size="16" />
                    <span>活动日程</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">Comiket · M3 · Live 信息</p>
                </div>
                <div class="mini-card">
                  <div class="flex items-center gap-2 text-slate-800 font-semibold">
                    <Tag :size="16" />
                    <span>标签导航</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">风格 / 主题 / 角色歌</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Portal Navigation -->
      <section class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Portal</p>
            <h2 class="text-3xl font-bold text-slate-900">选择你要去的地方</h2>
            <p class="text-slate-600 mt-1">用更清晰的入口快速到达目标：作品、艺术家、活动与专题导航。</p>
          </div>
          <NuxtLink
            to="/works"
            class="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900 transition-colors"
          >
            查看所有入口
            <ArrowRight :size="16" />
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink
            v-for="link in portalLinks"
            :key="link.title"
            :to="link.to"
            class="group flex items-start gap-4 rounded-2xl bg-white/80 border border-white/70 p-5 shadow-lg shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div :class="['h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0', link.tone]">
              <component :is="link.icon" :size="22" />
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-semibold text-slate-900">{{ link.title }}</h3>
                <ArrowRight
                  :size="16"
                  class="text-slate-400 transition-transform duration-300 group-hover:translate-x-1"
                />
              </div>
              <p class="text-slate-600">{{ link.desc }}</p>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <component :is="Sparkles" :size="14" />
                <span>{{ link.meta }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- What We Offer -->
      <section class="rounded-3xl bg-white/80 border border-white/70 shadow-xl shadow-slate-200/60 p-6 md:p-10 space-y-10">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p class="text-sm uppercase tracking-[0.2em] text-slate-500">What we offer</p>
            <h2 class="text-3xl font-bold text-slate-900">CDCAT 提供的一切</h2>
            <p class="text-slate-600 mt-1">用细节丰富的档案、精选策展与灵感探索，让收藏与查找更简单。</p>
          </div>
          <div class="flex flex-wrap gap-2 text-xs text-slate-600">
            <span class="chip">曲目信息</span>
            <span class="chip">制作人员</span>
            <span class="chip">发行渠道</span>
            <span class="chip">活动收录</span>
          </div>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="item in featureList"
            :key="item.title"
            class="feature-card group"
          >
            <div class="flex items-center gap-3">
              <div :class="['h-11 w-11 rounded-xl flex items-center justify-center text-white', item.tone]">
                <component :is="item.icon" :size="20" />
              </div>
              <h3 class="text-xl font-semibold text-slate-900">{{ item.title }}</h3>
            </div>
            <p class="text-slate-600 mt-3 leading-relaxed">{{ item.desc }}</p>
            <div class="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <AudioWaveform :size="14" />
              <span>{{ item.tagline }}</span>
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-4 gap-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div class="text-3xl font-black text-slate-900">{{ stat.value }}</div>
            <div class="text-sm font-semibold text-slate-600 mt-1">{{ stat.label }}</div>
            <p class="text-xs text-slate-500 mt-1">{{ stat.desc }}</p>
          </div>
        </div>
      </section>

      <!-- Featured Topics -->
      <section class="space-y-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p class="text-sm uppercase tracking-[0.2em] text-slate-500">Curated topics</p>
            <h2 class="text-3xl font-bold text-slate-900">热门专题与灵感</h2>
            <p class="text-slate-600 mt-1">以主题化的方式探索，让你快速沉浸在喜欢的世界观与角色里。</p>
          </div>
          <NuxtLink
            to="/works"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            浏览更多
            <ArrowRight :size="16" />
          </NuxtLink>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="topic in topics"
            :key="topic.title"
            class="topic-card"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div :class="['h-11 w-11 rounded-full flex items-center justify-center text-white', topic.tone]">
                  <component :is="topic.icon" :size="20" />
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-500">{{ topic.tag }}</p>
                  <h3 class="text-xl font-semibold text-slate-900">{{ topic.title }}</h3>
                </div>
              </div>
              <ArrowRight :size="18" class="text-slate-400" />
            </div>
            <p class="text-slate-600 mt-3">{{ topic.desc }}</p>
            <div class="flex flex-wrap gap-2 mt-4">
              <span
                v-for="pill in topic.pills"
                :key="pill"
                class="chip"
              >
                {{ pill }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Flow -->
      <section class="rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-2xl shadow-slate-400/20 overflow-hidden relative">
        <div class="absolute inset-0 pointer-events-none">
          <div class="hero-grid"></div>
        </div>
        <div class="relative z-10 space-y-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p class="text-sm uppercase tracking-[0.2em] text-slate-300">Flow</p>
              <h2 class="text-3xl font-bold">3 步抵达想要的音乐</h2>
              <p class="text-slate-200/80 mt-2">更顺滑的交互、柔和的动画，帮助你快速筛选、查看、收藏。</p>
            </div>
            <NuxtLink
              to="/works"
              class="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-4 py-2 text-sm font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              开始探索
              <ArrowRight :size="16" />
            </NuxtLink>
          </div>

          <div class="grid md:grid-cols-3 gap-4">
            <div
              v-for="(step, index) in flow"
              :key="step.title"
              class="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                  {{ index + 1 }}
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-300">{{ step.tag }}</p>
                  <h3 class="text-lg font-semibold">{{ step.title }}</h3>
                </div>
              </div>
              <p class="text-slate-200/80 mt-3 leading-relaxed">{{ step.desc }}</p>
              <div class="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-200">
                <component :is="step.icon" :size="14" />
                <span>{{ step.meta }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Disc3,
  Library,
  Mic2,
  Music,
  Radio,
  Search,
  Sparkles,
  Tag,
  Users,
  AudioWaveform,
  Layers,
  ListMusic,
  Flame,
  Globe2
} from "lucide-vue-next";

const portalLinks = [
  {
    title: '作品库',
    desc: '按专辑、单曲、合集、番剧 OST 浏览，支持目录编号与标签检索。',
    meta: '新入库与历史版本同步展示',
    to: '/works',
    icon: Library,
    tone: 'bg-gradient-to-br from-sky-500 to-cyan-500'
  },
  {
    title: '艺术家 · 社团',
    desc: '制作人、Vocal、编曲、社团资料一站式整理，便于交叉查询。',
    meta: '支持按角色、圈内名搜索',
    to: '/artists',
    icon: Mic2,
    tone: 'bg-gradient-to-br from-emerald-500 to-lime-500'
  }
];

const featureList = [
  {
    title: '档案级细节',
    desc: '曲目列表、参与人员、发行渠道、活动出展信息，一目了然。',
    tagline: '深度曲目信息',
    icon: Layers,
    tone: 'bg-gradient-to-br from-sky-500 to-indigo-500'
  },
  {
    title: '主题化策展',
    desc: '东方 Project、初音未来、Galgame 配乐等专题导航，灵感随时可达。',
    tagline: '灵感推荐',
    icon: Compass,
    tone: 'bg-gradient-to-br from-amber-500 to-orange-500'
  },
  {
    title: '实时更新',
    desc: '活动档期、社团新作、热门曲目趋势即时刷新，保持最新状态。',
    tagline: '保持新鲜',
    icon: Flame,
    tone: 'bg-gradient-to-br from-emerald-500 to-teal-500'
  }
];

const stats = [
  { value: '10K+', label: '音乐作品', desc: '同人 / VOCALOID / OST', },
  { value: '5K+', label: '艺术家/社团', desc: '制作人 / Vocal / 团队' },
  { value: '120K+', label: '曲目信息', desc: '曲目、编曲、作词详单' },
  { value: '24/7', label: '服务状态', desc: '随时随地访问查询' }
];

const topics = [
  {
    tag: 'TOUHOU',
    title: '东方 Project 主题馆',
    desc: '按社团、角色歌、弹幕作品时间线整理，帮助你回顾与补完。',
    pills: ['同人展会', '角色曲', '专辑编号'],
    icon: Globe2,
    tone: 'bg-gradient-to-br from-sky-500 to-blue-600'
  },
  {
    tag: 'VOCALOID',
    title: '虚拟歌姬星图',
    desc: '初音未来、洛天依、可不等歌姬的热门曲与冷门佳作一键直达。',
    pills: ['V家曲库', 'PV 收录', '制作人'],
    icon: ListMusic,
    tone: 'bg-gradient-to-br from-emerald-500 to-teal-600'
  },
  {
    tag: 'GAME & ANIME',
    title: '动画 / 游戏配乐',
    desc: '番剧 OST、Galgame、主机与手游配乐按季度与平台分类浏览。',
    pills: ['季度新番', 'Galgame', 'Live OST'],
    icon: Flame,
    tone: 'bg-gradient-to-br from-amber-500 to-orange-600'
  }
];

const flow = [
  {
    tag: 'Discover',
    title: '搜索与导航',
    desc: '关键词、编号、标签组合搜索，动画过渡帮你快速切换筛选。',
    meta: '智能提示 + 动画反馈',
    icon: Search
  },
  {
    tag: 'Dive in',
    title: '浏览档案页',
    desc: '清晰的曲目列表与参与人员模块，保持视线焦点与阅读节奏。',
    meta: '流畅过场动画',
    icon: Library
  },
  {
    tag: 'Collect',
    title: '收藏与关注',
    desc: '关注艺术家/社团，收藏喜欢的作品，生成你的私人播放清单感受。',
    meta: '实时同步',
    icon: Tag
  }
];

useHead({
  title: 'CDCAT - 日系音乐门户 | 同人·VOCALOID·动漫·游戏',
  meta: [
    {
      name: 'description',
      content: 'CDCAT 是日系音乐情报门户，聚合同人音乐、VOCALOID、动漫游戏配乐与活动档案，提供细致的曲目信息与专题策展。'
    },
    {
      name: 'keywords',
      content: '日系音乐,同人音乐,VOCALOID,东方Project,动漫OST,游戏音乐,音乐数据库,曲目索引'
    }
  ]
});
</script>

<style scoped>
.floating-blob {
  position: absolute;
  filter: blur(60px);
  opacity: 0.5;
  transform: translateZ(0);
  animation: float 18s ease-in-out infinite;
}

.blob-1 {
  width: 420px;
  height: 420px;
  top: -80px;
  left: -60px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 60%);
  animation-delay: 0.3s;
}

.blob-2 {
  width: 380px;
  height: 380px;
  right: -40px;
  bottom: -60px;
  background: radial-gradient(circle, rgba(244, 165, 96, 0.35), transparent 60%);
  animation-delay: 1s;
}

.glow-ring {
  position: absolute;
  inset: 10% 12%;
  border-radius: 32px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 0 120px 40px rgba(59, 130, 246, 0.08);
}

.hero-panel {
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.9));
  box-shadow: 0 30px 60px -40px rgba(15, 23, 42, 0.45);
  border-radius: 32px;
  padding: 20px;
  backdrop-filter: blur(8px);
  animation: fade-in 0.6s ease both;
}

.glass-card {
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 16px 40px -28px rgba(15, 23, 42, 0.45);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 50px -30px rgba(15, 23, 42, 0.5);
}

.mini-card {
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.85);
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 12px 36px -26px rgba(15, 23, 42, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.mini-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px -26px rgba(15, 23, 42, 0.6);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.04);
  color: #0f172a;
  border-radius: 9999px;
  font-weight: 600;
  border: 1px solid rgba(148, 163, 184, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 30px -22px rgba(15, 23, 42, 0.5);
}

.feature-card {
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.95));
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 26px 60px -42px rgba(15, 23, 42, 0.5);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 32px 70px -44px rgba(15, 23, 42, 0.6);
  border-color: rgba(59, 130, 246, 0.2);
}

.topic-card {
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.95));
  border-radius: 22px;
  padding: 18px;
  box-shadow: 0 28px 70px -46px rgba(15, 23, 42, 0.5);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
}

.topic-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 32px 80px -48px rgba(15, 23, 42, 0.55);
  border-color: rgba(59, 130, 246, 0.2);
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.3;
  animation: shimmer 10s linear infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(24px);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: 0 0, 0 0;
  }
  100% {
    background-position: 80px 80px, 80px 80px;
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease both;
}

.animate-rise {
  animation: fade-in 0.7s ease both;
}

.animate-rise-delayed {
  animation: fade-in 0.8s ease both;
  animation-delay: 0.05s;
}

.animate-rise-slower {
  animation: fade-in 0.9s ease both;
  animation-delay: 0.1s;
}
</style>
