//load express module
const express = require('express');
const {asyncHandler, createResult, ResponseError} = require('#helpers/expressHelper');
const authTokenMiddleware = require('#middlewares/authenticateToken');

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  //set vars: router
  const router = express.Router();
  
  /**
   * unit set 리스트
   */
  router.get('/:item_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    let query;
    
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let itemIdx = req.params.item_idx;
      
      query = db.queryBuilder()
        .select(['ius.unit_set_idx', 'ius.unit_idx', 'iu.unit', 'iu.unit_type'])
        .from('invest_unit_set AS ius')
        .join('invest_unit AS iu', 'ius.unit_idx', 'iu.unit_idx')
        .where('ius.item_idx', itemIdx)
        .andWhere('iu.user_idx', userIdx)
        .orderBy('ius.unit_set_idx', 'asc');
      
      //set vars: list
      let rsList = await db.queryAll(query);
      
      res.json(createResult('success', {'list': rsList}));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * unit set 추가
   */
  router.post('/', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let itemIdx = req.body.item_idx;
      let unitIdx = req.body.unit_idx;
      if (!itemIdx || !unitIdx) throw new ResponseError('item_idx 또는 unit_idx는 필수입력임');
      
      //check data
      let hasItemData = await db.exists(db.queryBuilder()
        .from('invest_item AS ii')
        .join('invest_company AS ic', 'ii.company_idx', 'ic.company_idx')
        .where('ii.item_idx', itemIdx)
        .andWhere('ic.user_idx', userIdx)
      );
      if (!hasItemData) throw new ResponseError('item이 존재하지 않음');
  
      let hasUnitData = await db.exists(db.queryBuilder()
        .from('invest_unit')
        .where('unit_idx', unitIdx)
        .andWhere('user_idx', userIdx)
      );
      if (!hasUnitData) throw new ResponseError('unit이 존재하지 않음');
      
      //중복 체크
      let isDuplicate = await db.exists(db.queryBuilder()
        .from('invest_unit_set')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
      );
      if (isDuplicate) throw new ResponseError('이미 등록된 unit set임');
      
      //insert data
      let rsInsert = await db.execute(db.queryBuilder()
        .insert({'item_idx': itemIdx, 'unit_idx': unitIdx})
        .into('invest_unit_set')
      );
      if (!rsInsert) throw new ResponseError('unit set 추가 실패함');
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * unit set 삭제
   */
  router.delete('/:unit_set_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let unitSetIdx = req.params.unit_set_idx;
      
      //check data
      let hasData = await db.exists(db.queryBuilder()
        .from('invest_unit_set AS ius')
        .join('invest_unit AS iu', 'ius.unit_idx', 'iu.unit_idx')
        .where('ius.unit_set_idx', unitSetIdx)
        .andWhere('iu.user_idx', userIdx)
      );
      if (!hasData) throw new ResponseError('unit set가 존재하지 않음');
      
      //delete data
      let rsDelete = await db.execute(db.queryBuilder()
        .delete()
        .from('invest_unit_set')
        .where('unit_set_idx', unitSetIdx)
      );
      if (!rsDelete) throw new ResponseError('unit set 삭제 실패함');
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
};