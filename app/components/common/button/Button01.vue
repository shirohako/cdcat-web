<template>
  <button
    class="group relative flex h-9 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-pre rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors duration-150 ease-out hover:bg-primary-strong disabled:pointer-events-none disabled:opacity-50 md:flex"
    v-bind="$attrs"
  >
    <span
      class="absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 bg-on-primary opacity-10 transition-all duration-1000 ease-out group-hover:-translate-x-40"
    />
    <div class="flex items-center gap-1.5">
      <div class="flex items-center">
        <slot name="icon" />
      </div>
      <span><slot>Button</slot></span>
    </div>
  </button>
</template>
