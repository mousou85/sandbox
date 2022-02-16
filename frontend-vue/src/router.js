import {createWebHistory, createRouter} from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: import('./components/investHistory/Company.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;