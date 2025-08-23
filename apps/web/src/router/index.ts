import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: {
        title: '首页'
      },
      component: () => import('@/views/Home/index.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      meta: {
        title: ''
      },
      component: () => import('@/views/404/index.vue')
    }
  ],
  scrollBehavior() {
    return { left: 0, top: 0 }  
  }
})

router.onError((error: Error) => {
  if (
    error.message.includes('error loading dynamically imported module') ||
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed')
  ) {
  }
})

export default router
