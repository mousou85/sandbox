import axios from 'axios';
import qs from 'qs';
import * as _ from 'lodash';

/**
 * query param serializer redeclare
 * @param params
 * @return {string}
 */
axios.defaults.paramsSerializer = (params) => {
  return qs.stringify(params);
}

export default {
  /**
   * @param {string} url
   * @param {{}} [queryParams]
   * @param {AxiosRequestConfig} [config]
   * @return {Promise<{result: Boolean, data: *, resultMessage: string}>}
   */
  get: async (url, queryParams = null, config = null) => {
    try {
      let axiosConfig = {};
      if (queryParams) axiosConfig['params'] = queryParams;
      if (config) axiosConfig = _.merge(axiosConfig, config);

      const res = await axios.get(url, axiosConfig);
      const json = res.data;
  
      let result = {
        result: json.result,
        resultMessage: json.resultMessage
      };
      if (json.data) result.data = json.data;
  
      return result;
    } catch (err) {
      err.message = err.response?.data?.error || err.message;
      throw err;
    }
  },
  /**
   * @param {string} url
   * @param {{}} [requestBody]
   * @param {AxiosRequestConfig} [config]
   * @return {Promise<{result: Boolean, data: *, resultMessage: string}>}
   */
  post: async (url, requestBody, config = null) => {
    try {
      const res = await axios.post(url, requestBody ? requestBody : null, config);
      const json = res.data;
      
      let result = {
        result: json.result,
        resultMessage: json.resultMessage
      };
      if (json.data) result.data = json.data;

      return result;
    } catch (err) {
      err.message = err.response?.data?.error || err.message;
      throw err;
    }
  },
  /**
   * @param {string} url
   * @param {{}} [requestBody]
   * @param {AxiosRequestConfig} [config]
   * @return {Promise<{result: Boolean, data: *, resultMessage: string}>}
   */
  put: async (url, requestBody, config) => {
    try {
      const res = await axios.put(url, requestBody ? requestBody : null, config);
      const json = res.data;
  
      let result = {
        result: json.result,
        resultMessage: json.resultMessage
      };
      if (json.data) result.data = json.data;
  
      return result;
    } catch (err) {
      err.message = err.response?.data?.error || err.message;
      throw err;
    }
  },
  /**
   * @param {string} url
   * @param {{}} [requestBody]
   * @param {AxiosRequestConfig} [config]
   * @return {Promise<{result: Boolean, data: *, resultMessage: string}>}
   */
  delete: async (url, requestBody, config) => {
    try {
      let axiosConfig = {};
      if (requestBody) axiosConfig['data'] = requestBody;
      if (config) axiosConfig = _.merge(axiosConfig, config);
      
      const res = await axios.delete(url, axiosConfig);
      const json = res.data;
  
      let result = {
        result: json.result,
        resultMessage: json.resultMessage
      };
      if (json.data) result.data = json.data;
  
      return result;
    } catch (err) {
      err.message = err.response?.data?.error || err.message;
      throw err;
    }
  }
}