import http from "../libs/http";
import {numberUncomma} from "@/libs/helper";

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
 * @param {number} itemIdx
 * @return {Promise<Object[]>}
 */
const getItemUsableUnitList = async (itemIdx) => {
  const res = await http.get(`${baseURL}/invest-history/unit-set/${itemIdx}`);
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
const getHistoryList = async (itemIdx, historyType, unit, date) => {
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
const getItemSummary = async (itemIdx) => {
  const res = await http.get(`${baseURL}/invest-history/summary/${itemIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
  return res.data;
}

/**
 * get company list
 * @returns {Promise<Object[]>}
 */
const getCompanyList = async() => {
  const res = await http.get(`${baseURL}/invest-history/company`);
  if (!res.result) throw new Error(res.resultMessage);
  return res.data.list;
}

/**
 * add company
 * @param {string} companyName
 * @returns {Promise<void>}
 */
const addCompany = async(companyName) => {
  const res = await http.post(`${baseURL}/invest-history/company`, {company_name: companyName});
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * edit company
 * @param {number} companyIdx
 * @param {string} companyName
 * @returns {Promise<void>}
 */
const editCompany = async(companyIdx, companyName) => {
  const res = await http.put(`${baseURL}/invest-history/company/${companyIdx}`, {company_name: companyName});
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * delete company
 * @param {number} companyIdx
 * @returns {Promise<void>}
 */
const delCompany = async(companyIdx) => {
  const res = await http.delete(`${baseURL}/invest-history/company/${companyIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * get all unit list
 * @returns {Promise<Object[]>}
 */
const getUnitList = async() => {
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
const addUnit = async(unit, unitType) => {
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
const editUnit = async(unitIdx, unit, unitType) => {
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
const delUnit = async (unitIdx) => {
  const res = await http.delete(`${baseURL}/invest-history/unit/${unitIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
}

/**
 * 히스토리 추가
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

/**
 * 히스토리 수정
 * @param {{history_idx: number, history_date: string, val: number, memo: string}} requestBody
 * @returns {Promise<void>}
 */
const editHistory = async (requestBody) => {
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
const delHistory = async (historyIdx) => {
  const res = await http.delete(`${baseURL}/invest-history/history/${historyIdx}`);
  if (!res.result) throw new Error(res.resultMessage);
}

export {
  getItemList,
  getItemUsableUnitList,
  getHistoryList,
  addHistory,
  editHistory,
  delHistory,
  getItemSummary,
  getCompanyList,
  addCompany,
  editCompany,
  delCompany,
  getUnitList,
  addUnit,
  editUnit,
  delUnit,
}