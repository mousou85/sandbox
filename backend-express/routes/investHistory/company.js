//load express module
const express = require('express');
const {asyncHandler, createResult, ResponseError} = require('#helpers/expressHelper');
const authTokenMiddleWare = require('#middlewares/authenticateToken');

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  const router = express.Router();
  
  /**
   * company 리스트
   */
  router.get('/', authTokenMiddleWare, asyncHandler(async (req, res) => {
    try {
      //set vars: 리스트
      let list = await db.queryAll(db.queryBuilder()
        .select()
        .from('invest_company')
        .orderBy('company_idx', 'asc')
      );
      
      res.json(createResult('success', {'list': list}));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * company 데이터
   */
  router.get('/:company_idx', authTokenMiddleWare, asyncHandler(async (req, res) => {
    try {
      //set vars: request
      let companyIdx = req.params.company_idx;
      
      //set vars: 데이터
      let company = await db.queryRow(db.queryBuilder()
        .select()
        .from('invest_company')
        .where('company_idx', companyIdx)
      );
      if (!company) throw new ResponseError('데이터가 존재하지 않음');
      
      res.json(createResult('success', company));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * company 추가
   */
  router.post('/', authTokenMiddleWare, asyncHandler(async (req, res) => {
    try {
      //set vars: request
      let companyName = req.body.company_name;
      if (!companyName) throw new ResponseError('company_name값은 필수입력임');
      if (companyName.length > 20) throw new ResponseError('company_name은 20자 이하로 입력');
      companyName = companyName.trim();
      
      //중복 체크
      let hasData = await db.exists(db.queryBuilder()
        .from('invest_company')
        .where('company_name', companyName)
      );
      if (hasData) throw new ResponseError('이미 등록된 company임');
      
      //insert data
      let rsInsert = await db.execute(db.queryBuilder()
        .insert({'company_name': companyName})
        .into('invest_company')
      );
      if (!rsInsert) throw new ResponseError('company 추가 실패함');
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * company 수정
   */
  router.put('/:company_idx', authTokenMiddleWare, asyncHandler(async (req, res) => {
    try {
      //set vars: request
      let companyIdx = req.params.company_idx;
      let companyName = req.body.company_name;
      if (!companyName) throw new ResponseError('company_namee값은 필수입력');
      if (companyName.length > 20) throw new ResponseError('company_name은 20자 이하로 입력');
      companyName = companyName.trim();
      
      //check data
      let hasData = await db.exists(db.queryBuilder()
        .from('invest_company')
        .where('company_idx', companyIdx)
      );
      if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
      
      //update data
      let rsUpdate = await db.execute(db.queryBuilder()
        .update({'company_name': companyName})
        .from('invest_company')
        .where('company_idx', companyIdx)
      );
      if (!rsUpdate) throw new ResponseError('company 수정 실패함');
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * company 삭제
   */
  router.delete('/:company_idx', authTokenMiddleWare, asyncHandler(async (req, res) => {
    try {
      //set vars: request
      let companyIdx = req.params.company_idx;
      
      //check data
      let hasData = await db.exists(db.queryBuilder()
        .from('invest_company')
        .where('company_idx', companyIdx)
      );
      if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
      
      let hasItem = await db.exists(db.queryBuilder()
        .from('invest_item')
        .where('company_idx', companyIdx)
      );
      if (hasItem) throw new ResponseError('item이 존재하는 company는 삭제 할 수 없음');
      
      //delete data
      let rsDelete = await db.execute(db.queryBuilder()
        .delete()
        .from('invest_company')
        .where('company_idx', companyIdx)
      );
      if (!rsDelete) throw new ResponseError('company 삭제 실패함');
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
};