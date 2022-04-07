import http from "../libs/http";

let baseURL = 'http://localhost:5000';

/**
 * get item list
 * @return {Promise<Object[]>}
 */
const getItemList = async () => {
  const res = await http.get(`${baseURL}/invest-history/item/`);
  if (!res.result) throw new Error(res.resultMessage);
  
  return res.data.list;
}

/**
 * get item usable unit list
 * @param itemIdx
 * @return {Promise<Object[]>}
 */
const getItemUsableUnitList = async (itemIdx) => {
  const res = await http.get(`${baseURL}/invest-history/unit-set/${itemIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
  
  return res.data.list;
}

/**
 * get item total summary
 * @param {number} itemIdx
 * @return {Promise<Object>}
 */
const getItemSummary = async (itemIdx) => {
  const res = await http.get(`${baseURL}/invest-history/summary/${itemIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
  return res.data;
}

/**
 *
 * @param {{item_idx: number, unit_idx: number, history_date: string, history_type: string, [inout_type]: string, [revenue_type]: string, val: number, memo: string}} requestBody
 * @return {Promise<void>}
 */
const addHistory = async (requestBody) => {
  const itemIdx = requestBody.item_idx;
  
  delete requestBody.item_idx;
  if (['in', 'out'].includes(requestBody.history_type)) {
    delete requestBody.revenue_type;
  } else if (requestBody.history_type == 'revenue') {
    delete requestBody.inout_type;
  }
  
  const res = await http.post(`${baseURL}/invest-history/history/${itemIdx}/`, requestBody);
  if (!res.result) throw new Error(res.resultMessage);
}

export {
  getItemList,
  getItemUsableUnitList,
  addHistory,
  getItemSummary
}