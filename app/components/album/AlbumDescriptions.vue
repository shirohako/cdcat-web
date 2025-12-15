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
      <div class="text-gray-700 space-y-2 text-sm leading-relaxed">
        <p v-for="(paragraph, index) in displayDescriptions" :key="index">
          {{ paragraph }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { FileText } from "lucide-vue-next";

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
