const express = require('express');
const asyncHandler = require('../../helper/express-async-wrap');
const {ResponseError, createResult} = require('../../helper/express-response');
const {Mysql} = require("../../database/mysql");

const router = express.Router();

/**
 * company 리스트
 */
router.get('/', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: 리스트
    let list = await db.queryAll('SELECT * FROM invest_company ORDER BY company_idx ASC');

    res.json(createResult('success', {'list': list}));
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * company 데이터
 */
router.get('/:company_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let companyIdx = req.params.company_idx;

    //set vars: 데이터
    let company = await db.queryRow('SELECT * FROM invest_company WHERE company_idx = :company_idx', {'company_idx': companyIdx});
    if (!company) throw new ResponseError('데이터가 존재하지 않음');

    res.json(createResult('success', company));
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * company 추가
 */
router.post('/', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let companyName = req.body.company_name;
    if (!companyName) throw new ResponseError('company_name값은 필수입력임');
    if (companyName.length > 20) throw new ResponseError('company_name은 20자 이하로 입력');
    companyName = companyName.trim();

    //중복 체크
    let hasData = await db.queryScalar('SELECT COUNT(*) FROM invest_company WHERE company_name = :company_name', {'company_name': companyName});
    if (hasData) throw new ResponseError('이미 등록된 company임');

    //insert data
    let rsInsert = await db.execute('INSERT INTO invest_company(company_name) VALUES(:company_name)', {'company_name': companyName});
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
router.put('/:company_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let companyIdx = req.params.company_idx;
    let companyName = req.body.company_name;
    if (!companyName) throw new ResponseError('company_namee값은 필수입력');
    if (companyName.length > 20) throw new ResponseError('company_name은 20자 이하로 입력');
    companyName = companyName.trim();

    //check data
    let hasData = await  db.queryScalar('SELECT COUNT(*) FROM invest_company WHERE company_idx = :company_idx', {'company_idx': companyIdx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');

    //update data
    let sql = 'UPDATE invest_company SET company_name = :company_name WHERE company_idx = :company_idx';
    let rsUpdate = await db.execute(sql, {'company_idx': companyIdx, 'company_name': companyName});
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
router.delete('/:company_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let companyIdx = req.params.company_idx;

    //check data
    let hasData = await  db.queryScalar('SELECT COUNT(*) FROM invest_company WHERE company_idx = :company_idx', {'company_idx': companyIdx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');

    let hasItem = await db.queryScalar('SELECT COUNT(*) FROM invest_item WHERE company_idx = :company_idx', {'company_idx': companyIdx});
    if (hasItem) throw new ResponseError('item이 존재하는 company는 삭제 할 수 없음');

    //delete data
    let rsDelete = await db.execute('DELETE FROM invest_company WHERE company_idx = :company_idx', {'company_idx': companyIdx});
    if (!rsDelete) throw new ResponseError('company 삭제 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

module.exports = router;