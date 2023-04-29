<script setup lang="ts">
import { reactive, ref, provide, watch } from 'vue';
import pb from './pb';
import type { AlertBannerLevel } from './helpers/alertBannerLevel';
import {
  Collections,
  type RelationsRecord,
  RelationsStateOptions,
  type UsersResponse,
} from './helpers/pocketbase-types';
import AlertBanner from './components/AlertBanner.vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const alerts = reactive<{ msg: string; level: AlertBannerLevel }[]>([]);
let showing = false;

const alertMsg = ref('');
const alertLevel = ref<AlertBannerLevel>('info');
const alertActive = ref(false);

const showNavBar = ref(false);

provide('showAlertBanner', (msg: string, level: AlertBannerLevel) => {
  alerts.push({ msg: msg, level: level });
});

// follow request listener
pb.authStore.onChange(async () => {
  if (pb.authStore.isValid) {
    const UID = pb.authStore.model?.id;

    pb.collection(Collections.Relations).subscribe<RelationsRecord>(
      '*',
      (e) => {
        // add user to following list if outgoing request accepted
        if (
          e.record.from === UID &&
          e.record.state === RelationsStateOptions.accept
        ) {
          pb.collection(Collections.Users).update(UID, {
            'following+': e.record.to,
          });
        }
        // if incoming request
        else if (e.record.to === UID) {
          // send alert if follow request
          if (e.record.state === RelationsStateOptions.follow) {
            pb.collection(Collections.Users)
              .getOne<UsersResponse>(e.record.from)
              .then((response) => {
                alerts.push({
                  msg: `${response.username} requested to follow you`,
                  level: 'info',
                });
              });
          }
          // remove user from followers list if unfollow request
          else if (e.record.state === RelationsStateOptions.unfollow) {
            pb.collection(Collections.Users).update(UID, {
              'followers-': e.record.from,
            });
          }
        }
      }
    );
  }
  // unsubscribe if not logged in
  else {
    pb.collection(Collections.Relations).unsubscribe();
  }
}, true);

watch(() => route.meta, () => {
  showNavBar.value = route.meta.noNavBar ?? true;
})

watch(alerts, () => {
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
        } else {
          clearInterval(loop);
          showing = false;
        }
      }, 3000);
    }
  }
});
</script>

<template>
  <div>
    <AlertBanner :active="alertActive" :level="alertLevel" :msg="alertMsg" />

    <nav v-if="showNavBar" class="padding:0.5em shadow bg-solid">
      <RouterLink :to="{ name: 'account' }">
        <i class="iconoir-group"></i>
      </RouterLink>
      <RouterLink :to="{ name: 'vote' }">
        <i class="iconoir-music-double-note"></i>
      </RouterLink>
    </nav>

    <RouterView />
  </div>
</template>

<style>
:root {
  --nav-height: 3rem;
}
</style>

<style scoped>
nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: center;
  block-size: var(--nav-height);
}
</style>
