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

module.exports = asyncHandler