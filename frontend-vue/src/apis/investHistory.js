import {apiBase} from '@/apis/base';

export const useInvestApi = () => {
  const api = apiBase();
  
  return {
    /**
     * get group list
     * @returns {Promise<{
     *   group_idx: number,
     *   group_name: string,
     *   item_count: number,
     *   item_list: {
     *     item_idx: number,
     *     item_type: string,
     *     item_type_text: string,
     *     item_name: string,
     *     is_close: string,
     *     closed_at: string,
     *     unit_list: {
     *       unit_idx: number,
     *       unit: string,
     *       unit_type: string
     *     }[]
     *   }[]
     * }[]>}
     */
    getGroupList: async () => {
      const res = await api.get('/invest-history/group');
      return res.data.list;
    },
    /**
     *
     * @param groupIdx
     * @returns {Promise<{
     *   group_idx: number,
     *   group_name: string,
     *   item_count: number,
     *   item_list: {
     *     item_idx: number,
     *     item_type: string,
     *     item_type_text: string,
     *     item_name: string,
     *     is_close: string,
     *     closed_at: string,
     *     unit_list: {
     *       unit_idx: number,
     *       unit: string,
     *       unit_type: string
     *     }[]
     *   }[]
     * }>}
     */
    getGroup: async (groupIdx) => {
      const res = await api.get(`/invest-history/group/${groupIdx}`);
      return res.data.data;
    },
    /**
     * add group
     * @param {string} groupName
     * @returns {Promise<number>} group idx
     */
    addGroup: async (groupName) => {
      const res = await api.post('/invest-history/group', {group_name: groupName});
      return res.data.group_idx;
    },
    /**
     * edit group
     * @param {number} groupIdx
     * @param {string} groupName
     * @returns {Promise<void>}
     */
    editGroup: async (groupIdx, groupName) => {
      await api.put(`/invest-history/group/${groupIdx}`, {group_name: groupName});
    },
    /**
     * delete group
     * @param {number} groupIdx
     * @returns {Promise<void>}
     */
    delGroup: async (groupIdx) => {
      await api.delete(`/invest-history/group/${groupIdx}`);
    },
    /**
     * add group item
     * @param {number} groupIdx
     * @param {number[]} itemIdxList
     * @returns {Promise<void>}
     */
    addGroupItem: async (groupIdx, itemIdxList) => {
      await api.post(`/invest-history/group/${groupIdx}/item`, {items: itemIdxList});
    },
    /**
     * delete group item
     * @param {number} groupIdx
     * @param {number[]} itemIdxList
     * @returns {Promise<void>}
     */
    delGroupItem: async (groupIdx, itemIdxList) => {
      await api.post(`/invest-history/group/${groupIdx}/item`, {items: itemIdxList});
    },
    /**
     * get item list
     * @return {Promise<{
     *   item_idx: number,
     *   item_type: string,
     *   item_type_text: string,
     *   item_name: string,
     *   is_close: string,
     *   closed_at: string,
     *   unit_list: {
     *     unit_idx: number,
     *     unit: string,
     *     unit_type: string
     *   }[]
     * }[]>}
     */
    getItemList: async () => {
      const res = await api.get('/invest-history/item');
      return res.data.list;
    },
    /**
     * get item data
     * @param {number} itemIdx
     * @returns {Promise<{
     *   item_idx: number,
     *   item_type: string,
     *   item_type_text: string,
     *   item_name: string,
     *   is_close: string,
     *   closed_at: string,
     *   unit_list: {
     *     unit_idx: number,
     *     unit: string,
     *     unit_type: string
     *   }[]
     * }>}
     */
    getItem: async (itemIdx) => {
      const res = await api.get(`/invest-history/item/${itemIdx}`);
      return res.data;
    },
    /**
     * add item
     * @param {{group_idx: number, item_type: string, item_name: string}} data
     * @return {Promise<number>} item idx
     */
    addItem: async (data) => {
      const res = await api.post(`/invest-history/item/`, data);
      return res.data.item_idx;
    },
    /**
     * edit item
     * @param {number} itemIdx
     * @param {{[group_idx]: number, [item_type]: string, [item_name]: string}} data
     * @return {Promise<void>}
     */
    editItem: async (itemIdx, data) => {
      await api.put(`/invest-history/item/${itemIdx}`, data);
    },
    /**
     * delete item
     * @param {number} itemIdx
     * @return {Promise<void>}
     */
    delItem: async (itemIdx) => {
      await api.delete(`/invest-history/item/${itemIdx}`);
    },
    /**
     * add item unit list
     * @param {number} itemIdx
     * @param {number[]} unitIdxList
     * @returns {Promise<void>}
     */
    addItemUnit: async (itemIdx, unitIdxList) => {
      await api.post(`/invest-history/item/${itemIdx}/unit`, {units: unitIdxList});
    },
    /**
     * edit item unit list
     * @param {number} itemIdx
     * @param {number[]} unitIdxList
     * @returns {Promise<void>}
     */
    editItemUnit: async (itemIdx, unitIdxList) => {
      await api.put(`/invest-history/item/${itemIdx}/unit`, {units: unitIdxList});
    },
    /**
     * delete item unit list
     * @param {number} itemIdx
     * @param {number[]} unitIdxList
     * @returns {Promise<void>}
     */
    delItemUnit: async (itemIdx, unitIdxList) => {
      await api.delete(`/invest-history/item/${itemIdx}/unit`, {units: unitIdxList});
    },
    /**
     * get item usable unit list
     * @param {number} itemIdx
     * @return {Promise<Object[]>}
     */
    getItemUsableUnitList: async (itemIdx) => {
      const res = await api.get(`/invest-history/unit-set/${itemIdx}`);
      if (!res.result) throw new Error(res.resultMessage);
  
      return res.data.list;
    },
    /**
     * get item type list
     * @return {Promise<{type: string, text: string}[]>}
     */
    getItemTypeList: async () => {
      const res = await api.get(`/invest-history/item/item-type`);
      return res.data.list;
    },
    /**
     * get history list
     * @param {number} itemIdx
     * @param {string} [historyType=inout,revenue]
     * @param {string} [unit]
     * @param {string} [date]
     * @return {Promise<{
     *   history_idx: number,
     *   unit_idx: number,
     *   history_date: string,
     *   history_type: string,
     *   history_type_text: string,
     *   inout_type: string,
     *   inout_type_text: string,
     *   revenue_type: string,
     *   revenue_type_text: string,
     *   val: number,
     *   memo: string,
     *   unit: string,
     *   unit_type: string
     * }[]>}
     */
    getHistoryList: async (itemIdx, historyType, unit, date) => {
      let params = {};
      if (historyType) params['history_type'] = historyType;
      if (unit) params['unit'] = unit;
      if (date) params['date'] = date;
  
      const res = await api.get(`/invest-history/history/${itemIdx}`, params);
      return res.data.list;
    },
    /**
     * get item total summary
     * @param {number} itemIdx
     * @return {Promise<{
     *   unit: string,
     *   unitType: string,
     *   inout: {
     *     total: number,
     *     principal: number,
     *     proceeds: number
     *   },
     *   revenue: {
     *     total: number,
     *     interest: number,
     *     eval: number
     *   },
     *   earn: {
     *     earn: number,
     *     rate: number,
     *     earnIncProceeds: number,
     *     rateIncProceeds: number
     *   }
     * }>}
     */
    getItemSummaryTotal: async (itemIdx) => {
      const res = await api.get(`/invest-history/summary/${itemIdx}/total`);
      return res.data;
    },
    /**
     * get item month summary
     * @param {number} itemIdx
     * @param {string} [date]
     * @param {string} [unit]
     * @return {Promise<{
     *   year: string,
     *   month: string,
     *   unit: string,
     *   unitType: string,
     *   inout: {
     *     total: number,
     *     principalTotal: number,
     *     principalPrev: number,
     *     principalCurrent: number,
     *     proceedsTotal: number,
     *     proceedsPrev: number,
     *     proceedsCurrent: number
     *   },
     *   revenue: {
     *     total: number,
     *     interestTotal: number,
     *     interestPrev: number,
     *     interestCurrent: number,
     *     eval: number,
     *     evalPrev: number
     *   },
     *   earn: {
     *     earn: number,
     *     rate: number,
     *     earnIncProceeds: number,
     *     rateIncProceeds: number
     *   },
     *   earnPrevDiff: {
     *     earn: number,
     *     rate: number,
     *     earnIncProceeds: number,
     *     rateIncProceeds: number
     *   }
     * }>}
     */
    getItemSummaryMonth: async (itemIdx, date, unit) => {
      let params = {};
      if (unit) params.unit = unit;
      if (date) params.date = date;
      
      const res = await api.get(`/invest-history/summary/${itemIdx}/month`, params);
      return res.data;
    },
    /**
     * get item year summary
     * @param {number} itemIdx
     * @param {number|string} [year]
     * @param {string} [unit]
     * @return {Promise<{
     *   year: string,
     *   unit: string,
     *   unitType: string,
     *   inout: {
     *     total: number,
     *     principalTotal: number,
     *     principalPrev: number,
     *     principalCurrent: number,
     *     proceedsTotal: number,
     *     proceedsPrev: number,
     *     proceedsCurrent: number
     *   },
     *   revenue: {
     *     total: number,
     *     interestTotal: number,
     *     interestPrev: number,
     *     interestCurrent: number,
     *     eval: number,
     *     evalPrev: number
     *   },
     *   earn: {
     *     earn: number,
     *     rate: number,
     *     earnIncProceeds: number,
     *     rateIncProceeds: number
     *   },
     *   earnPrevDiff: {
     *     earn: number,
     *     rate: number,
     *     earnIncProceeds: number,
     *     rateIncProceeds: number
     *   }
     * }>}
     */
    getItemSummaryYear: async (itemIdx, year, unit) => {
      let params = {};
      if (unit) params.unit = unit;
      if (year) params.year = year;
      
      const res = await api.get(`/invest-history/summary/${itemIdx}/year`, params);
      return res.data;
    },
    /**
     * get all unit list
     * @return {Promise<{
     *   unit_idx: number,
     *   unit: string,
     *   unit_type: string
     * }[]>}
     */
    getUnitList: async() => {
      const res = await api.get(`/invest-history/unit`);
      return res.data.list;
    },
    /**
     * add unit
     * @param {string} unit
     * @param {string} unitType
     * @return {Promise<number>} unit idx
     */
    addUnit: async(unit, unitType) => {
      const res = await api.post(`/invest-history/unit`, {unit: unit, unit_type: unitType});
      return res.data.unit_idx;
    },
    /**
     * edit unit
     * @param {number} unitIdx
     * @param {string} unit
     * @param {string} unitType
     * @return {Promise<void>}
     */
    editUnit: async(unitIdx, unit, unitType) => {
      await api.put(`/invest-history/unit/${unitIdx}`, {
        unit: unit,
        unit_type: unitType
      });
    },
    /**
     * delete unit
     * @param {number} unitIdx
     * @return {Promise<void>}
     */
    delUnit: async (unitIdx) => {
      await api.delete(`/invest-history/unit/${unitIdx}`);
    },
    /**
     * 히스토리 추가
     * @param {number} itemIdx
     * @param {{
     *   unit_idx: number,
     *   history_date: string,
     *   history_type: string,
     *   [inout_type]: string,
     *   [revenue_type]: string,
     *   val: number,
     *   memo: string
     * }} requestBody
     * @return {Promise<number>} history idx
     */
    addHistory: async (itemIdx, requestBody) => {
      if (requestBody.history_type == 'inout') {
        delete requestBody.revenue_type;
      } else if (requestBody.history_type == 'revenue') {
        delete requestBody.inout_type;
      }
    
      const res = await api.post(`/invest-history/history/${itemIdx}/`, requestBody);
      return res.data.history_idx;
    },
    /**
     * 히스토리 수정
     * @param {number} historyIdx
     * @param {{
     *   [history_date]: string,
     *   [val]: number,
     *   [memo]: string
     * }} requestBody
     * @return {Promise<void>}
     */
    editHistory: async (historyIdx, requestBody) => {
      await api.put(`/invest-history/history/${historyIdx}`, requestBody);
    },
    /**
     * 히스토리 삭제
     * @param {number} historyIdx
     * @return {Promise<void>}
     */
    delHistory: async (historyIdx) => {
      await api.delete(`/invest-history/history/${historyIdx}`);
    }
  }
}
