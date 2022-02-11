const express = require('express');
const asyncHandler = require('../helper/express-async-wrap');
const {ResponseError, createResult} = require('../helper/express-response');

const router = express.Router();

router.post('/unit', asyncHandler(async (req, res, next) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    const unit = req.body.unit;
    const unitType = req.body.unitType;
    if (!unit) throw new ResponseError('unit값은 필수입력임');
    if (!unitType) throw new ResponseError('unitType값은 필수입력임');

    //중복 체크
    let hasData = await db.queryScalar('SELECT COUNT(*) FROM invest_unit WHERE unit = :unit', {unit: unit});
    if (hasData) throw new ResponseError('이미 등록된 unit입니다.');

    //insert data
    let rsInsert = await db.execute('INSERT INTO invest_unit(unit, unit_type) VALUES(:unit, :unit_type)', {unit: unit, unit_type: unitType});
    if (!rsInsert) throw new ResponseError('unit 추가에 실패했습니다.');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

module.exports = router;