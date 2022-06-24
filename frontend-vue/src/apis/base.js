import {useStore} from 'vuex';
import {useRouter} from 'vue-router';

import axios from "axios";
import qs from "qs";
import * as _ from 'lodash';

const baseURL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiBase = () => {
  const store = useStore();
  const router = useRouter();
  
  const EXCLUDE_AUTH_URL = [
    '/user/login',
    '/user/refreshToken',
  ];
  
  /**
   * axios instance
   * @type {AxiosInstance}
   */
  const axiosInstance = axios.create({
    baseURL: baseURL,
    responseType: 'json',
    responseEncoding: 'utf8',
    paramsSerializer: (params) => {
      return qs.stringify(params);
    }
  });
  
  /**
   * axios request interceptor
   */
  axiosInstance.interceptors.request.use(
    (config) => {
      if (!EXCLUDE_AUTH_URL.includes(config.url)) {
        const accessToken = store.getters['user/getAccessToken'];
        if (accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  /**
   * axios response interceptor
   */
  axiosInstance.interceptors.response.use(
    (response) => {
      const jsonData = response.data;
      
      let result = {
        result: jsonData.result,
        resultMessage: jsonData.resultMessage,
      }
      if (jsonData.data) result.data = jsonData.data;
      
      return result;
    },
    async (error) => {
      if (error.response) {
        const originalConfig = error.config;
        
        /*
        refresh access token
         */
        if (error.response.status == 401 && !originalConfig._retry) {
          if (error.response.data?.errorCode == -21) {
            originalConfig._retry= true;
            
            try {
              const res = await axiosInstance.post('/user/refreshToken', {
                refresh_token: store.getters['user/getRefreshToken']
              });
  
              await store.dispatch('user/accessToken', res.data.access_token);
  
              return axiosInstance(originalConfig);
            } catch (refreshTokenError) {
              await store.dispatch('user/logout');
              await router.push({name: 'login'});
              return Promise.reject(customError(refreshTokenError));
            }
          } else {
            await store.dispatch('user/logout');
            await router.push({name: 'login'});
            return Promise.reject(customError(error));
          }
        }
      }
      
      return Promise.reject(customError(error));
    }
  )
  
  /**
   * create custom error
   * @param axiosError
   * @returns {*}
   */
  const customError = (axiosError) => {
    if (axiosError.response?.data?.errorMessage) {
      axiosError.message = axiosError.response.data.errorMessage;
    }
    if (axiosError.response?.data?.errorCode) {
      axiosError.errorCode = axiosError.response.data.errorCode;
    }
    if (axiosError.response?.status) {
      axiosError.httpCode = axiosError.response.status;
    }
    
    let jsonObject = axiosError?.toJSON();
    
    axiosError.toJSON = () => {
      if (axiosError.errorCode) jsonObject.errorCode = axiosError.errorCode;
      if (axiosError.httpCode) jsonObject.httpCode = axiosError.httpCode;
      
      return jsonObject;
    }
    return axiosError;
  }
  
  return {
    /**
     * request get
     * @param {string} url
     * @param {{}} [params]
     * @param {{[headers]: {}, [timeout]: number}|null} [config]
     * @return {Promise<{result: boolean, resultMessage: string, [data]: *}>}
     */
    get: async (url, params = null, config = null) => {
      let axiosConfig = {};
      if (params && Object.keys(params).length) {
        axiosConfig['params'] = params;
      }
      if (config && Object.keys(config).length) {
        axiosConfig = _.merge(axiosConfig, config);
      }
  
      return await axiosInstance.get(url, axiosConfig);
    },
    /**
     * request post
     * @param {string} url
     * @param {{}} [data]
     * @param {{[headers]: {}, [timeout]: number}|null} [config]
     * @return {Promise<{result: boolean, resultMessage: string, [data]: *}>}
     */
    post: async (url, data = null, config = null) => {
      if (!data || !Object.keys(data).length) {
        data = null;
      }
      if (!config || !Object.keys(data).length) {
        config = null;
      }
  
      return await axiosInstance.post(url, data, config);
    },
    /**
     * request put
     * @param {string} url
     * @param {{}} [data]
     * @param {{[headers]: {}, [timeout]: number}|null} [config]
     * @return {Promise<{result: boolean, resultMessage: string, [data]: *}>}
     */
    put: async (url, data = null, config = null) => {
      if (!data || !Object.keys(data).length) {
        data = null;
      }
      if (!config || !Object.keys(data).length) {
        config = null;
      }
  
      return await axiosInstance.put(url, data, config);
    },
    /**
     * request patch
     * @param {string} url
     * @param {{}} [data]
     * @param {{[headers]: {}, [timeout]: number}|null} [config]
     * @return {Promise<{result: boolean, resultMessage: string, [data]: *}>}
     */
    patch: async (url, data = null, config = null) => {
      if (!data || !Object.keys(data).length) {
        data = null;
      }
      if (!config || !Object.keys(data).length) {
        config = null;
      }
  
      return await axiosInstance.patch(url, data, config);
    },
    /**
     * request delete
     * @param {string} url
     * @param {{}} [data]
     * @param {{[headers]: {}, [timeout]: number}|null} [config]
     * @return {Promise<{result: boolean, resultMessage: string, [data]: *}>}
     */
    delete: async (url, data = null, config = null) => {
      let axiosConfig = {};
      if (data && Object.keys(data).length) {
        axiosConfig['data'] = data;
      }
      if (config && Object.keys(config).length) {
        axiosConfig = _.merge(axiosConfig, config);
      }
  
      return await axiosInstance.delete(url, axiosConfig);
    }
  }
}