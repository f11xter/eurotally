<script setup lang="ts">
import UserCard from '@/components/UserCard.vue';
import UserRequestCard from '@/components/UserRequestCard.vue';
import pb from '@/pb';
import { ClientRelations } from '@/types/client-types';
import {
  type UsersResponse,
  type RecordIdString,
  Collections,
  type RelationsResponse,
  RelationsStateOptions,
} from '@/types/pocketbase-types';
import { ref, watch } from 'vue';

type UserRelation = {
  user: UsersResponse;
  state: ClientRelations;
};

type UserRequest = {
  accepted: boolean;
  id: RecordIdString;
  user: UsersResponse;
};

type TExpandTo = {
  to: UsersResponse;
};

type TExpandFrom = {
  from: UsersResponse;
};

const UID = pb.authStore.model!.id;

const searchTerm = ref('');
const searchResults = ref<UserRelation[]>([]);

const requests = ref<UserRequest[]>([]);
const following = ref<UserRelation[]>([]);
const followers = ref<UserRelation[]>([]);

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
  });

// get followers
pb.collection(Collections.Relations)
  .getFullList<RelationsResponse<TExpandFrom>>({
    filter: `to="${UID}" && state="${RelationsStateOptions.accept}"`,
    expand: 'from',
    $cancelKey: 'followers',
  })
  .then((usersResponse) => {
    // get relations from current user to user results
    const conditions = usersResponse.map((x) => `to="${x.id}"`);

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
          const rel = relationsResponse.find((rel) => rel.to === user.id);

          return {
            user: user.expand!.from,
            state: getStateString(rel?.state),
          };
        });
      });
  });

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

/**
 * Handles `UserRequestCard` update event
 * @param entry entry associated with card
 * @param accepted whether request was accepted
 */
function onRequestUpdate(entry: UserRequest, accepted: boolean) {
  entry.accepted = accepted;
  if (!accepted) {
    requests.value = requests.value.filter((x) => x.id !== entry.id);
  }
}

/**
 * Returns client representation of follow state
 * @param state server representation of follow state
 */
function getStateString(state: RelationsStateOptions | undefined) {
  switch (state) {
    case RelationsStateOptions.follow:
      return ClientRelations.pending;

    case RelationsStateOptions.accept:
      return ClientRelations.following;

    default:
      return ClientRelations.follow;
  }
}
</script>

<template>
  <main>
    <form @submit.prevent>
      <label for="search">
        <h2>find friends</h2>
      </label>
      <input id="search" type="text" v-model.trim="searchTerm" />
    </form>

    <UserCard
      v-for="entry in searchResults"
      :user="entry.user"
      :state="entry.state"
      :key="entry.user.id"
      @update="(newState) => (entry.state = newState)"
    />

    <h2>requests</h2>
    <UserRequestCard
      v-for="entry in requests"
      :key="entry.id"
      :accepted="entry.accepted"
      :record-id="entry.id"
      :user="entry.user"
      @update="(accepted) => onRequestUpdate(entry, accepted)"
    />

    <h2>following</h2>
    <UserCard
      v-for="entry in following"
      :user="entry.user"
      :state="entry.state"
      :key="entry.user.id"
      @update="(newState) => (entry.state = newState)"
    />

    <h2>followers</h2>
    <UserCard
      v-for="entry in followers"
      :user="entry.user"
      :state="entry.state"
      :key="entry.user.id"
      @update="(newState) => (entry.state = newState)"
    />
  </main>
</template>
