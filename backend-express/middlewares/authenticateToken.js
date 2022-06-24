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
    if (!token) throw new ResponseError('authorization fail', ResponseError.ERROR_CODE.ACCESS_TOKEN_MISSING, ResponseError.HTTP_UNAUTHORIZED);
  
    //decode token
    try {
      req.user = userHelper.decodeAccessToken(token);
    } catch (err) {
      throw new ResponseError('authorization fail', ResponseError.ERROR_CODE.TOKEN_ERROR, ResponseError.HTTP_UNAUTHORIZED);
    }
    
    next();
  } catch (err) {
    throw err;
  }
}