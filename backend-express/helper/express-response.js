/**
 * 에러 핸들링 미들웨어
 * @param err
 * @param req
 * @param res
 * @param next
 */
function error(err, req, res, next) {
  if (!(err instanceof ResponseError)) {
    err = new ResponseError(err, -1, 500);
  }

  res.status(err.httpCode)
    .json({result: false, errorCode: err.errorCode, error: err.message});
}

/**
 * 결과 json data 생성
 * @param {string} [resultMessage]
 * @param {*} [extraData]
 * @return {{result: boolean, resultMessage: (*|string)}}
 */
function createResult(resultMessage, extraData) {
  let jsonData = {
    result: true,
    resultMessage: resultMessage ? resultMessage : 'success',
  }

  if (extraData) jsonData.data = extraData;

  return jsonData;
}

/**
 * 에러 객체
 */
class ResponseError extends Error {
  constructor(errorMessage, errorCode, httpCode) {
    super(errorMessage);

    this.errorCode = errorCode ? errorCode : -1;
    this.httpCode = httpCode ? httpCode : 400;
  }
}

module.exports = {
  error,
  createResult,
  ResponseError
}