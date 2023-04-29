<script setup lang="ts">
import UserCard from '@/components/UserCard.vue';
import type { UserRelation } from '@/helpers/client-types';
import { getStateString } from '@/helpers/functions';
import {
  Collections,
  type RelationsResponse,
  RelationsStateOptions,
  type UsersResponse,
} from '@/helpers/pocketbase-types';
import pb from '@/pb';
import { ref } from 'vue';

type TExpandFrom = {
  from: UsersResponse;
};

const UID = pb.authStore.model!.id;

const followers = ref<UserRelation[]>([]);
const isLoading = ref(true);

// get followers
pb.collection(Collections.Relations)
  .getFullList<RelationsResponse<TExpandFrom>>({
    filter: `to="${UID}" && (state="${RelationsStateOptions.f_accept}" || state="${RelationsStateOptions.f_confirm}")`,
    expand: 'from',
    $cancelKey: 'followers',
  })
  .then((usersResponse) => {
    // get relations from current user to user results
    const conditions = usersResponse.map((x) => `to="${x.from}"`);

    let filter = `from="${UID}"`;
    if (conditions.length > 0) {
      filter += `&& (${conditions.join('||')})`;
    }

    pb.collection(Collections.Relations)
      .getFullList<RelationsResponse>({
        filter: filter,
      })
      .then((relationsResponse) => {
        followers.value = usersResponse.map((user) => {
          const rel = relationsResponse.find((rel) => rel.to === user.from);

          return {
            user: user.expand!.from,
            state: getStateString(rel?.state),
          };
        });

        isLoading.value = false;
      });
  });
</script>

<template>
  <main class="flow | padding:0.5em bg-solid">
    <p v-if="isLoading">Loading...</p>
    <p v-else-if="followers.length === 0">No followers</p>

    <UserCard
      v-for="entry in followers"
      :user="entry.user"
      :state="entry.state"
      :key="entry.user.id"
      @update="(newState) => (entry.state = newState)"
    />
  </main>
</template>

<style scoped>
main {
  position: relative;
  padding-block-start: 1em;
}
</style>
