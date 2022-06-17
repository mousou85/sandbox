require('dotenv').config();
const crypto = require('crypto');
const jwt = require("jsonwebtoken");

/**
 * @param {Mysql} [db]
 */
module.exports = (db) => {
  const ACCESS_TOKEN_SECRET = process.env.LOGIN_ACCESS_TOKEN_SECRET;
  const REFRESH_TOKEN_SECRET = process.env.LOGIN_REFRESH_TOKEN_SECRET;
  
  /**
   * create hashed password
   * @param {string} password
   * @returns {{salt: string, hashedPassword: string}}
   */
  const encryptPassword = (password) => {
    const salt = crypto.randomBytes(64).toString('base64');
    const hash = crypto.pbkdf2Sync(password, salt, 2280, 128, 'sha512');
    const hashedPassword = hash.toString('base64');
    return {
      hashedPassword,
      salt
    }
  }
  
  /**
   * compare password
   * @param {string} password
   * @param {string} salt
   * @param {string} userPassword
   * @returns {boolean}
   */
  const verifyPassword = (password, salt, userPassword) => {
    const hash = crypto.pbkdf2Sync(password, salt, 2280, 128, 'sha512');
    const hashedPassword = hash.toString('base64');
    return hashedPassword === userPassword;
  }
  
  /**
   * create access token
   * @param {Object} payload
   * @returns {string}
   */
  const createAccessToken = (payload) => {
    if (payload.hasOwnProperty('iat')) delete payload.iat;
    if (payload.hasOwnProperty('exp')) delete payload.exp;

    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {expiresIn: '10m'});
  }
  
  /**
   * create refresh token
   * @param {Object} payload
   * @returns {string}
   */
  const createRefreshToken = (payload) => {
    if (payload.hasOwnProperty('iat')) delete payload.iat;
    if (payload.hasOwnProperty('exp')) delete payload.exp;
    
    return jwt.sign(payload, REFRESH_TOKEN_SECRET,{expiresIn: '1h'});
  }
  
  /**
   * decode access token
   * @param {string} token
   * @returns {Object}
   */
  const decodeAccessToken = (token) => {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
      throw err;
    }
  }
  
  /**
   * decode refresh token
   * @param {string} token
   * @returns {Object}
   */
  const decodeRefreshToken = (token) => {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (err) {
      throw err;
    }
  }
  
  return {
    encryptPassword,
    verifyPassword,
    createAccessToken,
    createRefreshToken,
    decodeAccessToken,
    decodeRefreshToken,
  }
}