import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }, {
      path: '/xmind',
      name: 'xmind',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/XmindDemo.vue')
    },
    {
      path: '/xmind2',
      name: 'xmind2',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/XmindDemo2.vue')
    },
    {
      path: '/aomao',
      name: 'aomao',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/aomao.vue')
    },
    {
      path: '/code',
      name: 'code',
      component: () => import('../views/MergeCode.vue')
    },
    {
      path: '/code2',
      name: 'code2',
      component: () => import('../views/MergeCode2.vue')
    },
    {
      path: '/codeDemo',
      name: 'codeDemo',
      component: () => import('../views/MergeCode copy.vue')
    }
  ]
})

export default router
