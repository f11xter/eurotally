<script setup lang="ts">
import type { Vote } from '@/helpers/client-types';
import { computed } from 'vue';
import VoteHearts from './VoteHearts.vue';
import VoteNameList from './VoteNameList.vue';
import pb from '@/pb';

const props = defineProps<{
  title: string;
  votes: Vote[];
  score: number;
}>();

defineEmits<{ (e: 'updateScore', score: number): void }>();

const extracted = computed(() =>
  props.votes
    .filter((x) => x.uid != pb.authStore.model?.id)
    .map((x) => {
      return {
        id: x.id,
        name: x.username,
        score: x.score,
      };
    })
);

const avg = computed(() =>
  (
    props.votes.reduce((prev, current) => (prev += current.score), 0) /
      props.votes.length || 0
  ).toFixed(1)
);
</script>

<template>
  <div class="vote-category-container | blur flow shadow | bg-translucent">
    <div class="flex align-items:center children-no-margin">
      <h2 class="icon-label"><slot></slot>{{ title }}</h2>
      <p>avg: {{ avg }}</p>
    </div>

    <VoteHearts
      :score="score"
      @update-score="(score) => $emit('updateScore', score)"
    />

    <VoteNameList :votes="extracted" />
  </div>
</template>

<style scoped>
.vote-category-container {
  width: 100%;
  height: fit-content;
  padding: 1rem;

  border-radius: 1rem;
}

h2 {
  flex: 1;
  text-transform: capitalize;
}
</style>
