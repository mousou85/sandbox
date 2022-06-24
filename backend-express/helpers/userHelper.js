require('dotenv').config();
const crypto = require('crypto');
const jwt = require("jsonwebtoken");

/**
 * @param {Mysql} [db]
 */
module.exports = (db) => {
  const ACCESS_TOKEN_SECRET = process.env.LOGIN_ACCESS_TOKEN_SECRET;
  const REFRESH_TOKEN_SECRET = process.env.LOGIN_REFRESH_TOKEN_SECRET;
  
  return {
    /**
     * create hashed password
     * @param {string} password
     * @returns {{salt: string, hashedPassword: string}}
     */
    encryptPassword: (password) => {
      const salt = crypto.randomBytes(64).toString('base64');
      const hash = crypto.pbkdf2Sync(password, salt, 2280, 128, 'sha512');
      const hashedPassword = hash.toString('base64');
      return {
        hashedPassword,
        salt
      }
    },
    /**
     * compare password
     * @param {string} password
     * @param {string} salt
     * @param {string} userPassword
     * @returns {boolean}
     */
    verifyPassword: (password, salt, userPassword) => {
      const hash = crypto.pbkdf2Sync(password, salt, 2280, 128, 'sha512');
      const hashedPassword = hash.toString('base64');
      return hashedPassword === userPassword;
    },
    /**
     * create access token
     * @param {Object} payload
     * @returns {string}
     */
    createAccessToken: (payload) => {
      if (payload.hasOwnProperty('iat')) delete payload.iat;
      if (payload.hasOwnProperty('exp')) delete payload.exp;
    
      return jwt.sign(payload, ACCESS_TOKEN_SECRET, {expiresIn: '10m'});
    },
    /**
     * create refresh token
     * @param {Object} payload
     * @returns {string}
     */
    createRefreshToken: (payload) => {
      if (payload.hasOwnProperty('iat')) delete payload.iat;
      if (payload.hasOwnProperty('exp')) delete payload.exp;
    
      return jwt.sign(payload, REFRESH_TOKEN_SECRET,{expiresIn: '1d'});
    },
    /**
     * decode access token
     * @param {string} token
     * @returns {Object}
     */
    decodeAccessToken: (token) => {
      try {
        return jwt.verify(token, ACCESS_TOKEN_SECRET);
      } catch (err) {
        throw err;
      }
    },
    /**
     * decode refresh token
     * @param {string} token
     * @returns {Object}
     */
    decodeRefreshToken: (token) => {
      try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
      } catch (err) {
        throw err;
      }
    },
    /**
     * insert user login log
     * @param {number} userIdx
     * @param {string} ip
     * @param {string} userAgent
     * @returns {Promise<void>}
     */
    insertLoginLog: async (userIdx, ip, userAgent) => {
      await db.execute(db.queryBuilder()
        .insert({
          user_idx: userIdx,
          ip: db.raw('INET_ATON(:ip)', {ip: ip}),
          user_agent: userAgent
        })
        .into('users_login_log')
      );
    }
  }
}