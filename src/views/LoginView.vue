<script setup lang="ts">
import pb from '@/pb';
import { Collections } from '@/helpers/pocketbase-types';
import { ref } from 'vue';
import type { LocationQueryValue } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');

const disabled = ref(false);

function logIn(username: string, password: string) {
  pb.collection(Collections.Users)
    .authWithPassword(username, password)
    .then(() => {
      router.push(
        (route.query.redirect as LocationQueryValue) ?? '/account'
      );
    })
    .catch(() => {
      disabled.value = false;
      error.value = 'Log in failed';
    });
}

function onLogInClicked() {
  disabled.value = true;
  logIn(username.value, password.value);
}

function onSignUpClicked() {
  disabled.value = true;

  pb.collection(Collections.Users)
    .create({
      username: username.value,
      password: password.value,
      passwordConfirm: password.value,
    })
    .then(() => {
      logIn(username.value, password.value);
    })
    .catch(() => {
      disabled.value = false;
      error.value = 'Sign up failed';
    });
}
</script>

<template>
  <main>
    <img src="@/assets/images/logo.jpg" />

    <form @submit.prevent>
      <label for="username">Name</label>
      <input
        v-model="username"
        id="username"
        :disabled="disabled"
        type="text"
      />

      <label for="password">Password</label>
      <input
        v-model="password"
        id="password"
        :disabled="disabled"
        type="password"
      />

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <div>
        <button @click="onSignUpClicked" :disabled="disabled" type="submit">
          Sign Up
        </button>
        <button @click="onLogInClicked" :disabled="disabled" type="submit">
          Log In
        </button>
      </div>
    </form>
  </main>
</template>

<style scoped>
img {
  max-width: 100%;
}

form {
  padding: 1em;
}

form > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
}

form > :is(input, p) {
  display: block;
  inline-size: 100%;
  margin-block: 0 1em;
}

.error {
  color: hsl(0 100% 60%);
}
</style>
