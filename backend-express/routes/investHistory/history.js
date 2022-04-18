const express = require('express');
const dayjs = require('dayjs');
const asyncHandler = require('#helper/express-async-wrap');
const {ResponseError, createResult} = require('#helper/express-response');

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  const router = express.Router();
  const {upsertSummary, historyTypeList, inoutTypeList, revenueTypeList} = require('#helper/db/investHistory')(db);
  
  /**
   * history 리스트
   */
  router.get('/:item_idx', asyncHandler(async (req, res) => {
    try {
      //set vars: request
      const itemIdx = req.params.item_idx;
      const historyType = req.query.history_type ?? '';
      const unit = req.query.unit ? req.query.unit.toUpperCase() : '';
      const date = req.query.date ?? '';
      if (!itemIdx) throw new ResponseError('잘못된 접근');
      
      //set vars: sql 쿼리
      let query = db.queryBuilder()
        .select([
          'h.history_idx',
          'h.unit_idx',
          'h.history_date',
          'h.history_type',
          'h.inout_type',
          'h.revenue_type',
          'h.val',
          'h.memo',
          'u.unit',
          'u.unit_type'
        ])
        .from('invest_history AS h')
        .join('invest_unit AS u', 'h.unit_idx', 'u.unit_idx')
        .where('h.item_idx', itemIdx)
        .orderBy([
          {column: 'h.history_date', order: 'desc'},
          {column: 'h.history_idx', order: 'desc'}
        ]);
      
      if (historyType) {
        query.where('h.history_type', historyType);
      }
      if (unit) {
        query.where('u.unit', unit);
      }
      if (date) {
        query.whereBetween('h.history_date', [
            dayjs(date).format('YYYY-MM-01'),
            dayjs(date).endOf('month').format('YYYY-MM-DD')
          ]);
      }
      
      //set vars: history 리스트
      const historyList = await db.queryAll(query);
      for (const key in historyList) {
        const _historyType = historyList[key].history_type;
        const _inoutType = historyList[key].inout_type;
        const _revenueType = historyList[key].revenue_type;
        
        historyList[key].history_type_text = historyTypeList[_historyType];
        historyList[key].inout_type_text = _inoutType ? inoutTypeList[_inoutType] : null;
        historyList[key].revenue_type_text = _revenueType ? revenueTypeList[_revenueType] : null;
      }
      
      res.json(createResult('success', {'list': historyList}));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * history 등록
   */
  router.post('/:item_idx', asyncHandler(async (req, res) => {
    try {
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
      const hasItem = await db.exists(db.queryBuilder()
        .from('invest_item')
        .where('item_idx', itemIdx)
      );
      if (!hasItem) throw new ResponseError('item이 존재하지 않음');
      const hasUnit = await db.exists(db.queryBuilder()
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
        await upsertSummary(itemIdx, historyDate, unitIdx, trx);
        
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
  router.put('/:history_idx', asyncHandler(async (req, res) => {
    try {
      //set vars: request
      const historyIdx = req.params.history_idx;
      const historyDate = req.body.history_date;
      const val = req.body.val;
      const memo = req.body.memo;
      if (!historyIdx) throw new ResponseError('history_idx는 필수임');
      if (!historyDate) throw new ResponseError('history_date는 필수임');
      if (!val) throw new ResponseError('val은 필수임');
      
      //set vars: 데이터
      const rsHistory = await db.queryRow(db.queryBuilder()
          .select()
          .from('invest_history')
          .where('history_idx', historyIdx)
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
        await upsertSummary(rsHistory.item_idx, historyDate, rsHistory.unit_idx, trx);
        
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
  router.delete('/:history_idx', asyncHandler(async (req, res) => {
    try {
      //set vars: request
      const historyIdx=  req.params.history_idx;
      if (!historyIdx) throw new ResponseError('history_idx는 필수임');
  
      //set vars: 데이터
      const rsHistory = await db.queryRow(db.queryBuilder()
          .select()
          .from('invest_history')
          .where('history_idx', historyIdx)
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
        await upsertSummary(rsHistory.item_idx, rsHistory.history_date, rsHistory.unit_idx, trx);
        
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