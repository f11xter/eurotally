<script setup lang="ts">
import pb from '@/pb';
import {
  Collections,
  type UsersResponse,
  type RecordIdString,
  RelationsStateOptions,
} from '@/helpers/pocketbase-types';

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
  <p class="flex align-items:center">
    {{ user.username }}

    <span v-if="accepted" class="accepted">Accepted</span>

    <span v-else>
      <button class="secondary" @click="onAccept" type="button">Accept</button>
      <button class="bg-solid" @click="onDeny" type="button">
        <i class="iconoir-cancel"></i>
      </button>
    </span>
  </p>
</template>

<style scoped>
p {
  justify-content: space-between;
}

.accepted {
  padding: 0.3em 0.6em;
}
</style>