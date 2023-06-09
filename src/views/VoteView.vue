<script setup lang="ts">
import VoteCategory from '@/components/VoteCategory.vue';
import pb from '@/pb';
import type { Vote } from '@/helpers/client-types';
import {
  type UsersResponse,
  type CountriesResponse,
  Collections,
  type VotesResponse,
} from '@/helpers/pocketbase-types';
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

type TExpandUser = {
  user: UsersResponse;
};

const UID = pb.authStore.model!.id;

const categories = [
  'singing',
  'song',
  'performance',
  'outfit',
  'vibes',
  'overall',
];

const icons = [
  'iconoir-emoji-sing-right-note',
  'iconoir-music-double-note',
  'iconoir-running',
  'iconoir-t-shirt',
  'iconoir-sea-and-sun',
  'iconoir-three-stars',
];

const route = useRoute();
const router = useRouter();

/** countries data */
const countries = ref<CountriesResponse[]>([]);

/** `true` when countries data loaded */
const isLoaded = ref(false);

/** `true` when countries list showing */
const isListExpanded = ref(false);
/** sets position of bottom nav to show countries list */
const bottomNavTop = computed(() =>
  isListExpanded.value
    ? '0'
    : 'calc(100vh - var(--nav-height) - var(--button-height))'
);

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
  countries.value.length > 0
    ? `url("${countries.value[index.value].profile}")`
    : ''
);

const userVotes = computed(() => {
  const val: Record<string, number> = {
    singing: 0,
    song: 0,
    performance: 0,
    outfit: 0,
    vibes: 0,
    overall: 0,
  };

  for (const vote of votes.value.filter((x) => x.uid === UID)) {
    val[vote.category] = vote.score;
  }

  return val;
});

// get countries data
pb.collection(Collections.Countries)
  .getFullList<CountriesResponse>({ filter: 'order > 0', sort: 'order' })
  .then((response) => {
    countries.value = response;
    isLoaded.value = true;
  });

// Update page on initial data load and route change
watch([countries, () => route.params.country], () => {
  // populate country data
  const param = route.params.country as string;
  const i = countries.value.findIndex((x) => x.country === param.toLowerCase());

  if (i === -1) {
    console.error("Couldn't find country");
    router.push({
      name: 'vote',
      params: { country: countries.value[0].country },
    });
  }

  index.value = i;
  prev.value = i === 0 ? countries.value.length - 1 : i - 1;
  next.value = (i + 1) % countries.value.length;

  // close countries list
  isListExpanded.value = false;

  getInitialVotes(countries.value[i].id);
  subscribeToVotes(countries.value[i].id);
});

/**
 * Populate `votes` with votes so far
 * @param countryID id attribute of current country
 */
function getInitialVotes(countryID: string) {
  pb.collection(Collections.Votes)
    .getFullList<VotesResponse<TExpandUser>>({
      filter: `country="${countryID}"`,
      expand: 'user',
    })
    .then((response) => {
      votes.value = response.map((x) => {
        const user = x.expand!.user;
        return {
          id: x.id,
          uid: user.id,
          category: x.category,
          username: user.username,
          score: x.score,
        };
      });
    });
}

/**
 * Handle newly created, updated and deleted votes of current country
 * @param countryID id attribute of current country
 */
function subscribeToVotes(countryID: string) {
  pb.collection(Collections.Votes).subscribe<VotesResponse>('*', (e) => {
    // if current country
    if (e.record.country === countryID) {
      if (e.action === 'create') {
        pushNewVote(e.record);
      } else if (e.action === 'update') {
        const i = votes.value.findIndex((x) => x.id === e.record.id);

        if (i === -1) {
          pushNewVote(e.record);
        } else {
          votes.value[i].score = e.record.score;
        }
      } else if (e.action === 'delete') {
        votes.value = votes.value.filter((x) => x.id !== e.record.id);
      }
    }
  });
}

/**
 * Push new vote from subscription to `votes`
 * @param vote vote record fetched by subscription
 */
function pushNewVote(vote: VotesResponse) {
  pb.collection(Collections.Users)
    .getOne(vote.user)
    .then((response) => {
      votes.value.push({
        id: vote.id,
        uid: response.id,
        category: vote.category,
        username: response.username,
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
  // check if create or update method required
  // if vote already exists in client list, use update
  // check client to avoid unnecessary server requests

  const current = votes.value.find(
    (x) => x.id === UID && x.category === category
  );

  if (current) {
    if (score !== current.score) {
      pb.collection(Collections.Votes).update(current.id, {
        score: score,
      });
    }
  }

  // if vote not already in client list check server
  else {
    pb.collection(Collections.Votes)
      .getFirstListItem<VotesResponse>(
        `user="${UID}" && country="${
          countries.value[index.value].id
        }" && category="${category}"`
      )
      .then((response) => {
        // update if exists on server
        if (score !== response.score) {
          pb.collection(Collections.Votes).update(response.id, {
            score: score,
          });
        }
      })
      .catch(() => {
        // create if doesn't exist on server
        pb.collection(Collections.Votes).create({
          user: UID,
          country: countries.value[index.value].id,
          category: category,
          score: score,
        });
      });
  }
}
</script>

<template>
  <div
    class="container | flex relative"
    :style="{ backgroundImage: backgroundImage }"
  >
    <main v-if="isLoaded" class="grid">
      <VoteCategory
        v-for="(c, index) in categories"
        :title="c"
        :votes="votes.filter((x) => x.category === c)"
        :score="userVotes[c]"
        :key="c"
        @update-score="(score) => updateVote(c, score)"
      >
        <i :class="icons[index]"></i>
      </VoteCategory>
    </main>

    <div class="details | absolute inline-size:100% shadow bg-solid">
      <nav v-if="isLoaded" class="relative flex align-items:center">
        <img
          :src="countries[index].flag"
          :alt="countries[index].country + ' flag'"
          class="absolute"
          onerror="this.style.display = 'none'"
        />

        <RouterLink :to="'/vote/' + countries[prev].country">
          <i class="iconoir-arrow-left"></i>
        </RouterLink>

        <div>
          <h1 class="capitalize">
            {{ countries[index].order }}.
            {{ countries[index].country.replace('-', ' ') }}
          </h1>
          <p>{{ countries[index].band }}</p>
          <p>{{ countries[index].song }}</p>
        </div>

        <RouterLink :to="'/vote/' + countries[next].country">
          <i class="iconoir-arrow-right"></i>
        </RouterLink>
      </nav>

      <div v-else>
        <p>Loading...</p>
      </div>
    </div>

    <div
      class="drawer | absolute inline-size:100% transition:200ms bg-solid"
      :style="{ top: bottomNavTop }"
    >
      <button
        type="button"
        class="inline-size:100% bg-muted"
        :style="{
          'border-block-end': isListExpanded ? '2px solid var(--c-border)' : '',
        }"
        @click="isListExpanded = !isListExpanded"
      >
        <i v-if="isListExpanded" class="iconoir-nav-arrow-down"></i>
        <i v-else class="iconoir-playlist"></i>
      </button>

      <nav>
        <p v-for="country in countries" :key="country.id">
          {{ country.order }}.
          <RouterLink :to="'/vote/' + country.country" class="capitalize">
            {{ country.country.replace('-', ' ') }}
          </RouterLink>
          &mdash;
          {{ country.song }}
        </p>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.container {
  --details-height: 8rem;
  --button-height: 3rem;

  flex-direction: column;
  block-size: calc(100vh - var(--nav-height));

  background-size: cover;
  background-position: 50% 50%;

  overflow: hidden;
}

main {
  flex: 1;
  padding: 0.5rem;
  padding-block-end: calc(
    var(--details-height) + var(--button-height) + 0.5rem
  );
  overflow: scroll;
}

.details {
  bottom: var(--button-height);
  block-size: var(--details-height);
  border-radius: 1rem 1rem 0 0;
}

.details nav {
  padding-block: 2.5rem 0.5rem;
}

.details a {
  margin-inline: 1.5rem;
}

.details div {
  flex: 1;
  overflow: hidden;
}

.details :is(h1, p) {
  text-align: center;
  white-space: nowrap;
}

.details img {
  left: 50%;
  top: 0;
  block-size: 5rem;
  translate: -50% -50%;
}

.drawer {
  border-radius: 1rem 1rem 0 0;
}

.drawer button {
  block-size: var(--button-height);
}

.drawer button:is(:hover, :focus-visible) {
  filter: brightness(90%);
}

.drawer i {
  margin-block: 0.5rem;
}

.drawer nav {
  block-size: calc(100vh - var(--button-height) - var(--nav-height));
  overflow: scroll;
}

.drawer p {
  padding: 1rem;
}

.drawer p:nth-child(even) {
  background: var(--c-muted);
}
</style>
