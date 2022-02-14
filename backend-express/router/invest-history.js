const express = require('express');
const asyncHandler = require('../helper/express-async-wrap');
const {ResponseError, createResult} = require('../helper/express-response');
const {Mysql} = require("../database/mysql");

const router = express.Router();

/**
 * unit 목록
 */
router.get('/unit', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: 리스트
    let unitList = await db.queryAll('SELECt * FROM invest_unit ORDER BY unit_idx ASC');

    res.json(createResult('success', {list: unitList}));
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * unit 데이터
 */
router.get('/unit/:unit_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let unit_idx = req.params.unit_idx;

    //set vars: 데이터
    let unit = await db.queryRow('SELECT * FROM invest_unit WHERE unit_idx = :unit_idx', {'unit_idx': unit_idx});
    if (!unit) throw new ResponseError('데이터가 존재하지 않음');

    res.json(createResult('success', unit));
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * unit 추가
 */
router.post('/unit', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let unit = req.body.unit;
    let unit_type = req.body.unit_type;
    if (!unit) throw new ResponseError('unit값은 필수입력임');
    if (!unit_type) throw new ResponseError('unit_type값은 필수입력임');
    unit = unit.toUpperCase();

    //중복 체크
    let hasData = await db.queryScalar('SELECT COUNT(*) FROM invest_unit WHERE unit = :unit', {'unit': unit});
    if (hasData) throw new ResponseError('이미 등록된 unit입니다.');

    //insert data
    let rsInsert = await db.execute('INSERT INTO invest_unit(unit, unit_type) VALUES(:unit, :unit_type)', {'unit': unit, 'unit_type': unit_type});
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
router.put('/unit/:unit_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let unit_idx = req.params.unit_idx;
    let unit = req.body.unit;
    let unit_type = req.body.unit_type;
    if (!unit && !unit_type) throw new ResponseError('unit 또는 unit_type값 중 하나는 필수임');
    unit = unit.toUpperCase();

    //check data
    let hasData = await  db.queryScalar('SELECT unit_idx FROM invest_unit WHERE unit_idx = :unit_idx', {'unit_idx': unit_idx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');

    //update data
    let params = {};
    if (unit) params.unit = unit;
    if (unit_type) params.unit_type = unit_type;

    let [sqlUpdate, sqlParams] = Mysql.createUpdateClause(params);
    sqlParams.unit_idx = unit_idx;

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

/**
 * unit 삭제
 */
router.delete('/unit/:unit_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let unit_idx = req.params.unit_idx;

    //check data
    let hasData = await  db.queryScalar('SELECT unit_idx FROM invest_unit WHERE unit_idx = :unit_idx', {'unit_idx': unit_idx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');

    //delete data
    let rsDelete = await db.execute('DELETE FROM invest_unit WHERE unit_idx = :unit_idx', {'unit_idx': unit_idx});
    if (!rsDelete) throw new ResponseError('unit 삭제 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * company 추가
 */
router.post('/company', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let company_name = req.body.company_name;
    if (!company_name) throw new ResponseError('company_name값은 필수입력임');
    if (company_name.length > 20) throw new ResponseError('company_name은 20자 이하로 입력');

    //중복 체크
    let hasData = await db.queryScalar('SELECT COUNT(*) FROM invest_company WHERE company_name = :company_name', {'company_name': company_name});
    if (hasData) throw new ResponseError('이미 등록된 company임');

    //insert data
    let rsInsert = await db.execute('INSERT INTO invest_company(company_name) VALUES(:company_name)', {'company_name': company_name});
    if (!rsInsert) throw new ResponseError('company 추가 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * company 수정
 */
router.put('/company/:company_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let company_idx = req.params.company_idx;
    let company_name = req.body.company_name;
    if (!company_name) throw new ResponseError('company_namee값은 필수입력');
    if (company_name.length > 20) throw new ResponseError('company_name은 20자 이하로 입력');

    //check data
    let hasData = await  db.queryScalar('SELECT COUNT(*) FROM invest_company WHERE company_idx = :company_idx', {'company_idx': company_idx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');

    //update data
    let sql = 'UPDATE invest_company SET company_name = :company_name WHERE company_idx = :company_idx';
    let rsUpdate = await db.execute(sql, {'company_idx': company_idx, 'company_name': company_name});
    if (!rsUpdate) throw new ResponseError('company 수정 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * company 삭제
 */
router.delete('/company/:company_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let company_idx = req.params.company_idx;

    //check data
    let hasData = await  db.queryScalar('SELECT COUNT(*) FROM invest_company WHERE company_idx = :company_idx', {'company_idx': company_idx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');

    let hasItem = await db.queryScalar('SELECT COUNT(*) FROM invest_item WHERE company_idx = :company_idx', {'company_idx': company_idx});
    if (hasItem) throw new ResponseError('item이 존재하는 company는 삭제 할 수 없음');

    //delete data
    let rsDelete = await db.execute('DELETE FROM invest_company WHERE company_idx = :company_idx', {'company_idx': company_idx});
    if (!rsDelete) throw new ResponseError('company 삭제 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

module.exports = router;