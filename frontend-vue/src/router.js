import {createWebHistory, createRouter} from 'vue-router';
import {computed} from "vue";

export default (store) => {
  const routes = [
    {
      name: 'index',
      path: '/',
      component: () => import('@/components/Index.vue'),
      meta: {needLogin: true},
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
      meta: {needLogin: true},
      children: [
        {
          name: 'investHistory',
          path: 'history',
          meta: {needLogin: true},
          component: () => import('@/components/investHistory/History.vue')
        },
        {
          name: 'investGroup',
          path: 'group',
          meta: {needLogin: true},
          component: () => import('@/components/investHistory/Group.vue')
        },
        {
          name: 'investItem',
          path: 'item',
          meta: {needLogin: true},
          component: () => import('@/components/investHistory/Item.vue')
        },
        {
          name: 'investUnit',
          path: 'unit',
          meta: {needLogin: true},
          component: () => import('@/components/investHistory/Unit.vue')
        },
      ]
    },
  ];
  
  const router = createRouter({
    history: createWebHistory(),
    routes
  });
  
  router.beforeEach( (to, from, next) => {
    const needLogin = to.matched.some(record => record.meta.needLogin);
    const isLoggedIn = computed(() => store.getters['user/isLogin']);
    
    if (to.name == 'login' && isLoggedIn.value) {
      next({name: 'index'});
    }
    
    if (needLogin && !isLoggedIn.value) {
      next({name: 'login'});
    }
    
    next();
  });
  
  return router;
}