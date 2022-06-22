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
    doLogin(state, value) {
      state.isLoggedIn = true;
      state.data = value.data;
      state.accessToken = value.accessToken;
      state.refreshToken = value.refreshToken;
    },
    /**
     * logout
     * @param state
     */
    doLogout(state) {
      state.isLoggedIn = false;
      state.data = null;
      state.accessToken = '';
      state.refreshToken = '';
    },
    /**
     * set access token
     * @param state
     * @param {string} accessToken
     */
    setAccessToken(state, accessToken) {
      state.accessToken = accessToken;
    },
    
    setRefreshToken(state, refreshToken) {
      state.refreshToken = refreshToken;
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
     * 로그인 처리
     * @param commit
     * @param {{data: {}, accessToken: string, refreshToken: string}} value
     * @returns {Promise<void>}
     */
    async login({commit}, value) {
      try {
        commit('doLogin', {data: value.data, accessToken: value.accessToken, refreshToken: value.refreshToken});
      } catch (err) {
        throw err;
      }
    },
    /**
     * 로그아웃 처리
     * @param commit
     */
    logout({commit}) {
      commit('doLogout');
    },
    /**
     * set access token
     * @param commit
     * @param {string} accessToken
     */
    accessToken({commit}, accessToken) {
      commit('setAccessToken', accessToken);
    }
  }
};