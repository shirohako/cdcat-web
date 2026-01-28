<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-md ring-1 ring-red-200/60 overflow-hidden">
      <div class="p-6 pb-5 border-b border-red-100">
        <h2 class="text-base font-semibold text-red-600">危险操作</h2>
        <p class="text-sm text-gray-500 mt-1">以下操作不可逆转，请谨慎操作</p>
      </div>

      <div class="divide-y divide-gray-100">
        <div class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-900">导出数据</p>
            <p class="text-xs text-gray-400 mt-0.5">下载你的所有数据的副本</p>
          </div>
          <button type="button" class="btn btn-outline btn-sm gap-1.5 shrink-0" @click="$emit('info', '数据导出已开始，完成后将通过邮件通知你')">
            <Download :size="14" />
            导出
          </button>
        </div>

        <div class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-900">停用账户</p>
            <p class="text-xs text-gray-400 mt-0.5">暂时停用账户，你的数据将被保留</p>
          </div>
          <button type="button" class="btn btn-outline btn-warning btn-sm shrink-0" @click="$emit('info', '账户停用功能即将上线')">
            停用
          </button>
        </div>

        <div class="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-900">删除账户</p>
            <p class="text-xs text-gray-400 mt-0.5">永久删除你的账户和所有数据，此操作无法撤销</p>
          </div>
          <button type="button" class="btn btn-error btn-sm text-white gap-1.5 shrink-0" @click="showConfirm = true">
            <Trash2 :size="14" />
            删除账户
          </button>
        </div>
      </div>
    </section>

    <!-- Delete confirm modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          @click.self="close"
        >
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="scale-95 opacity-0"
            enter-to-class="scale-100 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="scale-100 opacity-100"
            leave-to-class="scale-95 opacity-0"
          >
            <div v-if="showConfirm" class="bg-white rounded-2xl shadow-2xl w-full max-w-md ring-1 ring-black/5">
              <div class="p-6">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle :size="20" class="text-red-600" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900">确认删除账户</h3>
                </div>

                <p class="text-sm text-gray-600 leading-relaxed mb-5">
                  此操作将永久删除你的账户及所有关联数据，包括个人资料、贡献记录等。此操作<strong class="text-gray-900">无法撤销</strong>。
                </p>

                <div class="grid gap-1.5">
                  <label for="delete-confirm" class="text-sm text-gray-700">
                    请输入
                    <code class="px-1.5 py-0.5 bg-red-50 rounded text-red-600 font-mono text-xs border border-red-100">{{ username }}</code>
                    以确认
                  </label>
                  <input
                    id="delete-confirm"
                    v-model="confirmText"
                    type="text"
                    class="input input-bordered w-full bg-white"
                    placeholder="输入用户名确认"
                    @keyup.enter="confirmText === username && confirmDelete()"
                  />
                </div>
              </div>

              <div class="px-6 py-4 bg-gray-50/60 border-t border-gray-100 rounded-b-2xl flex justify-end gap-2">
                <button type="button" class="btn btn-ghost btn-sm" @click="close">
                  取消
                </button>
                <button
                  type="button"
                  class="btn btn-error btn-sm text-white"
                  :disabled="confirmText !== username"
                  @click="confirmDelete"
                >
                  确认删除
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { Download, Trash2, AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  username: { type: String, default: '' }
})

const emit = defineEmits(['info', 'delete'])

const showConfirm = ref(false)
const confirmText = ref('')

const close = () => {
  showConfirm.value = false
  confirmText.value = ''
}

const confirmDelete = () => {
  close()
  emit('info', '账户删除功能即将上线')
}
</script>
