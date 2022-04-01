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
  /** @type {Mysql} */
  const db = req.app.get('db');

  try {
    //set vars: request
    let itemIdx = req.params.item_idx;
    let historyType = req.query.history_type ?? '';
    if (!itemIdx) throw new ResponseError('잘못된 접근');

    //set vars: sql 쿼리
    let query = db.queryBuilder()
      .select([
        'h.history_idx',
        'h.unit_idx',
        'h.history_date',
        'h.history_type',
        'h.inout_type',
        'h.revenue_type',
        'h.val',
        'h.memo',
        'u.unit',
        'u.unit_type'
      ])
      .from('invest_history AS h')
      .join('invest_unit AS u', 'h.unit_idx', 'u.unit_idx')
      .where('h.item_idx', itemIdx)
      .orderBy([
        {column: 'h.history_date', order: 'desc'},
        {column: 'h.history_idx', order: 'desc'}
      ])
    ;
    if (historyType) {
      if (historyType == 'inout') {
        query.whereIn('h.history_type', ['in', 'out'])
      } else if (historyType == 'revenue') {
        query.where('h.history_type', 'revenue');
      }
    }

    //set vars: history 리스트
    const historyList = await db.queryAll(query);
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
  }
}));

/**
 * history 등록
 */
router.post('/:item_idx', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
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
    const hasItem = await db.exists(db.queryBuilder()
        .from('invest_item')
        .where('item_idx', itemIdx)
      );
    if (!hasItem) throw new ResponseError('item이 존재하지 않음');
    const hasUnit = await db.exists(db.queryBuilder()
        .from('invest_unit_set')
        .where('item_idx', itemIdx)
        .andWhere('unit_idx', unitIdx)
      );
    if (!hasUnit) throw new ResponseError('unit이 존재하지 않음');
    
    //insert data
    const trx = await db.transaction();
    try {
      //history 등록
      let insertData = {
        item_idx: itemIdx,
        unit_idx: unitIdx,
        history_date: historyDate,
        history_type: historyType,
        inout_type: inoutType,
        revenue_type: revenueType,
        val: val,
        memo: memo
      };
      
      let rsInsert = await db.execute(db.queryBuilder()
          .insert(insertData)
          .into('invest_history')
        , trx);
      if (!rsInsert) throw new ResponseError('history 추가 실패함');
      
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
 * history summary
 */
router.get('/:item_idx/summary', asyncHandler(async (req, res) => {
  /** @type {Mysql} */
  const db = req.app.get('db');
  
  try {
    // set vars: request
    let itemIdx = req.params.item_idx;
    let startDate = req.query.startDate ?? '';
    let endDate = req.query.endDate ?? '';
    
    // set vars: summary data
    let summaryData = {
      'in': {},
      'out': {},
      'revenue': {},
      'revenueRate': {}
    };
    
    // summary에 history_type와 단위별로 세부 항목 설정
    let rsUnitSet = await db.queryAll(db.queryBuilder()
        .select(['u.unit', 'u.unit_type'])
        .from('invest_unit_set AS us')
        .join('invest_unit AS u', 'u.unit_idx', 'us.unit_idx')
        .where('us.item_idx', itemIdx)
      );
    
    for (const summaryKey of Object.keys(summaryData)) {
      for (const unit of rsUnitSet) {
        let _unit = unit.unit;
        let _unitType = unit.unit_type;

        if (['in', 'out', 'revenue'].includes(summaryKey)) { // 유입/유출/평가 세부 항목 설정
          // 유입/유출/평가 공통 세부 항목
          summaryData[summaryKey][_unit] = {
            'unit': _unit,
            'unit_type': _unitType,
            'total': 0,
          };

          // 유형별 별도 세부 항목 설정
          if (['in','out'].includes(summaryKey)) {
            summaryData[summaryKey][_unit].principal = 0;
            summaryData[summaryKey][_unit].proceeds = 0;
          } else if (summaryKey == 'revenue') {
            summaryData[summaryKey][_unit].eval = 0;
            summaryData[summaryKey][_unit].interest = 0;
          }
        } else if (summaryKey == 'revenueRate') { // 수익율 세부 항목 설정
          summaryData[summaryKey][_unit] = {
            'rate': 0.0,
            'diff': 0.0,
            'excludeProceedsRate': 0.0,
            'excludeProceedsDiff': 0.0
          };
        }
      }
    }
    
    // 단위별 유입/유출/평가(이자) 항목 설정
    let query = db.queryBuilder()
      .select([
        'h.history_type',
        db.raw(`
            CASE
              WHEN h.history_type in ('in', 'out') THEN h.inout_type
              WHEN h.history_type = 'revenue' THEN h.revenue_type
            END AS val_type
          `),
        'u.unit',
        db.raw('SUM(h.val) AS totalVal')
      ])
      .from('invest_history AS h')
      .join('invest_unit AS u', 'h.unit_idx', 'u.unit_idx')
      .where('h.item_idx', itemIdx)
      .andWhereRaw(`(h.history_type IN ('in', 'out') OR (h.history_type = 'revenue' AND h.revenue_type = 'interest'))`)
      .groupByRaw(`h.history_type, val_type, h.unit_idx`);
    let rsSummary = await db.queryAll(query);

    for (const data of rsSummary) {
      let _historyType = data.history_type;
      let _valType = data.val_type;
      let _unit = data.unit;
      let _val = data.totalVal;

      summaryData[_historyType][_unit].total += _val;
      summaryData[_historyType][_unit][_valType] += _val;
    }
    
    // 단위별 평가(평가금액) 항목 설정
    query = db.queryBuilder()
      .select(['t.unit', 't.val'])
      .from((query) => {
        query.select(['h.val', 'u.unit'])
          .from('invest_history AS h')
          .join('invest_unit AS u', 'h.unit_idx', 'u.unit_idx')
          .where('h.item_idx', itemIdx)
          .andWhereRaw(`h.history_type = 'revenue' AND h.revenue_type = 'eval'`)
          .orderByRaw(`h.history_date DESC, h.history_idx DESC`)
          .limit(1000)
          .as('t');
      })
      .groupBy('t.unit');
    rsSummary = await db.queryAll(query);
    
    for (const data of rsSummary) {
      let _unit = data.unit;
      let _val = data.val;
      
      summaryData['revenue'][_unit].total += _val;
      summaryData['revenue'][_unit].eval = _val;
    }
    
    // 단위별 수익율 항목 설정
    for (const unit of Object.keys(summaryData.revenueRate)) {
      // set vars: 단위 타입
      let _unitType = summaryData['in'][unit].unit_type;
      
      // set vars: 유입금액(원금/수익 재투자 금액 별도 계산)
      let _inTotal = summaryData['in'][unit].total;
      let _inExcludeProceedsTotal = _inTotal - summaryData['in'][unit].proceeds;
      
      // set vars: 유입금액(원금/수익 재투자 금액 별도 계산)
      let _outTotal = summaryData['out'][unit].total;
      let _outExcludeProceedsTotal = _outTotal - summaryData['out'][unit].proceeds;
      
      // set vars: 평가 금액
      // (이자만 있고 평가금액이 없으면 유입금액을 더해서 계산함)
      let _revenueTotal = summaryData['revenue'][unit].total;
      if (summaryData['revenue'][unit].interest > 0 && summaryData['revenue'][unit].eval == 0) {
        _revenueTotal += (_inTotal - _outTotal);
      }
      
      // 수익율/수익금 계산
      let _diff = _revenueTotal - (_inTotal - _outTotal);
      if (_unitType == 'int') _diff = parseInt(_diff.toString());
      else if (_unitType == 'float') _diff = parseFloat(_diff.toString());
      
      let _rate = _diff / _revenueTotal;
      
      // 수익율/수익금 계산(수익 재투자 금액 제외한 금액)
      let _excludeProceedsDiff = _revenueTotal - (_inExcludeProceedsTotal - _outExcludeProceedsTotal);
      if (_unitType == 'int') _excludeProceedsDiff = parseInt(_excludeProceedsDiff.toString());
      else if (_unitType == 'float') _excludeProceedsDiff = parseFloat(_excludeProceedsDiff.toString());
      
      let _excludeProceedsRate = _excludeProceedsDiff / _revenueTotal;
      
      summaryData['revenueRate'][unit].diff = _diff;
      summaryData['revenueRate'][unit].rate = Math.floor(_rate * 10000) / 100;
      summaryData['revenueRate'][unit].excludeProceedsDiff = _excludeProceedsDiff;
      summaryData['revenueRate'][unit].excludeProceedsRate = Math.floor(_excludeProceedsRate * 10000) / 100;
    }

    res.json(createResult('success', summaryData));
  } catch (err) {
    throw err;
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
  /** @type {Mysql} */
  const db = req.app.get('db');
  
  try {
    //set vars: request
    const itemIdx = req.params.item_idx;
    const historyIdx=  req.params.history_idx;
    if (!itemIdx || !historyIdx) throw new ResponseError('item_idx, history_idx는 필수임');
    
    //check data
    let hasData = await db.exists(db.queryBuilder()
        .from('invest_history')
        .where('item_idx', itemIdx)
        .andWhere('history_idx', historyIdx)
      );
    if (!hasData) throw new ResponseError('데이터가 존재하지 않음');
    
    //delete data
    let rsDelete = await db.execute(db.queryBuilder()
        .delete()
        .from('invest_history')
        .where('item_idx', itemIdx)
        .andWhere('history_idx', historyIdx)
      );
    if (!rsDelete) throw new ResponseError('삭제 실패');
    
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