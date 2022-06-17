const jwt = require('jsonwebtoken');
const {ResponseError} = require("#helpers/expressHelper");

/**
 * user token auth check express middlewares
 * @param req
 * @param res
 * @param next
 */
module.exports = (req, res, next) => {
  const loginSecretKey = process.env.LOGIN_SECRET_KEY;
  
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) throw "auth fail";
  
    const decoded = jwt.verify(token, loginSecretKey);
    req.login = decoded;
    
    next();
  } catch (err) {
    throw new ResponseError(err, -1, 401);
  }
}