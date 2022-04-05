const express = require('express');
const asyncHandler = require('../../helper/express-async-wrap');
const {ResponseError, createResult} = require('../../helper/express-response');
const dayjs = require("dayjs");

/**
 * @param {Mysql} db
 * @return {Router}
 */
module.exports = (db) => {
  const router = express.Router();
  const {upsertSummary, upsertMonthSummary, upsertYearSummary, upsertTotalSummary} = require('../../helper/db/investHistory')(db);
  
  /**
   * summary
   */
  router.get('/:item_idx([0-9]+)', asyncHandler(async (req, res) => {
    try {
      //set vars: request
      const itemIdx = req.params.item_idx;
      const summaryType = req.query.summary_type ?? 'total';
      const unit = req.query.unit ? req.query.unit.toUpperCase() : 'KRW';
      const summaryDate = (summaryType == 'year' || summaryType == 'month') ? req.query.summary_date : '';
      
      if (!itemIdx) throw new ResponseError('잘못된 접근');
      if (!['total', 'year', 'month'].includes(summaryType)) throw new ResponseError('잘못된 summary_type');
      if (summaryType == 'year' || summaryType == 'month') {
        if (!summaryDate) throw new ResponseError('summary_date 없음');
      }
      
      //item 유무 체크
      const hasItem = await db.exists(db.queryBuilder()
          .from('invest_item')
          .where('item_idx', itemIdx)
        );
      if (!hasItem) throw new ResponseError('item이 존재하지 않음');
  
      //set vars: 요약 데이터
      let query = db.queryBuilder();
      if (summaryType == 'total') {
        query.from('invest_summary AS s')
      } else if (summaryType == 'year') {
        query.from('invest_summary_year AS s')
          .where('s.summary_year', summaryDate);
      } else if (summaryType == 'month') {
        query.from('invest_summary_month AS s')
          .where('s.summary_date', summaryDate);
      }
      query.select()
        .join('invest_unit AS u', 's.unit_idx', 'u.unit_idx')
        .where('s.item_idx', itemIdx)
        .andWhere('u.unit', unit);
      const rsSummary = await db.queryRow(query);
  
      // set vars: summary data
      let summaryData = {
        'unit': unit,
        'unitType': '',
        'deposit': 0,
        'excludeProceedsDeposit': 0,
        'in': {
          'total': 0,
          'principal': 0,
          'proceeds': 0,
        },
        'out': {
          'total': 0,
          'principal': 0,
          'proceeds': 0
        },
        'revenue': {
          'total': 0,
          'interest': 0,
          'eval': 0
        },
        'revenueRate': {
          'diff': 0,
          'rate': 0.0,
          'excludeProceedsDiff': 0,
          'excludeProceedsRate': 0
        }
      };
      
      if (rsSummary) {
        summaryData['unitType'] = rsSummary.unit_type;
        
        //summaryData 값 세팅
        for (const key of Object.keys(rsSummary)) {
          let _summaryKey1 = '';
          let _summaryKey2 = '';
          if (key == 'in_principal') {
            _summaryKey1 = 'in';
            _summaryKey2 = 'principal';
          } else if (key == 'in_proceeds') {
            _summaryKey1 = 'in';
            _summaryKey2 = 'proceeds';
          } else if (key == 'out_principal') {
            _summaryKey1 = 'out';
            _summaryKey2 = 'principal';
          } else if (key == 'out_proceeds') {
            _summaryKey1 = 'out';
            _summaryKey2 = 'proceeds';
          } else if (key == 'revenue_interest') {
            _summaryKey1 = 'revenue';
            _summaryKey2 = 'interest';
          } else if (key == 'revenue_eval') {
            _summaryKey1 = 'revenue';
            _summaryKey2 = 'eval';
          }
          
          if (_summaryKey1 && _summaryKey2) {
            summaryData[_summaryKey1][_summaryKey2] = rsSummary[key];
            summaryData[_summaryKey1]['total'] += rsSummary[key];
          }
        }
  
        // set vars: 유입금액(원금/수익 재투자 금액 별도 계산)
        const inTotal = summaryData['in']['total'];
        const inExcludeProceedsTotal = inTotal - summaryData['in']['proceeds'];
        
        // set vars: 유입금액(원금/수익 재투자 금액 별도 계산)
        const outTotal = summaryData['out']['total'];
        const outExcludeProceedsTotal = outTotal - summaryData['out']['proceeds'];
        
        summaryData['deposit'] = (inTotal - outTotal);
        summaryData['excludeProceedsDeposit'] = (inExcludeProceedsTotal - outExcludeProceedsTotal);
  
        // set vars: 평가 금액
        // (이자만 있고 평가금액이 없으면 유입금액을 더해서 계산함)
        let revenueTotal = summaryData['revenue']['total'];
        if (summaryData['revenue']['interest'] > 0 && summaryData['revenue']['eval'] == 0) {
          revenueTotal += (inTotal - outTotal);
        }
        
        // 수익율/수익금 계산
        if (revenueTotal > 0) {
          let diff = revenueTotal - (inTotal - outTotal);
          if (summaryData['unitType'] == 'int') diff = parseInt(diff.toString());
          else if (summaryData['unitType'] == 'float') diff = parseFloat(diff.toString());
          const rate = diff / (inTotal - outTotal);
  
          // 수익율/수익금 계산(수익 재투자 금액 제외한 금액)
          let excludeProceedsDiff = revenueTotal - (inExcludeProceedsTotal - outExcludeProceedsTotal);
          if (summaryData['unitType'] == 'int') excludeProceedsDiff = parseInt(excludeProceedsDiff.toString());
          else if (summaryData['unitType'] == 'float') excludeProceedsDiff = parseFloat(excludeProceedsDiff.toString());
          const excludeProceedsRate = excludeProceedsDiff / (inExcludeProceedsTotal - outExcludeProceedsTotal);
  
          summaryData['revenueRate']['diff'] = diff;
          summaryData['revenueRate']['rate'] = Math.floor(rate * 10000) / 100;
          summaryData['revenueRate']['excludeProceedsDiff'] = excludeProceedsDiff;
          summaryData['revenueRate']['excludeProceedsRate'] = Math.floor(excludeProceedsRate * 10000) / 100;
        }
      }
      
      res.json(createResult('success', summaryData));
    } catch (err) {
      throw err;
    }
  }));
  
  /**
   * summary remake
   */
  router.get('/remake-all', asyncHandler(async (req, res) => {
    try {
      //set vars: 상품 목록
      const itemList = await db.queryAll(db.queryBuilder()
          .select('item_idx')
          .from('invest_item')
        );
      
      //상품별로 처리
      for (const item of itemList) {
        const _itemIdx = item.item_idx;
        
        //set vars: 단위 리스트
        const unitList = await db.queryAll(db.queryBuilder()
            .select('unit_idx')
            .from('invest_unit_set')
            .where('item_idx', _itemIdx)
          );
        
        //단위별로 처리
        for (const unit of unitList) {
          const _unitIdx = unit.unit_idx;
          
          //set vars: 요약 데이터 만들 기간 범위
          const rsDateRange = await db.queryRow(db.queryBuilder()
              .select([
                db.raw(`DATE_FORMAT(MIN(history_date), '%Y-%m-01') AS minDate`),
                db.raw(`DATE_FORMAT(MAX(history_date), '%Y-%m-01') AS maxDate`)
              ])
              .from('invest_history')
              .where('item_idx', _itemIdx)
              .andWhere('unit_idx', _unitIdx)
            );
          if (!rsDateRange.minDate || !rsDateRange.maxDate) continue;
  
          const _minDate = dayjs(rsDateRange.minDate);
          const _maxDate = dayjs(rsDateRange.maxDate);
  
          //기간 범위를 1달 단위로 반복하며 처리
          let _targetDate = _minDate;
          let _lastYear = _minDate.year();
          let _summaryYear = [_lastYear];
          while (_targetDate <= _maxDate) {
            //월간 요약 데이터 생성
            await upsertMonthSummary(_itemIdx, _targetDate.format('YYYY-MM-DD'), _unitIdx);
    
            _targetDate = _targetDate.add(1, 'month');
            if (_lastYear != _targetDate.year()) {
              _lastYear = _targetDate.year();
              _summaryYear.push(_lastYear);
            }
          }
  
          //년간 요약 데이터 생성
          for (const year of _summaryYear) {
            await upsertYearSummary(_itemIdx, `${year}-12-01`, _unitIdx);
          }
  
          //전체 요약 데이터 생성
          await upsertTotalSummary(_itemIdx, _unitIdx);
        }
      }
      
      res.json(createResult('success'));
    } catch (err) {
      throw err;
    }
  }));
  
  return router;
}