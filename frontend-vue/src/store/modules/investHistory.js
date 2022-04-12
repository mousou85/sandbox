export const investHistory = {
  namespaced: true,
  state: {
    currentItemIdx: 0,
    updateSummaryFlag: false,
    updateInOutListFlag: false,
    updateRevenueListFlag: false,
  },
  mutations: {
    setCurrentItemIdx(state, value) {
      state.currentItemIdx = value ? parseInt(value) : 0;
    },
    /**
     * @param {Object} state
     * @param {boolean} value
     */
    setUpdateSummaryFlag(state, value) {
      state.updateSummaryFlag = value;
    },
    setUpdateInOutListFlag(state, value) {
      state.updateInOutListFlag = value;
    },
    setUpdateRevenueListFlag(state, value) {
      state.updateRevenueListFlag = value;
    }
  },
  getters: {
    getCurrentItemIdx(state) {
      return state.currentItemIdx;
    },
    getUpdateSummaryFlag(state) {
      return state.updateSummaryFlag;
    },
    getUpdateInOutListFlag(state) {
      return state.updateInOutListFlag;
    },
    getUpdateRevenueListFlag(state) {
      return state.updateRevenueListFlag;
    }
  },
  actions: {
  
  }
}