const {ResponseError} = require("#helpers/expressHelper");

/**
 * 에러 핸들링 미들웨어
 * @param err
 * @param req
 * @param res
 * @param next
 */
module.exports = (err, req, res, next) => {
  if (!(err instanceof ResponseError)) {
    err = new ResponseError(err, -1, 500);
  }
  
  res.status(err.httpCode)
    .json({result: false, errorCode: err.errorCode, error: err.message});
}