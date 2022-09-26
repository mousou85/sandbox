import {createWebHistory, createRouter} from 'vue-router';
import {computed} from "vue";

import store from '@/store/index';
import {useUserApi} from '@/apis/user';
import * as helper from '@/libs/helper';

/**
 * 라우트 정보
 */
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

/**
 * 라우터 객체 생성
 */
const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * navigation guard 설정
 */


/**
 * 자동 로그인 처리
 * @returns {Promise<boolean>}
 */
const autoLoginProceed = async () => {
  const userApi = useUserApi();
  
  const autoLoginToken = helper.getLocalStorage('autoLoginToken');
  if (!autoLoginToken) return false;
  
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
  return true;
}

//navigation guard 설정
router.beforeEach( async (to, from, next) => {
  const needLogin = to.matched.some(record => record.meta.needLogin);
  const isLoggedIn = computed(() => store.getters['user/isLogin']);
  
  if (to.name == 'login') { //로그인 페이지
    if (isLoggedIn.value) { //이미 로그인 되어 있으면 인덱스로 넘김
      next({name: 'index'});
      return;
    } else {
      //자동 로그인 시도
      if (await autoLoginProceed()) {
        next({name: 'index'});
        return;
      }
    }
  } else if (needLogin) { //그 이외에 로그인 필요 페이지
    if (!isLoggedIn.value) {
      try {
        if (await autoLoginProceed()) {
          next({name: 'index'});
          return;
        }
      } catch (err) {
        helper.delLocalStorage('autoLoginToken');
      }
    }
  }
  
  next();
});


export default router;