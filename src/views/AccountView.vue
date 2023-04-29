<script setup lang="ts">
import SearchBar from '@/components/SearchBar.vue';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const activeTab = ref('requests');

// update active tab
watch(
  [() => route.name],
  () => {
    if (route.name === 'account') {
      activeTab.value = 'requests';
    } else {
      activeTab.value = route.name!.toString();
    }
  },
  { immediate: true }
);
</script>

<template>
  <header class="bg-muted relative">
    <SearchBar />

    <nav class="tablist">
      <RouterLink
        class="tab | flex justify-content:center align-items:center | inline-size:100%"
        :data-active="activeTab === 'requests'"
        :to="{ name: 'requests' }"
      >
        <h2>requests</h2>
      </RouterLink>

      <RouterLink
        class="tab | flex justify-content:center align-items:center | inline-size:100%"
        :data-active="activeTab === 'following'"
        :to="{ name: 'following' }"
      >
        <h2>following</h2>
      </RouterLink>

      <RouterLink
        class="tab | flex justify-content:center align-items:center | inline-size:100%"
        :data-active="activeTab === 'followers'"
        :to="{ name: 'followers' }"
      >
        <h2>followers</h2>
      </RouterLink>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  --search-height: 6rem;
}

.tablist {
  padding-block-start: var(--search-height);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  box-shadow: inset 0 -0.5em 0.5em -0.5em #0004;
}

.tab {
  block-size: 3rem;
  text-decoration: none;
  text-align: center;
}

.tab[data-active='true'] {
  background: var(--c-solid);
  border-radius: 1em 1em 0 0;
  box-shadow: 0 0 0.5em #0004;
}
</style>
