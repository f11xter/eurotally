<script setup lang="ts">
import { computed } from 'vue';
import VoteNameList from './VoteNameList.vue';
import VoteHearts from './VoteHearts.vue';
import type { Vote } from '@/types/vote';

const props = defineProps<{
  title: string,
  votes: Vote[],
  score: number,
}>();

defineEmits<{ (e: "updateScore", score: number): void }>();

const extracted = computed(() =>
  props.votes.map(x => {
    return {
      id: x.id,
      name: x.username,
      score: x.score,
    }
  })
);

const avg = computed(() =>
  ((props.votes.reduce((prev, current) => prev += current.score, 0) / props.votes.length) || 0).toFixed(1)
);
</script>

<template>
  <div class="vote-category-container | blur flow shadow">
    <div class="flex align-items-center children-no-margin">
      <h2 class="icon-label">
        <slot></slot>{{ title }}
      </h2>
      <p>avg: {{ avg }}</p>
    </div>

    <VoteHearts :score="score" @update-score="(score) => $emit('updateScore', score)" />

    <VoteNameList :votes="extracted" />
  </div>
</template>

<style scoped>
.vote-category-container {
  width: 100%;
  height: fit-content;
  padding: 1rem;
  
  border-radius: 1rem;
  background-color: hsl(0 0% 100% / 0.8);
}

h2 {
  flex: 1;
  text-transform: capitalize;
}
</style>