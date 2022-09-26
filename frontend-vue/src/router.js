import {createWebHistory, createRouter} from 'vue-router';
import {computed} from "vue";

import {useUserApi} from '@/apis/user';
import * as helper from '@/libs/helper';

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
  
  const userApi = useUserApi(store, router);
  
  router.beforeEach( async (to, from, next) => {
    const needLogin = to.matched.some(record => record.meta.needLogin);
    const isLoggedIn = computed(() => store.getters['user/isLogin']);
    const autoLoginToken = helper.getLocalStorage('autoLoginToken');
    
    if (to.name == 'login') {
      if (isLoggedIn.value) {
        next({name: 'index'});
        return;
      } else {
      
      }
    }
    
    if (needLogin) {
      if (!isLoggedIn.value) {
        
        
        if (autoLoginToken) {
          try {
            const refreshToken = await userApi.verifyAutoLoginToken(autoLoginToken);
            const accessToken = await userApi.refreshToken(refreshToken);

            await store.dispatch('user/accessToken', accessToken);

            const userInfo = await userApi.getUserInfo();
            await store.dispatch('user/login', {
              data: {
                user_idx: userInfo.user_idx,
                id: userInfo.id,
                name: userInfo.name,
                use_otp: userInfo.use_otp
              },
              refreshToken: refreshToken
            });

            next({name: 'index'});
            return;
          } catch (err) {
            helper.delLocalStorage('autoLoginToken');
          }
        }
  
        next({name: 'login'});
        return;
      } else {
        if (to.name == 'login') {
          next({name: 'index'});
          return;
        }
      }
    }
    
    next();
  });
  
  return router;
}