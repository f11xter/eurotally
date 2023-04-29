<script setup lang="ts">
import type { UserRelation } from '@/helpers/client-types';
import { getStateString } from '@/helpers/functions';
import {
  Collections,
  type UsersResponse,
  type RelationsResponse,
} from '@/helpers/pocketbase-types';
import pb from '@/pb';
import { ref, onMounted, watch } from 'vue';
import UserCard from './UserCard.vue';

const UID = pb.authStore.model!.id;

const isFocused = ref(false);
const searchElement = ref<HTMLElement | null>(null);
const searchTerm = ref('');
const searchResults = ref<UserRelation[]>([]);

onMounted(() => {
  document.body.addEventListener('click', (e) => {
    if (!searchElement.value?.contains(e.target as HTMLElement)) {
      isFocused.value = false;
    }
  });
});

// get search results
watch(searchTerm, () => {
  if (searchTerm.value !== '') {
    // get users with names containing searchTerm
    pb.collection(Collections.Users)
      .getList<UsersResponse>(1, 10, {
        filter: `username~"${searchTerm.value}" && id!="${UID}"`,
      })
      .then((usersResponse) => {
        // get relations from current user to search results
        const conditions = usersResponse.items.map((x) => `to="${x.id}"`);

        let filter = `from="${UID}"`;
        if (conditions.length > 0) {
          filter += `&& (${conditions.join('||')})`;
        }

        pb.collection(Collections.Relations)
          .getFullList<RelationsResponse>({
            filter: filter,
          })
          .then((relationsResponse) => {
            // populate searchResults with relations data
            searchResults.value = usersResponse.items.map((user) => {
              const rel = relationsResponse.find((rel) => rel.to === user.id);

              return {
                user: user,
                state: getStateString(rel?.state),
              };
            });
          });
      });
  } else {
    searchResults.value = [];
  }
});

function onClick() {
  searchTerm.value = '';
  isFocused.value = false;
}
</script>

<template>
  <form
    ref="searchElement"
    @submit.prevent
    class="absolute inline-size:100% padding:0.5em"
  >
    <div
      class="search | flow | relative padding:0.5em transition:100ms bg-solid"
      :class="{ shadow: isFocused }"
      :data-focused="isFocused"
    >
      <div class="input | relative children-no-margin">
        <input
          type="text"
          class="inline-size:100% padding:0.5em"
          :class="{ 'bg-muted': isFocused }"
          placeholder="find friends"
          v-model.trim="searchTerm"
          @focus="isFocused = true"
        />

        <button
          v-if="isFocused"
          type="button"
          class="absolute transition:100ms"
          @click="onClick"
        >
          <i class="iconoir-cancel"></i>
        </button>

        <i v-else class="iconoir-search | absolute"></i>
      </div>

      <div
        v-if="isFocused && searchResults.length > 0"
        class="flow padding:0.5em"
      >
        <UserCard
          v-for="entry in searchResults"
          :key="entry.user.id"
          :user="entry.user"
          :state="entry.state"
          @update="(newState) => (entry.state = newState)"
        />
      </div>
    </div>
  </form>
</template>

<style scoped>
.search {
  border-radius: 0.5em;
  z-index: 1;
}

.search input {
  border: none;
  border-radius: 0.1em;
}

.search .input > :last-child {
  top: 50%;
  right: 0;
  translate: 0 -50%;
  background: none;
}

.search .input > i {
  pointer-events: none;
}
</style>
