<template>
  <!-- Beside a field's label; a field's EditorHelp goes in the slot. -->
  <span class="badge badge-error badge-xs ml-1.5 rounded-[5px] align-[1px]">{{ $t('editor.required_tag') }}<slot /></span>
</template>
