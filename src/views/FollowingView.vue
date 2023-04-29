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

type TExpandTo = {
  to: UsersResponse;
};

const UID = pb.authStore.model!.id;

const following = ref<UserRelation[]>([]);
const isLoading = ref(true);

// get following
pb.collection(Collections.Relations)
  .getFullList<RelationsResponse<TExpandTo>>({
    filter: `from="${UID}" && state="${RelationsStateOptions.accept}"`,
    expand: 'to',
    $cancelKey: 'following',
  })
  .then((response) => {
    following.value = response.map((x) => ({
      user: x.expand!.to,
      state: getStateString(x.state),
    }));

    isLoading.value = false;
  });
</script>

<template>
  <main class="flow | padding:0.5em bg-solid">
    <p v-if="isLoading">Loading...</p>
    <p v-else-if="following.length === 0">
      Not following anyone<br />Find friends using the search above
    </p>

    <UserCard
      v-for="entry in following"
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
