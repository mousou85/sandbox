import http from "@/libs/http";

/**
 * api base url
 * @type {string}
 */
let baseURL = 'http://localhost:5000';

/**
 * set api base url
 * @param url
 */
export const setAPIBaseUrl = (url) => {
  baseURL = url;
}

/**
 * get item list
 * @return {Promise<Object[]>}
 */
export const getItemList = async () => {
  const res = await http.get(`${baseURL}/invest-history/item/`);
  if (!res.result) throw new Error(res.resultMessage);
  
  return res.data.list;
}

/**
 * add item
 * @param {{company_idx: number, item_type: string, item_name: string, [units]: number[]}} requestBody
 * @returns {Promise<void>}
 */
export const addItem = async (requestBody) => {
  const res = await http.post(`${baseURL}/invest-history/item/`, requestBody);
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * edit item
 * @param {{item_idx: number, [company_idx]: number, [item_type]: string, [item_name]: string, [units]: number[]}} requestBody
 * @returns {Promise<void>}
 */
export const editItem = async (requestBody) => {
  const itemIdx = requestBody.item_idx;
  
  delete requestBody.item_idx;
  
  const res = await http.put(`${baseURL}/invest-history/item/${itemIdx}`, requestBody);
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * delete item
 * @param {number} itemIdx
 * @returns {Promise<void>}
 */
export const delItem = async (itemIdx) => {
  const res = await http.delete(`${baseURL}/invest-history/item/${itemIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * get item usable unit list
 * @param {number} itemIdx
 * @return {Promise<Object[]>}
 */
export const getItemUsableUnitList = async (itemIdx) => {
  const res = await http.get(`${baseURL}/invest-history/unit-set/${itemIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
  
  return res.data.list;
}

/**
 * get item type list
 * @returns {Promise<Object[]>}
 */
export const getItemTypeList = async () => {
  const res = await http.get(`${baseURL}/invest-history/item/item-type`);
  if (!res.result) throw new Error(res.resultMessage);
  
  return res.data.list;
}

/**
 * get history list
 * @param {number} itemIdx
 * @param {string} [historyType=inout,revenue]
 * @param {string} [unit]
 * @param {string} [date]
 * @return {Promise<Object[]>}
 */
export const getHistoryList = async (itemIdx, historyType, unit, date) => {
  let params = {};
  if (historyType) params['history_type'] = historyType;
  if (unit) params['unit'] = unit;
  if (date) params['date'] = date;
  
  const res = await http.get(`${baseURL}/invest-history/history/${itemIdx}`, params);
  if (!res.result) throw new Error(res.resultMessage);
  
  return res.data.list;
}

/**
 * get item total summary
 * @param {number} itemIdx
 * @return {Promise<Object>}
 */
export const getItemSummaryTotal = async (itemIdx) => {
  const res = await http.get(`${baseURL}/invest-history/summary/${itemIdx}/total`);
  if (!res.result) throw new Error(res.resultMessage);
  return res.data;
}

/**
 * get item month summary
 * @param {number} itemIdx
 * @param {string} date
 * @return {Promise<Object>}
 */
export const getItemSummaryMonth = async (itemIdx, date) => {
  const res = await http.get(`${baseURL}/invest-history/summary/${itemIdx}/month`, {date: date});
  if (!res.result) throw new Error(res.resultMessage);
  return res.data;
}

/**
 * get item year summary
 * @param {number} itemIdx
 * @param {number|string} year
 * @return {Promise<Object>}
 */
export const getItemSummaryYear = async (itemIdx, year) => {
  const res = await http.get(`${baseURL}/invest-history/summary/${itemIdx}/year`, {year: year});
  if (!res.result) throw new Error(res.resultMessage);
  return res.data;
}

/**
 * get company list
 * @returns {Promise<Object[]>}
 */
export const getCompanyList = async() => {
  const res = await http.get(`${baseURL}/invest-history/company`);
  if (!res.result) throw new Error(res.resultMessage);
  return res.data.list;
}

/**
 * add company
 * @param {string} companyName
 * @returns {Promise<void>}
 */
export const addCompany = async(companyName) => {
  const res = await http.post(`${baseURL}/invest-history/company`, {company_name: companyName});
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * edit company
 * @param {number} companyIdx
 * @param {string} companyName
 * @returns {Promise<void>}
 */
export const editCompany = async(companyIdx, companyName) => {
  const res = await http.put(`${baseURL}/invest-history/company/${companyIdx}`, {company_name: companyName});
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * delete company
 * @param {number} companyIdx
 * @returns {Promise<void>}
 */
export const delCompany = async(companyIdx) => {
  const res = await http.delete(`${baseURL}/invest-history/company/${companyIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * get all unit list
 * @returns {Promise<Object[]>}
 */
export const getUnitList = async() => {
  const res = await http.get(`${baseURL}/invest-history/unit`);
  if (!res.result) throw new Error(res.resultMessage);
  return res.data.list;
}

/**
 * add unit
 * @param {string} unit
 * @param {string} unitType
 * @returns {Promise<void>}
 */
export const addUnit = async(unit, unitType) => {
  const res = await http.post(`${baseURL}/invest-history/unit`, {unit: unit, unit_type: unitType});
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * edit unit
 * @param {number} unitIdx
 * @param {string} unit
 * @param {string} unitType
 * @returns {Promise<void>}
 */
export const editUnit = async(unitIdx, unit, unitType) => {
  const res = await http.put(`${baseURL}/invest-history/unit/${unitIdx}`, {
      unit: unit,
      unit_type: unitType
    });
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * delete unit
 * @param {number} unitIdx
 * @returns {Promise<void>}
 */
export const delUnit = async (unitIdx) => {
  const res = await http.delete(`${baseURL}/invest-history/unit/${unitIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * 히스토리 추가
 * @param {{item_idx: number, unit_idx: number, history_date: string, history_type: string, [inout_type]: string, [revenue_type]: string, val: number, memo: string}} requestBody
 * @return {Promise<void>}
 */
export const addHistory = async (requestBody) => {
  const itemIdx = requestBody.item_idx;
  
  delete requestBody.item_idx;
  if (requestBody.history_type == 'inout') {
    delete requestBody.revenue_type;
  } else if (requestBody.history_type == 'revenue') {
    delete requestBody.inout_type;
  }
  
  const res = await http.post(`${baseURL}/invest-history/history/${itemIdx}/`, requestBody);
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * 히스토리 수정
 * @param {{history_idx: number, history_date: string, val: number, memo: string}} requestBody
 * @returns {Promise<void>}
 */
export const editHistory = async (requestBody) => {
  const historyIdx = requestBody.history_idx;
  
  delete requestBody.history_idx;
  
  const res = await http.put(`${baseURL}/invest-history/history/${historyIdx}`, requestBody);
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * 히스토리 삭제
 * @param {number} historyIdx
 * @return {Promise<void>}
 */
export const delHistory = async (historyIdx) => {
  const res = await http.delete(`${baseURL}/invest-history/history/${historyIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
}
