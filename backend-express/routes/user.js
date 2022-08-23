//load express module
const express = require('express');
const {asyncHandler, ResponseError, createResult, getRemoteAddress, getUserAgent} = require('#helpers/expressHelper');
const authTokenMiddleWare = require('#middlewares/authenticateToken');
const {TokenExpiredError} = require("jsonwebtoken");
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

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
      const userId = req.body.id;
      const password = req.body.password;
      
      //set vars: ip, user agent
      const ip = getRemoteAddress(req);
      const userAgent = getUserAgent(req);
      
      if (!userId || !password) {
        await userHelper.insertLoginLog(null, LOGIN_LOG_TYPES.BAD_REQUEST, ip, userAgent);
        throw new ResponseError('필수 파라미터 누락');
      }
      
      //set vars: user data
      const rsUser = await db.queryRow(db.queryBuilder()
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
      const rsPasswordSalt = await db.queryRow(db.queryBuilder()
        .select('salt')
        .from('users_password_salt')
        .where('user_idx', rsUser.user_idx)
      );
      
      //check password
      if (!userHelper.verifyPassword(password, rsPasswordSalt.salt, rsUser.password)) {
        await userHelper.updateLoginFailCount(rsUser.user_idx, rsUser.login_fail_count + 1);
        if (rsUser.login_fail_count >= 4) {
          await userHelper.insertLoginLog(rsUser.user_idx, LOGIN_LOG_TYPES.LOGIN_FAIL_EXCEED, ip, userAgent);
          throw new ResponseError('로그인 실패 횟수 초과');
        } else {
          await userHelper.insertLoginLog(rsUser.user_idx, LOGIN_LOG_TYPES.PASSWORD_MISMATCH, ip, userAgent);
          throw new ResponseError('비밀번호가 일치하지 않음');
        }
      }
      
      //set vars: access token, refresh token
      const payload = {user_idx: rsUser.user_idx, id: rsUser.id};
      const accessToken = userHelper.createAccessToken(payload);
      const refreshToken = userHelper.createRefreshToken(payload);
      
      //insert login log
      await userHelper.insertLoginLog(rsUser.user_idx, LOGIN_LOG_TYPES.LOGIN, ip, userAgent);
      
      //set vars: response data
      const responseData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        data: {
          user_idx: rsUser.user_idx,
          id: rsUser.id,
          name: rsUser.name,
          use_otp: rsUser.use_otp == 'y',
        }
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
      
      res.json(createResult('success', {access_token: newAccessToken}));
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
      //set vars: request
      const userIdx = req.user.user_idx;
  
      //set vars: user data
      const rsUser = await db.queryRow(db.queryBuilder()
        .select('*')
        .from('users')
        .where('user_idx', userIdx)
      );
      if (!rsUser) {
        throw new ResponseError('잘못된 접근입니다.');
      }
      
      //check already register otp
      const hasOtp = await db.exists(db.queryBuilder()
        .from('users_otp')
        .where('user_idx', userIdx)
      );
      if (rsUser.use_otp == 'y' && hasOtp) {
        throw new ResponseError('이미 OTP를 등록하셨습니다.');
      }
      
      //set vars: otp secret, auth url, qr code
      const otpSecret = speakeasy.generateSecret({
        length: 32,
        name: 'sand box',
      });
      const authURL = speakeasy.otpauthURL({
        secret: otpSecret.base32,
        issuer: 'sand box',
        label: rsUser.id,
        period: 30,
        digits: 6,
        encoding: 'base32',
      });
      const generateQRCode = await QRCode.toDataURL(authURL);
      
      res.json(createResult('success', {
        secret: otpSecret.base32,
        qrcode: generateQRCode,
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
      //set vars: user info
      const userIdx = req.user.user_idx;
      
      //set vars: request
      const secret = req.body.secret;
      const authToken = req.body.authToken;
      if (!secret || !authToken) {
        throw new ResponseError('잘못된 접근입니다.');
      }
      
      //otp 코드 인증 확인
      const isVerified = speakeasy.totp.verify({
        secret: secret,
        token: authToken,
        digits: 6,
        encoding: 'base32',
      });
      
      if (!isVerified) {
        throw new ResponseError('OTP 코드가 잘못되었습니다.\n다시 입력해주세요.');
      }
      
      //db에 OTP 정보 갱신
      const dbTrx = await db.transaction();
      try {
        //set vars: OTP 정보 유무
        const hasOtpData = await db.exists(db.queryBuilder()
          .from('users_otp')
          .where('user_idx', userIdx)
        , dbTrx);
        
        //OTP 정보 유무에 따라 쿼리 분리
        let dbBuilder;
        if (hasOtpData) {
          dbBuilder = db.queryBuilder()
            .update({secret: secret})
            .from('users_otp');
        } else {
          dbBuilder = db.queryBuilder()
            .insert({user_idx: userIdx, secret: secret})
            .into('users_otp');
        }
        await db.execute(dbBuilder, dbTrx);
        
        //users 테이블에 otp 사용여부 갱신
        await db.execute(db.queryBuilder()
          .update({use_otp: 'y'})
          .from('users')
          .where({user_idx: userIdx})
        , dbTrx);
        
        await dbTrx.commit();
      } catch (err) {
        await dbTrx.rollback();
        throw new ResponseError('OTP 등록중 문제가 발생했습니다.');
      }
      
      res.json(createResult('success'));
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
};