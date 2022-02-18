import axios from 'axios';
import qs from 'qs';

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
   * @return {Promise<{result: Boolean, data: *, resultMessage: string}>}
   */
  get: async (url, queryParams) => {
    try {
      const axiosParams = {params: queryParams ? queryParams : null};

      const res = await axios.get(url, axiosParams);
      const json = res.data;

      return {
        result: json.result,
        resultMessage: json.resultMessage,
        data: json.data
      };
    } catch (err) {
      const errMessage = err.response?.data?.error || err.message;
      throw new Error(errMessage);
    }
  },
  /**
   * @param {string} url
   * @param {{}} [requestBody]
   * @return {Promise<{result: Boolean, data: *, resultMessage: string}>}
   */
  post: async (url, requestBody) => {
    try {
      const res = await axios.post(url, requestBody ? requestBody : null);
      const json = res.data;

      return {
        result: json.result,
        resultMessage: json.resultMessage,
        data: json.data
      };
    } catch (err) {
      const errMessage = err.response?.data?.error || err.message;
      throw new Error(errMessage);
    }
  },
  /**
   * @param {string} url
   * @param {{}} [requestBody]
   * @return {Promise<{result: Boolean, data: *, resultMessage: string}>}
   */
  put: async (url, requestBody) => {
    try {
      const res = await axios.put(url, requestBody ? requestBody : null);
      const json = res.data;

      return {
        result: json.result,
        resultMessage: json.resultMessage,
        data: json.data
      };
    } catch (err) {
      const errMessage = err.response?.data?.error || err.message;
      throw new Error(errMessage);
    }
  },
  /**
   * @param {string} url
   * @param {{}} [requestBody]
   * @return {Promise<{result: Boolean, data: *, resultMessage: string}>}
   */
  delete: async (url, requestBody) => {
    try {
      const res = await axios.delete(url, {data: requestBody ? requestBody : null});
      const json = res.data;

      return {
        result: json.result,
        resultMessage: json.resultMessage,
        data: json.data
      };
    } catch (err) {
      const errMessage = err.response?.data?.error || err.message;
      throw new Error(errMessage);
    }
  }
}