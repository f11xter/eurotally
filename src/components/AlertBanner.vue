<script setup lang="ts">
import type { AlertBannerLevel } from '@/helpers/alertBannerLevel';

defineProps<{ active: boolean; level: AlertBannerLevel; msg: string }>();
</script>

<template>
  <div
    :data-level="level"
    :class="{ active: active }"
    class="alert-banner-container | shadow children-no-margin transition:100ms"
  >
    <p>{{ msg }}</p>
  </div>
</template>

<style scoped>
.alert-banner-container {
  position: absolute;
  top: 0;
  z-index: 1;

  width: 100%;
  padding: 0.5rem;

  background-color: hsl(0 0% 100%);
  transform: translateY(-100%);
}

.active {
  transform: translateY(0);
}

[data-level='info'] {
  background-color: hsl(200 100% 80%);
}

[data-level='error'] {
  background-color: hsl(0 100% 80%);
}
</style>
