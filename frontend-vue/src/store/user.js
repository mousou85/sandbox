import {
  login as requestLogin,
  getInfo as requestInfo,
} from '@/apis/user';

export const user = {
  namespaced: true,
  state: {
    isLoggedIn: false,
    data: null,
    accessToken: '',
    refreshToken: '',
  },
  mutations: {
    /**
     * set login info
     * @param state
     * @param {{data: {}, accessToken: string, refreshToken: string}} value
     */
    login(state, {data, accessToken, refreshToken}) {
      state.isLoggedIn = true;
      state.data = data;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.data = null;
      state.accessToken = '';
      state.refreshToken = '';
    }
  },
  getters: {
    /**
     * is logged in
     * @param state
     * @returns {boolean}
     */
    isLogin(state) {
      return state.isLoggedIn;
    },
    /**
     * get user info
     * @param state
     * @returns {{}}
     */
    getUserInfo(state) {
      return state.data;
    },
    /**
     * get access token
     * @param state
     * @returns {string}
     */
    getAccessToken(state) {
      return state.accessToken;
    },
    /**
     * get refresh token
     * @param state
     * @returns {string}
     */
    getRefreshToken(state) {
      return state.refreshToken;
    }
  },
  actions: {
    /**
     * 로그인 요청
     * @param commit
     * @param {{id: string, password: string}} value
     * @returns {Promise<void>}
     */
    async login({commit}, value) {
      const id = value.id;
      const password = value.password;
      
      try {
        const rsToken = await requestLogin(id, password);
        const rsInfo = await requestInfo(rsToken.access_token);
        
        commit('login', {data: rsInfo, accessToken: rsToken.access_token, refreshToken: rsToken.refresh_token});
      } catch (err) {
        throw err;
      }
    }
  }
};