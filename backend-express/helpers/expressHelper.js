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
 * @extends Error
 */
class ResponseError extends Error {
  static HTTP_BAD_REQUEST = 400;
  static HTTP_UNAUTHORIZED = 401;
  static HTTP_FORBIDDEN = 403;
  
  static ERROR_CODE = {
    COMMON_ERROR: -1,
    NEED_LOGIN: -10,
    ACCESS_TOKEN_MISSING: -20,
    TOKEN_ERROR: -21,
    REFRESH_TOKEN_EXPIRED: -22,
  }
  
  /**
   * @constructor
   * @param {string} errorMessage
   * @param {number} [errorCode=-1]
   * @param {number} [httpCode=400]
   */
  constructor(errorMessage, errorCode, httpCode) {
    super(errorMessage);
  
    this.errorMessage = errorMessage;
    this.errorCode = errorCode ? errorCode : ResponseError.ERROR_CODE.COMMON_ERROR;
    this.httpCode = httpCode ? httpCode : ResponseError.HTTP_BAD_REQUEST;
  }
}

module.exports = {
  asyncHandler,
  createResult,
  ResponseError,
};