<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import VoteCategory from '@/components/VoteCategory.vue';

import pb from "@/pb";
import type { Vote } from '@/types/vote';
import { stringifyExpression } from '@vue/compiler-core';


const categories = ["singing", "song", "performance", "outfit", "vibes", "overall"];
const icons = ["iconoir-mic", "iconoir-music-double-note", "iconoir-running", "iconoir-t-shirt", "iconoir-sea-and-sun", "iconoir-three-stars"];

const route = useRoute();
const showAlertBanner = inject<Function>("showAlertBanner") as Function;

/** countries data `{ id, country, song, band, flag, profile }` */
const countries = ref<Record<string, any>[]>([]);

/** `true` when countries data loaded */
const isLoaded = ref(false);

/** index of current country in `countries` */
const index = ref(0);
/** index of previous country in `countries` for bottom nav */
const prev = ref(0);
/** index of next country in `countries` for bottom nav */
const next = ref(0);

/** list of votes for current country */
const votes = ref<Vote[]>([]);

// update background image
const backgroundImage = computed(() =>
  countries.value.length > 0 ?
    `url("${countries.value[index.value].profile}")` :
    ""
);

const userVotes = computed(() => {
  const val: Record<string, number> = {
    "singing": 0,
    "song": 0,
    "performance": 0,
    "outfit": 0,
    "vibes": 0,
    "overall": 0,
  };

  for (const vote of votes.value.filter(x => x.uid === pb.authStore.model!.id)) {
    val[vote.category] = vote.score;
  }

  return val;
});

// get countries data
pb.collection("countries").getFullList({ sort: "country" }).then((list) => {
  countries.value = list;
  isLoaded.value = true;
});

// Update page on initial data load and route change
watch(
  [
    countries,
    () => route.params.country,
  ],
  () => {
    // populate country data
    const param = route.params.country as string;
    const i = countries.value.findIndex(x => x.country === param.toLowerCase());

    if (i === -1) {
      // TODO: error handling - couldn't find country
      console.error("couldn't find country");
    }

    index.value = i;
    prev.value = i === 0 ? countries.value.length - 1 : i - 1;
    next.value = (i + 1) % countries.value.length;

    getInitialVotes(countries.value[i].id);
    subscribeToVotes(countries.value[i].id);
  }
);

/**
 * Populate `votes` with votes so far
 * @param countryID id attribute of current country
 */
function getInitialVotes(countryID: string) {
  pb.collection("votes").getFullList({
    filter: `country="${countryID}"`,
    expand: "user",
  }).then((data) => {
    votes.value = data.map(x => {
      const user = x.expand.user as Record<string, any>;
      return {
        id: x.id,
        uid: user.id,
        category: x.category,
        username: user.username,
        score: x.score,
      }
    });
  });
}

/**
 * Handle newly created, updated and deleted votes of current country
 * @param countryID id attribute of current country
 */
function subscribeToVotes(countryID: string) {
  pb.collection("votes").subscribe("*", (e) => {
    // if current country
    if (e.record.country === countryID) {
      if (e.action === "create") {
        pushNewVote(e.record);
      }

      else if (e.action === "update") {
        const i = votes.value.findIndex(x => x.id === e.record.id);

        if (i == -1) {
          pushNewVote(e.record);
        }
        else {
          votes.value[i].score = e.record.score;
        }
      }

      else if (e.action === "delete") {
        votes.value = votes.value.filter(x => x.id !== e.record.id);
      }
    }
  })
}

/**
 * Push new vote from subscription to `votes`
 * @param vote vote record fetched by subscription
 */
function pushNewVote(vote: Record<string, any>) {
  pb.collection("users").getOne(vote.user).then((user) => {
    votes.value.push({
      id: vote.id,
      uid: user.id,
      category: vote.category,
      username: user.username,
      score: vote.score,
    });
  });
}

/**
 * Update or create vote on server
 * @param category 
 * @param score 
 */
function updateVote(category: string, score: number) {
  // route is always authenticated 
  const user = pb.authStore.model!;

  // check if create or update method required
  // if vote already exists in client list, use update
  // check client to avoid unnecessary server requests

  const current = votes.value.find(x => x.username === user.username && x.category === category);

  if (current) {
    if (score !== current.score) {
      pb.collection("votes").update(
        current.id,
        {
          user: current.uid,
          country: countries.value[index.value].id,
          category: category,
          score: score,
        }
      );
    }
  }

  // if vote not already in client list check server
  else {
    pb.collection("votes").getFirstListItem(
      `user="${user.id}" && country="${countries.value[index.value].id}" && category="${category}"`

    ).then((current) => {
      // update if exists on server
      if (score !== current.score) {
        pb.collection("votes").update(
          current.id,
          {
            user: current.user,
            country: current.country,
            category: category,
            score: score,
          }
        );
      }

    }).catch(() => {
      // create if doesn't exist on server
      pb.collection("votes").create(
        {
          user: user.id,
          country: countries.value[index.value].id,
          category: category,
          score: score,
        }
      );
    });
  }
}
</script>

<template>
  <div class="container" :style="{ backgroundImage: backgroundImage }">
    <main v-if="isLoaded" class="flow">
      <VoteCategory v-for="(c, index) in categories" :title="c" :votes="votes.filter(x => x.category === c)"
        :score="userVotes[c]" :key="c" @update-score="(score) => updateVote(c, score)">
        <i :class="icons[index]"></i>
      </VoteCategory>
    </main>

    <nav v-if="isLoaded" class="bottomNav | shadow">
      <img :src="countries[index].flag" :alt="countries[index].country + ' flag'" onerror="this.style.display = 'none'" />

      <RouterLink :to="'/vote/' + countries[prev].country"><i class="iconoir-arrow-left"></i></RouterLink>

      <div>
        <h1>{{ countries[index].country.replace("-", " ") }}</h1>
        <p>{{ countries[index].band }}</p>
        <p>{{ countries[index].song }}</p>
      </div>

      <RouterLink :to="'/vote/' + countries[next].country"><i class="iconoir-arrow-right"></i></RouterLink>
    </nav>

    <div v-else class="bottomNav | shadow">
      <p>Loading...</p>
    </div>
  </div>

  <button type="button" @click="showAlertBanner('hi there', 'error')" style="position: absolute;bottom:1rem;">alert</button>
</template>

<style scoped>
.container {
  --footer-height: 8rem;

  display: flex;
  flex-direction: column;
  height: 100vh;

  background-size: cover;
  background-position: 50% 50%;
}

main {
  flex: 1;
  overflow: scroll;
  padding: 0.5rem;
  padding-bottom: calc(var(--footer-height) + 0.5rem);
}

.bottomNav {
  position: absolute;
  bottom: 0;
  height: var(--footer-height);
  width: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;

  padding: 2.5rem 0.5rem;
  padding-bottom: 1rem;
  border-radius: 1rem 1rem 0 0;
  background-color: hsl(0 100% 100%);
}

nav>img {
  position: absolute;
  height: 5rem;
  top: -2.5rem;
  left: 50%;
  translate: -50% 0;
}

nav>div {
  flex: 1;
}

nav>div>* {
  width: fit-content;
  margin: 0 auto;
}

nav h1 {
  text-transform: capitalize;
}

nav i {
  color: black;
}
</style>