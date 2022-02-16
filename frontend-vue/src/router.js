import {createWebHistory, createRouter} from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'index',
    component: import('./components/Index.vue')
  },
  {
    path: '/invest-history/company',
    name: 'invest-company',
    component: import('./components/investHistory/Company.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;