require('dotenv').config();
const crypto = require('crypto');
const jwt = require("jsonwebtoken");

/**
 * @param {Mysql} [db]
 */
module.exports = (db) => {
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
   * @param {number} userIdx
   * @param {string} id
   * @returns {string}
   */
  const createAccessToken = (userIdx, id) => {
    const tokenSecret = process.env.LOGIN_ACCESS_TOKEN_SECRET;
    console.log(tokenSecret);

    return jwt.sign(
      {userIdx: userIdx, id: id},
      tokenSecret,
      {expiresIn: '10m'}
    );
  }
  
  /**
   * create refresh token
   * @param {number} userIdx
   * @param {string} id
   * @returns {string}
   */
  const createRefreshToken = (userIdx, id) => {
    const tokenSecret = process.env.LOGIN_REFRESH_TOKEN_SECRET;
    console.log(tokenSecret);
  
    return jwt.sign(
      {userIdx: userIdx, id: id},
      tokenSecret,
      {expiresIn: '1h'}
    );
  }
  
  return {
    encryptPassword,
    verifyPassword,
    createAccessToken,
    createRefreshToken,
  }
}