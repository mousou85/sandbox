import {apiBase} from '@/apis/base';

export const useInvestApi = () => {
  const api = apiBase();
  
  return {
    /**
     * get group list
     * @returns {Promise<{
     *  group_idx: number,
     *  group_name: string,
     *  item_count: number,
     *  item_list: {
     *    item_idx: number,
     *    item_type: string,
     *    item_type_text: string,
     *    item_name: string,
     *    is_close: string,
     *    closed_at: string,
     *    unit_list: {
     *      unit_idx: number,
     *      unit: string,
     *      unit_type: string
     *    }[]
     *  }[]
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
     *  group_idx: number,
     *  group_name: string,
     *  item_count: number,
     *  item_list: {
     *    item_idx: number,
     *    item_type: string,
     *    item_type_text: string,
     *    item_name: string,
     *    is_close: string,
     *    closed_at: string,
     *    unit_list: {
     *      unit_idx: number,
     *      unit: string,
     *      unit_type: string
     *    }[]
     *  }[]
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
     *  item_idx: number,
     *  item_type: string,
     *  item_type_text: string,
     *  item_name: string,
     *  is_close: string,
     *  closed_at: string,
     *  unit_list: {
     *    unit_idx: number,
     *    unit: string,
     *    unit_type: string
     *  }[]
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
     *  item_idx: number,
     *  item_type: string,
     *  item_type_text: string,
     *  item_name: string,
     *  is_close: string,
     *  closed_at: string,
     *  unit_list: {
     *    unit_idx: number,
     *    unit: string,
     *    unit_type: string
     *  }[]
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
     * @return {Promise<Object[]>}
     */
    getHistoryList: async (itemIdx, historyType, unit, date) => {
      let params = {};
      if (historyType) params['history_type'] = historyType;
      if (unit) params['unit'] = unit;
      if (date) params['date'] = date;
  
      const res = await api.get(`/invest-history/history/${itemIdx}`, params);
      if (!res.result) throw new Error(res.resultMessage);
  
      return res.data.list;
    },
    /**
     * get item total summary
     * @param {number} itemIdx
     * @return {Promise<Object>}
     */
    getItemSummaryTotal: async (itemIdx) => {
      const res = await api.get(`/invest-history/summary/${itemIdx}/total`);
      if (!res.result) throw new Error(res.resultMessage);
      return res.data;
    },
    /**
     * get item month summary
     * @param {number} itemIdx
     * @param {string} date
     * @return {Promise<Object>}
     */
    getItemSummaryMonth: async (itemIdx, date) => {
      const res = await api.get(`/invest-history/summary/${itemIdx}/month`, {date: date});
      if (!res.result) throw new Error(res.resultMessage);
      return res.data;
    },
    /**
     * get item year summary
     * @param {number} itemIdx
     * @param {number|string} year
     * @return {Promise<Object>}
     */
    getItemSummaryYear: async (itemIdx, year) => {
      const res = await api.get(`/invest-history/summary/${itemIdx}/year`, {year: year});
      if (!res.result) throw new Error(res.resultMessage);
      return res.data;
    },
    /**
     * get company list
     * @return {Promise<Object[]>}
     */
    getCompanyList: async() => {
      const res = await api.get(`/invest-history/company`);
      if (!res.result) throw new Error(res.resultMessage);
      return res.data.list;
    },
    /**
     * add company
     * @param {string} companyName
     * @return {Promise<void>}
     */
    addCompany: async(companyName) => {
      const res = await api.post(`/invest-history/company`, {company_name: companyName});
      if (!res.result) throw new Error(res.resultMessage);
    },
    /**
     * edit company
     * @param {number} companyIdx
     * @param {string} companyName
     * @return {Promise<void>}
     */
    editCompany: async(companyIdx, companyName) => {
      const res = await api.put(`/invest-history/company/${companyIdx}`, {company_name: companyName});
      if (!res.result) throw new Error(res.resultMessage);
    },
    /**
     * delete company
     * @param {number} companyIdx
     * @return {Promise<void>}
     */
    delCompany: async(companyIdx) => {
      const res = await api.delete(`/invest-history/company/${companyIdx}`);
      if (!res.result) throw new Error(res.resultMessage);
    },
    /**
     * get all unit list
     * @return {Promise<Object[]>}
     */
    getUnitList: async() => {
      const res = await api.get(`/invest-history/unit`);
      if (!res.result) throw new Error(res.resultMessage);
      return res.data.list;
    },
    /**
     * add unit
     * @param {string} unit
     * @param {string} unitType
     * @return {Promise<void>}
     */
    addUnit: async(unit, unitType) => {
      const res = await api.post(`/invest-history/unit`, {unit: unit, unit_type: unitType});
      if (!res.result) throw new Error(res.resultMessage);
    },
    /**
     * edit unit
     * @param {number} unitIdx
     * @param {string} unit
     * @param {string} unitType
     * @return {Promise<void>}
     */
    editUnit: async(unitIdx, unit, unitType) => {
      const res = await api.put(`/invest-history/unit/${unitIdx}`, {
        unit: unit,
        unit_type: unitType
      });
      if (!res.result) throw new Error(res.resultMessage);
    },
    /**
     * delete unit
     * @param {number} unitIdx
     * @return {Promise<void>}
     */
    delUnit: async (unitIdx) => {
      const res = await api.delete(`/invest-history/unit/${unitIdx}`);
      if (!res.result) throw new Error(res.resultMessage);
    },
    /**
     * 히스토리 추가
     * @param {{item_idx: number, unit_idx: number, history_date: string, history_type: string, [inout_type]: string, [revenue_type]: string, val: number, memo: string}} requestBody
     * @return {Promise<void>}
     */
    addHistory: async (requestBody) => {
      const itemIdx = requestBody.item_idx;
    
      delete requestBody.item_idx;
      if (requestBody.history_type == 'inout') {
        delete requestBody.revenue_type;
      } else if (requestBody.history_type == 'revenue') {
        delete requestBody.inout_type;
      }
    
      const res = await api.post(`/invest-history/history/${itemIdx}/`, requestBody);
      if (!res.result) throw new Error(res.resultMessage);
    },
    /**
     * 히스토리 수정
     * @param {{history_idx: number, history_date: string, val: number, memo: string}} requestBody
     * @return {Promise<void>}
     */
    editHistory: async (requestBody) => {
      const historyIdx = requestBody.history_idx;
    
      delete requestBody.history_idx;
    
      const res = await api.put(`/invest-history/history/${historyIdx}`, requestBody);
      if (!res.result) throw new Error(res.resultMessage);
    },
    /**
     * 히스토리 삭제
     * @param {number} historyIdx
     * @return {Promise<void>}
     */
    delHistory: async (historyIdx) => {
      const res = await api.delete(`/invest-history/history/${historyIdx}`);
      if (!res.result) throw new Error(res.resultMessage);
    }
  }
}
