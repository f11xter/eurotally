import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import pb from '@/pb';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/views/AccountView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/vote/:country',
      component: () => import('@/views/VoteView.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

// check user is authed before navigating to relevant routes
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !pb.authStore.isValid) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    };
  }
});

// redirect to log in if user signs out
pb.authStore.onChange(() => {
  if (!pb.authStore.isValid) {
    router.push({ name: 'login' });
  }
});

export default router;
