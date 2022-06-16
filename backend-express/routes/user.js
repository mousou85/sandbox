const express = require('express');
const asyncHandler = require('#helper/express-async-wrap');
const {ResponseError, createResult} = require('#helper/express-response');

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  //load helper module
  const userHelper = require('#helper/db/user')(db);
  
  //set vars: express router
  const router = express.Router();
  
  
  /**
   * 로그인 처리
   */
  router.post('/login', asyncHandler(async (req, res) => {
    try {
      const userId = req.body.id;
      const password = req.body.password;
      if (!userId || !password) throw new ResponseError('필수 파라미터 누락', -100);
      
      const rsUser = await db.queryRow(db.queryBuilder()
        .select('*')
        .from('users')
        .where('id', userId)
      );
      if (!rsUser) throw new ResponseError('존재하지 않는 아이디', -201);
      
      if (!userHelper.verifyPassword(password, rsUser.password_salt, rsUser.password)) {
        throw new ResponseError('비밀번호가 일치하지 않음', -202);
      }
      
      res.json(createResult('success', null));
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
};