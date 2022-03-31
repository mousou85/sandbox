const express = require('express');
const asyncHandler = require('../../helper/express-async-wrap');
const {ResponseError, createResult} = require('../../helper/express-response');
const {Mysql} = require("../../database/mysql");

const router = express.Router();


/**
 * unit set 리스트
 */
router.get('/:item_idx', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');
  
  let query;

  try {
    //set vars: request
    let itemIdx = req.params.item_idx;
    
    query = db.queryBuilder()
      .select(['us.unit_set_idx', 'us.unit_idx', 'u.unit', 'u.unit_type'])
      .from('invest_unit_set AS us')
      .join('invest_unit AS u', 'us.unit_idx', 'u.unit_idx')
      .where('us.item_idx', itemIdx)
      .orderBy('us.unit_set_idx', 'asc');

    //set vars: list
    let list = await db.queryAll(query);

    res.json(createResult('success', {'list': list}));
  } catch (err) {
    throw err;
  }
}));

/**
 * unit set 추가
 */
router.post('/', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');
  
  let query;

  try {
    //set vars: request
    let itemIdx = req.body.item_idx;
    let unitIdx = req.body.unit_idx;
    if (!itemIdx || !unitIdx) throw new ResponseError('item_idx 또는 unit_idx는 필수입력임');

    //check data
    query = db.queryBuilder()
      .select(db.raw('1'))
      .from('invest_item')
      .where('item_idx', itemIdx);
    let hasItemData = await db.queryScalar(query);
    if (!hasItemData) throw new ResponseError('item이 존재하지 않음');

    query = db.queryBuilder()
      .select(db.raw('1'))
      .from('invest_unit')
      .where('unit_idx', unitIdx);
    let hasUnitData = await db.queryScalar(query);
    if (!hasUnitData) throw new ResponseError('unit이 존재하지 않음');

    //중복 체크
    query = db.queryBuilder()
      .select(db.raw('1'))
      .from('invest_unit_set')
      .where('item_idx', itemIdx)
      .andWhere('unit_idx', unitIdx);
    let isDuplicate = await db.queryScalar(query);
    if (isDuplicate) throw new ResponseError('이미 등록된 unit set임');

    //insert data
    query = db.queryBuilder()
      .insert({'item_idx': itemIdx, 'unit_idx': unitIdx})
      .into('invest_unit_set');
    let rsInsert = await db.execute(query);
    if (!rsInsert) throw new ResponseError('unit set 추가 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  }
}));

/**
 * unit set 삭제
 */
router.delete('/:unit_set_idx', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');

  try {
    //set vars: request
    let unitSetIdx = req.params.unit_set_idx;
    
    let query;

    //check data
    query = db.queryBuilder()
      .select(db.raw('1'))
      .from('invest_unit_set')
      .where('unit_set_idx', unitSetIdx);
    let hasData = await db.queryScalar(query);
    if (!hasData) throw new ResponseError('unit set가 존재하지 않음');

    //delete data
    query = db.queryBuilder()
      .delete()
      .from('invest_unit_set')
      .where('unit_set_idx', unitSetIdx);
    let rsDelete = await db.execute(query);
    if (!rsDelete) throw new ResponseError('unit set 삭제 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  }
}));

module.exports = router;