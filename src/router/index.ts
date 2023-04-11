import { createRouter, createWebHistory } from "vue-router"
import HomeView from "@/views/HomeView.vue"
import pb from "@/pb";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean,
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView
    },
    {
      path: "/list",
      name: "list",
      component: () => import("@/views/ListView.vue"),
    },
    {
      path: "/vote",
      name: "vote",
      component: () => import("@/views/ListView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/vote/:country",
      component: () => import("@/views/VoteView.vue"),
      meta: { requiresAuth: true },
    },
  ]
});

// check user is authed before navigating to relevant routes
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !pb.authStore.isValid) {
    return {
      name: "home",
      query: { redirect: to.fullPath },
    }
  }
});

// redirect to log in if user signs out
pb.authStore.onChange(() => {
  if (!pb.authStore.isValid) {
    router.push({ name: "home" });
  }
});

export default router
