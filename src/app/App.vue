<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div
    class="mx-auto min-h-dvh max-w-md px-5"
    style="
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
    "
  >
    <RouterView />
  </div>
</template>
