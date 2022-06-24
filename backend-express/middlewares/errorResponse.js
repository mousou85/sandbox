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
    err = new ResponseError(err, ResponseError.ERROR_CODE.COMMON_ERROR, ResponseError.HTTP_BAD_REQUEST);
  }
  
  res.status(err.httpCode)
    .json({isError: true, errorCode: err.errorCode, errorMessage: err.errorMessage});
}