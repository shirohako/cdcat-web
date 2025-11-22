<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">仪表盘</h1>
      <p class="text-gray-600 mt-2">欢迎回来！这是你的项目概览</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg
               transition-all duration-200 hover:-translate-y-1"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
          </div>
          <div
            :class="[
              'w-12 h-12 rounded-lg flex items-center justify-center',
              stat.bgColor
            ]"
          >
            <Icon :name="stat.icon" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="mt-4 flex items-center gap-2">
          <span
            :class="[
              'text-sm font-medium',
              stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
            ]"
          >
            <Icon
              :name="stat.trend === 'up' ? 'lucide:trending-up' : 'lucide:trending-down'"
              class="w-4 h-4 inline"
            />
            {{ stat.change }}
          </span>
          <span class="text-sm text-gray-500">vs 上月</span>
        </div>
      </div>
    </div>

    <!-- Recent Projects -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">最近项目</h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="project in recentProjects"
              :key="project.id"
              class="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50
                     transition-colors duration-150 cursor-pointer border border-transparent
                     hover:border-gray-200"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    project.color
                  ]"
                >
                  <Icon :name="project.icon" class="w-5 h-5 text-white" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ project.name }}</p>
                  <p class="text-sm text-gray-500">{{ project.tasks }} 个任务</p>
                </div>
              </div>
              <div class="text-right">
                <div
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    project.statusColor
                  ]"
                >
                  {{ project.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-lg border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">最近活动</h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex gap-3"
            >
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <span class="text-white text-xs font-semibold">{{ activity.user.charAt(0) }}</span>
                </div>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-900">
                  <span class="font-medium">{{ activity.user }}</span>
                  {{ activity.action }}
                </p>
                <p class="text-xs text-gray-500 mt-1">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const stats = [
  {
    label: '总项目',
    value: '24',
    icon: 'lucide:folder',
    bgColor: 'bg-blue-500',
    trend: 'up',
    change: '+12%'
  },
  {
    label: '进行中任务',
    value: '156',
    icon: 'lucide:check-square',
    bgColor: 'bg-green-500',
    trend: 'up',
    change: '+8%'
  },
  {
    label: '团队成员',
    value: '32',
    icon: 'lucide:users',
    bgColor: 'bg-purple-500',
    trend: 'up',
    change: '+3%'
  },
  {
    label: '完成率',
    value: '87%',
    icon: 'lucide:trending-up',
    bgColor: 'bg-orange-500',
    trend: 'up',
    change: '+5%'
  }
]

const recentProjects = [
  {
    id: 1,
    name: '网站重构项目',
    tasks: 24,
    status: '进行中',
    statusColor: 'bg-green-100 text-green-800',
    icon: 'lucide:layout',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: '移动应用开发',
    tasks: 18,
    status: '设计中',
    statusColor: 'bg-yellow-100 text-yellow-800',
    icon: 'lucide:smartphone',
    color: 'bg-purple-500'
  },
  {
    id: 3,
    name: 'API 集成',
    tasks: 12,
    status: '测试中',
    statusColor: 'bg-blue-100 text-blue-800',
    icon: 'lucide:code',
    color: 'bg-green-500'
  }
]

const recentActivities = [
  {
    id: 1,
    user: '张三',
    action: '完成了任务 "用户界面设计"',
    time: '5分钟前'
  },
  {
    id: 2,
    user: '李四',
    action: '创建了新项目 "数据分析系统"',
    time: '1小时前'
  },
  {
    id: 3,
    user: '王五',
    action: '更新了 "移动应用开发" 项目状态',
    time: '2小时前'
  },
  {
    id: 4,
    user: '赵六',
    action: '添加了新的团队成员',
    time: '3小时前'
  }
]
</script>
