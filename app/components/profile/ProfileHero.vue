<template>
  <div class="container mx-auto max-w-6xl 2xl:max-w-7xl px-4 pb-2 pt-8 md:px-6">
    <header class="card relative overflow-hidden">
      <div class="relative h-38 sm:h-44 md:h-52">
        <img
          v-if="displayBanner"
          v-img-fade
          :src="displayBanner"
          :alt="displayBanner === ownBanner ? `${profile.username} banner` : ''"
          class="h-full w-full object-cover"
          @error="onBannerError"
        >
        <div
          v-else
          class="h-full w-full bg-linear-to-br from-primary/35 via-sunken to-card"
        />
        <div
          class="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent to-card/30"
        />
      </div>

      <div
        class="relative border-t border-line px-4 pb-4 sm:px-6 sm:pb-6"
      >
        <div
          class="absolute -top-12 left-4 size-20 overflow-hidden rounded-full border-3 border-white bg-sunken sm:-top-16 sm:left-6 sm:size-26 sm:border-4"
        >
          <img
            v-if="displayAvatar"
            v-img-fade
            :src="profile.avatar_url"
            :alt="profile.username"
            class="h-full w-full object-cover"
            @error="onAvatarError"
          >
          <span
            v-else
            class="grid h-full w-full place-items-center text-body"
          >
            <User :size="26" class="text-faint sm:h-8 sm:w-8" />
          </span>
        </div>

        <UiButton :icon="MoreVertical" :label="moreActionsLabel" size="sm" round class="absolute right-3 top-3" />

        <h1
          class="mt-12 truncate text-[1.14rem] font-semibold leading-[1.15] tracking-[-0.01em] text-title sm:mt-14 sm:text-[1.28rem] md:text-[1.42rem]"
        >
          {{ profileDisplayName }}
        </h1>

        <p
          class="mt-2 flex flex-wrap items-center gap-2 text-[0.9rem] text-body sm:text-[1rem]"
        >
          <span>@{{ profile.username }}</span>
          <span class="text-faint" aria-hidden="true">•</span>
          <span class="inline-flex items-center gap-1.5">
            <Calendar :size="14" />
            {{ $t("profile.joined") }} {{ memberSince }}
          </span>
        </p>

        <div class="mt-3 max-w-4xl">
          <p
            ref="bioTextRef"
            :class="[
              'wrap-break-word text-[0.88rem] leading-[1.55] text-body transition-all sm:text-[0.96rem] sm:leading-[1.6]',
              bioCollapsible && !bioExpanded
                ? 'overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]'
                : '',
            ]"
          >
            {{ profileBio }}
          </p>
          <UiButton v-if="bioCollapsible" size="xs" class="mt-1" @click="bioExpanded = !bioExpanded">
            {{ bioExpanded ? bioCollapseLabel : bioExpandLabel }}
          </UiButton>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { Calendar, MoreVertical, User } from "@lucide/vue";
import { artistPageConfig } from "~/config/artistPage";

const props = defineProps({
  profile: {
    type: Object,
    required: true,
  },
});

const { locale } = useI18n();

const bannerLoadFailed = ref(false);
const defaultBannerFailed = ref(false);
const avatarLoadFailed = ref(false);
const bioTextRef = ref(null);
const bioExpanded = ref(false);
const bioCollapsible = ref(false);
const BIO_COLLAPSED_LINES = 3;

const profileDisplayName = computed(() => {
  return props.profile.nickname || props.profile.username;
});

const displayAvatar = computed(() => {
  return String(props.profile.avatar_url || "").trim().length > 0 && !avatarLoadFailed.value;
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

const ownBanner = computed(() => {
  return (props.profile.banner_url || "").trim();
});

// The user's banner, else (or when it fails to load) the same default as artist pages; the gradient only if that fails too.
const displayBanner = computed(() => {
  if (ownBanner.value && !bannerLoadFailed.value) return ownBanner.value;
  return defaultBannerFailed.value ? "" : artistPageConfig.defaultBannerUrl;
});

watch(ownBanner, () => {
  bannerLoadFailed.value = false;
});

const onBannerError = () => {
  if (displayBanner.value === ownBanner.value) bannerLoadFailed.value = true;
  else defaultBannerFailed.value = true;
};

watch(
  () => props.profile.avatar_url,
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
