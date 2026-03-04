<template>
  <section class="bg-white rounded-lg border-2 border-blue-500 p-6">
    <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
      <FileText :size="24" />
      Descriptions
    </h2>

    <div v-if="languageOptions.length > 1" class="mb-4 flex flex-wrap items-center gap-2">
      <div class="join">
        <button
          v-for="option in languageOptions"
          :key="option.language"
          type="button"
          class="btn btn-xs join-item"
          :class="{ 'btn-active': option.language === selectedLanguage }"
          @click="selectedLanguage = option.language"
        >
          {{ languageLabel(option.language) }}
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <!-- Slogan -->
      <div v-if="displaySlogan" class="border-l-2 border-blue-400 pl-4 py-1">
        <p class="text-base md:text-lg font-medium text-gray-800 leading-relaxed">
          {{ displaySlogan }}
        </p>
      </div>

      <!-- Main Descriptions -->
      <div
        v-if="isMarkdown"
        class="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
        v-html="renderedMarkdown"
      />
      <div v-else class="text-gray-700 space-y-2 text-sm leading-relaxed">
        <p v-for="(paragraph, index) in displayDescriptions" :key="index">
          {{ paragraph }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { FileText } from "lucide-vue-next";
import MarkdownIt from "markdown-it";

const props = defineProps({
  slogan: {
    type: String,
    default: "",
  },
  descriptions: {
    type: Array,
    default: () => [],
  },
});

// 初始化 markdown-it
const md = new MarkdownIt({
  html: false, // 不允许 HTML 标签
  breaks: true, // 将换行符转换为 <br>
  linkify: true, // 自动将 URL 转换为链接
});

// 只在客户端导入 DOMPurify
const DOMPurify = import.meta.client ? (await import('dompurify')).default : null;

const languageOptions = computed(() => {
  const list = Array.isArray(props.descriptions) ? props.descriptions : [];
  if (list.length === 0) return [];
  if (typeof list[0] !== "object" || !list[0] || !("language" in list[0])) return [];

  const seen = new Set();
  const options = [];

  for (const item of list) {
    const language = item?.language;
    if (!language || seen.has(language)) continue;
    seen.add(language);
    options.push(item);
  }

  return options;
});

const selectedLanguage = ref("");

watchEffect(() => {
  const options = languageOptions.value;
  if (options.length === 0) return;

  const stillValid = selectedLanguage.value
    && options.some((d) => d.language === selectedLanguage.value);
  if (stillValid) return;

  const byDefault = options.find((d) => d.is_default);
  selectedLanguage.value = (byDefault || options[0]).language;
});

const activeDescription = computed(() => {
  const options = languageOptions.value;
  if (options.length === 0) return null;

  const selected = selectedLanguage.value;
  return options.find((d) => d.language === selected) || options[0];
});

const displaySlogan = computed(() => {
  const fromApi = activeDescription.value?.content?.catch_copy?.text;
  return fromApi || props.slogan || "";
});

const isMarkdown = computed(() => {
  const format = activeDescription.value?.content?.body?.format;
  return format === "markdown";
});

const displayDescriptions = computed(() => {
  const fromApi = activeDescription.value?.content?.body?.text;
  if (fromApi) {
    return String(fromApi)
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const list = Array.isArray(props.descriptions) ? props.descriptions : [];
  if (list.length === 0) return [];
  if (typeof list[0] === "string") return list;
  return [];
});

const renderedMarkdown = computed(() => {
  if (!isMarkdown.value) return "";

  const text = activeDescription.value?.content?.body?.text || "";
  if (!text) return "";

  // 渲染 Markdown
  const rendered = md.render(text);

  // 在客户端使用 DOMPurify 清理 HTML，防止 XSS 攻击
  // 在服务器端直接返回渲染的 HTML（因为 html: false 已经禁止了 HTML 标签）
  if (DOMPurify) {
    return DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  }

  return rendered;
});

const languageLabel = (code) => {
  const c = String(code);
  const map = {
    "zh-Hans": "ZH-Hans",
    "zh-Hant": "ZH-Hant",
    "ja-JP": "JA",
    "ja": "JA",
    "en": "EN",
  };
  return map[c] || c;
};
</script>
