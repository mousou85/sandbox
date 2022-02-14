const express = require('express');
const asyncHandler = require('../../helper/express-async-wrap');
const {ResponseError, createResult} = require('../../helper/express-response');
const {Mysql} = require("../../database/mysql");

const router = express.Router();


/**
 * unit set 리스트
 */
router.get('/:item_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let itemIdx = req.params.item_idx;

    //set vars: list
    let sql = `
      SELECT us.unit_set_idx, us.unit_idx, u.unit, u.unit_type
      FROM invest_unit_set AS us
        JOIN invest_unit AS u ON u.unit_idx = us.unit_idx
      WHERE us.item_idx = :item_idx
      ORDER BY us.unit_set_idx ASC
    `;
    let list = await db.queryAll(sql, {'item_idx': itemIdx});

    res.json(createResult('success', {'list': list}));
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * unit set 추가
 */
router.post('/', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let itemIdx = req.body.item_idx;
    let unitIdx = req.body.unit_idx;
    if (!itemIdx || !unitIdx) throw new ResponseError('item_idx 또는 unit_idx는 필수입력임');

    //check data
    let hasItemData = await db.queryScalar('SELECT 1 FROM invest_item WHERE item_idx = :item_idx', {'item_idx': itemIdx});
    if (!hasItemData) throw new ResponseError('item이 존재하지 않음');

    let hasUnitData = await db.queryScalar('SELECT 1 FROM invest_unit WHERE unit_idx = :unit_idx', {'unit_idx': unitIdx});
    if (!hasUnitData) throw new ResponseError('unit이 존재하지 않음');

    //중복 체크
    let isDuplicate = await db.queryScalar('SELECT 1 FROM invest_unit_set WHERE item_idx = :item_idx AND unit_idx = :unit_idx', {'item_idx': itemIdx, 'unit_idx': unitIdx});
    if (isDuplicate) throw new ResponseError('이미 등록된 unit set임');

    //insert data
    let rsInsert = await db.execute('INSERT INTO invest_unit_set(item_idx, unit_idx) VALUES (:item_idx, :unit_idx)', {'item_idx': itemIdx, 'unit_idx': unitIdx});
    if (!rsInsert) throw new ResponseError('unit set 추가 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * unit set 삭제
 */
router.delete('/:unit_set_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let unitSetIdx = req.params.unit_set_idx;

    //check data
    let hasData = await db.queryScalar('SELECT 1 FROM invest_unit_set WHERE unit_set_idx = :unit_set_idx', {'unit_set_idx': unitSetIdx});
    if (!hasData) throw new ResponseError('unit set가 존재하지 않음');

    //delete data
    let rsDelete = await db.execute('DELETE FROM invest_unit_set WHERE unit_set_idx = :unit_set_idx', {'unit_set_idx': unitSetIdx});
    if (!rsDelete) throw new ResponseError('unit set 삭제 실패함');

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

module.exports = router;