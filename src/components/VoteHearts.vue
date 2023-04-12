<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{ score: number }>();

const emit = defineEmits<{ (e: "updateScore", score: number): void }>();

const active = ref(props.score);
const previousActive = ref(0);

const delay = computed(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(pos => `${Math.abs(previousActive.value - pos) * 20}ms`));

const click = (pos: number) => {
  previousActive.value = active.value;
  active.value = pos;
  emit("updateScore", active.value);
}

watch(
  () => props.score,
  () => {
    active.value = props.score;
    previousActive.value = 0;
  },
  { immediate: true },
);
</script>

<template>
  <div class="heart-container">
    <svg v-for="n in 10" :key="n" :style="{ '--hue': 190 + 16 * n, transitionDelay: delay[n] }"
      :class="{ 'active': n <= active }" @click="click(n)" stroke-width="2" viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 8.862a5.95 5.95 0 01-1.654 4.13c-2.441 2.531-4.809 5.17-7.34 7.608-.581.55-1.502.53-2.057-.045l-7.295-7.562c-2.205-2.286-2.205-5.976 0-8.261a5.58 5.58 0 018.08 0l.266.274.265-.274A5.612 5.612 0 0116.305 3c1.52 0 2.973.624 4.04 1.732A5.95 5.95 0 0122 8.862z"
        stroke-width="2" stroke-linejoin="round"></path>
    </svg>
  </div>
</template>

<style scoped>
.heart-container {
  display: flex;
}

svg {
  --lightness: 90%;
  width: 100%;
  aspect-ratio: 1/1;

  fill: hsl(var(--hue) 100% var(--lightness));
  stroke: hsl(var(--hue) 100% 50%);
}

svg.active {
  --lightness: 65%;
}

svg:nth-child(even) {
  transform: scaleY(-1);
}
</style>