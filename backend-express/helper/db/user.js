const crypto = require('crypto');

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
  
  return {
    encryptPassword,
    verifyPassword,
  }
}