import {getItemSummary} from "@/modules/investHistory";

export const investHistory = {
  namespaced: true,
  state: {
    currentItemIdx: 0,
    currentItemSummary: {
      unit: '',
      unitType: '',
      deposit: 0,
      excludeProceedsDeposit: 0,
      in: {
        total: 0,
        principal: 0,
        proceeds: 0,
      },
      out: {
        total: 0,
        principal: 0,
        proceeds: 0,
      },
      revenue: {
        total: 0,
        interest: 0,
        eval: 0,
      },
      revenueRate: {
        diff: 0,
        rate: 0,
        excludeProceedsDiff: 0,
        excludeProceedsRate: 0
      }
    }
  },
  mutations: {
    setCurrentItemIdx(state, value) {
      state.currentItemIdx = value ? parseInt(value) : 0;
    },
    setCurrentItemSummary(state, value) {
      for (const key1 of Object.keys(value)) {
        const val1 = value[key1];
    
        if (state.currentItemSummary.hasOwnProperty(key1)) {
          if (typeof val1 == 'object') {
            for (const key2 of Object.keys(val1)) {
              const val2 = val1[key2];
          
              if (state.currentItemSummary[key1].hasOwnProperty(key2)) {
                state.currentItemSummary[key1][key2] = val2;
              }
            }
          } else {
            state.currentItemSummary[key1] = val1;
          }
        }
      }
    }
  },
  getters: {
    getCurrentItemIdx(state) {
      return state.currentItemIdx;
    },
    getCurrentItemSummary(state) {
      return state.currentItemSummary;
    }
  },
  actions: {
    async requestItemSummary({state, commit}) {
      if (state.currentItemIdx > 0) {
        const itemIdx = state.currentItemIdx;
        const data = await getItemSummary(itemIdx);
        
        commit('setCurrentItemSummary', data);
      }
    }
  }
}