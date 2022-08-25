//load express module
const express = require('express');
const {asyncHandler, ResponseError, createResult} = require('#helpers/expressHelper');
const authTokenMiddleware = require('#middlewares/authenticateToken');

//load etc module
const dayjs = require('dayjs');

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  //load invest history helpers
  const investHistoryHelper = require('#helpers/investHistoryHelper')(db);
  
  //set vars: router
  const router = express.Router();
  
  //set vars: invest history const
  const historyTypeList = investHistoryHelper.historyTypeList;
  const inoutTypeList = investHistoryHelper.inoutTypeList;
  const revenueTypeList = investHistoryHelper.revenueTypeList;
  
  /**
   * history 리스트
   */
  router.get('/:item_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let itemIdx = req.params.item_idx;
      let historyType = req.query.history_type ?? '';
      let unit = req.query.unit ? req.query.unit.toUpperCase() : '';
      let date = req.query.date ?? '';
      if (!itemIdx) throw new ResponseError('잘못된 접근');
      
      //set vars: sql 쿼리
      let query = db.queryBuilder()
        .select([
          'ih.history_idx',
          'ih.unit_idx',
          'ih.history_date',
          'ih.history_type',
          'ih.inout_type',
          'ih.revenue_type',
          'ih.val',
          'ih.memo',
          'iu.unit',
          'iu.unit_type'
        ])
        .from('invest_history AS ih')
        .join('invest_unit AS iu', 'ih.unit_idx', 'iu.unit_idx')
        .join('invest_item AS ii', 'ih.item_idx', 'ii.item_idx')
        .join('invest_company AS ic', 'ii.company_idx', 'ic.company_idx')
        .where('ih.item_idx', itemIdx)
        .andWhere('ic.user_idx', userIdx)
        .orderBy([
          {column: 'h.history_date', order: 'desc'},
          {column: 'h.history_idx', order: 'desc'}
        ]);
      
      if (historyType) query.where('ih.history_type', historyType);
      if (unit) query.where('iu.unit', unit);
      if (date) {
        query.whereBetween('ih.history_date', [
            dayjs(date).format('YYYY-MM-01'),
            dayjs(date).endOf('month').format('YYYY-MM-DD')
          ]);
      }
      
      //set vars: history 리스트
      let rsHistoryList = await db.queryAll(query);
      for (const key in rsHistoryList) {
        let _historyType = rsHistoryList[key].history_type;
        let _inoutType = rsHistoryList[key].inout_type;
        const _revenueType = rsHistoryList[key].revenue_type;
  
        rsHistoryList[key].history_type_text = historyTypeList[_historyType];
        rsHistoryList[key].inout_type_text = _inoutType ? inoutTypeList[_inoutType] : null;
        rsHistoryList[key].revenue_type_text = _revenueType ? revenueTypeList[_revenueType] : null;
      }
      
      res.json(createResult('success', {'list': rsHistoryList}));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * history 등록
   */
  router.post('/:item_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let itemIdx = req.params.item_idx;
      let unitIdx = req.body.unit_idx;
      let historyDate = req.body.history_date;
      let historyType = req.body.history_type;
      let inoutType = null;
      let revenueType = null;
      let val = req.body.val;
      let memo = req.body.memo;
      
      if (!itemIdx) throw new ResponseError('item_idx는 필수입력임');
      if (!unitIdx) throw new ResponseError('unit_idx는 필수입력임');
      if (!historyDate) throw new ResponseError('history_date는 필수입력임');
      if (!historyType) throw new ResponseError('history_type은 필수입력임');
      if (!val) throw new ResponseError('val은 필수입력임');
      if (historyType == 'inout') {
        inoutType = req.body.inout_type;
        if (!inoutType) throw new ResponseError('inout_type은 필수입력임');
      } else {
        revenueType = req.body.revenue_type;
        if (!revenueType) throw new ResponseError('revenue_type은 필수입력임');
      }
      
      //check data
      let hasItem = await db.exists(db.queryBuilder()
        .from('invest_item AS ii')
        .join('invest_company AS ic', 'ii.company_idx', 'ic.company_idx')
        .where('ii.item_idx', itemIdx)
        .andWhere('ic.user_idx', userIdx)
      );
      if (!hasItem) throw new ResponseError('item이 존재하지 않음');
      let hasUnit = await db.exists(db.queryBuilder()
        .from('invest_unit_set')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
      );
      if (!hasUnit) throw new ResponseError('unit이 존재하지 않음');
      
      //insert data
      const trx = await db.transaction();
      try {
        //history 등록
        let insertData = {
          item_idx: itemIdx,
          unit_idx: unitIdx,
          history_date: historyDate,
          history_type: historyType,
          inout_type: inoutType,
          revenue_type: revenueType,
          val: val,
          memo: memo
        };
        
        let rsInsert = await db.execute(db.queryBuilder()
          .insert(insertData)
          .into('invest_history')
        , trx);
        if (!rsInsert) throw new ResponseError('history 추가 실패함');
        
        //요약 데이터 생성/갱신
        await investHistoryHelper.upsertSummary(itemIdx, historyDate, unitIdx, trx);
        
        await trx.commit();
      } catch (err) {
        await trx.rollback();
        throw err;
      }
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * history 수정
   */
  router.put('/:history_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let historyIdx = req.params.history_idx;
      let historyDate = req.body.history_date;
      let val = req.body.val;
      let memo = req.body.memo;
      if (!historyIdx) throw new ResponseError('history_idx는 필수임');
      if (!historyDate) throw new ResponseError('history_date는 필수임');
      if (!val) throw new ResponseError('val은 필수임');
      
      //set vars: 데이터
      let rsHistory = await db.queryRow(db.queryBuilder()
        .select(['ih.item_idx', 'ih.unit_idx'])
        .from('invest_history AS ih')
        .join('invest_item AS ii', 'ih.item_idx', 'ii.item_idx')
        .join('invest_company AS ic', 'ii.company_idx', 'ic.company_idx')
        .where('ih.history_idx', historyIdx)
        .andWhere('ic.user_idx', userIdx)
      );
      if (!rsHistory) throw new ResponseError('데이터자 존재하지 않음');
      
      const trx = await db.transaction();
      try {
        await db.execute(db.queryBuilder()
          .update({
            'history_date': historyDate,
            'val': val,
            'memo': memo
          })
          .from('invest_history')
          .where('history_idx', historyIdx)
        , trx);
        
        //요약데이터 update
        await investHistoryHelper.upsertSummary(rsHistory.item_idx, historyDate, rsHistory.unit_idx, trx);
        
        await trx.commit();
      } catch (err) {
        await trx.rollback();
        throw err;
      }
      
      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * history 삭제
   */
  router.delete('/:history_idx', authTokenMiddleware, asyncHandler(async (req, res) => {
    try {
      //set vars: user idx
      const userIdx = req.user.user_idx;
      
      //set vars: request
      let historyIdx=  req.params.history_idx;
      if (!historyIdx) throw new ResponseError('history_idx는 필수임');
  
      //set vars: 데이터
      let rsHistory = await db.queryRow(db.queryBuilder()
        .select(['ih.item_idx', 'ih.history_date', 'ih.unit_idx'])
        .from('invest_history AS ih')
        .join('invest_item AS ii', 'ih.item_idx', 'ii.item_idx')
        .join('invest_company AS ic', 'ii.company_idx', 'ic.company_idx')
        .where('ih.history_idx', historyIdx)
        .andWhere('ic.user_idx', userIdx)
      );
      if (!rsHistory) throw new ResponseError('데이터가 존재하지 않음');
      
      const trx = await db.transaction();
      try {
        //delete data
        let rsDelete = await db.execute(db.queryBuilder()
          .delete()
          .from('invest_history')
          .where('history_idx', historyIdx)
        , trx);
        if (!rsDelete) throw new ResponseError('삭제 실패');
  
        //요약 데이터 insert/update
        await investHistoryHelper.upsertSummary(rsHistory.item_idx, rsHistory.history_date, rsHistory.unit_idx, trx);
        
        await trx.commit();
      } catch (err) {
        await trx.rollback();
        throw err;
      }

      res.json(createResult());
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
}