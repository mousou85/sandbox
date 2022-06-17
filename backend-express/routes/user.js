//load express module
const express = require('express');
const {asyncHandler, ResponseError, createResult} = require('#helpers/expressHelper');
const authTokenMiddleware = require('#middlewares/authenticateToken');

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
      const payload = {user_idx: rsUser.user_idx, id: rsUser.id};
      const accessToken = userHelper.createAccessToken(payload);
      const refreshToken = userHelper.createRefreshToken(payload);
      
      //set vars: response data
      const responseData = {
        user_idx: rsUser.user_idx,
        id: rsUser.id,
        name: rsUser.name,
        access_token: accessToken,
        refresh_token: refreshToken,
      }
      
      res.json(createResult('success', responseData));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * 액세스 토큰 재발급
   */
  router.post('/refreshToken', asyncHandler(async (req, res) => {
    //set vars: request
    const refreshToken = req.body.refresh_token;
    if (!refreshToken) throw new ResponseError('필수 파라미터 누락');
    
    try {
      const decodedPayload = userHelper.decodeRefreshToken(refreshToken);
      
      const newAccessToken = userHelper.createAccessToken(decodedPayload);
      
      res.json(createResult('success', {accessToken: newAccessToken}));
    } catch (err) {
      throw new ResponseError('auth fail', -1, 403);
    }
  }));
  
  return router;
};