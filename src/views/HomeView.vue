<script setup lang="ts">
import pb from '@/pb';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const username = ref("");
const password = ref("");
const error = ref("");

function auth(username: string, password: string) {
  pb.collection("users").authWithPassword(username, password).then(() => {
    router.push({ path: route.query.redirect as string || "/vote/united-kingdom" });
  }).catch(() => {
    error.value = "Incorrect password";
  });
}

function logInOrSignUp() {
  // log out
  pb.authStore.clear();

  // freeze inputs
  const name = username.value;
  const pwd = password.value;

  // auth if user exists
  // else create user first
  pb.collection("users").getFirstListItem(`username="${name}"`).then(() => {
    auth(name, pwd);
  }).catch(() => {
    pb.collection("users").create(
      {
        username: name,
        password: pwd,
        passwordConfirm: pwd,
      }).then(() => {
        auth(name, pwd);
      }).catch(() => {
        error.value = "Sign up failed";
      });
  });
}
</script>

<template>
  <main>
    <img src="@/assets/images/logo.jpg">

    <label for="username">Name</label>
    <input v-model="username" id="username" type="text" />

    <label for="password">Password</label>
    <input v-model="password" id="password" type="password" />

    <p v-if="error" class="error">{{ error }}</p>

    <button @click="logInOrSignUp" type="button">
      Let's go!
      <i class="iconoir-arrow-right"></i>
    </button>
  </main>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  height: 100%;
}

img {
  max-width: 100%;
}

input {
  padding: 0.5em;
  border: none;
  border-bottom: 2px solid var(--c-border);
  margin-bottom: 1em;
}

button {
  display: flex;
  align-items: center;
  gap: 1ch;

  font-size: 1.2em;
  line-height: 150%;

  padding: 0.6em 1.2em;

  border: none;
  border-radius: 1em;

  background: var(--c-accent-bg);
}

.error {
  color: hsl(0 100% 60%);
}
</style>
