import {createStore} from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import {user} from '@/store/user';


export default createStore({
  state: {
    /**
     * 모바일 여부
     */
    isMobile: false,
    /**
     * 사이트명
     */
    SITE_NAME: '',
  },
  mutations: {
    /**
     * 모바일 여부 설정
     * @param state
     * @param {boolean} value
     */
    setMobile(state, value) {
      state.isMobile = value;
    },
    /**
     * 사이트명 설정
     * @param state
     * @param {string} value
     */
    setSiteName(state, value) {
      state.SITE_NAME = value;
    }
  },
  getters: {
    /**
     * 모바일 여부 반환
     * @param state
     * @returns {boolean}
     */
    isMobile(state) {
      return state.isMobile;
    },
    /**
     * 사이트명 반환
     * @param state
     * @returns {string}
     */
    getSiteName(state) {
      return state.SITE_NAME;
    }
  },
  actions: {
    /**
     * 모바일 여부 설정
     * @param commit
     * @param {boolean} value
     */
    setMobile({commit}, value) {
      commit('setMobile', value);
    }
  },
  plugins: [
    createPersistedState({
      paths: ['user'],
      storage: window.sessionStorage,
    }),
  ],
  modules: {
    user,
  }
});