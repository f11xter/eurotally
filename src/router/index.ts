import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import pb from '@/pb';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    showNavBar?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/vote',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { showNavBar: false },
    },
    {
      path: '/account',
      component: () => import('@/views/AccountView.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'account',
          component: () => import('@/views/RequestsView.vue'),
        },
        {
          path: 'requests',
          name: 'requests',
          component: () => import('@/views/RequestsView.vue'),
        },
        {
          path: 'following',
          name: 'following',
          component: () => import('@/views/FollowingView.vue'),
        },
        {
          path: 'followers',
          name: 'followers',
          component: () => import('@/views/FollowersView.vue'),
        },
      ],
    },
    {
      path: '/vote',
      redirect: '/vote/albania',
    },
    {
      path: '/vote/:country',
      name: 'vote',
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

  // set country return
  if (
    from.fullPath.includes('/vote') &&
    !to.fullPath.includes('/vote') &&
    !to.query.returnToCountry
  ) {
    return {
      path: to.fullPath,
      query: { returnToCountry: from.params.country },
    };
  }

  // maintain country return between pages
  if (
    from.query.returnToCountry &&
    !to.query.returnToCountry &&
    !to.fullPath.includes('/vote')
  ) {
    return {
      path: to.fullPath,
      query: { returnToCountry: from.query.returnToCountry },
    }
  }

  // use country return
  if (
    !from.fullPath.includes('/vote') &&
    to.fullPath.includes('/vote') &&
    from.query.returnToCountry &&
    from.query.returnToCountry !== to.params.country
  ) {
    return {
      name: 'vote',
      params: { country: from.query.returnToCountry as string },
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
