const express = require('express');
const asyncHandler = require('../../helper/express-async-wrap');
const {ResponseError, createResult} = require('../../helper/express-response');
const {Mysql} = require("../../database/mysql");

const router = express.Router();

const itemTypeList = {
  'cash': '현금',
  'deposit': '예금',
  'saving': '적금',
  'trade': '매매',
  'future': '선물',
  'defi': '디파이',
  'p2p': 'P2p'
};

/**
 * item type 리스트
 */
router.get('/item-type', asyncHandler(async (req, res) => {
  let list = [];
  for (let key in itemTypeList) {
    list.push({type: key, text: itemTypeList[key]});
  }

  res.json(createResult('success', {'list': list}));
}));

/**
 * item 데이터
 */
router.get('/:item_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');
  
  try {
    //set vars: request
    let itemIdx = req.params.item_idx;
    if (!itemIdx) throw new ResponseError('잘못된 접근');
    
    //set vars: 데이터
    let sql = `
      SELECT i.*, c.company_name
      FROM invest_item i
        JOIN invest_company c ON c.company_idx = i.company_idx
      WHERE i.item_idx = :item_idx
    `;
    let item = await db.queryRow(sql, {item_idx: itemIdx});
    if (!item) throw new ResponseError('데이터 없음');
    
    sql = `
      SELECT us.*, u.unit, u.unit_type
      FROM invest_unit_set us
        JOIN invest_unit u ON u.unit_idx = us.unit_idx
      WHERE us.item_idx = :item_idx
      ORDER BY us.unit_set_idx ASC
    `;
    item.unit_set = await db.queryAll(sql, {item_idx: itemIdx});
    
    res.json(createResult('success', item));
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * item 등록
 */
router.post('/', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let companyIdx = req.body.company_idx;
    let itemType = req.body.item_type;
    let itemName = req.body.item_name;
    let units = req.body.units;
    itemName = itemName ? itemName.trim() : null;
    if (!companyIdx) throw new ResponseError('company_idx는 필수입력임');
    if (!itemType) throw new ResponseError('item_type는 필수입력임');
    if (!itemName) throw new ResponseError('item_name는 필수입력임');
    if (!itemTypeList.hasOwnProperty(itemType)) throw new ResponseError('존재하지 않는 item type임');
    if (itemName.length > 50) throw new ResponseError('item_name은 50자 이하로 입력');

    //check data
    let hasCompany = await db.queryScalar('SELECT 1 FROM invest_company WHERE company_idx = :company_idx', {company_idx: companyIdx});
    if (!hasCompany) throw new ResponseError('company가 존재하지 않음');

    //insert data
    await db.beginTransaction();
    try {
      //item 등록
      let sql = 'INSERT INTO invest_item(company_idx, item_type, item_name) VALUES(:company_idx, :item_type, :item_name)';
      let rsInsert = await db.execute(sql, {company_idx: companyIdx, item_type: itemType, item_name: itemName});
      if (!rsInsert) throw new ResponseError('item 추가 실패함');

      //set vars: itemIdx
      let itemIdx = db.getLastInsertID();

      //unit set 등록
      if (units && units.length) {
        for (let unit of units) {
          let hasUnit = await db.queryScalar('SELECT 1 FROM invest_unit WHERE unit_idx = :unit_idx', {unit_idx: unit});
          if (!hasUnit) throw new ResponseError('unit이 존재하지 않음');

          sql = 'INSERT INTO invest_unit_set(item_idx, unit_idx) VALUES(:item_idx, :unit_idx)';
          await db.execute(sql, {item_idx: itemIdx, unit_idx:unit});
        }
      }

      await db.commit();
    } catch (err) {
      await db.rollback();
      throw err;
    }

    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * item 수정
 */
router.put('/:item_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');

  try {
    //set vars: request
    let itemIdx = req.params.item_idx;
    let companyIdx = req.body.company_idx;
    let itemType = req.body.item_type;
    let itemName = req.body.item_name;
    let units = req.body.units;
    itemName = itemName ? itemName.trim() : null;
    if (!companyIdx && !itemType && !itemName && (!units || !units.length)) throw new ResponseError('잘못된 접근');

    //check data
    let hasData = await db.queryScalar('SELECT 1 FROM invest_item WHERE item_idx = :item_idx', {item_idx: itemIdx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
    
    /*
    update data
     */
    let updateParams = {};
    
    if (companyIdx) {
      let hasCompany = await db.queryScalar('SELECT 1 FROM invest_company WHERE company_idx = :company_idx', {company_idx: companyIdx});
      if (!hasCompany) throw new ResponseError('company가 존재하지 않음');
  
      updateParams.company_idx = companyIdx;
    }
    if (itemType) {
      if (!itemTypeList.hasOwnProperty(itemType)) throw new ResponseError('존재하지 않는 item type임');
      
      updateParams.item_type = itemType;
    }
    if (itemName) {
      if (itemName.length > 50) throw new ResponseError('item_name은 50자 이하로 입력');
      
      updateParams.item_name = itemName;
    }
    
    await db.beginTransaction();
    try {
      //update
      if (Object.keys(updateParams).length > 0) {
        let [sqlUpdate, sqlParams] = Mysql.createUpdateClause(updateParams);
        sqlParams.item_idx = itemIdx;
        
        await db.execute(`UPDATE invest_item SET ${sqlUpdate} WHERE item_idx = :item_idx`, sqlParams);
      }
      
      //unit-set update
      if (units && units.length) {
        let unitSetList = await db.queryAll('SELECT unit_set_idx, unit_idx FROM invest_unit_set WHERE item_idx = :item_idx', {item_idx: itemIdx});
        
        for (let item of unitSetList) {
          //기존 등록 unit 중 삭제해야될 것들 삭제
          if (!units.includes(item.unit_idx)) {
            await db.execute('DELETE FROM invest_unit_set WHERE unit_set_idx = :unit_set_idx', {unit_set_idx: item.unit_set_idx});
          } else {
            units.splice(units.indexOf(item.unit_idx), 1);
          }
        }
        
        for (let unit of units) {
          await db.execute('INSERT INTO invest_unit_set(item_idx, unit_idx) VALUES(:item_idx, :unit_idx)', {item_idx: itemIdx, unit_idx: unit});
        }
      }
      
      await db.commit();
    } catch (err) {
      await db.rollback();
      throw err;
    }
    
    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * item 삭제
 */
router.delete('/:item_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');
  
  try {
    //set vars: request
    let itemIdx = req.params.item_idx;
    
    //check data
    let hasData = await db.queryScalar('SELECT 1 FROM invest_item WHERE item_idx = :item_idx', {item_idx: itemIdx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
    
    let hasHistory = await db.queryScalar('SELECT COUNT(*) FROM invest_history WHERE item_idx = :item_idx', {item_idx: itemIdx});
    if (hasHistory) throw new ResponseError('history가 있는 item은 삭제 불가');
    
    /*
    delete data
     */
    await db.beginTransaction();
    try {
      await db.execute('DELETE FROM invest_unit_set WHERE item_idx = :item_idx', {item_idx: itemIdx});
      
      await db.execute('DELETE FROM invest_item WHERE item_idx = :item_idx', {item_idx: itemIdx});
      
      await db.commit();
    } catch (err) {
      await db.rollback();
      throw err;
    }
    
    res.json(createResult());
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

// const historyTypeList = {
//   'in': '유입',
//   'out': '유출',
//   'revenue': '평가'
// };
// const inoutTypeList = {
//   'principal': '원금',
//   'proceeds': '수익금'
// };
// const revenueTypeList = {
//   'interest': '이자',
//   'eval': '평가금액'
// };


module.exports = router;