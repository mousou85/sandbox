import {createStore} from 'vuex';

export default createStore({
  state: {
    /**
     * 모바일 여부
     */
    isMobile: false,
  },
  mutations: {
    /**
     * 모바일 여부 설정
     * @param state
     * @param {boolean} value
     */
    setMobile(state, value) {
      state.isMobile = value;
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
  }
  // modules: {
  //   investHistory
  // }
});