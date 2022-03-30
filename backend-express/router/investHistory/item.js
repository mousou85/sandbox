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

router.get('/', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');
  
  try {
    //set vars: 데이터
    let list = await db.queryAll(
      db.queryBuilder()
        .select(db.raw('i.*, ic.company_name'))
        .from('invest_item AS i')
        .join('invest_company AS ic', 'i.company_idx', 'ic.company_idx')
        .orderBy([
          {column: 'ic.company_name', order: 'asc'},
          {column: 'i.item_name', order: 'asc'}
        ])
    );
    for (let i in list) {
      let _itemIdx = list[i].item_idx;
      
      list[i].item_type_text = itemTypeList[list[i].item_type];
      list[i].unit_set = await db.queryAll(
        db.queryBuilder()
          .select(db.raw('us.*, u.unit, u.unit_type'))
          .from('invest_unit_set AS us')
          .join('invest_unit AS u', 'us.unit_idx', 'u.unit_idx')
          .where('us.item_idx', _itemIdx)
          .orderBy('us.unit_set_idx', 'asc')
      );
    }
  
    res.json(createResult('success', {'list': list}));
  } catch (err) {
    throw err;
  }
}));

/**
 * item 데이터
 */
router.get('/:item_idx', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');
  
  try {
    //set vars: request
    let itemIdx = req.params.item_idx;
    if (!itemIdx) throw new ResponseError('잘못된 접근');
    
    //set vars: 데이터
    let item = await db.queryRow(
      db.queryBuilder()
        .select(db.raw('i.*, c.company_name'))
        .from('invest_item AS i')
        .join('invest_company AS c', 'i.company_idx', 'c.company_idx')
        .where('i.item_idx', itemIdx)
    );
    if (!item) throw new ResponseError('데이터 없음');
    
    item.unit_set = await db.queryAll(
      db.queryBuilder()
        .select(db.raw('us.*, u.unit, u.unit_type'))
        .from('invest_unit_set AS us')
        .join('invest_unit AS u', 'us.unit_idx', 'u.unit_idx')
        .where('us.item_idx', itemIdx)
        .orderBy('us.unit_set_idx', 'asc')
    );
    
    res.json(createResult('success', item));
  } catch (err) {
    throw err;
  }
}));

/**
 * item 등록
 */
router.post('/', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
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
    
    let query;

    //check data
    query = db.queryBuilder()
      .select(db.raw('1'))
      .from('invest_company')
      .where('company_idx', companyIdx);
    let hasCompany = await db.queryScalar(query);
    if (!hasCompany) throw new ResponseError('company가 존재하지 않음');

    //insert data
    const trx = await db.transaction();
    try {
      //item 등록
      query = db.queryBuilder()
        .insert({'company_idx': companyIdx, 'item_type': itemType, 'item_name': itemName})
        .into('invest_item');
      let itemIdx = await db.execute(query, trx);
      if (!itemIdx) throw new ResponseError('item 추가 실패함');

      //unit set 등록
      if (units && units.length) {
        for (let unit of units) {
          query = db.queryBuilder()
            .select(db.raw('1'))
            .from('invest_unit')
            .where('unit_idx', unit);
          let hasUnit = await db.queryScalar(query, trx);
          if (!hasUnit) throw new ResponseError('unit이 존재하지 않음');

          query = db.queryBuilder()
            .insert({'item_idx': itemIdx, 'unit_idx': unit})
            .into('invest_unit_set');
          await db.execute(query, trx);
        }
      }

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
 * item 수정
 */
router.put('/:item_idx', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
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
    
    let query;

    //check data
    query = db.queryBuilder()
      .select(db.raw('1'))
      .from('invest_item')
      .where('item_idx', itemIdx);
    let hasData = await db.queryScalar(query);
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
    
    /*
    update data
     */
    let updateParams = {};
    
    if (companyIdx) {
      query = db.queryBuilder()
        .select(db.raw('1'))
        .from('invest_company')
        .where('company_idx', companyIdx);
      let hasCompany = await db.queryScalar(query);
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
    
    const trx = await db.transaction();
    try {
      //update
      query = db.queryBuilder()
        .update(updateParams)
        .from('invest_item')
        .where('item_idx', itemIdx);
      await db.execute(query, trx);
      
      //unit-set update
      if (units && units.length) {
        query = db.queryBuilder()
          .select(['unit_set_idx', 'unit_idx'])
          .from('invest_unit_set')
          .where('item_idx', itemIdx);
        let unitSetList = await db.queryAll(query, trx);
        
        for (let item of unitSetList) {
          //기존 등록 unit 중 삭제해야될 것들 삭제
          if (!units.includes(item.unit_idx)) {
            query = db.queryBuilder()
              .delete()
              .from('invest_unit_set')
              .where('unit_set_idx', item.unit_set_idx);
            await db.execute(query, trx);
          } else {
            units.splice(units.indexOf(item.unit_idx), 1);
          }
        }
        
        for (let unit of units) {
          query = db.queryBuilder()
            .insert({'item_idx': itemIdx, 'unit_idx': unit})
            .into('invest_unit_set');
          await db.execute(query, trx);
        }
      }
      
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
 * item 삭제
 */
router.delete('/:item_idx', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');
  
  try {
    //set vars: request
    let itemIdx = req.params.item_idx;
    
    let query;
    
    //check data
    query = db.queryBuilder()
      .select(db.raw('1'))
      .from('invest_item')
      .where('item_idx', itemIdx);
    let hasData = await db.queryScalar(query);
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
    
    query = db.queryBuilder()
      .select(db.raw('COUNT(*)'))
      .from('invest_history')
      .where('item_idx', itemIdx);
    let hasHistory = await db.queryScalar(query);
    if (hasHistory) throw new ResponseError('history가 있는 item은 삭제 불가');
    
    /*
    delete data
     */
    const trx = await db.transaction();
    try {
      query = db.queryBuilder()
        .delete()
        .from('invest_unit_set')
        .where('item_idx', itemIdx);
      await db.execute(query, trx);
      
      query = db.queryBuilder()
        .delete()
        .from('invest_item')
        .where('item_idx', itemIdx);
      await db.execute(query, trx);
      
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