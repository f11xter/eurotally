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
      router.push((route.query.redirect as LocationQueryValue) ?? '/account');
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

    <form @submit.prevent class="flow">
      <label for="username" class="flow block">
        <span :style="{ '--flow-space': '0.5em' }">Name</span>

        <input
          v-model="username"
          type="text"
          id="username"
          class="padding:0.5em inline-size:100%"
          :disabled="disabled"
          :style="{ '--flow-space': '0.5em' }"
        />
      </label>

      <label for="password" class="flow block">
        <span :style="{ '--flow-space': '0.5em' }">Password</span>
        <input
          v-model="password"
          type="password"
          id="password"
          class="padding:0.5em inline-size:100%"
          :disabled="disabled"
          :style="{ '--flow-space': '0.5em' }"
        />
      </label>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <div>
        <button
          class="secondary"
          @click="onSignUpClicked"
          :disabled="disabled"
          type="submit"
        >
          Sign Up
        </button>
        <button
          class="primary"
          @click="onLogInClicked"
          :disabled="disabled"
          type="submit"
        >
          Log In
        </button>
      </div>
    </form>
  </main>
</template>

<style scoped>
img {
  display: block;
  max-width: 100%;
  margin: auto;
}

form {
  padding: 1em;
}

input {
  border-radius: 0.5em;
  border: 1px solid var(--c-border);
}

form > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
}

.error {
  color: hsl(0 100% 60%);
}
</style>
