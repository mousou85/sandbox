import {apiBase} from '@/apis/base';

export const useUserApi = () => {
  const api = apiBase();
  
  return {
    /**
     * get login
     * @param {string} userId
     * @param {string} userPassword
     * @return {Promise<{access_token: string, refresh_token: string, data: {user_idx: number, id: string, name: string}}>}
     */
    login: async (userId, userPassword) => {
      const res = await api.post('/user/login', {id: userId, password: userPassword});
  
      return {
        access_token: res.data.access_token,
        refresh_token: res.data.refresh_token,
        data: res.data.data,
      };
    },
    /**
     * get new access token
     * @param {string} refreshToken
     * @return {Promise<{access_token: string}>}
     */
    refreshToken: async (refreshToken) => {
      const res = await api.post('/user/refreshToken', {refresh_token: refreshToken});
  
      return {
        access_token: res.data.access_token,
      }
    },
    /**
     * request otp qr code
     * @returns {Promise<{qrcode: string, secret: string}>}
     */
    getOtpQRCode: async () => {
      const res = await api.get('/user/otp/register');

      return {
        secret: res.data.secret,
        qrcode: res.data.qrcode
      }
    },
    /**
     * register otp
     * @param {string} secret
     * @param {string} verifyToken
     * @returns {Promise<boolean>}
     */
    setOtp: async (secret, verifyToken) => {
      const res = await api.post('/user/otp/register', {secret: secret, authToken: verifyToken});
      
      return res.result;
    }
  }
}