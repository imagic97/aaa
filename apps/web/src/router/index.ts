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
      path: '/video',
      name: 'video',
      meta: {
        title: '视频播放'
      },
      component: () => import('@/views/Video/index.vue')
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

const DYNAMIC_IMPORT_ERRORS = [
  'error loading dynamically imported module',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
];

router.onError((error: Error) => {
  if (DYNAMIC_IMPORT_ERRORS.some(msg => error.message.includes(msg))) {
    console.error('Dynamic import failed:', error);
  }
})

export default router
