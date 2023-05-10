<script setup lang="ts">
import { reactive, ref, provide, watch } from 'vue';
import pb from './pb';
import type { AlertBannerLevel } from './helpers/alertBannerLevel';
import {
  Collections,
  RelationsStateOptions,
  type UsersResponse,
  type RelationsResponse,
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
    const UID = pb.authStore.model!.id;

    pb.collection(Collections.Relations)
      .getFullList<RelationsResponse>({
        filter: `to="${UID}" || from="${UID}"`,
      })
      .then((response) => {
        // accepted outgoing requests
        const accepted = response.filter(
          (x) => x.from === UID && x.state === RelationsStateOptions.f_accept
        );

        // incoming unfollow requests
        const unfollows = response.filter(
          (x) => x.to === UID && x.state === RelationsStateOptions.u_request
        );

        // set accepted outgoing requests to confirmed
        for (const request of accepted) {
          pb.collection(Collections.Relations).update(request.id, {
            state: RelationsStateOptions.f_confirm,
          });
        }

        // set incoming unfollow requests to confirmed
        for (const request of unfollows) {
          pb.collection(Collections.Relations).update(request.id, {
            state: RelationsStateOptions.u_confirm,
          });
        }

        // update following and followers list
        if (accepted.length > 0 || unfollows.length > 0) {
          pb.collection(Collections.Users).update(UID, {
            'following+': accepted.map((x) => x.to),
            'followers-': unfollows.map((x) => x.from),
          });
        }
      });

    pb.collection(Collections.Relations).subscribe<RelationsResponse>(
      '*',
      (e) => {
        // accepted outgoing request
        // set state to confirmed
        // add to following list
        if (
          e.record.from === UID &&
          e.record.state === RelationsStateOptions.f_accept
        ) {
          pb.collection(Collections.Relations).update(e.record.id, {
            state: RelationsStateOptions.f_confirm,
          });

          pb.collection(Collections.Users).update(UID, {
            'following+': e.record.to,
          });
        }

        // incoming follow request
        // push banner alert
        else if (
          e.record.to === UID &&
          e.record.state === RelationsStateOptions.f_request
        ) {
          pb.collection(Collections.Users)
            .getOne<UsersResponse>(e.record.from)
            .then((response) => {
              alerts.push({
                msg: `${response.username} requested to follow you`,
                level: 'info',
              });
            });
        }

        // incoming unfollow request
        // set state to confirmed
        // remove from followers list
        else if (
          e.record.to === UID &&
          e.record.state === RelationsStateOptions.u_request
        ) {
          pb.collection(Collections.Relations).update(e.record.id, {
            state: RelationsStateOptions.u_confirm,
          });

          pb.collection(Collections.Users).update(UID, {
            'followers-': e.record.from,
          });
        }
      }
    );
  }
  // unsubscribe if not logged in
  else {
    pb.collection(Collections.Relations).unsubscribe();
  }
}, true);

watch(
  () => route.meta,
  () => {
    showNavBar.value = route.meta.showNavBar ?? true;
  },
  { immediate: true }
);

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
      <RouterLink :to="{ path: '/vote' }">
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
