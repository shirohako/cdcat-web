<template>
  <div
    class="min-h-screen relative overflow-hidden bg-linear-to-br from-amber-50 via-slate-50 to-sky-50 text-slate-900"
  >
    <div
      class="relative z-10 container mx-auto max-w-6xl px-4 md:px-8 py-16 md:py-24 space-y-16"
    >
      <!-- Hero -->
      <section class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
        <div class="space-y-6">
          <div class="space-y-4 animate-rise">
            <h1
              class="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900"
            >
              探索繁星璀璨的夜空，找到属于你的声音坐标
            </h1>
            <p class="text-lg text-slate-600 max-w-2xl">
              CDCAT 是一个面向重度听歌用户的音乐资料站点。
            </p>
          </div>

          <div class="flex flex-col sm:flex-row gap-3 animate-rise-delayed">
            <NuxtLink
              to="/works"
              class="group inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-sky-500 to-emerald-500 px-6 py-3 text-white font-semibold shadow-lg shadow-sky-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Music :size="20" />
              浏览作品
              <ArrowRight
                :size="18"
                class="transition-transform duration-300 group-hover:translate-x-1"
              />
            </NuxtLink>
            <NuxtLink
              to="/artists"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-800 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
            >
              <Users :size="20" />
              发现艺术家
            </NuxtLink>
          </div>

          <div
            class="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-rise-slower"
          >
            <div class="border border-slate-200/90 bg-white/80 rounded-[14px] py-3.5 px-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-30px_rgba(15,23,42,0.5)]">
              <div
                class="flex items-center gap-2 text-emerald-600 font-semibold"
              >
                <Disc3 :size="18" />
                <span>数据库</span>
              </div>
              <p class="text-sm text-slate-600 mt-1">可以查询音乐作品的情报</p>
            </div>
            <div class="border border-slate-200/90 bg-white/80 rounded-[14px] py-3.5 px-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-30px_rgba(15,23,42,0.5)]">
              <div class="flex items-center gap-2 text-sky-600 font-semibold">
                <Search :size="18" />
                <span>时光机</span>
              </div>
              <p class="text-sm text-slate-600 mt-1">
                管理自己听过的，喜欢的歌曲
              </p>
            </div>
            <div class="border border-slate-200/90 bg-white/80 rounded-[14px] py-3.5 px-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-30px_rgba(15,23,42,0.5)]">
              <div class="flex items-center gap-2 text-amber-600 font-semibold">
                <Radio :size="18" />
                <span>交流地</span>
              </div>
              <p class="text-sm text-slate-600 mt-1">
                这里也是 音乐/设备/作曲 的交流平台
              </p>
            </div>
          </div>
        </div>

        <div class="relative">
          <div class="border border-white/80 bg-[linear-gradient(140deg,rgba(255,255,255,0.9),rgba(241,245,249,0.9))] shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] rounded-4xl p-5 backdrop-blur-sm animate-[fade-in_0.6s_ease_both]">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Beta Version
                </p>
                <p class="text-3xl font-black text-slate-900 mt-1">CDCAT</p>
              </div>
              <div
                class="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold"
              >
                <Sparkles :size="14" />
                <span>内部测试版本</span>
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <div
                class="rounded-2xl bg-white/70 border border-white/60 shadow-sm p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <p class="text-sm font-semibold text-slate-700">
                    你想找什么？
                  </p>
                  <div
                    class="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold"
                  >
                    <Sparkles :size="14" />
                    <span>搜索功能还不可用</span>
                  </div>
                </div>
                <div
                  class="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)]"
                >
                  <Search :size="18" class="text-slate-500" />
                  <span class="text-sm text-slate-500"
                    >例如：东方红魔乡 / 初音未来 / M3-53</span
                  >
                </div>
              </div>

              <p class="text-sm font-semibold text-slate-700">发现更多：</p>
              <div class="grid grid-cols-2 gap-3">
                <div class="border border-slate-200/90 bg-white/85 rounded-2xl p-3.5 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(15,23,42,0.6)]">
                  <div
                    class="flex items-center gap-2 text-sky-600 font-semibold"
                  >
                    <Library :size="16" />
                    <span>找音乐</span>
                  </div>
                </div>
                <div class="border border-slate-200/90 bg-white/85 rounded-2xl p-3.5 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(15,23,42,0.6)]">
                  <div
                    class="flex items-center gap-2 text-amber-600 font-semibold"
                  >
                    <Mic2 :size="16" />
                    <span>找音乐人</span>
                  </div>
                </div>
                <div class="border border-slate-200/90 bg-white/85 rounded-2xl p-3.5 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(15,23,42,0.6)]">
                  <div
                    class="flex items-center gap-2 text-emerald-600 font-semibold"
                  >
                    <CalendarDays :size="16" />
                    <span>设备评测</span>
                  </div>
                </div>
                <div class="border border-slate-200/90 bg-white/85 rounded-2xl p-3.5 shadow-[0_12px_36px_-26px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(15,23,42,0.6)]">
                  <div
                    class="flex items-center gap-2 text-slate-800 font-semibold"
                  >
                    <Tag :size="16" />
                    <span>交流</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Portal -->
      <section class="space-y-6">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h2 class="text-3xl font-bold text-slate-900">满足所有人的需求</h2>
            <p class="text-slate-600 mt-1">
              无论您是创作者，还是听众，都可以使用。
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="link in portalLinks"
            :key="link.title"
            class="group flex items-start gap-4 rounded-2xl bg-white/80 border border-white/70 p-5 shadow-lg shadow-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              :class="[
                'h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0',
                link.tone,
              ]"
            >
              <component :is="link.icon" :size="22" />
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-semibold text-slate-900">
                  {{ link.title }}
                </h3>
                <ArrowRight
                  :size="16"
                  class="text-slate-400 transition-transform duration-300 group-hover:translate-x-1"
                />
              </div>
              <p class="text-slate-600">{{ link.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- What We Offer -->
      <section
        class="rounded-3xl bg-white/80 border border-white/70 shadow-xl shadow-slate-200/60 p-6 md:p-10 space-y-10"
      >
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <p class="text-sm uppercase tracking-[0.2em] text-slate-500">
              What we offer
            </p>
            <h2 class="text-3xl font-bold text-slate-900">自有"纯净"数据</h2>
            <p class="text-slate-600 mt-1">
              CDCAT 不会用爬虫自动化收集任何同类网站数据，所有数据来自用户提交。
            </p>
          </div>
          <div class="flex flex-wrap gap-2 text-xs text-slate-600">
            <span class="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-900/4 text-slate-900 rounded-full font-semibold border border-slate-400/30 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)]">任何人可编辑</span>
            <span class="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-900/4 text-slate-900 rounded-full font-semibold border border-slate-400/30 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)]">开放接口</span>
            <span class="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-900/4 text-slate-900 rounded-full font-semibold border border-slate-400/30 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)]">免费</span>
          </div>
        </div>

        <div class="grid md:grid-cols-4 gap-4">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div class="text-3xl font-black text-slate-900">
              {{ stat.value }}
            </div>
            <div class="text-sm font-semibold text-slate-600 mt-1">
              {{ stat.label }}
            </div>
            <p class="text-xs text-slate-500 mt-1">{{ stat.desc }}</p>
          </div>
        </div>
      </section>

      <!-- Featured Topics -->
      <section class="space-y-6">
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <p class="text-sm uppercase tracking-[0.2em] text-slate-500">
              Curated topics
            </p>
            <h2 class="text-3xl font-bold text-slate-900">不仅仅是音乐</h2>
            <p class="text-slate-600 mt-1">
              音乐往往和游戏、动漫、电影、电视剧等内容一起被创作出来。我们完善的关联设计，方便从各个视角切入查看。
            </p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="topic in topics"
            :key="topic.title"
            class="border border-slate-200/90 bg-linear-to-b from-white/96 to-slate-50/95 rounded-[22px] p-4.5 shadow-[0_28px_70px_-46px_rgba(15,23,42,0.5)] transition-all duration-350 hover:-translate-y-2 hover:shadow-[0_32px_80px_-48px_rgba(15,23,42,0.55)] hover:border-blue-500/20"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'h-11 w-11 rounded-full flex items-center justify-center text-white',
                    topic.tone,
                  ]"
                >
                  <component :is="topic.icon" :size="20" />
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
                    {{ topic.tag }}
                  </p>
                  <h3 class="text-lg font-semibold text-slate-900">
                    {{ topic.title }}
                  </h3>
                </div>
              </div>
            </div>
            <p class="text-slate-600 mt-3">{{ topic.desc }}</p>
            <div class="flex flex-wrap gap-2 mt-4">
              <span
                v-for="pill in topic.pills"
                :key="pill"
                class="inline-flex items-center gap-1.5 py-2 px-3 bg-slate-900/4 text-slate-900 rounded-full font-semibold border border-slate-400/30 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)]"
              >
                {{ pill }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Flow -->
      <section
        class="rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-2xl shadow-slate-400/20 overflow-hidden relative"
      >
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute inset-0 opacity-30 animate-[shimmer_10s_linear_infinite] hero-grid"></div>
        </div>
        <div class="relative z-10 space-y-8">
          <div
            class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <p class="text-sm uppercase tracking-[0.2em] text-slate-300">
                Flow
              </p>
              <h2 class="text-3xl font-bold">为收藏家定制的音乐站</h2>
              <p class="text-slate-200/80 mt-2">
                我们在专辑的基础上，提供商品，特典信息查看。
              </p>
            </div>
          </div>

          <div class="grid md:grid-cols-3 gap-4">
            <div
              v-for="(item, index) in flow"
              :key="item.title"
              class="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <div class="flex items-center gap-3">
                <div
                  class="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold"
                >
                  {{ index + 1 }}
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-300">
                    {{ item.tag }}
                  </p>
                  <h3 class="text-lg font-semibold">{{ item.title }}</h3>
                </div>
              </div>
              <p class="text-slate-200/80 mt-3 leading-relaxed">
                {{ item.desc }}
              </p>
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
  Disc3,
  Library,
  Mic2,
  Music,
  Radio,
  Search,
  Sparkles,
  Tag,
  Users,
  ListMusic,
  Flame,
  Globe2,
} from "lucide-vue-next";

const portalLinks = [
  {
    title: "听众",
    desc: "可以在 CDCAT 记录，管理自己听过的音乐，创建歌单，分享喜欢的曲目。",
    icon: Library,
    tone: "bg-gradient-to-br from-sky-500 to-cyan-500",
  },
  {
    title: "音乐创作者",
    desc: "可以在 CDCAT 宣传自己的作品，添加售卖链接，和听众意见。",
    icon: Mic2,
    tone: "bg-gradient-to-br from-emerald-500 to-lime-500",
  },
];

const stats = [
  { value: "0K+", label: "音乐作品", desc: "" },
  { value: "0K+", label: "艺术家/社团", desc: "" },
  { value: "0K+", label: "单曲", desc: "" },
  { value: "0K+", label: "乐评", desc: "" },
];

const topics = [
  {
    tag: "条目",
    title: "寻找某个动画的所有音乐",
    desc: "我们设计了条目，可以快速从Bangumi.tv 导入动画，任何专辑都可以关联到条目中。",
    pills: ["动画", "游戏", "电视剧"],
    icon: Globe2,
    tone: "bg-gradient-to-br from-sky-500 to-blue-600",
  },
  {
    tag: "系列",
    title: "寻找有相同所有音乐",
    desc: "多个同样IP下的多个游戏，动画。可以将多个专辑和条目，归档为一个系列，结构一目了然。",
    pills: ["整合条目", "同主题"],
    icon: ListMusic,
    tone: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
];

const flow = [
  {
    tag: "Products",
    title: "商品",
    desc: "整合所有音乐关联的发型产品。无论是普通版本，限定版本，还是数字下载版本。轻松了解关系和价格。",
    icon: Search,
  },
  {
    tag: "Tokuten",
    title: "特典",
    desc: "限定特典，店铺特典，下载特典，期间限定特典。轻松了解商品信息。",
    icon: Library,
  },
  {
    tag: "Links",
    title: "链接",
    desc: "一键直达作者委托店铺，拒绝跳转到任何诈骗网站。",
    icon: Tag,
  },
];

useHead({
  title: "CDCAT - 日系音乐门户 | 同人·VOCALOID·动漫·游戏",
  meta: [
    {
      name: "description",
      content:
        "CDCAT 是日系音乐情报门户，聚合同人音乐、VOCALOID、动漫游戏配乐与活动档案，提供细致的曲目信息与专题策展。",
    },
    {
      name: "keywords",
      content:
        "日系音乐,同人音乐,VOCALOID,东方Project,动漫OST,游戏音乐,音乐数据库,曲目索引",
    },
  ],
});
</script>

<style scoped>
.hero-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
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
    background-position:
      0 0,
      0 0;
  }
  100% {
    background-position:
      80px 80px,
      80px 80px;
  }
}
</style>
