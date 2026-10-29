<script setup lang="ts">
/** An endpoint's path in mono: `{name}` parts in the section's colour, and a line may break after any slash. */
const props = defineProps<{ path: string }>()

const tokens = computed(() => props.path.split(/(\{\w+\}|\/)/).filter(Boolean))
</script>

<template>
  <code class="font-mono text-title"><template v-for="(token, index) in tokens" :key="index"><span v-if="token.startsWith('{')" class="text-(--accent)">{{ token }}</span><template v-else-if="token === '/'">/<wbr></template><template v-else>{{ token }}</template></template></code>
</template>
