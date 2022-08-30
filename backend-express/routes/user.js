//load express module
const express = require('express');
const {asyncHandler, ResponseError, createResult, getRemoteAddress, getUserAgent} = require('#helpers/expressHelper');
const authTokenMiddleWare = require('#middlewares/authenticateToken');
const {TokenExpiredError} = require("jsonwebtoken");

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
      //set vars: 로그인 로그 타입 목록
      const LOGIN_LOG_TYPES = userHelper.LOGIN_LOG_TYPES;
      
      //set vars: request
      let mode = req.body.mode || 'auth'; //auth, verifyOTP
      let userId = req.body.id;
      let password = req.body.password;
      let otpAuthToken = req.body.authToken;
      
      //set vars: ip, user agent
      let ip = getRemoteAddress(req);
      let userAgent = getUserAgent(req);
      
      if (!userId || !password) {
        await userHelper.insertLoginLog(null, LOGIN_LOG_TYPES.BAD_REQUEST, ip, userAgent);
        throw new ResponseError('필수 파라미터 누락');
      }
      
      //set vars: user data
      let rsUser = await db.queryRow(db.queryBuilder()
        .select('*')
        .from('users')
        .where('id', userId)
      );
      if (!rsUser) {
        await userHelper.insertLoginLog(null, LOGIN_LOG_TYPES.ATTEMPT, ip, userAgent);
        throw new ResponseError('존재하지 않는 아이디');
      }
      
      //check login fail count
      if (rsUser.login_fail_count >= 5) {
        throw new ResponseError('로그인 실패 횟수 초과');
      }
      
      //set vars: password salt
      let rsPasswordSalt = await db.queryRow(db.queryBuilder()
        .select('salt')
        .from('users_password_salt')
        .where('user_idx', rsUser.user_idx)
      );
      
      //check password
      if (!userHelper.verifyPassword(password, rsPasswordSalt.salt, rsUser.password)) {
        await userHelper.updateLoginFailCount(rsUser.user_idx, rsUser.login_fail_count + 1);
        
        //login fail count 횟수에 따라 exception 분리
        if (rsUser.login_fail_count >= 4) {
          await userHelper.insertLoginLog(rsUser.user_idx, LOGIN_LOG_TYPES.LOGIN_FAIL_EXCEED, ip, userAgent);
          throw new ResponseError('로그인 실패 횟수 초과');
        } else {
          await userHelper.insertLoginLog(rsUser.user_idx, LOGIN_LOG_TYPES.PASSWORD_MISMATCH, ip, userAgent);
          throw new ResponseError('비밀번호가 일치하지 않음');
        }
      }
      
      /*
       * mode에 따라 처리 분리
       */
      let responseData = {};
      switch (mode) {
        case 'auth':
          if (rsUser.use_otp == 'y') {
            responseData.needOTPVerify = true;
          } else {
            //set vars: access token, refresh token
            const payload = {user_idx: rsUser.user_idx};
            const accessToken = userHelper.createAccessToken(payload);
            const refreshToken = userHelper.createRefreshToken(payload);
  
            //insert login log
            await userHelper.insertLoginLog(rsUser.user_idx, LOGIN_LOG_TYPES.LOGIN, ip, userAgent);
            
            responseData.access_token = accessToken;
            responseData.refresh_token = refreshToken;
            responseData.data = {
              id: rsUser.id,
              name: rsUser.name,
              use_otp: rsUser.use_otp == 'y',
            };
          }
          break;
        case 'verifyOTP':
          if (!otpAuthToken) throw new ResponseError('OTP 코드를 입력해주세요.');
  
          let otpSecret = await db.queryScalar(db.queryBuilder()
            .select('secret')
            .from('users_otp')
            .where('user_idx', rsUser.user_idx)
          );
          if (!otpSecret) throw new ResponseError('OTP 등록 정보를 찾지 못했습니다.');
          
          const isOTPVerified = userHelper.verifyOTPToken(otpSecret, otpAuthToken);
          if (!isOTPVerified) throw new ResponseError('OTP 코드가 잘못되었습니다.\n다시 입력해주세요.');
  
          //set vars: access token, refresh token
          const payload = {user_idx: rsUser.user_idx};
          const accessToken = userHelper.createAccessToken(payload);
          const refreshToken = userHelper.createRefreshToken(payload);
  
          //insert login log
          await userHelper.insertLoginLog(rsUser.user_idx, LOGIN_LOG_TYPES.LOGIN, ip, userAgent);
  
          responseData.access_token = accessToken;
          responseData.refresh_token = refreshToken;
          responseData.data = {
            id: rsUser.id,
            name: rsUser.name,
            use_otp: rsUser.use_otp == 'y',
          };
          break;
        default:
          throw new ResponseError('잘못된 접근입니다.');
      }
      
      res.json(createResult(responseData));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * 회원 정보 반환
   */
  router.get('/info', authTokenMiddleWare, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
    if (!userIdx) throw new ResponseError('잘못된 접근입니다.');
    
    //set vars: user data
    let rsUser = await db.queryRow(db.queryBuilder()
      .select(['user_idx', 'id', 'name', 'use_otp'])
      .from('users')
      .where('user_idx', userIdx)
    );
    if (!rsUser) throw new ResponseError('회원이 존재하지 않습니다.');
  
    res.json(createResult({
      user_idx: rsUser.user_idx,
      id: rsUser.id,
      name: rsUser.name,
      use_otp: rsUser.use_otp == 'y'
    }));
  }));
  
  /**
   * 액세스 토큰 재발급
   */
  router.post('/refreshToken', asyncHandler(async (req, res) => {
    //set vars: request
    let refreshToken = req.body.refresh_token;
    if (!refreshToken) throw new ResponseError('필수 파라미터 누락');
    
    try {
      let decodedPayload = userHelper.decodeRefreshToken(refreshToken);
  
      let newAccessToken = userHelper.createAccessToken(decodedPayload);
      
      res.json(createResult( {access_token: newAccessToken}));
    } catch (err) {
      let errorCode = ResponseError.ERROR_CODE.TOKEN_ERROR;
      let errorMessage = 'access token issued fail';
      if (err instanceof  TokenExpiredError) {
        errorCode = ResponseError.ERROR_CODE.REFRESH_TOKEN_EXPIRED;
        errorMessage = 'refresh token expired';
      }
      throw new ResponseError(errorMessage, errorCode);
    }
  }));
  
  /**
   * OTP 등록용 QR코드 반환
   */
  router.get('/otp/register', authTokenMiddleWare, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
  
      //set vars: user data
      let rsUser = await db.queryRow(db.queryBuilder()
        .select('*')
        .from('users')
        .where('user_idx', userIdx)
      );
      if (!rsUser) throw new ResponseError('잘못된 접근입니다.');
      
      //check already register otp
      let hasOtp = await db.exists(db.queryBuilder()
        .from('users_otp')
        .where('user_idx', rsUser.user_idx)
      );
      if (rsUser.use_otp == 'y' && hasOtp) throw new ResponseError('이미 OTP를 등록하셨습니다.');
      
      //set vars: otp secret, auth url, qr code
      let otpSecret = await userHelper.createOTPSecret(rsUser.id);
      
      res.json(createResult({
        secret: otpSecret.secret,
        qrcode: otpSecret.qrCode,
      }));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * OTP 등록 처리
   */
  router.post('/otp/register', authTokenMiddleWare, asyncHandler(async (req, res) => {
    try {
      //set vars: request
      let secret = req.body.secret;
      let authToken = req.body.authToken;
      if (!secret || !authToken) throw new ResponseError('잘못된 접근입니다.');
      
      //set vars: user info
      const userIdx = req.user.user_idx;
      let rsUser = await db.queryRow(db.queryBuilder()
        .select('*')
        .from('users')
        .where('user_idx', userIdx)
      );
      if (!rsUser) throw new ResponseError('잘못된 접근입니다.');
      
      //check already register otp
      let hasOtp = await db.exists(db.queryBuilder()
        .from('users_otp')
        .where('user_idx', rsUser.user_idx)
      );
      if (rsUser.use_otp == 'y' && hasOtp) throw new ResponseError('이미 OTP를 등록하셨습니다.');
  
      //otp 코드 인증 확인
      let isVerified = userHelper.verifyOTPToken(secret, authToken);
      if (!isVerified) throw new ResponseError('OTP 코드가 잘못되었습니다.\n다시 입력해주세요.');
      
      //db에 OTP 정보 갱신
      const dbTrx = await db.transaction();
      try {
        //set vars: OTP 정보 유무
        let hasOtpData = await db.exists(db.queryBuilder()
          .from('users_otp')
          .where('user_idx', rsUser.user_idx)
        , dbTrx);
        
        //OTP 정보 유무에 따라 쿼리 분리
        let dbBuilder;
        if (hasOtpData) {
          dbBuilder = db.queryBuilder()
            .update({secret: secret})
            .from('users_otp')
            .where('user_idx', rsUser.user_idx);
        } else {
          dbBuilder = db.queryBuilder()
            .insert({user_idx: rsUser.user_idx, secret: secret})
            .into('users_otp');
        }
        await db.execute(dbBuilder, dbTrx);
        
        //users 테이블에 otp 사용여부 갱신
        await db.execute(db.queryBuilder()
          .update({use_otp: 'y'})
          .from('users')
          .where('user_idx', rsUser.user_idx)
        , dbTrx);
        
        await dbTrx.commit();
      } catch (err) {
        await dbTrx.rollback();
        throw new ResponseError('OTP 등록중 문제가 발생했습니다.');
      }
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * OTP 해제 처리
   */
  router.post('/otp/unregister', authTokenMiddleWare, asyncHandler(async (req, res) => {
    try {
      //set vars: request
      let authToken = req.body.authToken;
      if (!authToken) throw new ResponseError('잘못된 접근입니다.');
      
      //set vars: user idx
      const userIdx = req.user.user_idx;
      let rsUser = await db.queryRow(db.queryBuilder()
        .select(['u.user_idx', 'u.id', 'u.use_otp', 'uo.secret'])
        .from('users AS u')
        .join('users_otp AS uo', 'u.user_idx', 'uo.user_idx')
        .where('u.user_idx', userIdx)
      );
      if (!rsUser) throw new ResponseError('회원정보가 존재하지 않습니다.');
      if (rsUser.use_otp != 'y') throw new ResponseError('OTP를 사용하고 있지 않습니다.');
      
      //otp 코드 인증 확인
      let isVerified = userHelper.verifyOTPToken(rsUser.secret, authToken);
      if (!isVerified) throw new ResponseError('OTP 코드가 잘못되었습니다.\n다시 입력해주세요.');

      //db에 OTP 정보 갱신
      const dbTrx = await db.transaction();
      try {
        //OTP 정보 삭제
        await db.execute(db.queryBuilder()
          .delete()
          .from('users_otp')
          .where('user_idx', rsUser.user_idx)
        , dbTrx);

        //users 테이블에 otp 사용여부 갱신
        await db.execute(db.queryBuilder()
          .update({use_otp: 'n'})
          .from('users')
          .where('user_idx', rsUser.user_idx)
        , dbTrx);

        await dbTrx.commit();
      } catch (err) {
        await dbTrx.rollback();
        throw new ResponseError('OTP 해제중 문제가 발생했습니다.');
      }
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
};