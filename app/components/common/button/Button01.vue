<template>
  <button
    class="flex overflow-hidden items-center text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-white shadow hover:bg-gray-800 h-9 px-4 py-2 whitespace-pre md:flex group relative w-full justify-center gap-2 rounded-md transition-all duration-300 ease-out hover:ring-2 hover:ring-black hover:ring-offset-2 cursor-pointer"
    v-bind="$attrs"
  >
    <span
      class="absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 bg-white opacity-10 transition-all duration-1000 ease-out group-hover:-translate-x-40"
    ></span>
    <div class="flex items-center gap-1.5">
      <div class="flex items-center text-white transition-all duration-300 group-hover:text-yellow-300">
        <slot name="icon" />
      </div>
      <span class="text-white"><slot>Button</slot></span>
    </div>
  </button>
</template>
