import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      children: [
        {
          path: '',
          name: 'root',
          component: () => import('@/views/root/index.vue')
        },
        {
          path: '/test',
          name: 'test',
          component: () => import('@/views/test/index.vue')
        },
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'pageNotFound',
      component: () => import('@/views/unknow/index.vue'),
    }
  ],
  scrollBehavior () {
    return { left: 0, top: 0 }
  }
})

router.onError((error: Error) => {
  if (
    error.message.includes('error loading dynamically imported module') ||
    error.message.includes('Failed to fetch dynamically imported module') ||
    error.message.includes('Importing a module script failed')
  ) {
    error.message = 'new version has been pulished,please refresh browser.'
  }
})

export default router
