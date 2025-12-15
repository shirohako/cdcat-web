<template>
  <div class="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
    <!-- Grid Background -->
    <div class="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>

    <!-- Hero Section -->
    <div class="container mx-auto px-4 md:px-8 py-16 md:py-24 max-w-7xl relative z-10">
      <div class="text-center mb-16">
        <!-- Logo/Title -->
        <div class="flex items-center justify-center gap-3 mb-6">
          <Disc3 :size="48" class="text-blue-600" />
          <h1 class="text-5xl md:text-7xl font-bold bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            CDCAT
          </h1>
        </div>

        <!-- Subtitle -->
        <p class="text-xl md:text-2xl text-gray-700 mb-4">
          日系音乐爱好者的专属数据库
        </p>
        <p class="text-lg text-gray-600 max-w-3xl mx-auto">
          同人音乐 · VOCALOID · 动漫 · 游戏配乐 · 全方位收录
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <NuxtLink
            to="/works"
            class="px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <div class="flex items-center gap-2 justify-center">
              <Music :size="20" />
              <span>浏览作品</span>
            </div>
          </NuxtLink>
          <NuxtLink
            to="/artists"
            class="px-8 py-4 bg-white text-gray-800 rounded-full font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-200"
          >
            <div class="flex items-center gap-2 justify-center">
              <Users :size="20" />
              <span>发现艺术家</span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <!-- Feature 1: 同人音乐 -->
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div class="w-14 h-14 bg-linear-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
            <Disc :size="28" class="text-white" />
          </div>
          <h3 class="text-xl font-bold mb-2 text-gray-800">同人音乐</h3>
          <p class="text-gray-600">
            收录来自 Comiket、M3 等同人展会的精品音乐作品，涵盖各类社团和独立音乐人
          </p>
        </div>

        <!-- Feature 2: VOCALOID -->
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div class="w-14 h-14 bg-linear-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
            <Music2 :size="28" class="text-white" />
          </div>
          <h3 class="text-xl font-bold mb-2 text-gray-800">VOCALOID</h3>
          <p class="text-gray-600">
            初音未来、洛天依等虚拟歌姬的海量曲库，从经典名曲到最新投稿一网打尽
          </p>
        </div>

        <!-- Feature 3: 动漫游戏 -->
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div class="w-14 h-14 bg-linear-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
            <Gamepad2 :size="28" class="text-white" />
          </div>
          <h3 class="text-xl font-bold mb-2 text-gray-800">动漫游戏</h3>
          <p class="text-gray-600">
            动画原声带、游戏 OST、角色歌、广播剧等周边音乐资料完整收录
          </p>
        </div>

        <!-- Feature 4: 详细资料 -->
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div class="w-14 h-14 bg-linear-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
            <Database :size="28" class="text-white" />
          </div>
          <h3 class="text-xl font-bold mb-2 text-gray-800">详细资料</h3>
          <p class="text-gray-600">
            完整的目录编号、发行信息、曲目列表，让收藏和查询更加便捷高效
          </p>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-16">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-800">探索海量音乐宝藏</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              10K+
            </div>
            <div class="text-gray-600 font-medium">音乐作品</div>
          </div>
          <div class="text-center">
            <div class="text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              5K+
            </div>
            <div class="text-gray-600 font-medium">艺术家/社团</div>
          </div>
          <div class="text-center">
            <div class="text-4xl md:text-5xl font-bold bg-linear-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
              100K+
            </div>
            <div class="text-gray-600 font-medium">曲目信息</div>
          </div>
          <div class="text-center">
            <div class="text-4xl md:text-5xl font-bold bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
              24/7
            </div>
            <div class="text-gray-600 font-medium">随时访问</div>
          </div>
        </div>
      </div>

      <!-- Categories Section -->
      <div class="mb-16">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-800">热门分类</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div class="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
            <div class="text-3xl mb-2">🎵</div>
            <div class="font-semibold text-gray-800">东方Project</div>
          </div>
          <div class="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
            <div class="text-3xl mb-2">🎤</div>
            <div class="font-semibold text-gray-800">VOCALOID</div>
          </div>
          <div class="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
            <div class="text-3xl mb-2">🎮</div>
            <div class="font-semibold text-gray-800">游戏音乐</div>
          </div>
          <div class="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
            <div class="text-3xl mb-2">📺</div>
            <div class="font-semibold text-gray-800">动画OST</div>
          </div>
          <div class="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
            <div class="text-3xl mb-2">🎹</div>
            <div class="font-semibold text-gray-800">同人社团</div>
          </div>
          <div class="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
            <div class="text-3xl mb-2">✨</div>
            <div class="font-semibold text-gray-800">角色歌</div>
          </div>
        </div>
      </div>

      <!-- How it Works Section -->
      <div class="bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 md:p-12 text-white">
        <h2 class="text-3xl font-bold text-center mb-12">如何使用 CDCAT</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Search :size="32" />
            </div>
            <h3 class="text-xl font-bold mb-3">1. 搜索发现</h3>
            <p class="text-blue-100">
              通过关键词、艺术家名、目录编号快速找到你想要的音乐作品
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen :size="32" />
            </div>
            <h3 class="text-xl font-bold mb-3">2. 查看详情</h3>
            <p class="text-blue-100">
              浏览完整的专辑信息、曲目列表、参与人员等详细资料
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart :size="32" />
            </div>
            <h3 class="text-xl font-bold mb-3">3. 收藏管理</h3>
            <p class="text-blue-100">
              收藏喜欢的作品和艺术家，建立属于你的音乐收藏库
            </p>
          </div>
        </div>
      </div>

      <!-- Footer CTA -->
      <div class="text-center mt-16">
        <p class="text-gray-600 mb-6 text-lg">
          加入我们，一起探索日系音乐的无限魅力
        </p>
        <NuxtLink
          to="/works"
          class="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
          <span>立即开始</span>
          <ArrowRight :size="20" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Disc3,
  Disc,
  Music,
  Music2,
  Users,
  Gamepad2,
  Database,
  Search,
  BookOpen,
  Heart,
  ArrowRight
} from "lucide-vue-next";

// SEO Meta Tags
useHead({
  title: 'CDCAT - 日系音乐数据库 | 同人·VOCALOID·动漫·游戏',
  meta: [
    {
      name: 'description',
      content: 'CDCAT 是专为日系音乐爱好者打造的综合数据库，收录同人音乐、VOCALOID、动漫游戏OST等海量作品信息。'
    },
    {
      name: 'keywords',
      content: '日系音乐,同人音乐,VOCALOID,初音未来,东方Project,动漫OST,游戏音乐,音乐数据库'
    }
  ]
});
</script>

<style scoped>
.bg-grid-pattern {
  background-image:
    linear-gradient(to right, rgba(147, 51, 234, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(147, 51, 234, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* 为网格添加微妙的动画效果（可选） */
@media (prefers-reduced-motion: no-preference) {
  .bg-grid-pattern {
    animation: grid-fade 3s ease-in-out infinite alternate;
  }
}

@keyframes grid-fade {
  0% {
    opacity: 0.25;
  }
  100% {
    opacity: 0.35;
  }
}
</style>
