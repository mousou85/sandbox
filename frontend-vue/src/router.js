import {createWebHistory, createRouter} from 'vue-router';

const routes = [
  {
    path: '/',
    component: import('./components/Index.vue')
  },
  {
    path: '/invest-history/',
    redirect: '/invest-history/history',
    component: import('./components/investHistory/Index.vue'),
    children: [
      {
        path: 'history',
        component: import('./components/investHistory/History.vue')
      },
      {
        path: 'company',
        component: import('./components/investHistory/Company.vue')
      },
      {
        path: 'item',
        component: import('./components/investHistory/Item.vue')
      },

    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;