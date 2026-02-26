<template>
  <div class="container mx-auto max-w-6xl px-4 pb-2 pt-8 md:px-6">
    <header
      class="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_10px_24px_-20px_rgba(15,23,42,0.35)]"
    >
      <div class="relative h-38 sm:h-44 md:h-52">
        <img
          v-if="displayBanner && !bannerLoadFailed"
          :src="displayBanner"
          :alt="`${profile.username} banner`"
          class="h-full w-full object-cover"
          @error="onBannerError"
        >
        <div
          v-else
          class="h-full w-full bg-linear-to-r from-[#f1dea8] via-[#f0d8bb] to-[#edc7cc]"
        />
        <div
          class="pointer-events-none absolute inset-0 bg-linear-to-b from-white/0 to-white/30"
        />
      </div>

      <div
        class="relative border-t border-slate-100 bg-white px-4 pb-4 sm:px-6 sm:pb-6"
      >
        <div
          class="absolute -top-22 left-4 h-30 w-30 overflow-hidden rounded-full border-3 border-white bg-gray-100 shadow-md sm:-top-28 sm:left-6 sm:h-38 sm:w-38 sm:border-4"
        >
          <img
            v-if="displayAvatar"
            :src="profile.avatar"
            :alt="profile.username"
            class="h-full w-full object-cover"
            @error="onAvatarError"
          >
          <span
            v-else
            class="grid h-full w-full place-items-center text-slate-700"
          >
            <User :size="30" class="text-gray-400 sm:h-9 sm:w-9" />
          </span>
        </div>

        <button
          type="button"
          class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-500"
          :aria-label="moreActionsLabel"
        >
          <MoreVertical :size="18" />
        </button>

        <h1
          class="mt-12 truncate text-[1.14rem] font-semibold leading-[1.15] tracking-[-0.01em] text-slate-900 sm:mt-14 sm:text-[1.28rem] md:text-[1.42rem]"
        >
          {{ profileDisplayName }}
        </h1>

        <p
          class="mt-2 flex flex-wrap items-center gap-2 text-[0.9rem] text-slate-600 sm:text-[1rem]"
        >
          <span>@{{ profile.username }}</span>
          <span class="text-slate-300" aria-hidden="true">•</span>
          <span class="inline-flex items-center gap-1.5">
            <Calendar :size="14" />
            {{ $t("profile.joined") }} {{ memberSince }}
          </span>
        </p>

        <div class="mt-3 max-w-4xl">
          <p
            ref="bioTextRef"
            :class="[
              'wrap-break-word text-[0.88rem] leading-[1.55] text-slate-700 transition-all sm:text-[0.96rem] sm:leading-[1.6]',
              bioCollapsible && !bioExpanded
                ? 'overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]'
                : '',
            ]"
          >
            {{ profileBio }}
          </p>
          <button
            v-if="bioCollapsible"
            type="button"
            class="mt-1 border-none bg-transparent p-0 text-[0.8rem] font-semibold text-blue-600 hover:text-blue-700 hover:underline sm:text-[0.84rem]"
            @click="bioExpanded = !bioExpanded"
          >
            {{ bioExpanded ? bioCollapseLabel : bioExpandLabel }}
          </button>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { Calendar, MoreVertical, User } from "lucide-vue-next";

const props = defineProps({
  profile: {
    type: Object,
    required: true,
  },
});

const { locale } = useI18n();

const bannerLoadFailed = ref(false);
const avatarLoadFailed = ref(false);
const bioTextRef = ref(null);
const bioExpanded = ref(false);
const bioCollapsible = ref(false);
const BIO_COLLAPSED_LINES = 3;

const profileDisplayName = computed(() => {
  return props.profile.nickname || props.profile.username;
});

const displayAvatar = computed(() => {
  return String(props.profile.avatar || "").trim().length > 0 && !avatarLoadFailed.value;
});

const profileBio = computed(() => {
  const text = String(props.profile.bio || "").trim();
  return text || "This user has not written a bio yet.";
});

const isZhLocale = computed(() => locale.value.startsWith("zh"));

const moreActionsLabel = computed(() => {
  return isZhLocale.value ? "更多操作" : "More actions";
});

const bioExpandLabel = computed(() => {
  return isZhLocale.value ? "展开" : "Show more";
});

const bioCollapseLabel = computed(() => {
  return isZhLocale.value ? "收起" : "Show less";
});

const formatterLocale = computed(() => {
  const map = {
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-TW",
    en: "en-US",
    ja: "ja-JP",
  };
  return map[locale.value] || "en-US";
});

const memberSince = computed(() => {
  const d = new Date(props.profile.joined_at);
  return d.toLocaleDateString(formatterLocale.value, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const displayBanner = computed(() => {
  return (props.profile.banner || "").trim();
});

watch(displayBanner, () => {
  bannerLoadFailed.value = false;
});

const onBannerError = () => {
  bannerLoadFailed.value = true;
};

watch(
  () => props.profile.avatar,
  () => {
    avatarLoadFailed.value = false;
  }
);

const onAvatarError = () => {
  avatarLoadFailed.value = true;
};

const updateBioCollapsible = () => {
  const el = bioTextRef.value;
  if (!el) {
    bioCollapsible.value = false;
    return;
  }

  const lineHeight = Number.parseFloat(window.getComputedStyle(el).lineHeight);
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    bioCollapsible.value = false;
    return;
  }

  const collapsedMaxHeight = lineHeight * BIO_COLLAPSED_LINES + 1;
  bioCollapsible.value = el.scrollHeight > collapsedMaxHeight;
  if (!bioCollapsible.value) {
    bioExpanded.value = false;
  }
};

watch(profileBio, async () => {
  bioExpanded.value = false;
  await nextTick();
  updateBioCollapsible();
});

onMounted(async () => {
  await nextTick();
  updateBioCollapsible();
  window.addEventListener("resize", updateBioCollapsible);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateBioCollapsible);
});
</script>
