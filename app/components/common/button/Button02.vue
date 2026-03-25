<template>
  <button class="group relative inline-flex items-center py-2 rounded-[5px] bg-[#040f16] text-[#f5f5f5] font-semibold overflow-hidden transition-shadow duration-500 hover:shadow-[0_0_20px_0px_#2e2e2e3a] focus:outline-none">
    <span class="absolute left-0 flex items-center justify-center w-10 h-full transition-all duration-500 group-hover:w-full group-active:scale-[0.85]">
      <slot name="icon">
        <svg viewBox="0 0 175 80" width="22" height="22">
          <rect width="80" height="15" fill="#f0f0f0" rx="10" />
          <rect y="30" width="80" height="15" fill="#f0f0f0" rx="10" />
          <rect y="60" width="80" height="15" fill="#f0f0f0" rx="10" />
        </svg>
      </slot>
    </span>
    <span class="pl-10 pr-4 whitespace-nowrap transition-opacity duration-500 group-hover:opacity-0">
      <slot>MENU</slot>
    </span>
  </button>
</template>
