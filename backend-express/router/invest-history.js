const express = require('express');
const asyncHandler = require('../helper/express-async-wrap');
const {ResponseError, createResult} = require('../helper/express-response');

const router = express.Router();

/**
 * unit 추가
 */
router.post('/unit', asyncHandler(async (req, res, next) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let unit = req.body.unit;
    let unitType = req.body.unitType;
    if (!unit) throw new ResponseError('unit값은 필수입력임');
    if (!unitType) throw new ResponseError('unitType값은 필수입력임');
    unit = unit.toUpperCase();

    //중복 체크
    let hasData = await db.queryScalar('SELECT COUNT(*) FROM invest_unit WHERE unit = :unit', {unit: unit});
    if (hasData) throw new ResponseError('이미 등록된 unit입니다.');

    //insert data
    let rsInsert = await db.execute('INSERT INTO invest_unit(unit, unit_type) VALUES(:unit, :unit_type)', {unit: unit, unit_type: unitType});
    if (!rsInsert) throw new ResponseError('unit 추가 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * unit 수정
 */
router.put('/unit/:unit_idx', asyncHandler(async (req, res, next) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let unitIdx = req.params.unit_idx;
    let unit = req.body.unit;
    let unitType = req.body.unit_type;
    if (!unit && !unitType) throw new ResponseError('unit 또는 unitType값 중 하나는 필수임');
    unit = unit.toUpperCase();
    console.log(unit);

    //check data
    let hasData = await  db.queryScalar('SELECT unit_idx FROM invest_unit WHERE unit_idx = :unit_idx', {unit_idx: unitIdx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');

    //update data
    let sqlUpdate = '';
    let sqlParams = {unit_idx: unitIdx};
    if (unit) {
      sqlUpdate += 'unit = :unit, ';
      sqlParams.unit = unit;
    }
    if (unitType) {
      sqlUpdate += 'unit_type = :unit_type, ';
      sqlParams.unit_type = unitType;
    }
    sqlUpdate = sqlUpdate.trim().replace(/,$/, '');
    sqlUpdate = `UPDATE invest_unit SET ${sqlUpdate} WHERE unit_idx = :unit_idx`;

    let rsUpdate = await db.execute(sqlUpdate, sqlParams);
    if (!rsUpdate) throw new ResponseError('unit 수정 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

module.exports = router;