/**
 * express async 핸들러
 * @param {function} fn
 * @return {(function(*, *, *): Promise<void>)|*}
 */
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  }
}

/**
 * 결과 json data 생성
 * @param {string} [resultMessage='success']
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
  asyncHandler,
  createResult,
  ResponseError,
};