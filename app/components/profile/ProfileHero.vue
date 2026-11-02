<template>
  <!-- The same frame as the artist page's header: banner strip, avatar riding on its lower edge, then the text. -->
  <section class="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-8 2xl:max-w-7xl">
    <header class="card overflow-hidden">
      <div class="page-hero-banner relative bg-sunken">
        <!-- An uploaded banner is fitted like an artist's; an address from before uploads is cropped to the middle. -->
        <CommonBannerImage v-if="profile.banner_image" :image="profile.banner_image" sizes="(min-width: 1536px) 1216px, (min-width: 1152px) 1088px, 100vw" />
        <img
          v-else-if="displayBanner"
          v-img-fade
          :src="displayBanner"
          :alt="displayBanner === ownBanner ? `${profile.username} banner` : ''"
          class="h-full w-full object-cover"
          @error="onBannerError"
        >
        <div v-else class="h-full w-full bg-linear-to-br from-primary/35 via-sunken to-card" />
      </div>
      <div class="relative h-11 md:h-13">
        <div class="page-hero-avatar absolute left-4 top-0 -translate-y-1/2 overflow-hidden rounded-full border-4 border-card bg-sunken ring-1 ring-line md:left-6">
          <img
            v-if="displayAvatar"
            v-img-fade
            :src="profile.avatar_url"
            :alt="profile.username"
            class="h-full w-full object-cover"
            @error="onAvatarError"
          >
          <div v-else class="flex h-full w-full items-center justify-center text-faint"><User class="h-7 w-7 md:h-9 md:w-9" /></div>
        </div>
      </div>
      <div class="flex items-start gap-4 p-4 pt-3 sm:p-5 sm:pt-3 md:p-6 md:pt-3">
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-lg font-bold tracking-tight text-title md:text-xl">{{ profileDisplayName }}</h1>
          <p class="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-meta">
            <span>@{{ profile.username }}</span>
            <span class="text-faint" aria-hidden="true">•</span>
            <span class="inline-flex items-center gap-1.5">
              <Calendar :size="14" />
              {{ $t("profile.joined") }} {{ memberSince }}
            </span>
          </p>
          <div class="mt-1.5 max-w-3xl">
            <p
              ref="bioTextRef"
              :class="[
                'wrap-break-word text-sm leading-6 text-body',
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
        <UiButton :icon="MoreVertical" :label="moreActionsLabel" size="sm" round class="shrink-0" />
      </div>
    </header>
  </section>
</template>

<script setup>
import { Calendar, MoreVertical, User } from "@lucide/vue";
import { pageHeroConfig } from "~/config/pageHero";

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
    ko: "ko-KR",
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

// The user's banner, else (or when it fails to load) the same default as the artist page; the gradient only if that fails too.
const displayBanner = computed(() => {
  if (ownBanner.value && !bannerLoadFailed.value) return ownBanner.value;
  return defaultBannerFailed.value ? "" : pageHeroConfig.defaultBannerUrl;
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
