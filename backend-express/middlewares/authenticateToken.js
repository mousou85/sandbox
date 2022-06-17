//set environment
require('dotenv').config();
//load express module
const {ResponseError} = require("#helpers/expressHelper");
//load user helper
const userHelper = require('#helpers/userHelper')();

/**
 * user token auth check express middlewares
 * @param req
 * @param res
 * @param next
 */
module.exports = (req, res, next) => {
  try {
    //set vars: token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) throw new ResponseError('auth fail', -1, 401);
  
    //decode token
    try {
      req.user = userHelper.decodeAccessToken(token);
    } catch (err) {
      throw new ResponseError('auth fail', -1, 403);
    }
    
    next();
  } catch (err) {
    throw err;
  }
}