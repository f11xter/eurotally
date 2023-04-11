<script setup lang="ts">
import { provide, reactive, ref, watch } from 'vue';
import { RouterView } from 'vue-router'
import AlertBanner from '@/components/AlertBanner.vue';
import type { AlertBannerLevel } from '@/types/alertBannerLevel';

const alerts = reactive<{ msg: string, level: AlertBannerLevel }[]>([]);
let showing = false;

const alertMsg = ref("");
const alertLevel = ref<AlertBannerLevel>("info")
const alertActive = ref(false);

provide(
  "showAlertBanner",
  (msg: string, level: AlertBannerLevel) => {
    alerts.push({ msg: msg, level: level })
  },
);

watch(
  alerts,
  () => {
    if (!showing) {
      showing = true;

      const a = alerts.pop();

      if (a) {
        alertMsg.value = a.msg;
        alertLevel.value = a.level;
        alertActive.value = true;

        const loop = setInterval(() => {
          alertActive.value = false;
          
          const a = alerts.pop();
  
          if (a) {
            alertMsg.value = a.msg;
            alertLevel.value = a.level;
            alertActive.value = true;
          }
  
          else {
            clearInterval(loop);
            showing = false;
          }
        }, 3000);
      }
    }
  },
);
</script>

<template>
  <div>
    <AlertBanner :active="alertActive" :level="alertLevel" :msg="alertMsg" />
    <RouterView />
  </div>
</template>
