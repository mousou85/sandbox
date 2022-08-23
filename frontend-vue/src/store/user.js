export const user = {
  namespaced: true,
  state: {
    isLoggedIn: false,
    data: {
      user_idx: null,
      id: null,
      name: null,
      use_otp: false
    },
    accessToken: null,
    refreshToken: null,
  },
  mutations: {
    /**
     * set login flag
     * @param state
     */
    doLogin(state) {
      state.isLoggedIn = true;
    },
    /**
     * set logout flag
     * @param state
     */
    doLogout(state) {
      state.isLoggedIn = false;
    },
    /**
     * set user info
     * @param state
     * @param {{user_idx: (number|null), id: (string|null), name: (string|null), use_otp: boolean}} value
     */
    setUserInfo(state, value) {
      state.data = Object.assign(
        {},
        state.data,
        {
          user_idx: value.user_idx,
          id: value.id,
          name: value.name,
          use_otp: value.use_otp
        }
      );
    },
    /**
     * set access token
     * @param state
     * @param {string|null} accessToken
     */
    setAccessToken(state, accessToken) {
      state.accessToken = accessToken;
    },
    /**
     * set refresh token
     * @param state
     * @param {string|null} refreshToken
     */
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
     * @returns {{user_idx: (number|null), id: (string|null), name: (string|null), use_otp: boolean}}
     */
    getUserInfo(state) {
      return state.data;
    },
    /**
     * get access token
     * @param state
     * @returns {string|null}
     */
    getAccessToken(state) {
      return state.accessToken;
    },
    /**
     * get refresh token
     * @param state
     * @returns {string|null}
     */
    getRefreshToken(state) {
      return state.refreshToken;
    }
  },
  actions: {
    /**
     * 로그인 처리
     * @param commit
     * @param {{
     *  data: {
     *    user_idx: (number|null),
     *    id: (string|null),
     *    name: (string|null),
     *    use_otp: boolean
     *  },
     *  accessToken: string,
     *  refreshToken: string
     * }} value
     * @returns {Promise<void>}
     */
    login({commit}, value) {
      try {
        commit('setUserInfo', {
          user_idx: value.data.user_idx,
          id: value.data.id,
          name: value.data.name,
          use_otp: value.data.use_otp
        });
        commit('setAccessToken', value.accessToken);
        commit('setRefreshToken', value.refreshToken);
        commit('doLogin');
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    /**
     * 로그아웃 처리
     * @param commit
     */
    logout({commit}) {
      commit('setUserInfo', {user_idx: null, id: null, name: null, use_otp: false});
      commit('setAccessToken', null);
      commit('setRefreshToken', null);
      commit('doLogout');
    },
    /**
     * set user info
     * @param commit
     * @param {{user_idx: (number|null), id: (string|null), name: (string|null), use_otp: boolean}} userInfo
     */
    userInfo({commit}, userInfo) {
      commit('setUserInfo', {
        user_idx: userInfo.user_idx,
        id: userInfo.id,
        name: userInfo.name,
        use_otp: userInfo.use_otp
      });
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