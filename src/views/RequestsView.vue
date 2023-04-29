<script setup lang="ts">
import UserRequestCard from '@/components/UserRequestCard.vue';
import {
  type RecordIdString,
  type UsersResponse,
  Collections,
  type RelationsResponse,
  RelationsStateOptions,
} from '@/helpers/pocketbase-types';
import pb from '@/pb';
import { ref } from 'vue';

type UserRequest = {
  accepted: boolean;
  id: RecordIdString;
  user: UsersResponse;
};

type TExpandFrom = {
  from: UsersResponse;
};

const UID = pb.authStore.model!.id;

const requests = ref<UserRequest[]>([]);
const isLoading = ref(true);

// get requests
pb.collection(Collections.Relations)
  .getFullList<RelationsResponse<TExpandFrom>>({
    filter: `to="${UID}" && state="${RelationsStateOptions.follow}"`,
    expand: 'from',
    $cancelKey: 'requests',
  })
  .then((response) => {
    requests.value = response.map((x) => ({
      accepted: false,
      id: x.id,
      user: x.expand!.from,
    }));

    isLoading.value = false;
  });

function onRequestUpdate(entry: UserRequest, accepted: boolean) {
  entry.accepted = accepted;
  if (!accepted) {
    requests.value = requests.value.filter((x) => x.id !== entry.id);
  }
}
</script>

<template>
    <main class="flow | padding:0.5em bg-solid">
      <p v-if="isLoading">Loading...</p>
      <p v-else-if="requests.length === 0">No follow requests</p>
  
      <UserRequestCard
        v-for="entry in requests"
        :key="entry.id"
        :accepted="entry.accepted"
        :record-id="entry.id"
        :user="entry.user"
        @update="(accepted) => onRequestUpdate(entry, accepted)"
      />
    </main>
</template>

<style scoped>
main {
  position: relative;
  padding-block-start: 1em;
}
</style>
