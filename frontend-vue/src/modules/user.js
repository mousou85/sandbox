import http from "@/libs/http";

/**
 * api base url
 * @type {string}
 */
const baseURL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * get login(get tokens)
 * @param {string} userId
 * @param {string} userPassword
 * @returns {Promise<{access_token: string, refresh_token: string}>}
 */
export const login = async (userId, userPassword) => {
  const res = await http.post(`${baseURL}/user/login/`, {id: userId, password: userPassword});
  if (!res.result) throw new Error(res.resultMessage);
  
  return {
    access_token: res.data.access_token,
    refresh_token: res.data.refresh_token,
  };
}

/**
 * get user info
 * @param {string} accessToken
 * @returns {Promise<{user_idx: number, id: string, name: string}>}
 */
export const getInfo = async (accessToken) => {
  const axiosConfig = {
    headers: {'Authorization': `Bearer ${accessToken}`}
  };
  
  const res = await http.get(`${baseURL}/user/info`, null, axiosConfig);
  if (!res.result) throw new Error(res.resultMessage);
  
  return res.data;
}

/**
 * get new access token
 * @param {string} refreshToken
 * @returns {Promise<{access_token: string}>}
 */
export const refreshToken = async (refreshToken) => {
  const res = await http.post(`${baseURL}/user/refreshToken`, {refresh_token: refreshToken});
  if (!res.result) throw new Error(res.resultMessage);
  
  return {
    access_token: res.data.access_token,
  }
}