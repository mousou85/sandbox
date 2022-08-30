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
  router.get('/:item_idx([0-9]+)', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const itemIdx = req.params.item_idx;
    let historyType = req.query.history_type ? req.query.history_type.trim() : '';
    let unit = req.query.unit ? req.query.unit.toUpperCase().trim() : '';
    let date = req.query.date ? req.query.date.trim() : '';
  
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
      .where('ih.item_idx', itemIdx)
      .andWhere('ii.user_idx', userIdx)
      .orderBy([
        {column: 'ih.history_date', order: 'desc'},
        {column: 'ih.history_idx', order: 'desc'}
      ]);
  
    if (historyType) query.andWhere('ih.history_type', historyType);
    if (unit) query.andWhere('iu.unit', unit);
    if (date) {
      query.andWhereBetween('ih.history_date', [
        dayjs(date).format('YYYY-MM-01'),
        dayjs(date).endOf('month').format('YYYY-MM-DD')
      ]);
    }
  
    //set vars: history 리스트
    let rsHistoryList = await db.queryAll(query);
    for (const key in rsHistoryList) {
      let _historyType = rsHistoryList[key].history_type;
      let _inoutType = rsHistoryList[key].inout_type;
      let _revenueType = rsHistoryList[key].revenue_type;
    
      rsHistoryList[key].history_type_text = historyTypeList[_historyType];
      rsHistoryList[key].inout_type_text = _inoutType ? inoutTypeList[_inoutType] : null;
      rsHistoryList[key].revenue_type_text = _revenueType ? revenueTypeList[_revenueType] : null;
    }
  
    res.json(createResult({list: rsHistoryList}));
  }));
  
  /**
   * history 등록
   */
  router.post('/:item_idx([0-9]+)', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const itemIdx = req.params.item_idx;
    let unitIdx = req.body.unit_idx;
    let historyDate = req.body.history_date ? req.body.history_date.trim() : '';
    let historyType = req.body.history_type ? req.body.history_type.trim() : '';
    let inoutType = null;
    let revenueType = null;
    let val = req.body.val;
    let memo = req.body.memo ? req.body.memo.trim() : '';
  
    if (!itemIdx) throw new ResponseError('item_idx는 필수입력임');
    if (!unitIdx) throw new ResponseError('unit_idx는 필수입력임');
    if (!historyDate) throw new ResponseError('history_date는 필수입력임');
    if (!historyType) throw new ResponseError('history_type은 필수입력임');
    if (!val) throw new ResponseError('val은 필수입력임');
    if (historyType == 'inout') {
      inoutType = req.body.inout_type ? req.body.inout_type.trim() : '';
      if (!inoutType) throw new ResponseError('inout_type은 필수입력임');
    } else {
      revenueType = req.body.revenue_type ? req.body.revenue_type.trim() : '';
      if (!revenueType) throw new ResponseError('revenue_type은 필수입력임');
    }
  
    //check data
    let hasItem = await db.exists(db.queryBuilder()
      .from('invest_item')
      .where('item_idx', itemIdx)
      .andWhere('user_idx', userIdx)
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
    let historyIdx = null;
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
    
      historyIdx = await db.execute(db.queryBuilder()
        .insert(insertData)
        .into('invest_history')
      , trx);
      if (!historyIdx) throw new ResponseError('history 추가 실패함');
    
      //요약 데이터 생성/갱신
      await investHistoryHelper.upsertSummary(itemIdx, historyDate, unitIdx, trx);
    
      await trx.commit();
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  
    res.json(createResult({history_idx: historyIdx}));
  }));
  
  /**
   * history 수정
   */
  router.put('/:history_idx([0-9]+)', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const historyIdx = req.params.history_idx;
    let historyDate = req.body.history_date ? req.body.history_date.trim() : '';
    let val = req.body.val;
    let memo = req.body.memo ? req.body.memo.trim() : '';
    if (!historyDate && !val && !memo) throw new ResponseError('잘못된 접근임');
  
    //set vars: 데이터
    let rsHistory = await db.queryRow(db.queryBuilder()
      .select(['ih.item_idx', 'ih.unit_idx'])
      .from('invest_history AS ih')
      .join('invest_item AS ii', 'ih.item_idx', 'ii.item_idx')
      .where('ih.history_idx', historyIdx)
      .andWhere('ii.user_idx', userIdx)
    );
    if (!rsHistory) throw new ResponseError('데이터가 존재하지 않음');
  
    const trx = await db.transaction();
    try {
      let updateParams = {};
      if (historyDate) updateParams.history_date = historyDate;
      if (val) updateParams.val = val;
      if (memo) updateParams.memo = memo;
      
      await db.execute(db.queryBuilder()
        .update(updateParams)
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
  }));
  
  /**
   * history 삭제
   */
  router.delete('/:history_idx([0-9]+)', authTokenMiddleware, asyncHandler(async (req, res) => {
    //set vars: user idx
    const userIdx = req.user.user_idx;
  
    //set vars: request
    const historyIdx=  req.params.history_idx;
  
    //set vars: 데이터
    let rsHistory = await db.queryRow(db.queryBuilder()
      .select(['ih.item_idx', 'ih.history_date', 'ih.unit_idx'])
      .from('invest_history AS ih')
      .join('invest_item AS ii', 'ih.item_idx', 'ii.item_idx')
      .where('ih.history_idx', historyIdx)
      .andWhere('ii.user_idx', userIdx)
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
  }));
  
  return router;
}