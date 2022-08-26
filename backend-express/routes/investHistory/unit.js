//load express module
const express = require('express');
const {asyncHandler, ResponseError, createResult} = require('#helpers/expressHelper');
const authTokenMiddleware = require('#middlewares/authenticateToken');

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  //set vars: router
  const router = express.Router();
  
  /**
   * unit 목록
   */
  router.get('/', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: 리스트
      let rsUnitList = await db.queryAll(db.queryBuilder()
        .select()
        .from('invest_unit')
        .where('user_idx', userIdx)
        .orderBy('unit_idx', 'asc')
      );
      
      res.json(createResult('success', {list: rsUnitList}));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * unit 데이터
   */
  router.get('/:unit_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let unitIdx = req.params.unit_idx;
      
      //set vars: 데이터
      let rsUnit = await db.queryRow(db.queryBuilder()
        .select()
        .from('invest_unit')
        .where('unit_idx', unitIdx)
        .andWhere('user_idx', userIdx)
      );
      if (!rsUnit) throw new ResponseError('데이터가 존재하지 않음');
      
      res.json(createResult('success', rsUnit));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * unit 추가
   */
  router.post('/', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let unit = req.body.unit;
      let unitType = req.body.unit_type;
      if (!unit) throw new ResponseError('unit값은 필수입력임');
      if (!unitType) throw new ResponseError('unit_type값은 필수입력임');
      unitType = unitType.trim();
      
      //중복 체크
      let hasData = await db.exists(db.queryBuilder()
        .from('invest_unit')
        .where('user_idx', userIdx)
        .andWhere('unit', unit)
      );
      if (hasData) throw new ResponseError('이미 등록된 unit입니다.');
      
      //insert data
      let rsInsert = await db.execute(db.queryBuilder()
        .insert({user_idx: userIdx, unit: unit, unit_type: unitType})
        .into('invest_unit')
      );
      if (!rsInsert) throw new ResponseError('unit 추가 실패함');
      
      res.json(createResult());
    } catch (err) {
      console.log(err);
      throw err;
    }
  }));
  
  /**
   * unit 수정
   */
  router.put('/:unit_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let unitIdx = req.params.unit_idx;
      let unit = req.body.unit;
      let unitType = req.body.unit_type;
      if (!unit && !unitType) throw new ResponseError('unit 또는 unit_type값 중 하나는 필수임');
      unitType = unitType.trim();
      
      //check data
      let hasData = await db.exists(db.queryBuilder()
        .from('invest_unit')
        .where('unit_idx', unitIdx)
        .andWhere('user_idx', userIdx)
      );
      if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
      
      //update data
      let params = {};
      if (unit) params.unit = unit;
      if (unitType) params.unit_type = unitType;
  
      let rsUpdate = await db.execute(db.queryBuilder()
        .update(params)
        .from('invest_unit')
        .where('unit_idx', unitIdx)
      );
      if (!rsUpdate) throw new ResponseError('unit 수정 실패함');
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * unit 삭제
   */
  router.delete('/:unit_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let unitIdx = req.params.unit_idx;
      
      //check data
      let hasData = await db.exists(db.queryBuilder()
        .from('invest_unit')
        .where('unit_idx', unitIdx)
        .andWhere('user_idx', userIdx)
      );
      if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
      
      //delete data
      let rsDelete = await db.execute(db.queryBuilder()
        .delete()
        .from('invest_unit')
        .where('unit_idx', unitIdx)
      );
      if (!rsDelete) throw new ResponseError('unit 삭제 실패함');
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
};