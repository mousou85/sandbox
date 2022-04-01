const express = require('express');
const asyncHandler = require('../../helper/express-async-wrap');
const {ResponseError, createResult} = require('../../helper/express-response');
const {Mysql} = require("../../database/mysql");

const router = express.Router();

/**
 * unit 목록
 */
router.get('/', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');

  try {
    //set vars: 리스트
    let unitList = await db.queryAll(db.queryBuilder()
        .select()
        .from('invest_unit')
        .orderBy('unit_idx', 'asc')
      );

    res.json(createResult('success', {list: unitList}));
  } catch (err) {
    throw err;
  }
}));

/**
 * unit 데이터
 */
router.get('/:unit_idx', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');

  try {
    //set vars: request
    let unitIdx = req.params.unit_idx;

    //set vars: 데이터
    let unit = await db.queryRow(db.queryBuilder()
        .select()
        .from('invest_unit')
        .where('unit_idx', unitIdx)
      );
    if (!unit) throw new ResponseError('데이터가 존재하지 않음');

    res.json(createResult('success', unit));
  } catch (err) {
    throw err;
  }
}));

/**
 * unit 추가
 */
router.post('/', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');

  try {
    //set vars: request
    let unit = req.body.unit;
    let unitType = req.body.unit_type;
    if (!unit) throw new ResponseError('unit값은 필수입력임');
    if (!unitType) throw new ResponseError('unit_type값은 필수입력임');
    unitType = unitType.trim();

    //중복 체크
    let hasData = await db.exists(db.queryBuilder()
        .from('invest_unit')
        .where('unit', unit)
      );
    if (hasData) throw new ResponseError('이미 등록된 unit입니다.');

    //insert data
    let rsInsert = await db.execute(db.queryBuilder()
        .insert({'unit': unit, 'unit_type': unitType})
        .into('invest_unit')
      );
    if (!rsInsert) throw new ResponseError('unit 추가 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  }
}));

/**
 * unit 수정
 */
router.put('/:unit_idx', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');

  try {
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
router.delete('/:unit_idx', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');

  try {
    //set vars: request
    let unitIdx = req.params.unit_idx;

    //check data
    let hasData = await db.exists(db.queryBuilder()
        .from('invest_unit')
        .where('unit_idx', unitIdx)
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

module.exports = router;