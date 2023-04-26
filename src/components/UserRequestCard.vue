<script setup lang="ts">
import pb from '@/pb';
import {
  Collections,
  type UsersResponse,
  type RecordIdString,
  RelationsStateOptions,
} from '@/types/pocketbase-types';

const props = defineProps<{
  accepted: boolean;
  recordId: RecordIdString;
  user: UsersResponse;
}>();

const emit = defineEmits<{
  (e: 'update', accepted: boolean): void;
}>();

function onAccept() {
  emit('update', true);

  pb.collection(Collections.Relations).update(props.recordId, {
    state: RelationsStateOptions.accept,
  });

  pb.collection(Collections.Users).update(pb.authStore.model!.id, {
    'followers+': props.user.id,
  });
}

function onDeny() {
  emit('update', false);

  pb.collection(Collections.Relations).update(props.recordId, {
    state: RelationsStateOptions.deny,
  });
}
</script>

<template>
  <p>
    {{ user.username }}

    <span v-if="accepted">Accepted</span>

    <span v-else>
      <button @click="onAccept" type="button">Accept</button>
      <button @click="onDeny" type="button">×</button>
    </span>
  </p>
</template>
