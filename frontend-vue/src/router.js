import {createWebHistory, createRouter} from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'index',
    component: import('./components/Index.vue')
  },
  {
    path: '/invest-history/',
    name: 'invest-history',
    component: import('./components/investHistory/History.vue')
  },
  {
    path: '/invest-history/company',
    name: 'invest-company',
    component: import('./components/investHistory/Company.vue')
  },
  {
    path: '/invest-history/item',
    name: 'invest-item',
    component: import('./components/investHistory/Item.vue')
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;