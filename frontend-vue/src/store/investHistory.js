export const investHistory = {
  namespaced: true,
  state: {
    currentItemIdx: 0,
    updateSummaryFlag: false,
    updateInOutListFlag: false,
    updateRevenueListFlag: false,
    updateItemListFlag: false,
    selectedUnit: '',
  },
  mutations: {
    /**
     * set current item idx value
     * @param {Object} state
     * @param {number|string} value
     */
    setCurrentItemIdx(state, value) {
      state.currentItemIdx = value ? parseInt(value) : 0;
    },
    /**
     * set update summary flag
     * @param {Object} state
     * @param {boolean} value
     */
    setUpdateSummaryFlag(state, value) {
      state.updateSummaryFlag = value;
    },
    /**
     * set update in/out list flag
     * @param {Object} state
     * @param {boolean} value
     */
    setUpdateInOutListFlag(state, value) {
      state.updateInOutListFlag = value;
    },
    /**
     * set update revenue list flag
     * @param {Object} state
     * @param {boolean} value
     */
    setUpdateRevenueListFlag(state, value) {
      state.updateRevenueListFlag = value;
    },
    /**
     * set update item list flag
     * @param state
     * @param {boolean} value
     */
    setUpdateItemListFlag(state, value) {
      state.updateItemListFlag = value;
    },
    /**
     * set selected unit value
     * @param state
     * @param {string} value
     */
    setSelectedUnit(state, value) {
      state.selectedUnit = value;
    }
  },
  getters: {
    /**
     * get current item idx value
     * @param state
     * @returns {number}
     */
    getCurrentItemIdx(state) {
      return state.currentItemIdx;
    },
    /**
     * get update summary flag value
     * @param state
     * @returns {boolean}
     */
    getUpdateSummaryFlag(state) {
      return state.updateSummaryFlag;
    },
    /**
     * get update in/out list flag value
     * @param state
     * @returns {boolean}
     */
    getUpdateInOutListFlag(state) {
      return state.updateInOutListFlag;
    },
    /**
     * get update revenue list flag value
     * @param state
     * @returns {boolean}
     */
    getUpdateRevenueListFlag(state) {
      return state.updateRevenueListFlag;
    },
    /**
     * get update item list flag value
     * @param state
     * @returns {boolean}
     */
    getUpdateItemListFlag(state) {
      return state.updateItemListFlag;
    },
  },
  actions: {
  }
}