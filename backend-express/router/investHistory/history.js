const express = require('express');
const asyncHandler = require('../../helper/express-async-wrap');
const {ResponseError, createResult} = require('../../helper/express-response');
const {Mysql} = require("../../database/mysql");

const router = express.Router();

const historyTypeList = {
  'in': '유입',
  'out': '유출',
  'revenue': '평가'
};
const inoutTypeList = {
  'principal': '원금',
  'proceeds': '수익금',
};
const revenueTypeList = {
  'interest': '이자',
  'eval': '평가금액'
};

// router.get('/', asyncHandler(async (req, res) => {
//   //set vars: db
//   const db = req.app.get('db');
//
//   try {
//     //set vars: 데이터
//     let sql = `
//       SELECT i.*, ic.company_name
//       FROM invest_item i
//         JOIN invest_company ic ON i.company_idx = ic.company_idx
//       ORDER BY i.item_idx ASC
//     `;
//     let list = await db.queryAll(sql);
//     for (let i in list) {
//       let _itemIdx = list[i].item_idx;
//
//       sql = `
//         SELECT us.*, u.unit, u.unit_type
//         FROM invest_unit_set us
//           JOIN invest_unit u ON u.unit_idx = us.unit_idx
//         WHERE us.item_idx = :item_idx
//         ORDER BY us.unit_set_idx ASC
//       `;
//       list[i].item_type_text = itemTypeList[list[i].item_type];
//       list[i].unit_set = await db.queryAll(sql, {item_idx: _itemIdx});
//     }
//
//     res.json(createResult('success', {'list': list}));
//   } catch (err) {
//     throw err;
//   } finally {
//     await db.releaseConnection();
//   }
// }));

/**
 * history 리스트
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
      SELECT
        h.history_idx,
        h.unit_idx,
        h.history_date,
        h.history_type,
        h.inout_type,
        h.revenue_type,
        h.val,
        h.memo,
        u.unit,
        u.unit_type
      FROM invest_history h
        JOIN invest_unit u ON h.unit_idx = u.unit_idx
      WHERE h.item_idx = :item_idx
      ORDER BY h.history_date DESC, h.history_idx DESC
    `;
    const historyList = await db.queryAll(sql, {item_idx: itemIdx});
    for (let key in historyList) {
      const _historyType = historyList[key].history_type;
      const _inoutType = historyList[key].inout_type;
      const _revenueType = historyList[key].revenue_type;
      
      historyList[key].history_type_text = historyTypeList[_historyType];
      historyList[key].inout_type_text = _inoutType ? inoutTypeList[_inoutType] : null;
      historyList[key].revenue_type_text = _revenueType ? revenueTypeList[_revenueType] : null;
    }
    
    res.json(createResult('success', {'list': historyList}));
  } catch (err) {
    throw err;
  } finally {
    await db.releaseConnection();
  }
}));

/**
 * history 등록
 */
router.post('/:item_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');
  
  try {
    //set vars: request
    let itemIdx = req.params.item_idx;
    let unitIdx = req.body.unit_idx;
    let historyDate = req.body.history_date;
    let historyType = req.body.history_type;
    let inoutType = null;
    let revenueType = null;
    let val = req.body.val;
    let memo = req.body.memo;
    
    if (!itemIdx) throw new ResponseError('item_idx는 필수입력임');
    if (!unitIdx) throw new ResponseError('unit_idx는 필수입력임');
    if (!historyDate) throw new ResponseError('history_date는 필수입력임');
    if (!historyType) throw new ResponseError('history_type은 필수입력임');
    if (!val) throw new ResponseError('val은 필수입력임');
    if (['in','out'].includes(historyType)) {
      inoutType = req.body.inout_type;
      if (!inoutType) throw new ResponseError('inout_type은 필수입력임');
    } else {
      revenueType = req.body.revenue_type;
      if (!revenueType) throw new ResponseError('revenue_type은 필수입력임');
    }
    
    //check data
    const hasItem = await db.queryScalar('SELECT 1 FROM invest_item WHERE item_idx = :item_idx', {item_idx: itemIdx});
    if (!hasItem) throw new ResponseError('item이 존재하지 않음');
    const hasUnit = await db.queryScalar('SELECT 1 FROM invest_unit_set WHERE item_idx = :item_idx AND unit_idx = :unit_idx', {item_idx: itemIdx, unit_idx: unitIdx});
    if (!hasUnit) throw new ResponseError('unit이 존재하지 않음');
    
    //insert data
    await db.beginTransaction();
    try {
      //history 등록
      let sql = 'INSERT INTO invest_history(item_idx, unit_idx, history_date, history_type, inout_type, revenue_type, val, memo) VALUES(:item_idx, :unit_idx, :history_date, :history_type, :inout_type, :revenue_type, :val, :memo)';
      let sqlParams = {
        item_idx: itemIdx,
        unit_idx: unitIdx,
        history_date: historyDate,
        history_type: historyType,
        inout_type: inoutType,
        revenue_type: revenueType,
        val: val,
        memo: memo
      };
      
      let rsInsert = await db.execute(sql, sqlParams);
      if (!rsInsert) throw new ResponseError('history 추가 실패함');
      
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

// /**
//  * item 수정
//  */
// router.put('/:item_idx', asyncHandler(async (req, res) => {
//   //set vars: db
//   const db = req.app.get('db');
//
//   try {
//     //set vars: request
//     let itemIdx = req.params.item_idx;
//     let companyIdx = req.body.company_idx;
//     let itemType = req.body.item_type;
//     let itemName = req.body.item_name;
//     let units = req.body.units;
//     itemName = itemName ? itemName.trim() : null;
//     if (!companyIdx && !itemType && !itemName && (!units || !units.length)) throw new ResponseError('잘못된 접근');
//
//     //check data
//     let hasData = await db.queryScalar('SELECT 1 FROM invest_item WHERE item_idx = :item_idx', {item_idx: itemIdx});
//     if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
//
//     /*
//      update data
//      */
//     let updateParams = {};
//
//     if (companyIdx) {
//       let hasCompany = await db.queryScalar('SELECT 1 FROM invest_company WHERE company_idx = :company_idx', {company_idx: companyIdx});
//       if (!hasCompany) throw new ResponseError('company가 존재하지 않음');
//
//       updateParams.company_idx = companyIdx;
//     }
//     if (itemType) {
//       if (!itemTypeList.hasOwnProperty(itemType)) throw new ResponseError('존재하지 않는 item type임');
//
//       updateParams.item_type = itemType;
//     }
//     if (itemName) {
//       if (itemName.length > 50) throw new ResponseError('item_name은 50자 이하로 입력');
//
//       updateParams.item_name = itemName;
//     }
//
//     await db.beginTransaction();
//     try {
//       //update
//       if (Object.keys(updateParams).length > 0) {
//         let [sqlUpdate, sqlParams] = Mysql.createUpdateClause(updateParams);
//         sqlParams.item_idx = itemIdx;
//
//         await db.execute(`UPDATE invest_item SET ${sqlUpdate} WHERE item_idx = :item_idx`, sqlParams);
//       }
//
//       //unit-set update
//       if (units && units.length) {
//         let unitSetList = await db.queryAll('SELECT unit_set_idx, unit_idx FROM invest_unit_set WHERE item_idx = :item_idx', {item_idx: itemIdx});
//
//         for (let item of unitSetList) {
//           //기존 등록 unit 중 삭제해야될 것들 삭제
//           if (!units.includes(item.unit_idx)) {
//             await db.execute('DELETE FROM invest_unit_set WHERE unit_set_idx = :unit_set_idx', {unit_set_idx: item.unit_set_idx});
//           } else {
//             units.splice(units.indexOf(item.unit_idx), 1);
//           }
//         }
//
//         for (let unit of units) {
//           await db.execute('INSERT INTO invest_unit_set(item_idx, unit_idx) VALUES(:item_idx, :unit_idx)', {item_idx: itemIdx, unit_idx: unit});
//         }
//       }
//
//       await db.commit();
//     } catch (err) {
//       await db.rollback();
//       throw err;
//     }
//
//     res.json(createResult());
//   } catch (err) {
//     throw err;
//   } finally {
//     await db.releaseConnection();
//   }
// }));

/**
 * history 삭제
 */
router.delete('/:item_idx/:history_idx', asyncHandler(async (req, res) => {
  //set vars: db
  const db = req.app.get('db');
  
  try {
    //set vars: request
    const itemIdx = req.params.item_idx;
    const historyIdx=  req.params.history_idx;
    if (!itemIdx || !historyIdx) throw new ResponseError('item_idx, history_idx는 필수임');
    
    //check data
    let hasData = await db.queryScalar('SELECT 1 FROM invest_history WHERE item_idx = :item_idx AND history_idx = :history_idx', {item_idx: itemIdx, history_idx: historyIdx});
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
    
    //delete data
    let rsDelete = await db.execute('DELETE FROM invest_history WHERE item_idx = :item_idx AND history_idx = :history_idx', {item_idx: itemIdx, history_idx: historyIdx});
    if (!rsDelete) throw new ResponseError('삭제 실패');
    
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