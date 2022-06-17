//load express module
const express = require('express');
const {asyncHandler, ResponseError, createResult} = require('#helpers/expressHelper');

//load jwt module
const jwt = require('jsonwebtoken');

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  //load user helper
  const userHelper = require('#helpers/userHelper')(db);
  
  //set vars: express router
  const router = express.Router();
  
  /**
   * 로그인 처리
   */
  router.post('/login', asyncHandler(async (req, res) => {
    try {
      //set vars: request
      const userId = req.body.id;
      const password = req.body.password;
      if (!userId || !password) throw new ResponseError('필수 파라미터 누락', -100);
      
      //set vars: user data
      const rsUser = await db.queryRow(db.queryBuilder()
        .select('*')
        .from('users')
        .where('id', userId)
      );
      if (!rsUser) throw new ResponseError('존재하지 않는 아이디', -201);
      
      if (!userHelper.verifyPassword(password, rsUser.password_salt, rsUser.password)) {
        throw new ResponseError('비밀번호가 일치하지 않음', -202);
      }
      
      //set vars: access token, refresh token
      const accessToken = userHelper.createAccessToken(rsUser.user_idx, rsUser.id);
      const refreshToken = userHelper.createRefreshToken(rsUser.user_idx, rsUser.id);
      
      res.json(createResult('success', {accessToken, refreshToken}));
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
};