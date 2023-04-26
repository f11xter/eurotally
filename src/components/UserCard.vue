<script setup lang="ts">
import pb from '@/pb';
import { ClientRelations } from '@/types/client-types';
import {
  Collections,
  RelationsStateOptions,
  type RelationsResponse,
  type UsersResponse,
  type RecordIdString,
} from '@/types/pocketbase-types';

const props = defineProps<{
  user: UsersResponse;
  state: ClientRelations;
}>();

const emit = defineEmits<{
  (e: 'update', newState: ClientRelations): void;
}>();

function setState(oldState: ClientRelations) {
  if (oldState === 'follow') {
    emit('update', ClientRelations.pending);
  } else {
    emit('update', ClientRelations.follow);
  }
}

function updateRelation(
  id: RecordIdString,
  serverState: RelationsStateOptions,
  clientState: ClientRelations
) {
  if (
    clientState === ClientRelations.follow &&
    (serverState === RelationsStateOptions.deny ||
      serverState === RelationsStateOptions.unfollow)
  ) {
    pb.collection(Collections.Relations).update(id, {
      state: RelationsStateOptions.follow,
    });
  } else if (
    (clientState === ClientRelations.following ||
      clientState === ClientRelations.pending) &&
    serverState !== RelationsStateOptions.unfollow
  ) {
    pb.collection(Collections.Relations).update(id, {
      state: RelationsStateOptions.unfollow,
    });

    pb.collection(Collections.Users).update(pb.authStore.model!.id, {
      'following-': props.user.id,
    });
  }
}

function onClick() {
  const oldState = props.state;

  setState(oldState);

  pb.collection(Collections.Relations)
    .getFirstListItem<RelationsResponse>(
      `from="${pb.authStore.model?.id}" && to="${props.user.id}"`
    )
    .then((response) => {
      updateRelation(response.id, response.state, oldState);
    })
    .catch(() => {
      // create relation if doesn't exist
      pb.collection(Collections.Relations).create({
        from: pb.authStore.model?.id,
        to: props.user.id,
        state: RelationsStateOptions.follow,
      });
    });
}
</script>

<template>
  <p>
    {{ user.username }}
    <button @click="onClick" type="button">
      {{ state }}
    </button>
  </p>
</template>
