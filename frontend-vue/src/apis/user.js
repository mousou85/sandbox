import {apiBase} from '@/apis/base';

export const useUserApi = () => {
  const api = apiBase();
  
  return {
    /**
     * get login
     * @param {string} userId
     * @param {string} userPassword
     * @return {Promise<{
     *  access_token: string,
     *  refresh_token: string,
     *  data: {
     *    user_idx: number,
     *    id: string,
     *    name: string,
     *    use_otp: boolean
     *  }
     * }>}
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
     * get user info
     * @returns {Promise<{use_otp: boolean, name: string, user_idx: number, id: string}>}
     */
    getUserInfo: async () => {
      const res = await api.get('/user/info');
      
      return {
        user_idx: res.data.user_idx,
        id: res.data.id,
        name: res.data.name,
        use_otp: res.data.use_otp,
      };
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
    registerOTP: async (secret, verifyToken) => {
      const res = await api.post('/user/otp/register', {secret: secret, authToken: verifyToken});
      
      return res.result;
    },
    /**
     * unregister otp
     * @param {string} verifyToken
     * @returns {Promise<boolean>}
     */
    unregisterOTP: async (verifyToken) => {
      const res = await api.post('/user/otp/unregister', {authToken: verifyToken});
      
      return res.result;
    }
  }
}