<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';

const props = defineProps<{
  votes: {
    id: string;
    name: string;
    score: number;
  }[];
}>();

const outer = ref<HTMLElement | null>(null);
const overflow = ref(false);
const list = ref(props.votes);

watch(
  () => props.votes,
  () => {
    list.value = props.votes;

    nextTick(() => {
      if (outer.value) {
        if (outer.value.scrollWidth > outer.value.clientWidth) {
          overflow.value = true;
          list.value = list.value.concat(props.votes);
        } else {
          overflow.value = false;
        }
      } else {
        overflow.value = false;
      }
    });
  },
  { immediate: true }
);

const animationDuration = computed(() => {
  if (outer.value) {
    return `${outer.value?.scrollWidth / 30}s`;
  } else {
    return '0s';
  }
});
</script>

<template>
  <div class="outer" ref="outer" :class="{ overflow: overflow }">
    <div class="inner" :style="{ animationDuration: animationDuration }">
      <p v-if="list.length === 0">No votes yet...</p>
      <p
        v-for="vote in list"
        class="name"
        :style="{ '--hue': 190 + 16 * vote.score }"
        :key="vote.id"
      >
        {{ vote.name }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.outer {
  position: relative;
  width: 100%;
  overflow: hidden;
  height: 2rem;
}

.outer.overflow {
  mask-image: linear-gradient(
    to right,
    transparent,
    white 20%,
    white 80%,
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    white 20%,
    white 80%,
    transparent
  );
}

.inner {
  display: flex;
  gap: 1ch;
  width: fit-content;
}

.outer.overflow .inner {
  animation: scroll infinite linear;
}

@keyframes scroll {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50%);
  }
}

p {
  height: 2rem;
  margin: 0;
}

p:not(.name) {
  padding: 0.2rem 0;
  font-style: italic;
}

.name {
  border-radius: 0.75rem;
  padding: 0.2rem 0.4rem;
  border: 2px solid hsl(var(--hue) 100% 50%);
  background-color: hsl(var(--hue) 100% 95%);
  user-select: none;
}
</style>
