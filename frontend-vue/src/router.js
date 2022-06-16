import {createWebHistory, createRouter} from 'vue-router';

const routes = [
  {
    name: 'index',
    path: '/',
    component: () => import('@/components/Index.vue')
  },
  {
    name: 'login',
    path: '/login',
    component: () => import('@/components/Login.vue'),
  },
  {
    path: '/invest-history/',
    redirect: '/invest-history/history',
    component: () => import('@/components/investHistory/Index.vue'),
    children: [
      {
        name: 'investHistory',
        path: 'history',
        component: () => import('@/components/investHistory/History.vue')
      },
      {
        name: 'investCompany',
        path: 'company',
        component: () => import('@/components/investHistory/Company.vue')
      },
      {
        name: 'investItem',
        path: 'item',
        component: () => import('@/components/investHistory/Item.vue')
      },
      {
        name: 'investUnit',
        path: 'unit',
        component: () => import('@/components/investHistory/Unit.vue')
      },
    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;