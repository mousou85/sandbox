import {apiBase} from '@/apis/base';

export const useUserApi = () => {
  const api = apiBase();
  
  return {
    /**
     * do login
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
     * }|{needOTPVerify: boolean}>}
     */
    login: async (userId, userPassword) => {
      const res = await api.post('/user/login', {mode: 'auth', id: userId, password: userPassword});
      if (res.data.hasOwnProperty('needOTPVerify')) {
        return {needOTPVerify: res.data.needOTPVerify};
      } else {
        return {
          access_token: res.data.access_token,
          refresh_token: res.data.refresh_token,
          data: res.data.data,
        };
      }
    },
    /**
     * do login otp verify
     * @param {string} userId
     * @param {string} userPassword
     * @param {string|number} authToken
     * @returns {Promise<{
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
    loginVerifyOTP: async (userId, userPassword, authToken) => {
      const res = await api.post('/user/login', {
        mode: 'verifyOTP',
        id: userId,
        password: userPassword,
        authToken: authToken
      });
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
     *
     * @param {{
     *   [name]: string,
     *   [current_password]: string,
     *   [new_password]: string
     * }} updateData
     * @returns {Promise<void>}
     */
    editUserInfo: async (updateData) => {
      await api.post('/user/info', updateData);
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